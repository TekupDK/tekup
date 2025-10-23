#!/usr/bin/env python3
"""
Gmail e-conomic Forwarder - Optimized for e-conomic compatibility
"""
import asyncio
import json
import os
import sys
import logging
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import base64

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GmailEconomicForwarder:
    def __init__(self, creds_file, token_file, economic_email):
        """Initialize Gmail e-conomic Forwarder"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.economic_email = economic_email
        self.processed_label = "Videresendt_econ"
        self.sent_pdfs = set()  # Track sent PDFs to avoid duplicates
        logger.info(f"Initialized Gmail e-conomic Forwarder for {self.gmail_service.user_email}")
    
    async def search_emails_with_pdfs(self, days_back=180):
        """Search for emails with PDF attachments"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            start_date_str = start_date.strftime('%Y/%m/%d')
            end_date_str = end_date.strftime('%Y/%m/%d')
            
            # Search for emails with PDF attachments, excluding already processed
            query = f'has:attachment filename:pdf after:{start_date_str} before:{end_date_str} -label:{self.processed_label}'
            
            logger.info(f"Searching for emails with PDFs from {start_date_str} to {end_date_str}")
            
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=50  # Limit to prevent timeout
            ).execute()
            
            message_ids = response.get('messages', [])
            logger.info(f"Found {len(message_ids)} emails with PDF attachments")
            
            return message_ids
            
        except Exception as e:
            logger.error(f"Error searching emails: {e}")
            return []
    
    async def get_email_details(self, message_id):
        """Get email details with attachments"""
        try:
            message = self.gmail_service.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            # Extract headers
            headers = message.get('payload', {}).get('headers', [])
            email_data = {
                'id': message['id'],
                'threadId': message['threadId'],
                'subject': next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject'),
                'from': next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown'),
                'date': next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown'),
                'attachments': []
            }
            
            # Extract PDF attachments
            attachments = self._extract_pdf_attachments(message.get('payload', {}))
            email_data['attachments'] = attachments
            
            return email_data
            
        except Exception as e:
            logger.error(f"Error getting email {message_id}: {e}")
            return None
    
    def _extract_pdf_attachments(self, payload):
        """Extract PDF attachments from email payload"""
        attachments = []
        
        def process_part(part):
            if part.get('mimeType') == 'application/pdf':
                attachment_id = part.get('body', {}).get('attachmentId')
                filename = part.get('filename', 'unknown.pdf')
                size = part.get('body', {}).get('size', 0)
                
                if attachment_id:
                    attachments.append({
                        'id': attachment_id,
                        'filename': filename,
                        'size': size,
                        'mimeType': 'application/pdf'
                    })
            
            # Process nested parts
            if 'parts' in part:
                for subpart in part['parts']:
                    process_part(subpart)
        
        process_part(payload)
        return attachments
    
    async def download_attachment(self, message_id, attachment_id):
        """Download attachment from Gmail"""
        try:
            attachment = self.gmail_service.service.users().messages().attachments().get(
                userId='me',
                messageId=message_id,
                id=attachment_id
            ).execute()
            
            data = attachment.get('data')
            if data:
                return base64.urlsafe_b64decode(data)
            return None
            
        except Exception as e:
            logger.error(f"Error downloading attachment {attachment_id}: {e}")
            return None
    
    def _generate_pdf_hash(self, pdf_data, filename):
        """Generate a unique hash for PDF to detect duplicates"""
        import hashlib
        # Create hash based on content + filename + size
        content_hash = hashlib.md5(pdf_data).hexdigest()
        filename_hash = hashlib.md5(filename.encode()).hexdigest()
        size_hash = hashlib.md5(str(len(pdf_data)).encode()).hexdigest()
        
        # Combine all hashes for unique identification
        combined_hash = hashlib.md5(f"{content_hash}_{filename_hash}_{size_hash}".encode()).hexdigest()
        return combined_hash

    async def forward_pdf_to_economic(self, email_data, pdf_data, filename):
        """Forward PDF to e-conomic with optimized formatting and duplicate detection"""
        try:
            # Generate unique hash for this PDF
            pdf_hash = self._generate_pdf_hash(pdf_data, filename)
            
            # Check if we've already sent this PDF
            if pdf_hash in self.sent_pdfs:
                logger.info(f"SKIPPING DUPLICATE: {filename} (already sent)")
                return "duplicate"
            
            # Check file size
            file_size_mb = len(pdf_data) / (1024 * 1024)
            if file_size_mb > 10:
                logger.warning(f"PDF {filename} is too large ({file_size_mb:.1f}MB), skipping")
                return None
            
            # Clean filename for e-conomic
            clean_filename = filename.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_').replace('\\', '_')
            if not clean_filename.endswith('.pdf'):
                clean_filename += '.pdf'
            
            # Create email with e-conomic optimized format
            msg = MIMEMultipart()
            msg['From'] = self.gmail_service.user_email
            msg['To'] = self.economic_email
            msg['Subject'] = f"PDF Bilag: {email_data['subject']}"
            
            # Simple body that e-conomic can parse
            body = f"""PDF bilag videresendt fra Gmail.

Original email:
Fra: {email_data['from']}
Emne: {email_data['subject']}
Dato: {email_data['date']}
PDF fil: {clean_filename}

Automatisk videresendt af Gmail PDF Forwarder.
"""
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Attach PDF with e-conomic compatible headers
            pdf_attachment = MIMEBase('application', 'pdf')
            pdf_attachment.set_payload(pdf_data)
            encoders.encode_base64(pdf_attachment)
            
            # Use headers that e-conomic can definitely read
            pdf_attachment.add_header('Content-Disposition', f'attachment; filename="{clean_filename}"')
            pdf_attachment.add_header('Content-Type', 'application/pdf')
            pdf_attachment.add_header('Content-Transfer-Encoding', 'base64')
            
            msg.attach(pdf_attachment)
            
            # Send email
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            send_message = self.gmail_service.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            # Add to sent PDFs to prevent duplicates
            self.sent_pdfs.add(pdf_hash)
            
            logger.info(f"PDF {clean_filename} ({file_size_mb:.1f}MB) forwarded to {self.economic_email}")
            return send_message['id']
            
        except Exception as e:
            logger.error(f"Error forwarding PDF {filename}: {e}")
            return None
    
    async def create_processed_label(self):
        """Create processed label if it doesn't exist"""
        try:
            labels = self.gmail_service.service.users().labels().list(userId='me').execute()
            label_exists = any(label['name'] == self.processed_label for label in labels.get('labels', []))
            
            if not label_exists:
                label_body = {
                    'name': self.processed_label,
                    'labelListVisibility': 'labelShow',
                    'messageListVisibility': 'show'
                }
                created_label = self.gmail_service.service.users().labels().create(
                    userId='me',
                    body=label_body
                ).execute()
                logger.info(f"Created label: {self.processed_label} (ID: {created_label['id']})")
                return created_label['id']
            else:
                # Find existing label ID
                for label in labels.get('labels', []):
                    if label['name'] == self.processed_label:
                        logger.info(f"Using existing label: {self.processed_label} (ID: {label['id']})")
                        return label['id']
            
        except Exception as e:
            logger.error(f"Error creating label: {e}")
            return None
    
    async def mark_as_processed(self, message_id, label_id):
        """Mark email as processed"""
        try:
            if label_id:
                self.gmail_service.service.users().messages().modify(
                    userId='me',
                    id=message_id,
                    body={'addLabelIds': [label_id]}
                ).execute()
                logger.info(f"Marked message {message_id} as processed")
            else:
                logger.warning(f"Could not mark message {message_id} as processed - no label ID")
        except Exception as e:
            logger.error(f"Error marking message {message_id} as processed: {e}")
    
    async def load_sent_pdfs(self):
        """Load already sent PDFs from sent emails to prevent duplicates"""
        try:
            # Search for emails sent to e-conomic in the last 30 days
            query = f'to:{self.economic_email} after:2025/09/01'
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=100
            ).execute()
            
            sent_message_ids = response.get('messages', [])
            logger.info(f"Found {len(sent_message_ids)} previously sent emails to e-conomic")
            
            # Extract PDF hashes from sent emails
            for msg_id in sent_message_ids:
                try:
                    message = self.gmail_service.service.users().messages().get(
                        userId='me',
                        id=msg_id['id'],
                        format='full'
                    ).execute()
                    
                    # Extract PDF attachments from sent emails
                    attachments = self._extract_pdf_attachments(message.get('payload', {}))
                    for attachment in attachments:
                        if attachment['mimeType'] == 'application/pdf':
                            # Download and hash the PDF
                            pdf_data = await self.download_attachment(msg_id['id'], attachment['id'])
                            if pdf_data:
                                pdf_hash = self._generate_pdf_hash(pdf_data, attachment['filename'])
                                self.sent_pdfs.add(pdf_hash)
                                logger.debug(f"Loaded sent PDF hash: {attachment['filename']}")
                except Exception as e:
                    logger.debug(f"Could not process sent email {msg_id['id']}: {e}")
            
            logger.info(f"Loaded {len(self.sent_pdfs)} previously sent PDF hashes")
            
        except Exception as e:
            logger.warning(f"Could not load sent PDFs: {e}")

    async def run_forwarding_process(self, days_back=180, max_emails=10):
        """Run the PDF forwarding process with limits"""
        logger.info("Starting Gmail e-conomic PDF Forwarding process...")
        
        # Load previously sent PDFs to avoid duplicates
        await self.load_sent_pdfs()
        
        # Create processed label
        label_id = await self.create_processed_label()
        
        # Search for emails with PDFs
        message_ids = await self.search_emails_with_pdfs(days_back)
        
        if not message_ids:
            logger.info("No emails with PDF attachments found")
            return
        
        # Limit processing to prevent overload
        message_ids = message_ids[:max_emails]
        logger.info(f"Processing {len(message_ids)} emails (limited to {max_emails})")
        
        processed_count = 0
        forwarded_pdfs = 0
        errors = 0
        
        for i, msg_id in enumerate(message_ids, 1):
            try:
                logger.info(f"Processing email {i}/{len(message_ids)}: {msg_id['id']}")
                
                # Get email details
                email_data = await self.get_email_details(msg_id['id'])
                if not email_data or not email_data['attachments']:
                    logger.warning(f"No PDF attachments found in email {msg_id['id']}")
                    continue
                
                logger.info(f"Email: {email_data['subject']}")
                logger.info(f"From: {email_data['from']}")
                logger.info(f"PDF attachments: {len(email_data['attachments'])}")
                
                # Process each PDF attachment
                for attachment in email_data['attachments']:
                    if attachment['mimeType'] == 'application/pdf':
                        logger.info(f"Processing PDF: {attachment['filename']} ({attachment['size']} bytes)")
                        
                        # Download PDF
                        pdf_data = await self.download_attachment(msg_id['id'], attachment['id'])
                        if pdf_data:
                            # Forward to e-conomic
                            forward_id = await self.forward_pdf_to_economic(
                                email_data, pdf_data, attachment['filename']
                            )
                            if forward_id == "duplicate":
                                logger.info(f"SKIPPED DUPLICATE: {attachment['filename']}")
                            elif forward_id:
                                forwarded_pdfs += 1
                                logger.info(f"Successfully forwarded: {attachment['filename']}")
                            else:
                                logger.warning(f"Failed to forward: {attachment['filename']}")
                                errors += 1
                        else:
                            logger.error(f"Failed to download: {attachment['filename']}")
                            errors += 1
                
                # Mark as processed
                await self.mark_as_processed(msg_id['id'], label_id)
                processed_count += 1
                
                # Small delay to prevent rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error processing message {msg_id['id']}: {e}")
                errors += 1
        
        logger.info(f"Processed {processed_count} emails, forwarded {forwarded_pdfs} PDFs, {errors} errors")
        return processed_count, forwarded_pdfs, errors

async def main():
    """Main function"""
    # Configuration
    creds_file = "gmail-mcp-server/credentials.json"
    token_file = "gmail-mcp-server/token.json"
    economic_email = "788bilag1714566@e-conomic.dk"
    
    # Initialize forwarder
    forwarder = GmailEconomicForwarder(creds_file, token_file, economic_email)
    
    # Run forwarding process with limits
    processed, forwarded, errors = await forwarder.run_forwarding_process(days_back=180, max_emails=5)
    
    print(f"\nSUCCESS: Processed {processed} emails, forwarded {forwarded} PDFs to {economic_email}")
    if errors > 0:
        print(f"WARNING: {errors} errors occurred during processing")

if __name__ == "__main__":
    asyncio.run(main())

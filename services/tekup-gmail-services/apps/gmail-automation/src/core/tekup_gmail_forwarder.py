#!/usr/bin/env python3
"""
TekUp Gmail PDF Forwarder
Dedikeret løsning for TekUp organisationen
Automatisk PDF bilag forwarding til e-conomic
"""

import asyncio
import logging
import os
import sys
import base64
import hashlib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TekUpGmailForwarder:
    def __init__(self, creds_file, token_file):
        """Initialize TekUp Gmail Forwarder"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.processed_label = "TekUp_Processed"
        self.sent_pdfs = set()  # Track sent PDFs to avoid duplicates
        
        # TekUp specific configuration
        self.tekup_economic_email = "788bilag1714566@e-conomic.dk"
        self.tekup_organization = "Foodtruck Fiesta ApS"
        self.tekup_cvr = "44371901"
        
        logger.info(f"Initialized TekUp Gmail Forwarder for {self.gmail_service.user_email}")
    
    def _generate_pdf_hash(self, pdf_data, filename):
        """Generate a unique hash for PDF to detect duplicates"""
        content_hash = hashlib.md5(pdf_data).hexdigest()
        filename_hash = hashlib.md5(filename.encode()).hexdigest()
        size_hash = hashlib.md5(str(len(pdf_data)).encode()).hexdigest()
        combined_hash = hashlib.md5(f"{content_hash}_{filename_hash}_{size_hash}".encode()).hexdigest()
        return combined_hash

    async def forward_pdf_to_tekup_economic(self, email_data, pdf_data, filename):
        """Forward PDF to TekUp e-conomic with duplicate detection"""
        try:
            # Generate unique hash for this PDF
            pdf_hash = self._generate_pdf_hash(pdf_data, filename)
            
            # Check if we've already sent this PDF
            if pdf_hash in self.sent_pdfs:
                logger.info(f"SKIPPING DUPLICATE: {filename} (already sent to TekUp e-conomic)")
                return "duplicate"
            
            # Check file size (e-conomic limit)
            file_size_mb = len(pdf_data) / (1024 * 1024)
            if file_size_mb > 10:
                logger.warning(f"PDF {filename} is too large ({file_size_mb:.1f}MB), skipping")
                return None
            
            # Clean filename for e-conomic compatibility
            clean_filename = filename.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            
            # Create email for TekUp e-conomic
            msg = MIMEMultipart('mixed')
            msg['From'] = self.gmail_service.user_email
            msg['To'] = self.tekup_economic_email
            msg['Subject'] = f"TekUp Bilag: {clean_filename}"
            
            # Email body with TekUp branding
            body = f"""
TekUp Gmail PDF Auto Forwarder
==============================

Organisation: {self.tekup_organization}
CVR: {self.tekup_cvr}
Dato: {datetime.now().strftime('%d/%m/%Y %H:%M')}

PDF Bilag: {clean_filename}
Størrelse: {file_size_mb:.1f} MB

Dette bilag er automatisk sendt fra TekUp Gmail system.
Kontakt: ftfiestaa@gmail.com

---
TekUp Organization
Gmail PDF Automation System
"""
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Attach PDF with proper headers for e-conomic
            pdf_attachment = MIMEBase('application', 'pdf')
            pdf_attachment.set_payload(pdf_data)
            encoders.encode_base64(pdf_attachment)
            pdf_attachment.add_header(
                'Content-Disposition',
                f'attachment; filename="{clean_filename}"'
            )
            pdf_attachment.add_header('Content-Type', 'application/pdf')
            pdf_attachment.add_header('Content-Transfer-Encoding', 'base64')
            
            msg.attach(pdf_attachment)
            
            # Send email
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
            
            self.gmail_service.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            # Add to sent PDFs to prevent duplicates
            self.sent_pdfs.add(pdf_hash)
            logger.info(f"SUCCESS: TekUp PDF {clean_filename} ({file_size_mb:.1f}MB) sent to e-conomic")
            return "success"
                
        except Exception as e:
            logger.error(f"ERROR: Failed to send TekUp PDF {filename} to e-conomic: {e}")
            return None

    async def search_emails_with_pdfs(self, days_back=180):
        """Search for emails with PDF attachments"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            query = f'has:attachment filename:pdf after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")}'
            
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=50
            ).execute()
            
            message_ids = response.get('messages', [])
            logger.info(f"TekUp: Found {len(message_ids)} emails with PDF attachments from {start_date.strftime('%Y/%m/%d')} to {end_date.strftime('%Y/%m/%d')}")
            return message_ids
            
        except Exception as e:
            logger.error(f"ERROR: TekUp email search failed: {e}")
            return []

    async def get_email_details(self, message_id):
        """Get detailed email information"""
        try:
            message = self.gmail_service.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            headers = message.get('payload', {}).get('headers', [])
            subject = ''
            sender = ''
            
            for header in headers:
                if header['name'] == 'Subject':
                    subject = header['value']
                elif header['name'] == 'From':
                    sender = header['value']
            
            return {
                'id': message_id,
                'subject': subject,
                'sender': sender,
                'payload': message.get('payload', {})
            }
            
        except Exception as e:
            logger.error(f"ERROR: TekUp email details failed for {message_id}: {e}")
            return None

    def _extract_pdf_attachments(self, payload):
        """Extract PDF attachments from email payload"""
        attachments = []
        
        def extract_from_part(part):
            if part.get('mimeType') == 'application/pdf':
                attachment_id = part.get('body', {}).get('attachmentId')
                filename = part.get('filename', 'unknown.pdf')
                size = part.get('body', {}).get('size', 0)
                
                if attachment_id:
                    attachments.append({
                        'id': attachment_id,
                        'filename': filename,
                        'size': int(size),
                        'mimeType': 'application/pdf'
                    })
            
            # Check nested parts
            for subpart in part.get('parts', []):
                extract_from_part(subpart)
        
        extract_from_part(payload)
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
            logger.error(f"ERROR: TekUp attachment download failed for {attachment_id}: {e}")
            return None

    async def create_tekup_processed_label(self):
        """Create or get TekUp processed label"""
        try:
            # Check if label exists
            labels = self.gmail_service.service.users().labels().list(userId='me').execute()
            for label in labels.get('labels', []):
                if label['name'] == self.processed_label:
                    logger.info(f"TekUp: Using existing label: {self.processed_label} (ID: {label['id']})")
                    return label['id']
            
            # Create new TekUp label
            label_body = {
                'name': self.processed_label,
                'labelListVisibility': 'labelShow',
                'messageListVisibility': 'show'
            }
            
            created_label = self.gmail_service.service.users().labels().create(
                userId='me',
                body=label_body
            ).execute()
            
            logger.info(f"TekUp: Created new label: {self.processed_label} (ID: {created_label['id']})")
            return created_label['id']
            
        except Exception as e:
            logger.error(f"ERROR: TekUp label creation failed: {e}")
            return None

    async def mark_as_tekup_processed(self, message_id, label_id):
        """Mark email as processed by TekUp system"""
        try:
            if label_id:
                self.gmail_service.service.users().messages().modify(
                    userId='me',
                    id=message_id,
                    body={'addLabelIds': [label_id]}
                ).execute()
                logger.info(f"TekUp: Marked message {message_id} as processed")
            else:
                logger.warning(f"TekUp: Could not mark message {message_id} as processed - no label ID")
        except Exception as e:
            logger.error(f"ERROR: TekUp message marking failed for {message_id}: {e}")

    async def run_tekup_forwarding_process(self, days_back=180, max_emails=10):
        """Run the TekUp PDF forwarding process"""
        logger.info("=== TekUp Gmail PDF Forwarding Process Started ===")
        logger.info(f"Organization: {self.tekup_organization}")
        logger.info(f"CVR: {self.tekup_cvr}")
        logger.info(f"Target: {self.tekup_economic_email}")
        
        # Create TekUp processed label
        label_id = await self.create_tekup_processed_label()
        
        # Search for emails with PDFs
        message_ids = await self.search_emails_with_pdfs(days_back)
        
        if not message_ids:
            logger.info("TekUp: No emails with PDF attachments found")
            return
        
        # Process emails (limited to max_emails)
        emails_to_process = message_ids[:max_emails]
        logger.info(f"TekUp: Processing {len(emails_to_process)} emails (limited to {max_emails})")
        
        processed_count = 0
        forwarded_pdfs = 0
        duplicates = 0
        errors = 0
        
        for i, msg_id in enumerate(emails_to_process, 1):
            try:
                logger.info(f"TekUp: Processing email {i}/{len(emails_to_process)}: {msg_id['id']}")
                
                # Get email details
                email_data = await self.get_email_details(msg_id['id'])
                if not email_data:
                    logger.warning(f"TekUp: Could not get details for email {msg_id['id']}")
                    continue
                
                logger.info(f"TekUp Email: {email_data['subject']}")
                logger.info(f"TekUp From: {email_data['sender']}")
                
                # Extract PDF attachments
                attachments = self._extract_pdf_attachments(email_data['payload'])
                pdf_attachments = [att for att in attachments if att['mimeType'] == 'application/pdf']
                
                if not pdf_attachments:
                    logger.warning(f"TekUp: No PDF attachments found in email {msg_id['id']}")
                    continue
                
                logger.info(f"TekUp PDF attachments: {len(pdf_attachments)}")
                
                # Process each PDF attachment
                for attachment in pdf_attachments:
                    logger.info(f"TekUp: Processing PDF: {attachment['filename']} ({attachment['size']} bytes)")
                    
                    # Download PDF
                    pdf_data = await self.download_attachment(msg_id['id'], attachment['id'])
                    if pdf_data:
                        # Forward to TekUp e-conomic
                        result = await self.forward_pdf_to_tekup_economic(
                            email_data, pdf_data, attachment['filename']
                        )
                        if result == "duplicate":
                            duplicates += 1
                            logger.info(f"TekUp: SKIPPED DUPLICATE: {attachment['filename']}")
                        elif result == "success":
                            forwarded_pdfs += 1
                            logger.info(f"TekUp: Successfully sent: {attachment['filename']}")
                        else:
                            logger.warning(f"TekUp: Failed to send: {attachment['filename']}")
                            errors += 1
                    else:
                        logger.error(f"TekUp: Failed to download: {attachment['filename']}")
                        errors += 1
                
                # Mark as processed by TekUp
                await self.mark_as_tekup_processed(msg_id['id'], label_id)
                processed_count += 1
                
                # Rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"ERROR: TekUp processing failed for email {msg_id['id']}: {e}")
                errors += 1
        
        # TekUp Summary
        logger.info(f"\n=== TekUp Processing Complete ===")
        logger.info(f"Organization: {self.tekup_organization}")
        logger.info(f"Processed: {processed_count} emails")
        logger.info(f"Forwarded: {forwarded_pdfs} PDFs to e-conomic")
        logger.info(f"Duplicates: {duplicates} skipped")
        logger.info(f"Errors: {errors}")
        print(f"\nTekUp SUCCESS: Processed {processed_count} emails, forwarded {forwarded_pdfs} PDFs, {duplicates} duplicates, {errors} errors")

async def main():
    """Main function for TekUp Gmail Forwarder"""
    # Initialize TekUp forwarder
    forwarder = TekUpGmailForwarder(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json'
    )
    
    # Run TekUp forwarding process
    await forwarder.run_tekup_forwarding_process(days_back=180, max_emails=50)

if __name__ == "__main__":
    asyncio.run(main())

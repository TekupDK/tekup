#!/usr/bin/env python3
"""
Gmail PDF MCP Forwarder - MCP-baseret løsning til automatisk PDF forwarding
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

class GmailPDFMCPForwarder:
    def __init__(self, creds_file, token_file, economic_email):
        """Initialize Gmail PDF MCP Forwarder"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.economic_email = economic_email
        self.processed_label = "Videresendt_econ"
        logger.info(f"Initialized Gmail PDF MCP Forwarder for {self.gmail_service.user_email}")
    
    async def search_emails_with_pdfs(self, days_back=180):
        """Search for emails with PDF attachments from the last N days"""
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Format dates for Gmail query
            start_date_str = start_date.strftime('%Y/%m/%d')
            end_date_str = end_date.strftime('%Y/%m/%d')
            
            # Search query for emails with PDF attachments
            query = f'has:attachment filename:pdf after:{start_date_str} before:{end_date_str} -label:{self.processed_label}'
            
            logger.info(f"Searching for emails with PDFs from {start_date_str} to {end_date_str}")
            
            # Get message IDs
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=100
            ).execute()
            
            message_ids = response.get('messages', [])
            logger.info(f"Found {len(message_ids)} emails with PDF attachments")
            
            return message_ids
            
        except Exception as e:
            logger.error(f"Error searching emails: {e}")
            return []
    
    async def get_email_with_attachments(self, message_id):
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
    
    async def forward_pdf_to_economic(self, email_data, pdf_data, filename):
        """Forward PDF to e-conomic email with e-conomic compatible formatting"""
        try:
            # Check file size (e-conomic has limits)
            file_size_mb = len(pdf_data) / (1024 * 1024)
            if file_size_mb > 10:  # e-conomic typically has 10MB limit
                logger.warning(f"PDF {filename} is too large ({file_size_mb:.1f}MB), skipping")
                return None
            
            # Clean filename for e-conomic compatibility
            clean_filename = filename.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            if not clean_filename.endswith('.pdf'):
                clean_filename += '.pdf'
            
            # Create email message with e-conomic compatible format
            msg = MIMEMultipart()
            msg['From'] = self.gmail_service.user_email
            msg['To'] = self.economic_email
            msg['Subject'] = f"PDF Bilag: {email_data['subject']}"
            msg['Content-Type'] = 'multipart/mixed'
            
            # Simple email body (e-conomic prefers very simple format)
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
            
            # Use simple headers that e-conomic can read
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
            
            logger.info(f"PDF {clean_filename} ({file_size_mb:.1f}MB) forwarded to {self.economic_email}")
            return send_message['id']
            
        except Exception as e:
            logger.error(f"Error forwarding PDF {filename}: {e}")
            return None
    
    async def add_processed_label(self, message_id):
        """Add processed label to email"""
        try:
            # First check if label exists, create if not
            labels = self.gmail_service.service.users().labels().list(userId='me').execute()
            label_exists = any(label['name'] == self.processed_label for label in labels.get('labels', []))
            
            if not label_exists:
                # Create the label
                label_body = {
                    'name': self.processed_label,
                    'labelListVisibility': 'labelShow',
                    'messageListVisibility': 'show'
                }
                self.gmail_service.service.users().labels().create(
                    userId='me',
                    body=label_body
                ).execute()
                logger.info(f"Created label: {self.processed_label}")
            
            # Add label to message
            self.gmail_service.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': [self.processed_label]}
            ).execute()
            logger.info(f"Added processed label to message {message_id}")
        except Exception as e:
            logger.error(f"Error adding label to message {message_id}: {e}")
    
    async def run_forwarding_process(self, days_back=180):
        """Run the complete PDF forwarding process"""
        logger.info("Starting Gmail PDF MCP Forwarding process...")
        
        # Search for emails with PDFs
        message_ids = await self.search_emails_with_pdfs(days_back)
        
        if not message_ids:
            logger.info("No emails with PDF attachments found")
            return
        
        processed_count = 0
        forwarded_pdfs = 0
        
        for msg_id in message_ids:
            try:
                # Get email details
                email_data = await self.get_email_with_attachments(msg_id['id'])
                if not email_data or not email_data['attachments']:
                    continue
                
                logger.info(f"Processing email: {email_data['subject']}")
                
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
                            if forward_id:
                                forwarded_pdfs += 1
                                logger.info(f"Successfully forwarded: {attachment['filename']}")
                            else:
                                logger.warning(f"Failed to forward: {attachment['filename']}")
                        else:
                            logger.error(f"Failed to download: {attachment['filename']}")
                
                # Mark as processed
                await self.add_processed_label(msg_id['id'])
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing message {msg_id['id']}: {e}")
        
        logger.info(f"Processed {processed_count} emails, forwarded {forwarded_pdfs} PDFs")
        return processed_count, forwarded_pdfs

async def main():
    """Main function"""
    # Configuration
    creds_file = "gmail-mcp-server/credentials.json"
    token_file = "gmail-mcp-server/token.json"
    economic_email = "788bilag1714566@e-conomic.dk"
    
    # Initialize forwarder
    forwarder = GmailPDFMCPForwarder(creds_file, token_file, economic_email)
    
    # Run forwarding process
    processed, forwarded = await forwarder.run_forwarding_process(days_back=180)
    
    print(f"\nSUCCESS: Processed {processed} emails, forwarded {forwarded} PDFs to {economic_email}")

if __name__ == "__main__":
    asyncio.run(main())

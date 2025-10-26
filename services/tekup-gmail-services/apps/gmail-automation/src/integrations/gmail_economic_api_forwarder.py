#!/usr/bin/env python3
"""
Gmail to e-conomic API Forwarder
Automatisk PDF bilag forwarding med e-conomic API integration
"""

import asyncio
import logging
import os
import sys
import base64
import hashlib
import json
import requests
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

class EconomicApiForwarder:
    def __init__(self, creds_file, token_file, economic_config):
        """Initialize Gmail e-conomic API Forwarder"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.economic_config = economic_config
        self.processed_label = "Videresendt_econ"
        self.sent_pdfs = set()  # Track sent PDFs to avoid duplicates
        
        # e-conomic API configuration
        self.api_base_url = "https://restapi.e-conomic.com"
        self.headers = {
            'X-AppSecretToken': economic_config['app_secret_token'],
            'X-AgreementGrantToken': economic_config['agreement_grant_token'],
            'Content-Type': 'application/json'
        }
        
        logger.info(f"Initialized Gmail e-conomic API Forwarder for {self.gmail_service.user_email}")
    
    async def test_economic_connection(self):
        """Test connection to e-conomic API"""
        try:
            response = requests.get(f"{self.api_base_url}/customers", headers=self.headers)
            if response.status_code == 200:
                logger.info("SUCCESS: Connected to e-conomic API")
                return True
            else:
                logger.error(f"FAILED: e-conomic API connection failed - {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"ERROR: e-conomic API connection failed - {e}")
            return False
    
    async def create_economic_voucher(self, pdf_data, filename, description="PDF Bilag"):
        """Create a voucher in e-conomic with PDF attachment"""
        try:
            # Create voucher entry
            voucher_data = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "text": f"{description}: {filename}",
                "voucherNumber": None,  # Let e-conomic assign number
                "attachments": [
                    {
                        "fileName": filename,
                        "data": base64.b64encode(pdf_data).decode('utf-8')
                    }
                ]
            }
            
            # Create voucher via API
            response = requests.post(
                f"{self.api_base_url}/vouchers",
                headers=self.headers,
                json=voucher_data
            )
            
            if response.status_code == 201:
                voucher_id = response.json().get('voucherNumber')
                logger.info(f"SUCCESS: Created e-conomic voucher {voucher_id} for {filename}")
                return voucher_id
            else:
                logger.error(f"FAILED: Could not create e-conomic voucher - {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"ERROR: Failed to create e-conomic voucher for {filename}: {e}")
            return None
    
    def _generate_pdf_hash(self, pdf_data, filename):
        """Generate a unique hash for PDF to detect duplicates"""
        content_hash = hashlib.md5(pdf_data).hexdigest()
        filename_hash = hashlib.md5(filename.encode()).hexdigest()
        size_hash = hashlib.md5(str(len(pdf_data)).encode()).hexdigest()
        combined_hash = hashlib.md5(f"{content_hash}_{filename_hash}_{size_hash}".encode()).hexdigest()
        return combined_hash

    async def forward_pdf_to_economic_api(self, email_data, pdf_data, filename):
        """Forward PDF to e-conomic using API with duplicate detection"""
        try:
            # Generate unique hash for this PDF
            pdf_hash = self._generate_pdf_hash(pdf_data, filename)
            
            # Check if we've already sent this PDF
            if pdf_hash in self.sent_pdfs:
                logger.info(f"SKIPPING DUPLICATE: {filename} (already sent)")
                return "duplicate"
            
            # Check file size (e-conomic API limit)
            file_size_mb = len(pdf_data) / (1024 * 1024)
            if file_size_mb > 10:
                logger.warning(f"PDF {filename} is too large ({file_size_mb:.1f}MB), skipping")
                return None
            
            # Create voucher in e-conomic
            voucher_id = await self.create_economic_voucher(pdf_data, filename)
            
            if voucher_id:
                # Add to sent PDFs to prevent duplicates
                self.sent_pdfs.add(pdf_hash)
                logger.info(f"PDF {filename} ({file_size_mb:.1f}MB) uploaded to e-conomic voucher {voucher_id}")
                return voucher_id
            else:
                logger.warning(f"Failed to upload {filename} to e-conomic")
                return None
                
        except Exception as e:
            logger.error(f"Error uploading PDF {filename} to e-conomic: {e}")
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
            logger.info(f"Found {len(message_ids)} emails with PDF attachments from {start_date.strftime('%Y/%m/%d')} to {end_date.strftime('%Y/%m/%d')}")
            return message_ids
            
        except Exception as e:
            logger.error(f"Error searching emails: {e}")
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
            logger.error(f"Error getting email details for {message_id}: {e}")
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
            logger.error(f"Error downloading attachment {attachment_id}: {e}")
            return None

    async def create_processed_label(self):
        """Create or get processed label"""
        try:
            # Check if label exists
            labels = self.gmail_service.service.users().labels().list(userId='me').execute()
            for label in labels.get('labels', []):
                if label['name'] == self.processed_label:
                    logger.info(f"Using existing label: {self.processed_label} (ID: {label['id']})")
                    return label['id']
            
            # Create new label
            label_body = {
                'name': self.processed_label,
                'labelListVisibility': 'labelShow',
                'messageListVisibility': 'show'
            }
            
            created_label = self.gmail_service.service.users().labels().create(
                userId='me',
                body=label_body
            ).execute()
            
            logger.info(f"Created new label: {self.processed_label} (ID: {created_label['id']})")
            return created_label['id']
            
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

    async def run_forwarding_process(self, days_back=180, max_emails=10):
        """Run the PDF forwarding process with e-conomic API"""
        logger.info("Starting Gmail e-conomic API PDF Forwarding process...")
        
        # Test e-conomic connection
        if not await self.test_economic_connection():
            logger.error("Cannot connect to e-conomic API. Please check configuration.")
            return
        
        # Create processed label
        label_id = await self.create_processed_label()
        
        # Search for emails with PDFs
        message_ids = await self.search_emails_with_pdfs(days_back)
        
        if not message_ids:
            logger.info("No emails with PDF attachments found")
            return
        
        # Process emails (limited to max_emails)
        emails_to_process = message_ids[:max_emails]
        logger.info(f"Processing {len(emails_to_process)} emails (limited to {max_emails})")
        
        processed_count = 0
        forwarded_pdfs = 0
        errors = 0
        
        for i, msg_id in enumerate(emails_to_process, 1):
            try:
                logger.info(f"Processing email {i}/{len(emails_to_process)}: {msg_id['id']}")
                
                # Get email details
                email_data = await self.get_email_details(msg_id['id'])
                if not email_data:
                    logger.warning(f"Could not get details for email {msg_id['id']}")
                    continue
                
                logger.info(f"Email: {email_data['subject']}")
                logger.info(f"From: {email_data['sender']}")
                
                # Extract PDF attachments
                attachments = self._extract_pdf_attachments(email_data['payload'])
                pdf_attachments = [att for att in attachments if att['mimeType'] == 'application/pdf']
                
                if not pdf_attachments:
                    logger.warning(f"No PDF attachments found in email {msg_id['id']}")
                    continue
                
                logger.info(f"PDF attachments: {len(pdf_attachments)}")
                
                # Process each PDF attachment
                for attachment in pdf_attachments:
                    logger.info(f"Processing PDF: {attachment['filename']} ({attachment['size']} bytes)")
                    
                    # Download PDF
                    pdf_data = await self.download_attachment(msg_id['id'], attachment['id'])
                    if pdf_data:
                        # Forward to e-conomic via API
                        voucher_id = await self.forward_pdf_to_economic_api(
                            email_data, pdf_data, attachment['filename']
                        )
                        if voucher_id == "duplicate":
                            logger.info(f"SKIPPED DUPLICATE: {attachment['filename']}")
                        elif voucher_id:
                            forwarded_pdfs += 1
                            logger.info(f"Successfully uploaded: {attachment['filename']} (Voucher: {voucher_id})")
                        else:
                            logger.warning(f"Failed to upload: {attachment['filename']}")
                            errors += 1
                    else:
                        logger.error(f"Failed to download: {attachment['filename']}")
                        errors += 1
                
                # Mark as processed
                await self.mark_as_processed(msg_id['id'], label_id)
                processed_count += 1
                
                # Rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error processing email {msg_id['id']}: {e}")
                errors += 1
        
        # Summary
        logger.info(f"\nSUCCESS: Processed {processed_count} emails, uploaded {forwarded_pdfs} PDFs to e-conomic, {errors} errors")
        print(f"\nSUCCESS: Processed {processed_count} emails, uploaded {forwarded_pdfs} PDFs to e-conomic, {errors} errors")

async def main():
    """Main function"""
    # Load configuration
    economic_config = {
        'app_secret_token': os.getenv('ECONOMIC_APP_SECRET_TOKEN', 'demo'),
        'agreement_grant_token': os.getenv('ECONOMIC_AGREEMENT_GRANT_TOKEN', 'demo')
    }
    
    # Initialize forwarder
    forwarder = EconomicApiForwarder(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json',
        economic_config
    )
    
    # Run forwarding process
    await forwarder.run_forwarding_process(days_back=180, max_emails=5)

if __name__ == "__main__":
    asyncio.run(main())

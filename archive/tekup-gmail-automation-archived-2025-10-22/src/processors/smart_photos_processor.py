#!/usr/bin/env python3
"""
Smart Photos Processor
Intelligent behandling af kvitteringsbilleder fra Google Photos
"""

import asyncio
import sys
import os
import io
import json
import re
from datetime import datetime, timedelta
from PIL import Image
import requests
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

class SmartPhotosProcessor:
    def __init__(self, creds_file, token_file):
        """Initialize Gmail service for sending receipts"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.processed_photos = set()
        self.sent_count = 0
        self.error_count = 0
        
        print(f"Initialized Smart Photos Processor for {self.gmail_service.user_email}")
    
    async def find_receipt_emails_with_photos(self, days_back=180):
        """Find emails that likely contain receipt photos"""
        print("=== SØGER EFTER EMAILS MED KVITTERINGSBILEDER ===")
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Search for emails with receipt-related keywords
            receipt_keywords = [
                "kvittering", "receipt", "faktura", "invoice", "bilag", "regning",
                "danfoods", "telenor", "circle k", "ok", "q8", "wolt", "mcdonalds",
                "ikea", "johs sørensen", "larsen jakobsen", "visma", "economic",
                "collectia", "viabill", "booking", "travel", "europark", "feriekonto",
                "jks", "bs", "ls", "molslinje", "samsø", "kundegebyr", "lunar",
                "revolut", "mobilepay", "transfer", "overførsel", "dagrofa", "aura",
                "waffle supply", "livet i byen", "hejnsvig", "mad kultur", "århus catering",
                "gjensidige", "sintra", "jace ai"
            ]
            
            all_emails = []
            
            for keyword in receipt_keywords:
                query = f'after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")} "{keyword}" has:attachment'
                
                response = self.gmail_service.service.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=10
                ).execute()
                
                message_ids = response.get('messages', [])
                print(f"Found {len(message_ids)} emails for keyword: {keyword}")
                
                for msg_id in message_ids:
                    all_emails.append(msg_id['id'])
            
            # Remove duplicates
            unique_emails = list(set(all_emails))
            print(f"Total unique emails found: {len(unique_emails)}")
            
            return unique_emails
            
        except Exception as e:
            print(f"Error searching for receipt emails: {e}")
            return []
    
    async def process_receipt_emails(self, email_ids):
        """Process emails that likely contain receipts"""
        print("=== BEHANDLER EMAILS MED KVITTERINGER ===")
        
        processed_count = 0
        
        for i, email_id in enumerate(email_ids[:50]):  # Limit to 50 emails
            try:
                print(f"\nProcessing email {i+1}/{min(len(email_ids), 50)}")
                
                # Get email details
                message = self.gmail_service.service.users().messages().get(
                    userId='me',
                    id=email_id,
                    format='full'
                ).execute()
                
                subject = self._get_header(message, 'Subject')
                sender = self._get_header(message, 'From')
                date = self._get_header(message, 'Date')
                
                print(f"Subject: {subject}")
                print(f"From: {sender}")
                
                # Check if email has attachments
                attachments = self._extract_attachments(message)
                if attachments:
                    print(f"Found {len(attachments)} attachments")
                    
                    # Process each attachment
                    for attachment in attachments:
                        if attachment['mimeType'] in ['image/jpeg', 'image/png', 'image/jpg']:
                            await self._process_image_attachment(attachment, subject, sender)
                            processed_count += 1
                else:
                    print("No attachments found")
                
            except Exception as e:
                print(f"Error processing email {email_id}: {e}")
                self.error_count += 1
                continue
        
        print(f"\n=== PROCESSING COMPLETE ===")
        print(f"Processed emails: {processed_count}")
        print(f"Sent to e-conomic: {self.sent_count}")
        print(f"Errors: {self.error_count}")
    
    def _get_header(self, message, header_name):
        """Get email header value"""
        headers = message.get('payload', {}).get('headers', [])
        for header in headers:
            if header['name'] == header_name:
                return header['value']
        return ""
    
    def _extract_attachments(self, message):
        """Extract attachment information from email"""
        attachments = []
        
        def extract_from_part(part):
            if part.get('mimeType') in ['image/jpeg', 'image/png', 'image/jpg']:
                attachment_id = part.get('body', {}).get('attachmentId')
                filename = part.get('filename', 'unknown.jpg')
                size = part.get('body', {}).get('size', 0)
                
                if attachment_id:
                    attachments.append({
                        'id': attachment_id,
                        'filename': filename,
                        'size': int(size),
                        'mimeType': part.get('mimeType')
                    })
            
            # Check nested parts
            for subpart in part.get('parts', []):
                extract_from_part(subpart)
        
        extract_from_part(message.get('payload', {}))
        return attachments
    
    async def _process_image_attachment(self, attachment, subject, sender):
        """Process an image attachment"""
        try:
            print(f"Processing attachment: {attachment['filename']}")
            
            # Download attachment
            attachment_data = self.gmail_service.service.users().messages().attachments().get(
                userId='me',
                messageId=attachment['id'],
                id=attachment['id']
            ).execute()
            
            # Decode attachment data
            file_data = base64.urlsafe_b64decode(attachment_data['data'])
            
            # Convert to PDF
            image = Image.open(io.BytesIO(file_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create PDF
            pdf_buffer = io.BytesIO()
            image.save(pdf_buffer, format='PDF')
            pdf_data = pdf_buffer.getvalue()
            
            # Send to e-conomic
            filename = f"{attachment['filename']}_receipt.pdf"
            success = await self._send_to_economic(pdf_data, filename, subject, sender)
            
            if success:
                self.sent_count += 1
                print(f"SUCCESS: Sent {filename} to e-conomic")
            else:
                self.error_count += 1
                
        except Exception as e:
            print(f"Error processing attachment: {e}")
            self.error_count += 1
    
    async def _send_to_economic(self, pdf_data, filename, subject, sender):
        """Send PDF to e-conomic"""
        try:
            # Clean filename
            clean_filename = filename.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            
            # Create email
            msg = MIMEMultipart('mixed')
            msg['From'] = self.gmail_service.user_email
            msg['To'] = '788bilag1714566@e-conomic.dk'
            msg['Subject'] = f'PDF Bilag: {clean_filename}'
            
            # Email body
            body = f"""
TekUp Smart Photos Processing
Organization: Foodtruck Fiesta ApS
CVR: 44371901
Source: Gmail Attachment (Smart Processing)
Original Subject: {subject}
Original Sender: {sender}
Filename: {clean_filename}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach PDF
            part = MIMEBase('application', 'pdf')
            part.set_payload(pdf_data)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename= {clean_filename}')
            msg.attach(part)
            
            # Send email
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
            
            self.gmail_service.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            return True
            
        except Exception as e:
            print(f"Error sending to e-conomic: {e}")
            return False
    
    async def run_smart_processing(self):
        """Run the complete smart processing"""
        print("=== SMART PHOTOS PROCESSOR ===")
        print("Searching for emails with receipt attachments...")
        
        # Find receipt emails
        email_ids = await self.find_receipt_emails_with_photos()
        
        if not email_ids:
            print("No receipt emails found")
            return
        
        # Process emails
        await self.process_receipt_emails(email_ids)

async def main():
    """Main function"""
    processor = SmartPhotosProcessor(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json'
    )
    
    await processor.run_smart_processing()

if __name__ == "__main__":
    asyncio.run(main())

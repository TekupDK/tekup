#!/usr/bin/env python3
"""
Automated Photos Processor
Automatisk hentning og behandling af kvitteringsbilleder fra Google Photos
"""

import asyncio
import sys
import os
import io
import json
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

class AutomatedPhotosProcessor:
    def __init__(self, creds_file, token_file):
        """Initialize Gmail service for sending receipts"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.processed_photos = set()
        self.sent_count = 0
        self.error_count = 0
        
        print(f"Initialized Automated Photos Processor for {self.gmail_service.user_email}")
    
    async def search_google_photos_via_gmail(self, days_back=180):
        """Search for photos by looking for Google Photos links in Gmail"""
        print("=== SØGER EFTER GOOGLE PHOTOS LINKS I GMAIL ===")
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Search for emails with Google Photos links
            query = f'after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")} (photos.google.com OR drive.google.com)'
            
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=100
            ).execute()
            
            message_ids = response.get('messages', [])
            print(f"Found {len(message_ids)} emails with Google Photos links")
            
            photo_links = []
            
            for msg_id in message_ids[:20]:  # Limit to first 20
                try:
                    message = self.gmail_service.service.users().messages().get(
                        userId='me',
                        id=msg_id['id'],
                        format='full'
                    ).execute()
                    
                    # Extract photo links from email body
                    payload = message.get('payload', {})
                    body = self._extract_email_body(payload)
                    
                    if body and ('photos.google.com' in body or 'drive.google.com' in body):
                        photo_links.append({
                            'id': msg_id['id'],
                            'subject': self._get_header(message, 'Subject'),
                            'date': self._get_header(message, 'Date'),
                            'body': body
                        })
                        
                except Exception as e:
                    print(f"Error processing message {msg_id['id']}: {e}")
                    continue
            
            print(f"Found {len(photo_links)} emails with photo links")
            return photo_links
            
        except Exception as e:
            print(f"Error searching Gmail for photos: {e}")
            return []
    
    def _extract_email_body(self, payload):
        """Extract email body text"""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('mimeType') == 'text/plain':
                    data = part.get('body', {}).get('data', '')
                    if data:
                        body += base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                elif part.get('mimeType') == 'text/html':
                    data = part.get('body', {}).get('data', '')
                    if data:
                        body += base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        else:
            if payload.get('mimeType') == 'text/plain':
                data = payload.get('body', {}).get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        
        return body
    
    def _get_header(self, message, header_name):
        """Get email header value"""
        headers = message.get('payload', {}).get('headers', [])
        for header in headers:
            if header['name'] == header_name:
                return header['value']
        return ""
    
    async def process_receipt_photos_from_links(self, photo_links):
        """Process receipt photos from found links"""
        print("=== BEHANDLER KVITTERINGSBILEDER ===")
        
        for i, link_data in enumerate(photo_links):
            print(f"\nProcessing link {i+1}/{len(photo_links)}")
            print(f"Subject: {link_data['subject']}")
            
            # Extract photo URLs from email body
            photo_urls = self._extract_photo_urls(link_data['body'])
            
            if photo_urls:
                print(f"Found {len(photo_urls)} photo URLs")
                
                for j, url in enumerate(photo_urls):
                    try:
                        await self._process_single_photo(url, f"receipt_{i}_{j}")
                    except Exception as e:
                        print(f"Error processing photo {url}: {e}")
                        self.error_count += 1
            else:
                print("No photo URLs found in email body")
    
    def _extract_photo_urls(self, body):
        """Extract photo URLs from email body"""
        import re
        
        # Patterns for Google Photos and Drive links
        patterns = [
            r'https://photos\.google\.com/[^\s<>"]+',
            r'https://drive\.google\.com/[^\s<>"]+',
            r'https://lh\d+\.googleusercontent\.com/[^\s<>"]+'
        ]
        
        urls = []
        for pattern in patterns:
            matches = re.findall(pattern, body)
            urls.extend(matches)
        
        return list(set(urls))  # Remove duplicates
    
    async def _process_single_photo(self, photo_url, filename_base):
        """Process a single photo URL"""
        try:
            print(f"Processing photo: {photo_url[:50]}...")
            
            # Download photo
            response = requests.get(photo_url, timeout=30)
            if response.status_code != 200:
                print(f"Failed to download photo: {response.status_code}")
                return
            
            # Convert to PDF
            image = Image.open(io.BytesIO(response.content))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create PDF
            pdf_buffer = io.BytesIO()
            image.save(pdf_buffer, format='PDF')
            pdf_data = pdf_buffer.getvalue()
            
            # Send to e-conomic
            filename = f"{filename_base}_receipt.pdf"
            success = await self._send_to_economic(pdf_data, filename)
            
            if success:
                self.sent_count += 1
                print(f"SUCCESS: Sent {filename} to e-conomic")
            else:
                self.error_count += 1
                
        except Exception as e:
            print(f"Error processing photo: {e}")
            self.error_count += 1
    
    async def _send_to_economic(self, pdf_data, filename):
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
TekUp Automated Photos Processing
Organization: Foodtruck Fiesta ApS
CVR: 44371901
Source: Google Photos (Automated)
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
    
    async def run_automated_processing(self):
        """Run the complete automated processing"""
        print("=== AUTOMATED PHOTOS PROCESSOR ===")
        print("Searching for Google Photos links in Gmail...")
        
        # Search for photo links in Gmail
        photo_links = await self.search_google_photos_via_gmail()
        
        if not photo_links:
            print("No Google Photos links found in Gmail")
            return
        
        # Process photos
        await self.process_receipt_photos_from_links(photo_links)
        
        # Summary
        print(f"\n=== PROCESSING COMPLETE ===")
        print(f"Processed links: {len(photo_links)}")
        print(f"Sent to e-conomic: {self.sent_count}")
        print(f"Errors: {self.error_count}")

async def main():
    """Main function"""
    processor = AutomatedPhotosProcessor(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json'
    )
    
    await processor.run_automated_processing()

if __name__ == "__main__":
    asyncio.run(main())

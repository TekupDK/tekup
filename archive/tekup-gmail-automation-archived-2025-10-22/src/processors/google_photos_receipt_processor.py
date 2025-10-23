#!/usr/bin/env python3
"""
Google Photos Receipt Processor
Hent kvitteringsbilleder fra Google Photos og konverter til PDFs for e-conomic
"""

import asyncio
import sys
import os
import io
from datetime import datetime, timedelta
from PIL import Image
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

class GooglePhotosReceiptProcessor:
    def __init__(self, creds_file, token_file):
        """Initialize Google Photos and Gmail services"""
        self.gmail_service = GmailService(creds_file, token_file)
        
        # Initialize Google Photos API
        self.photos_service = None
        self.initialize_photos_service()
        
        print(f"Initialized Google Photos Receipt Processor for {self.gmail_service.user_email}")
    
    def initialize_photos_service(self):
        """Initialize Google Photos API service"""
        try:
            # Use same credentials as Gmail
            credentials = Credentials.from_authorized_user_file('gmail-mcp-server/token.json')
            
            # Build Google Photos API service
            self.photos_service = build('photoslibrary', 'v1', credentials=credentials)
            print("Google Photos API initialized successfully")
            
        except Exception as e:
            print(f"Error initializing Google Photos API: {e}")
            print("Note: Google Photos API requires separate authentication")
            self.photos_service = None
    
    async def search_receipt_photos(self, days_back=180):
        """Search for receipt photos in Google Photos"""
        if not self.photos_service:
            print("Google Photos API not available")
            return []
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Search for photos with receipt-related keywords
            search_terms = [
                "kvittering", "receipt", "faktura", "invoice", "bilag", "regning",
                "danfoods", "telenor", "circle k", "ok", "q8", "wolt", "mcdonalds",
                "ikea", "johs sørensen", "larsen jakobsen", "telenor", "visma",
                "economic", "collectia", "viabill", "booking", "travel", "europark",
                "feriekonto", "jks", "bs", "ls", "molslinje", "samsø", "kundegebyr",
                "lunar", "revolut", "mobilepay", "transfer", "overførsel"
            ]
            
            all_photos = []
            
            for term in search_terms:
                print(f"Searching for photos with term: {term}")
                
                # Search for photos
                search_request = {
                    'filters': {
                        'dateFilter': {
                            'ranges': [{
                                'startDate': {
                                    'year': start_date.year,
                                    'month': start_date.month,
                                    'day': start_date.day
                                },
                                'endDate': {
                                    'year': end_date.year,
                                    'month': end_date.month,
                                    'day': end_date.day
                                }
                            }]
                        },
                        'contentFilter': {
                            'includedContentCategories': ['RECEIPTS', 'DOCUMENTS']
                        }
                    }
                }
                
                response = self.photos_service.mediaItems().search(body=search_request).execute()
                photos = response.get('mediaItems', [])
                
                if photos:
                    print(f"Found {len(photos)} photos for term: {term}")
                    all_photos.extend(photos)
            
            # Remove duplicates
            unique_photos = []
            seen_ids = set()
            for photo in all_photos:
                if photo['id'] not in seen_ids:
                    unique_photos.append(photo)
                    seen_ids.add(photo['id'])
            
            print(f"Total unique photos found: {len(unique_photos)}")
            return unique_photos
            
        except Exception as e:
            print(f"Error searching Google Photos: {e}")
            return []
    
    async def download_photo(self, photo_item):
        """Download a photo from Google Photos"""
        try:
            photo_id = photo_item['id']
            base_url = photo_item['baseUrl']
            
            # Download photo
            response = requests.get(f"{base_url}=d")
            if response.status_code == 200:
                return response.content
            else:
                print(f"Failed to download photo {photo_id}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error downloading photo {photo_item.get('id', 'unknown')}: {e}")
            return None
    
    def convert_image_to_pdf(self, image_data, filename):
        """Convert image to PDF"""
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create PDF
            pdf_buffer = io.BytesIO()
            image.save(pdf_buffer, format='PDF')
            pdf_data = pdf_buffer.getvalue()
            
            print(f"Converted {filename} to PDF ({len(pdf_data)} bytes)")
            return pdf_data
            
        except Exception as e:
            print(f"Error converting {filename} to PDF: {e}")
            return None
    
    async def process_receipt_photos(self, max_photos=20):
        """Process receipt photos and send to e-conomic"""
        print("=== GOOGLE PHOTOS RECEIPT PROCESSOR ===\n")
        
        if not self.photos_service:
            print("Google Photos API not available. Please set up authentication.")
            return
        
        # Search for receipt photos
        photos = await self.search_receipt_photos()
        
        if not photos:
            print("No receipt photos found")
            return
        
        print(f"Processing {min(len(photos), max_photos)} photos...")
        
        processed_count = 0
        sent_count = 0
        
        for i, photo in enumerate(photos[:max_photos]):
            print(f"\nProcessing photo {i+1}/{min(len(photos), max_photos)}")
            print(f"Photo: {photo.get('filename', 'Unknown')}")
            print(f"Date: {photo.get('mediaMetadata', {}).get('creationTime', 'Unknown')}")
            
            # Download photo
            image_data = await self.download_photo(photo)
            if not image_data:
                print("Failed to download photo")
                continue
            
            # Convert to PDF
            filename = photo.get('filename', f'receipt_{photo["id"]}.jpg')
            pdf_data = self.convert_image_to_pdf(image_data, filename)
            if not pdf_data:
                print("Failed to convert to PDF")
                continue
            
            # Send to e-conomic
            try:
                await self.send_to_economic(pdf_data, filename)
                sent_count += 1
                print(f"SUCCESS: Sent {filename} to e-conomic")
            except Exception as e:
                print(f"ERROR: Failed to send {filename}: {e}")
            
            processed_count += 1
        
        print(f"\n=== PROCESSING COMPLETE ===")
        print(f"Processed: {processed_count} photos")
        print(f"Sent to e-conomic: {sent_count} PDFs")
    
    async def send_to_economic(self, pdf_data, filename):
        """Send PDF to e-conomic via email"""
        try:
            # Clean filename for e-conomic
            clean_filename = filename.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            
            # Create email
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            from email.mime.base import MIMEBase
            from email import encoders
            import base64
            
            msg = MIMEMultipart('mixed')
            msg['From'] = self.gmail_service.user_email
            msg['To'] = '788bilag1714566@e-conomic.dk'
            msg['Subject'] = f'PDF Bilag: {clean_filename}'
            
            # Email body
            body = f"""
TekUp Google Photos Receipt Processing
Organization: Foodtruck Fiesta ApS
CVR: 44371901
Source: Google Photos
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
            
        except Exception as e:
            print(f"Error sending to e-conomic: {e}")
            raise

async def main():
    """Main function"""
    processor = GooglePhotosReceiptProcessor(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json'
    )
    
    await processor.process_receipt_photos()

if __name__ == "__main__":
    asyncio.run(main())

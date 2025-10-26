#!/usr/bin/env python3
"""
Manual Receipt Processor
Hjælp med at behandle kvitteringsbilleder manuelt fra Google Photos
"""

import os
import sys
from datetime import datetime
from PIL import Image
import asyncio

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

class ManualReceiptProcessor:
    def __init__(self, creds_file, token_file):
        """Initialize Gmail service for sending receipts"""
        self.gmail_service = GmailService(creds_file, token_file)
        print(f"Initialized Manual Receipt Processor for {self.gmail_service.user_email}")
    
    def convert_image_to_pdf(self, image_path, output_path=None):
        """Convert image to PDF"""
        try:
            # Open image
            image = Image.open(image_path)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create output path if not provided
            if not output_path:
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                output_path = f"{base_name}_receipt.pdf"
            
            # Save as PDF
            image.save(output_path, format='PDF')
            print(f"Converted {image_path} to {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Error converting {image_path} to PDF: {e}")
            return None
    
    async def send_receipt_to_economic(self, pdf_path, original_filename=None):
        """Send PDF receipt to e-conomic"""
        try:
            # Read PDF file
            with open(pdf_path, 'rb') as f:
                pdf_data = f.read()
            
            # Use original filename or extract from path
            if not original_filename:
                original_filename = os.path.basename(pdf_path)
            
            # Clean filename for e-conomic
            clean_filename = original_filename.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            
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
TekUp Manual Receipt Processing
Organization: Foodtruck Fiesta ApS
CVR: 44371901
Source: Google Photos (Manual)
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
            
            print(f"SUCCESS: Sent {clean_filename} to e-conomic")
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to send {pdf_path}: {e}")
            return False
    
    def process_receipt_folder(self, folder_path):
        """Process all images in a folder"""
        print(f"Processing receipts in folder: {folder_path}")
        
        if not os.path.exists(folder_path):
            print(f"Folder {folder_path} does not exist")
            return
        
        # Supported image formats
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
        
        processed_count = 0
        sent_count = 0
        
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            
            # Check if it's an image file
            if os.path.isfile(file_path) and any(filename.lower().endswith(ext) for ext in image_extensions):
                print(f"\nProcessing: {filename}")
                
                # Convert to PDF
                pdf_path = self.convert_image_to_pdf(file_path)
                if pdf_path:
                    # Send to e-conomic
                    success = asyncio.run(self.send_receipt_to_economic(pdf_path, filename))
                    if success:
                        sent_count += 1
                    
                    # Clean up PDF file
                    try:
                        os.remove(pdf_path)
                    except:
                        pass
                
                processed_count += 1
        
        print(f"\n=== PROCESSING COMPLETE ===")
        print(f"Processed: {processed_count} images")
        print(f"Sent to e-conomic: {sent_count} PDFs")

def main():
    """Main function with instructions"""
    print("=== MANUAL RECEIPT PROCESSOR ===")
    print("This tool helps you process receipt photos from Google Photos")
    print()
    print("INSTRUCTIONS:")
    print("1. Download receipt photos from Google Photos to a folder")
    print("2. Run this script with the folder path")
    print("3. The script will convert images to PDFs and send to e-conomic")
    print()
    print("Example usage:")
    print("python manual_receipt_processor.py /path/to/receipt/photos")
    print()
    
    # Check if folder path provided
    if len(sys.argv) > 1:
        folder_path = sys.argv[1]
        processor = ManualReceiptProcessor(
            'gmail-mcp-server/credentials.json',
            'gmail-mcp-server/token.json'
        )
        processor.process_receipt_folder(folder_path)
    else:
        print("Please provide a folder path containing receipt photos")
        print("Example: python manual_receipt_processor.py ./receipt_photos")

if __name__ == "__main__":
    main()

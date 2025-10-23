#!/usr/bin/env python3
"""
Find Missing Receipts
Søg efter PDF fakturaer i Gmail for de manglende transaktioner
"""

import asyncio
import sys
from datetime import datetime, timedelta

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

class MissingReceiptsFinder:
    def __init__(self, creds_file, token_file):
        """Initialize Gmail service for finding missing receipts"""
        self.gmail_service = GmailService(creds_file, token_file)
        self.missing_vendors = [
            "Danfoods", "Johs. Sørensen", "Telenor", "Larsen & Jakobsen", 
            "Visma", "e-conomic", "Collectia", "Viabill", "Booking",
            "Travel", "Europark", "EuroIncasso", "FerieKonto", "JKS",
            "BS", "LS", "Molslinje", "Samsø", "Kundegebyr", "Online Banking",
            "Lunar", "Revolut", "MobilePay", "Transfer", "Overførsel"
        ]
        
        print(f"Initialized Missing Receipts Finder for {self.gmail_service.user_email}")
    
    async def search_for_vendor_receipts(self, vendor_name, days_back=180):
        """Search for receipts from specific vendor"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Create search query for vendor
            query = f'has:attachment filename:pdf after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")}'
            
            # Add vendor-specific terms
            vendor_terms = vendor_name.lower().replace(' ', ' OR ')
            query += f' ({vendor_terms})'
            
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=20
            ).execute()
            
            message_ids = response.get('messages', [])
            print(f"Found {len(message_ids)} emails with PDFs for {vendor_name}")
            
            return message_ids
            
        except Exception as e:
            print(f"Error searching for {vendor_name}: {e}")
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
            date = ''
            
            for header in headers:
                if header['name'] == 'Subject':
                    subject = header['value']
                elif header['name'] == 'From':
                    sender = header['value']
                elif header['name'] == 'Date':
                    date = header['value']
            
            return {
                'id': message_id,
                'subject': subject,
                'sender': sender,
                'date': date,
                'payload': message.get('payload', {})
            }
            
        except Exception as e:
            print(f"Error getting email details for {message_id}: {e}")
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
    
    async def find_missing_receipts(self):
        """Find missing receipts for all vendors"""
        print("=== SØGER EFTER MANGLENDE BILAG ===\n")
        
        all_found_receipts = []
        
        for vendor in self.missing_vendors:
            print(f"Searching for {vendor} receipts...")
            
            # Search for vendor receipts
            message_ids = await self.search_for_vendor_receipts(vendor)
            
            if message_ids:
                print(f"Found {len(message_ids)} potential receipts for {vendor}")
                
                # Get details for first few emails
                for i, msg_id in enumerate(message_ids[:3]):  # Limit to first 3
                    email_data = await self.get_email_details(msg_id['id'])
                    if email_data:
                        attachments = self._extract_pdf_attachments(email_data['payload'])
                        pdf_attachments = [att for att in attachments if att['mimeType'] == 'application/pdf']
                        
                        if pdf_attachments:
                            print(f"  - {email_data['subject'][:60]}...")
                            print(f"    From: {email_data['sender']}")
                            print(f"    PDFs: {len(pdf_attachments)}")
                            
                            all_found_receipts.append({
                                'vendor': vendor,
                                'email_data': email_data,
                                'attachments': pdf_attachments
                            })
            else:
                print(f"No receipts found for {vendor}")
            
            print()
        
        print(f"=== SAMMENDRAG ===")
        print(f"Total vendors searched: {len(self.missing_vendors)}")
        print(f"Total receipts found: {len(all_found_receipts)}")
        
        return all_found_receipts

async def main():
    """Main function"""
    finder = MissingReceiptsFinder(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json'
    )
    
    await finder.find_missing_receipts()

if __name__ == "__main__":
    asyncio.run(main())

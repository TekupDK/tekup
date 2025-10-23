#!/usr/bin/env python3
"""
Check Senders
Tjek hvilke afsendere vi har fået bilag fra
"""

import asyncio
import sys
from datetime import datetime, timedelta
from collections import defaultdict

# Add Gmail MCP Server to path
sys.path.append('gmail-mcp-server/src')
from gmail_plugin.server import GmailService

class SenderChecker:
    def __init__(self, creds_file, token_file):
        """Initialize Gmail service for checking senders"""
        self.gmail_service = GmailService(creds_file, token_file)
        print(f"Initialized Sender Checker for {self.gmail_service.user_email}")
    
    async def get_processed_emails(self, days_back=180):
        """Get emails that have been processed by TekUp system"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Search for emails with TekUp_Processed label
            query = f'label:TekUp_Processed after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")}'
            
            response = self.gmail_service.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=100
            ).execute()
            
            message_ids = response.get('messages', [])
            print(f"Found {len(message_ids)} emails with TekUp_Processed label")
            return message_ids
            
        except Exception as e:
            print(f"Error searching for processed emails: {e}")
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
                'date': date
            }
            
        except Exception as e:
            print(f"Error getting email details for {message_id}: {e}")
            return None
    
    async def check_senders(self):
        """Check which senders we have received receipts from"""
        print("=== TJEKKER AFSENDERE ===\n")
        
        # Get processed emails
        message_ids = await self.get_processed_emails()
        
        if not message_ids:
            print("No processed emails found")
            return
        
        # Analyze senders
        senders = defaultdict(list)
        
        for i, msg_id in enumerate(message_ids, 1):
            print(f"Processing email {i}/{len(message_ids)}: {msg_id['id']}")
            
            email_data = await self.get_email_details(msg_id['id'])
            if email_data:
                sender = email_data['sender']
                senders[sender].append(email_data)
                print(f"  From: {sender}")
                print(f"  Subject: {email_data['subject'][:60]}...")
            else:
                print(f"  Could not get details for {msg_id['id']}")
        
        print(f"\n=== AFSNEDERE OVERSIGT ===")
        print(f"Total processed emails: {len(message_ids)}")
        print(f"Unique senders: {len(senders)}")
        print()
        
        # Show senders sorted by count
        for sender, emails in sorted(senders.items(), key=lambda x: len(x[1]), reverse=True):
            print(f"{sender}: {len(emails)} emails")
            for email in emails[:3]:  # Show first 3 subjects
                print(f"  - {email['subject'][:60]}...")
            if len(emails) > 3:
                print(f"  ... and {len(emails) - 3} more")
            print()
        
        return senders

async def main():
    """Main function"""
    checker = SenderChecker(
        'gmail-mcp-server/credentials.json',
        'gmail-mcp-server/token.json'
    )
    
    await checker.check_senders()

if __name__ == "__main__":
    asyncio.run(main())

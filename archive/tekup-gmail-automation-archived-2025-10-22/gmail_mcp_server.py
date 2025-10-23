#!/usr/bin/env python3
"""
Gmail MCP Server with Auto OAuth2 Authentication
Based on the Gmail AutoAuth MCP Server concept
"""

import asyncio
import json
import os
import sys
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional

# Gmail API imports
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# MCP imports
from mcp.server import Server
from mcp.types import Resource, Tool, TextContent

# Configure logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GmailMCPServer:
    """Gmail MCP Server with automatic OAuth2 authentication"""
    
    def __init__(self):
        self.server = Server("gmail-autoauth-mcp")
        self.gmail_service = None
        self.credentials = None
        self.setup_handlers()
        logger.info("Gmail MCP Server initialized")
        
    def setup_handlers(self):
        """Setup MCP server handlers"""
        
        @self.server.list_resources()
        async def list_resources() -> List[Resource]:
            """List available Gmail resources"""
            return [
                Resource(
                    uri="gmail://inbox",
                    name="Gmail Inbox",
                    description="Gmail inbox emails",
                    mimeType="application/json"
                ),
                Resource(
                    uri="gmail://sent",
                    name="Gmail Sent",
                    description="Gmail sent emails",
                    mimeType="application/json"
                ),
                Resource(
                    uri="gmail://labels",
                    name="Gmail Labels",
                    description="Gmail labels and folders",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            """Read a specific Gmail resource"""
            if not self.gmail_service:
                return json.dumps({"error": "Gmail service not connected"})
            
            if uri == "gmail://inbox":
                return await self._get_inbox_emails()
            elif uri == "gmail://sent":
                return await self._get_sent_emails()
            elif uri == "gmail://labels":
                return await self._get_labels()
            else:
                raise ValueError(f"Unknown resource: {uri}")
        
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            """List available Gmail tools"""
            return [
                Tool(
                    name="send_email",
                    description="Send an email with optional attachments",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "to": {"type": "string", "description": "Recipient email address"},
                            "subject": {"type": "string", "description": "Email subject"},
                            "body": {"type": "string", "description": "Email body"},
                            "attachments": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of file paths to attach"
                            }
                        },
                        "required": ["to", "subject", "body"]
                    }
                ),
                Tool(
                    name="search_emails",
                    description="Search emails with various criteria",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"},
                            "max_results": {"type": "integer", "description": "Maximum number of results", "default": 10}
                        },
                        "required": ["query"]
                    }
                ),
                Tool(
                    name="get_email",
                    description="Get a specific email by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "email_id": {"type": "string", "description": "Email ID"}
                        },
                        "required": ["email_id"]
                    }
                ),
                Tool(
                    name="mark_as_read",
                    description="Mark emails as read",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "email_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of email IDs to mark as read"
                            }
                        },
                        "required": ["email_ids"]
                    }
                ),
                Tool(
                    name="delete_emails",
                    description="Delete emails",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "email_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of email IDs to delete"
                            }
                        },
                        "required": ["email_ids"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            """Call a specific Gmail tool"""
            if not self.gmail_service:
                return [TextContent(type="text", text=json.dumps({"error": "Gmail service not connected"}))]
            
            try:
                if name == "send_email":
                    result = await self._send_email(
                        arguments["to"],
                        arguments["subject"],
                        arguments["body"],
                        arguments.get("attachments", [])
                    )
                elif name == "search_emails":
                    result = await self._search_emails(
                        arguments["query"],
                        arguments.get("max_results", 10)
                    )
                elif name == "get_email":
                    result = await self._get_email(arguments["email_id"])
                elif name == "mark_as_read":
                    result = await self._mark_as_read(arguments["email_ids"])
                elif name == "delete_emails":
                    result = await self._delete_emails(arguments["email_ids"])
                else:
                    raise ValueError(f"Unknown tool: {name}")
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                return [TextContent(type="text", text=json.dumps({"error": str(e)}))]
    
    async def authenticate(self, credentials_file: str = "credentials.json"):
        """Authenticate with Gmail using OAuth2"""
        try:
            SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
            
            creds = None
            token_file = 'token.json'
            
            # Load existing token
            if os.path.exists(token_file):
                creds = Credentials.from_authorized_user_file(token_file, SCOPES)
            
            # If no valid credentials, get new ones
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(credentials_file):
                        # Create default credentials file
                        await self._create_default_credentials(credentials_file)
                    
                    flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
                    creds = flow.run_local_server(port=0)
                
                # Save credentials for next run
                with open(token_file, 'w') as token:
                    token.write(creds.to_json())
            
            # Build Gmail service
            self.gmail_service = build('gmail', 'v1', credentials=creds)
            self.credentials = creds
            
            # Get user info
            profile = self.gmail_service.users().getProfile(userId='me').execute()
            user_email = profile['emailAddress']
            
            logger.info(f"Successfully authenticated as: {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    async def _create_default_credentials(self, credentials_file: str):
        """Create default credentials file"""
        credentials = {
            "installed": {
                "client_id": "32040013275-oetuh0614ltcedsotr2ue1rajbd05n0n.apps.googleusercontent.com",
                "project_id": "decent-digit-461308-p8",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": "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",
                "redirect_uris": ["http://localhost"]
            }
        }
        
        with open(credentials_file, 'w') as f:
            json.dump(credentials, f, indent=2)
        
        logger.info(f"Created credentials file: {credentials_file}")
    
    async def _get_inbox_emails(self) -> str:
        """Get inbox emails"""
        try:
            results = self.gmail_service.users().messages().list(
                userId='me', labelIds=['INBOX'], maxResults=10
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = self.gmail_service.users().messages().get(
                    userId='me', id=message['id']
                ).execute()
                
                headers = msg['payload'].get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                emails.append({
                    'id': message['id'],
                    'subject': subject,
                    'from': sender,
                    'date': date,
                    'snippet': msg['snippet']
                })
            
            return json.dumps(emails, indent=2)
            
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    async def _get_sent_emails(self) -> str:
        """Get sent emails"""
        try:
            results = self.gmail_service.users().messages().list(
                userId='me', labelIds=['SENT'], maxResults=10
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = self.gmail_service.users().messages().get(
                    userId='me', id=message['id']
                ).execute()
                
                headers = msg['payload'].get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                to = next((h['value'] for h in headers if h['name'] == 'To'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                emails.append({
                    'id': message['id'],
                    'subject': subject,
                    'to': to,
                    'date': date,
                    'snippet': msg['snippet']
                })
            
            return json.dumps(emails, indent=2)
            
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    async def _get_labels(self) -> str:
        """Get Gmail labels"""
        try:
            results = self.gmail_service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            
            label_list = []
            for label in labels:
                label_list.append({
                    'id': label['id'],
                    'name': label['name'],
                    'type': label['type']
                })
            
            return json.dumps(label_list, indent=2)
            
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    async def _send_email(self, to: str, subject: str, body: str, attachments: List[str] = None) -> Dict[str, Any]:
        """Send an email"""
        try:
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            from email.mime.base import MIMEBase
            from email import encoders
            import base64
            
            message = MIMEMultipart()
            message['to'] = to
            message['subject'] = subject
            message.attach(MIMEText(body, 'plain'))
            
            # Add attachments if any
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        with open(file_path, "rb") as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                'Content-Disposition',
                                f'attachment; filename= {os.path.basename(file_path)}'
                            )
                            message.attach(part)
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            send_message = self.gmail_service.users().messages().send(
                userId='me', body={'raw': raw_message}
            ).execute()
            
            return {
                "success": True,
                "message_id": send_message['id'],
                "to": to,
                "subject": subject
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _search_emails(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """Search emails"""
        try:
            results = self.gmail_service.users().messages().list(
                userId='me', q=query, maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = self.gmail_service.users().messages().get(
                    userId='me', id=message['id']
                ).execute()
                
                headers = msg['payload'].get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                emails.append({
                    'id': message['id'],
                    'subject': subject,
                    'from': sender,
                    'date': date,
                    'snippet': msg['snippet']
                })
            
            return {
                "query": query,
                "results": emails,
                "total": len(emails)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _get_email(self, email_id: str) -> Dict[str, Any]:
        """Get a specific email"""
        try:
            msg = self.gmail_service.users().messages().get(
                userId='me', id=email_id
            ).execute()
            
            headers = msg['payload'].get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
            
            # Get email body
            body = ""
            if 'parts' in msg['payload']:
                for part in msg['payload']['parts']:
                    if part['mimeType'] == 'text/plain':
                        data = part['body']['data']
                        body = base64.urlsafe_b64decode(data).decode()
                        break
            
            return {
                'id': email_id,
                'subject': subject,
                'from': sender,
                'date': date,
                'body': body,
                'snippet': msg['snippet']
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _mark_as_read(self, email_ids: List[str]) -> Dict[str, Any]:
        """Mark emails as read"""
        try:
            for email_id in email_ids:
                self.gmail_service.users().messages().modify(
                    userId='me', id=email_id, body={'removeLabelIds': ['UNREAD']}
                ).execute()
            
            return {
                "success": True,
                "marked_read": len(email_ids)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _delete_emails(self, email_ids: List[str]) -> Dict[str, Any]:
        """Delete emails"""
        try:
            for email_id in email_ids:
                self.gmail_service.users().messages().delete(
                    userId='me', id=email_id
                ).execute()
            
            return {
                "success": True,
                "deleted": len(email_ids)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def run(self):
        """Run the MCP server"""
        logger.info("Starting Gmail MCP Server...")
        
        # Authenticate
        auth_success = await self.authenticate()
        if not auth_success:
            logger.error("Failed to authenticate with Gmail")
            return
        
        # Run the server
        await self.server.run()

async def main():
    """Main function for testing"""
    print("Gmail MCP Server - Auto OAuth2 Authentication")
    print("=" * 60)
    
    # Initialize server
    server = GmailMCPServer()
    
    # Test authentication
    print("1. Testing Gmail authentication...")
    auth_success = await server.authenticate()
    print(f"   Authentication: {'OK' if auth_success else 'ERROR'}")
    
    if auth_success:
        # Test getting inbox emails
        print("2. Testing inbox emails...")
        inbox = await server._get_inbox_emails()
        print(f"   Inbox: {inbox[:100]}...")
        
        # Test getting labels
        print("3. Testing labels...")
        labels = await server._get_labels()
        print(f"   Labels: {labels[:100]}...")
        
        print("\nSUCCESS: Gmail MCP Server test completed!")
        print("\nTo run the actual MCP server, use:")
        print("python gmail_mcp_server.py --server")
    else:
        print("\nERROR: Authentication failed!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        # Run as MCP server
        asyncio.run(GmailMCPServer().run())
    else:
        # Run test
        asyncio.run(main())

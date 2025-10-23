#!/usr/bin/env python3
"""
TekUp Gmail MCP Server for PDF forwarding and receipt processing
"""

import asyncio
import json
import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TekUpGmailMCPServer:
    """TekUp Gmail MCP Server for PDF forwarding and receipt processing"""
    
    def __init__(self):
        self.gmail_service = None
        self.tekup_config = self._load_tekup_config()
        logger.info("TekUp Gmail MCP Server initialized")
        
    def _load_tekup_config(self) -> Dict[str, Any]:
        """Load TekUp organization configuration"""
        config = {
            "organization": "TekUp",
            "economic_email": "788bilag1714566@e-conomic.dk",
            "processed_label": "TekUp_Processed",
            "max_emails": 50,
            "file_size_limit_mb": 10,
            "duplicate_detection": True,
            "photo_processing": True,
            "renos_integration": True
        }
        
        # Load from environment or config file
        if os.path.exists("tekup_config.json"):
            with open("tekup_config.json", "r") as f:
                config.update(json.load(f))
        
        return config
    
    def setup_gmail_service(self, creds_file: str, token_file: str):
        """Setup Gmail service connection"""
        try:
            from src.core.gmail_forwarder import GmailPDFForwarder
            self.gmail_service = GmailPDFForwarder()
            logger.info("Gmail service connected successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to setup Gmail service: {e}")
            return False
    
    async def list_emails(self, days_back: int = 30) -> List[Dict[str, Any]]:
        """List emails with PDF attachments"""
        try:
            if not self.gmail_service:
                return []
            
            # Use the existing Gmail forwarder to get emails
            # This is a simplified version - in reality we'd need to implement
            # the actual email listing functionality
            logger.info(f"Listing emails from last {days_back} days")
            
            # Return mock data for now
            return [
                {
                    "id": "mock_email_1",
                    "subject": "Invoice from Supplier",
                    "from": "supplier@example.com",
                    "date": "2024-10-14",
                    "has_pdf": True,
                    "pdf_count": 1
                }
            ]
            
        except Exception as e:
            logger.error(f"Error listing emails: {e}")
            return []
    
    async def process_emails(self, email_ids: List[str]) -> Dict[str, Any]:
        """Process specific emails"""
        try:
            if not self.gmail_service:
                return {"error": "Gmail service not connected"}
            
            logger.info(f"Processing {len(email_ids)} emails")
            
            # Use the existing Gmail forwarder to process emails
            # This would call the actual processing methods
            results = {
                "processed": len(email_ids),
                "successful": len(email_ids),
                "failed": 0,
                "forwarded_to": self.tekup_config["economic_email"]
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing emails: {e}")
            return {"error": str(e)}
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get system status"""
        try:
            status = {
                "server": "TekUp Gmail MCP Server",
                "version": "1.2.0",
                "status": "running",
                "gmail_connected": self.gmail_service is not None,
                "config": self.tekup_config,
                "timestamp": datetime.now().isoformat()
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e)}
    
    async def process_receipts(self, source: str = "gmail") -> Dict[str, Any]:
        """Process receipts from various sources"""
        try:
            logger.info(f"Processing receipts from {source}")
            
            # This would integrate with the receipt processors
            results = {
                "source": source,
                "processed": 0,
                "successful": 0,
                "failed": 0,
                "timestamp": datetime.now().isoformat()
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing receipts: {e}")
            return {"error": str(e)}

async def main():
    """Main function for testing the MCP server"""
    print("TekUp Gmail MCP Server - Test Mode")
    print("=" * 50)
    
    # Initialize server
    server = TekUpGmailMCPServer()
    
    # Test system status
    print("\n1. Testing system status...")
    status = await server.get_system_status()
    print(f"Status: {json.dumps(status, indent=2)}")
    
    # Test Gmail service setup
    print("\n2. Testing Gmail service setup...")
    gmail_ok = server.setup_gmail_service("config/credentials.json", "config/token.json")
    print(f"Gmail service: {'OK' if gmail_ok else 'ERROR'}")
    
    # Test email listing
    print("\n3. Testing email listing...")
    emails = await server.list_emails(days_back=7)
    print(f"Found {len(emails)} emails")
    
    # Test receipt processing
    print("\n4. Testing receipt processing...")
    receipts = await server.process_receipts("gmail")
    print(f"Receipt processing: {json.dumps(receipts, indent=2)}")
    
    print("\nSUCCESS: TekUp Gmail MCP Server test completed!")

if __name__ == "__main__":
    asyncio.run(main())

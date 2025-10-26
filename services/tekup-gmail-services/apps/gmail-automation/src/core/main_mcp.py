"""
TekUp Gmail Automation - MCP-based Main Entry Point

This module provides a MCP-based entry point for the TekUp Gmail Automation system.
"""

import sys
import asyncio
import logging
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def setup_logging(level: str = "INFO") -> None:
    """Setup logging configuration."""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

async def start_mcp_server():
    """Start the MCP server."""
    print("Starting TekUp Gmail MCP Server...")
    
    try:
        from tekup_gmail_mcp_server import TekUpGmailMCPServer
        server = TekUpGmailMCPServer()
        
        # Setup Gmail service
        gmail_ok = server.setup_gmail_service("config/credentials.json", "config/token.json")
        if not gmail_ok:
            print("ERROR: Failed to setup Gmail service")
            return False
        
        print("MCP Server started successfully!")
        print("Server is running... (Press Ctrl+C to stop)")
        
        # Keep server running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping MCP Server...")
            return True
        
    except Exception as e:
        print(f"ERROR: MCP Server failed to start: {e}")
        return False

async def test_mcp_server():
    """Test the MCP server functionality."""
    print("Testing TekUp Gmail MCP Server...")
    
    try:
        from tekup_gmail_mcp_server import TekUpGmailMCPServer
        server = TekUpGmailMCPServer()
        
        # Test system status
        print("1. Testing system status...")
        status = await server.get_system_status()
        print(f"   Status: {status['status']}")
        print(f"   Version: {status['version']}")
        
        # Test Gmail service setup
        print("2. Testing Gmail service setup...")
        gmail_ok = server.setup_gmail_service("config/credentials.json", "config/token.json")
        print(f"   Gmail service: {'OK' if gmail_ok else 'ERROR'}")
        
        # Test email listing
        print("3. Testing email listing...")
        emails = await server.list_emails(days_back=7)
        print(f"   Found {len(emails)} emails")
        
        # Test receipt processing
        print("4. Testing receipt processing...")
        receipts = await server.process_receipts("gmail")
        print(f"   Receipt processing: {receipts['processed']} processed")
        
        print("\nSUCCESS: MCP Server test completed!")
        return True
        
    except Exception as e:
        print(f"ERROR: MCP Server test failed: {e}")
        return False

async def process_emails_mcp():
    """Process emails using MCP server."""
    print("Processing emails with MCP Server...")
    
    try:
        from tekup_gmail_mcp_server import TekUpGmailMCPServer
        server = TekUpGmailMCPServer()
        
        # Setup Gmail service
        gmail_ok = server.setup_gmail_service("config/credentials.json", "config/token.json")
        if not gmail_ok:
            print("ERROR: Failed to setup Gmail service")
            return False
        
        # List emails
        emails = await server.list_emails(days_back=30)
        print(f"Found {len(emails)} emails to process")
        
        if emails:
            # Process emails
            email_ids = [email["id"] for email in emails]
            results = await server.process_emails(email_ids)
            print(f"Processing results: {results}")
        else:
            print("No emails to process")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Email processing failed: {e}")
        return False

async def process_receipts_mcp():
    """Process receipts using MCP server."""
    print("Processing receipts with MCP Server...")
    
    try:
        from tekup_gmail_mcp_server import TekUpGmailMCPServer
        server = TekUpGmailMCPServer()
        
        # Process receipts
        results = await server.process_receipts("gmail")
        print(f"Receipt processing results: {results}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Receipt processing failed: {e}")
        return False

def main():
    """Main entry point."""
    print("TekUp Gmail Automation - MCP-based Version")
    print("=" * 50)
    
    setup_logging()
    
    if len(sys.argv) < 2:
        print("Usage: python -m src.core.main_mcp <command>")
        print("Commands:")
        print("  start       - Start the MCP server")
        print("  test        - Test MCP server functionality")
        print("  emails      - Process emails with MCP server")
        print("  receipts    - Process receipts with MCP server")
        return 1
    
    command = sys.argv[1].lower()
    
    if command == "start":
        success = asyncio.run(start_mcp_server())
        return 0 if success else 1
        
    elif command == "test":
        success = asyncio.run(test_mcp_server())
        return 0 if success else 1
        
    elif command == "emails":
        success = asyncio.run(process_emails_mcp())
        return 0 if success else 1
        
    elif command == "receipts":
        success = asyncio.run(process_receipts_mcp())
        return 0 if success else 1
    
    else:
        print(f"ERROR: Unknown command '{command}'")
        return 1

if __name__ == "__main__":
    sys.exit(main())

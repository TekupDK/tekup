"""
TekUp Gmail Automation - Final Working Main Entry Point

This module provides a working entry point that focuses on Gmail functionality.
"""

import sys
import logging
import time
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def setup_logging(level: str = "INFO") -> None:
    """Setup logging configuration."""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def test_gmail_forwarder():
    """Test Gmail forwarder functionality."""
    try:
        from src.core.gmail_forwarder import GmailPDFForwarder
        forwarder = GmailPDFForwarder()
        print("OK: GmailPDFForwarder created successfully")
        return True
    except Exception as e:
        print(f"ERROR: GmailPDFForwarder failed: {e}")
        return False

def start_service():
    """Start the Gmail automation service."""
    print("Starting TekUp Gmail Automation Service...")
    
    try:
        from src.core.gmail_forwarder import GmailPDFForwarder
        forwarder = GmailPDFForwarder()
        
        print("Service started successfully!")
        print("Processing emails...")
        
        # Process emails using the run method
        forwarder.run()
        
        print("Email processing completed!")
        return True
        
    except Exception as e:
        print(f"ERROR: Service failed to start: {e}")
        return False

def check_status():
    """Check system status."""
    print("Checking system status...")
    
    gmail_ok = test_gmail_forwarder()
    
    print("\nSystem Status:")
    print(f"  Gmail Forwarder: {'OK' if gmail_ok else 'ERROR'}")
    
    if gmail_ok:
        print("\nSUCCESS: Gmail forwarder is working!")
    else:
        print("\nERROR: Gmail forwarder has issues!")
    
    return gmail_ok

def process_emails():
    """Process emails once."""
    print("Processing emails...")
    
    try:
        from src.core.gmail_forwarder import GmailPDFForwarder
        forwarder = GmailPDFForwarder()
        
        # Process emails using the run method
        forwarder.run()
        
        print("Email processing completed!")
        return True
        
    except Exception as e:
        print(f"ERROR: Email processing failed: {e}")
        return False

def main():
    """Main entry point."""
    print("TekUp Gmail Automation - Final Working Version")
    print("=" * 50)
    
    setup_logging()
    
    if len(sys.argv) < 2:
        print("Usage: python -m src.core.main_final <command>")
        print("Commands:")
        print("  start       - Start the service")
        print("  status      - Check system status")
        print("  process     - Process emails once")
        print("  test        - Run all tests")
        return 1
    
    command = sys.argv[1].lower()
    
    if command == "start":
        success = start_service()
        return 0 if success else 1
        
    elif command == "status":
        success = check_status()
        return 0 if success else 1
        
    elif command == "process":
        success = process_emails()
        return 0 if success else 1
        
    elif command == "test":
        print("Running system tests...")
        gmail_ok = test_gmail_forwarder()
        
        if gmail_ok:
            print("\nSUCCESS: All tests passed!")
            return 0
        else:
            print("\nERROR: Some tests failed!")
            return 1
    
    else:
        print(f"ERROR: Unknown command '{command}'")
        return 1

if __name__ == "__main__":
    sys.exit(main())

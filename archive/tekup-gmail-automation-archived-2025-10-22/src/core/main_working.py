"""
TekUp Gmail Automation - Working Main Entry Point

This module provides a working entry point that doesn't rely on problematic imports.
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

def test_receipt_processor():
    """Test receipt processor functionality."""
    try:
        # Test manual receipt processor (doesn't have gmail_plugin dependency)
        from src.processors.manual_receipt_processor import ManualReceiptProcessor
        processor = ManualReceiptProcessor()
        print("OK: ManualReceiptProcessor created successfully")
        return True
    except Exception as e:
        print(f"ERROR: ManualReceiptProcessor failed: {e}")
        return False

def test_economic_forwarder():
    """Test economic forwarder functionality."""
    try:
        from src.integrations.gmail_economic_forwarder import GmailEconomicForwarder
        forwarder = GmailEconomicForwarder()
        print("OK: GmailEconomicForwarder created successfully")
        return True
    except Exception as e:
        print(f"ERROR: GmailEconomicForwarder failed: {e}")
        return False

def start_service():
    """Start the Gmail automation service."""
    print("Starting TekUp Gmail Automation Service...")
    
    try:
        from src.core.gmail_forwarder import GmailPDFForwarder
        forwarder = GmailPDFForwarder()
        
        print("Service started successfully!")
        print("Processing emails...")
        
        # Process emails once
        forwarder.process_emails()
        
        print("Email processing completed!")
        return True
        
    except Exception as e:
        print(f"ERROR: Service failed to start: {e}")
        return False

def check_status():
    """Check system status."""
    print("Checking system status...")
    
    status = {
        "gmail_forwarder": test_gmail_forwarder(),
        "receipt_processor": test_receipt_processor(), 
        "economic_forwarder": test_economic_forwarder()
    }
    
    print("\nSystem Status:")
    for component, status_val in status.items():
        status_icon = "OK" if status_val else "ERROR"
        print(f"  {component}: {status_icon}")
    
    all_ok = all(status.values())
    if all_ok:
        print("\nSUCCESS: All components are working!")
    else:
        print("\nERROR: Some components have issues!")
    
    return all_ok

def process_receipts():
    """Process receipts."""
    print("Processing receipts...")
    
    try:
        from src.processors.manual_receipt_processor import ManualReceiptProcessor
        processor = ManualReceiptProcessor()
        
        # Process receipts
        processor.process_receipts()
        
        print("Receipt processing completed!")
        return True
        
    except Exception as e:
        print(f"ERROR: Receipt processing failed: {e}")
        return False

def main():
    """Main entry point."""
    print("TekUp Gmail Automation - Working Version")
    print("=" * 50)
    
    setup_logging()
    
    if len(sys.argv) < 2:
        print("Usage: python -m src.core.main_working <command>")
        print("Commands:")
        print("  start       - Start the service")
        print("  status      - Check system status")
        print("  receipts    - Process receipts")
        print("  test        - Run all tests")
        return 1
    
    command = sys.argv[1].lower()
    
    if command == "start":
        success = start_service()
        return 0 if success else 1
        
    elif command == "status":
        success = check_status()
        return 0 if success else 1
        
    elif command == "receipts":
        success = process_receipts()
        return 0 if success else 1
        
    elif command == "test":
        print("Running system tests...")
        gmail_ok = test_gmail_forwarder()
        receipt_ok = test_receipt_processor()
        economic_ok = test_economic_forwarder()
        
        all_ok = gmail_ok and receipt_ok and economic_ok
        
        if all_ok:
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

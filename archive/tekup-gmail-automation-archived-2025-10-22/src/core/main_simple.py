"""
TekUp Gmail Automation - Simple Main Entry Point

This module provides a simple entry point for testing the system.
"""

import sys
import logging
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def setup_logging():
    """Setup basic logging."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def test_imports():
    """Test if we can import the main modules."""
    try:
        print("Testing imports...")
        
        # Test core modules
        from src.core.gmail_forwarder import GmailPDFForwarder
        print("OK: GmailPDFForwarder imported successfully")
        
        # Test processors
        from src.processors.google_photos_receipt_processor import GooglePhotosReceiptProcessor
        print("OK: GooglePhotosReceiptProcessor imported successfully")
        
        # Test integrations
        from src.integrations.gmail_economic_forwarder import GmailEconomicForwarder
        print("OK: GmailEconomicForwarder imported successfully")
        
        print("\nSUCCESS: All core modules imported successfully!")
        return True
        
    except ImportError as e:
        print(f"ERROR: Import error: {e}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return False

def test_basic_functionality():
    """Test basic functionality of the system."""
    try:
        print("\nTesting basic functionality...")
        
        # Test Gmail forwarder
        from src.core.gmail_forwarder import GmailPDFForwarder
        forwarder = GmailPDFForwarder()
        print("OK: GmailPDFForwarder instantiated")
        
        # Test receipt processor
        from src.processors.google_photos_receipt_processor import GooglePhotosReceiptProcessor
        processor = GooglePhotosReceiptProcessor()
        print("OK: GooglePhotosReceiptProcessor instantiated")
        
        # Test economic forwarder
        from src.integrations.gmail_economic_forwarder import GmailEconomicForwarder
        economic = GmailEconomicForwarder()
        print("OK: GmailEconomicForwarder instantiated")
        
        print("\nSUCCESS: Basic functionality test passed!")
        return True
        
    except Exception as e:
        print(f"ERROR: Functionality test error: {e}")
        return False

def main():
    """Main entry point."""
    print("TekUp Gmail Automation - System Test")
    print("=" * 50)
    
    setup_logging()
    
    # Test imports
    if not test_imports():
        print("\nERROR: Import test failed!")
        return 1
    
    # Test basic functionality
    if not test_basic_functionality():
        print("\nERROR: Functionality test failed!")
        return 1
    
    print("\nSUCCESS: All tests passed! System is ready.")
    return 0

if __name__ == "__main__":
    sys.exit(main())

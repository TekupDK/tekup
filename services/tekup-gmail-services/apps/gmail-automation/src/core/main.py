"""
TekUp Gmail Automation - Main Entry Point

This module provides the main entry point for the TekUp Gmail Automation system.
"""

import asyncio
import logging
import sys
import time
from pathlib import Path
from typing import Optional

import click
from loguru import logger

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.core.gmail_forwarder import GmailPDFForwarder
from src.integrations.gmail_economic_api_forwarder import EconomicApiForwarder
from src.processors.google_photos_receipt_processor import GooglePhotosReceiptProcessor


def setup_logging(level: str = "INFO") -> None:
    """Setup logging configuration."""
    logger.remove()  # Remove default handler
    
    # Console logging
    logger.add(
        sys.stdout,
        level=level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True
    )
    
    # File logging
    log_file = Path("logs/tekup-gmail.log")
    log_file.parent.mkdir(exist_ok=True)
    
    logger.add(
        log_file,
        level=level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )


@click.group()
@click.option('--log-level', default='INFO', help='Log level (DEBUG, INFO, WARNING, ERROR)')
@click.option('--config', default='config/env.example', help='Configuration file path')
@click.pass_context
def cli(ctx, log_level: str, config: str):
    """TekUp Gmail Automation - Intelligent PDF forwarding and receipt processing."""
    ctx.ensure_object(dict)
    ctx.obj['log_level'] = log_level
    ctx.obj['config'] = config
    
    setup_logging(log_level)
    logger.info("TekUp Gmail Automation started")


@cli.command()
@click.option('--daemon', is_flag=True, help='Run as daemon')
@click.option('--interval', default=300, help='Processing interval in seconds')
@click.pass_context
def start(ctx, daemon: bool, interval: int):
    """Start the Gmail automation service."""
    logger.info(f"Starting Gmail automation service (interval: {interval}s)")
    
    try:
        forwarder = GmailPDFForwarder()
        
        if daemon:
            # Run in background
            import threading
            def run_forwarder():
                while True:
                    try:
                        forwarder.process_emails()
                        time.sleep(interval)
                    except Exception as e:
                        logger.error(f"Error in forwarder: {e}")
                        time.sleep(60)
            
            thread = threading.Thread(target=run_forwarder, daemon=True)
            thread.start()
            thread.join()
        else:
            # Run once
            forwarder.process_emails()
            
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
    except Exception as e:
        logger.error(f"Service error: {e}")
        sys.exit(1)


@cli.command()
@click.option('--email-id', required=True, help='Email ID to process')
@click.pass_context
def process(ctx, email_id: str):
    """Process a specific email."""
    logger.info(f"Processing email: {email_id}")
    
    try:
        forwarder = GmailPDFForwarder()
        result = forwarder.process_email(email_id)
        logger.info(f"Email processed: {result}")
    except Exception as e:
        logger.error(f"Error processing email: {e}")
        sys.exit(1)


@cli.command()
@click.pass_context
def status(ctx):
    """Check system status."""
    logger.info("Checking system status...")
    
    try:
        # Check Gmail connection
        forwarder = GmailPDFForwarder()
        gmail_status = forwarder.check_connection()
        
        # Check Economic API
        economic = EconomicApiForwarder()
        economic_status = economic.check_connection() if hasattr(economic, 'check_connection') else False
        
        # Check receipt processor
        processor = GooglePhotosReceiptProcessor()
        processor_status = processor.check_status() if hasattr(processor, 'check_status') else False
        
        logger.info(f"Gmail: {'✅' if gmail_status else '❌'}")
        logger.info(f"Economic API: {'✅' if economic_status else '❌'}")
        logger.info(f"Receipt Processor: {'✅' if processor_status else '❌'}")
        
    except Exception as e:
        logger.error(f"Status check error: {e}")
        sys.exit(1)


@cli.command()
@click.option('--source', default='all', help='Source to process (gmail, photos, all)')
@click.pass_context
def process_receipts(ctx, source: str):
    """Process receipts from various sources."""
    logger.info(f"Processing receipts from: {source}")
    
    try:
        processor = GooglePhotosReceiptProcessor()
        
        if source in ['gmail', 'all']:
            if hasattr(processor, 'process_gmail_receipts'):
                processor.process_gmail_receipts()
            
        if source in ['photos', 'all']:
            if hasattr(processor, 'process_photos_receipts'):
                processor.process_photos_receipts()
            else:
                processor.process_receipts()
            
        logger.info("Receipt processing completed")
        
    except Exception as e:
        logger.error(f"Receipt processing error: {e}")
        sys.exit(1)


@cli.command()
@click.pass_context
def test(ctx):
    """Run system tests."""
    logger.info("Running system tests...")
    
    try:
        import subprocess
        result = subprocess.run([sys.executable, "-m", "pytest", "tests/"], capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✅ All tests passed")
        else:
            logger.error(f"❌ Tests failed: {result.stderr}")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Test error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    cli()

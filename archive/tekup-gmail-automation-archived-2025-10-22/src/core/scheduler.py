#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scheduler til Gmail PDF Forwarder
Kører automatisk på planlagte tidspunkter
"""

import schedule
import time
import logging
from datetime import datetime
from gmail_forwarder import GmailPDFForwarder

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_forwarder():
    """Kør forwarder job"""
    logger.info("=" * 60)
    logger.info(f"🕒 Planlagt kørsel startet: {datetime.now()}")
    logger.info("=" * 60)
    
    try:
        forwarder = GmailPDFForwarder()
        forwarder.run()
        logger.info("✅ Planlagt kørsel gennemført")
    except Exception as e:
        logger.error(f"❌ Fejl under planlagt kørsel: {e}", exc_info=True)


def main():
    """Main scheduler"""
    print("🤖 Gmail PDF Forwarder Scheduler")
    print("=" * 50)
    
    # Kør ved start
    logger.info("🚀 Starter scheduler - første kørsel nu...")
    run_forwarder()
    
    # Planlæg daglig kørsel kl. 09:00
    schedule.every().day.at("09:00").do(run_forwarder)
    
    # Alternativt: Andre tider (kommenter ind/ud efter behov)
    # schedule.every().day.at("15:00").do(run_forwarder)  # Eftermiddag
    # schedule.every(6).hours.do(run_forwarder)           # Hver 6. time
    # schedule.every().monday.at("08:00").do(run_forwarder)  # Hver mandag
    
    logger.info("⏰ Scheduler konfigureret:")
    logger.info("   • Daglig kørsel kl. 09:00")
    logger.info("   • Tryk CTRL+C for at stoppe")
    
    # Hold scheduler kørende
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # Tjek hvert minut
        except KeyboardInterrupt:
            logger.info("\n⏹️  Scheduler stoppet af bruger")
            break
        except Exception as e:
            logger.error(f"💥 Scheduler fejl: {e}", exc_info=True)
            time.sleep(300)  # Vent 5 minutter ved fejl


if __name__ == '__main__':
    main()


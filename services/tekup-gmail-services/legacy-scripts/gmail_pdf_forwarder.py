#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gmail PDF Bilag Forwarder til e-conomic
Automatisk videresendelse af PDF-vedhaeftninger fra Gmail til e-conomic bilagsmail
"""

import os
import base64
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import pickle

# Konfiguration
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
CONFIG_FILE = 'config.json'
TOKEN_FILE = 'token.pickle'
LOG_FILE = 'gmail_forwarder.log'

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class GmailPDFForwarder:
    """Klasse til at haandtere Gmail PDF videresendelse til e-conomic"""
    
    def __init__(self, config_path: str = CONFIG_FILE):
        """Initialiser forwarder med konfiguration"""
        self.config = self.load_config(config_path)
        self.service = None
        self.processed_label_id = None
        self.stats = {
            'processed': 0,
            'forwarded': 0,
            'errors': 0,
            'skipped': 0
        }
    
    def load_config(self, config_path: str) -> dict:
        """Indlaes konfiguration fra JSON fil"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            logger.info(f"Konfiguration indlaest fra {config_path}")
            return config
        except FileNotFoundError:
            logger.error(f"Konfigurationsfil ikke fundet: {config_path}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Ugyldig JSON i konfigurationsfil: {e}")
            raise
    
    def authenticate(self):
        """Autentificer med Gmail API via OAuth2"""
        creds = None
        
        # Tjek om der er gemt credentials
        if os.path.exists(TOKEN_FILE):
            with open(TOKEN_FILE, 'rb') as token:
                creds = pickle.load(token)
        
        # Hvis ikke gyldige credentials, log ind
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                logger.info("Opdaterer udloebet token...")
                creds.refresh(Request())
            else:
                logger.info("Starter OAuth2 flow...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.config['credentials_file'], SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Gem credentials til naeste gang
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
            logger.info("Credentials gemt")
        
        self.service = build('gmail', 'v1', credentials=creds)
        logger.info("Gmail API service oprettet succesfuldt")
    
    def get_or_create_label(self, label_name: str) -> str:
        """Opret eller hent ID for label"""
        try:
            # Tjek om label eksisterer
            results = self.service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            
            for label in labels:
                if label['name'] == label_name:
                    logger.info(f"Label '{label_name}' fundet: {label['id']}")
                    return label['id']
            
            # Opret nyt label
            label_object = {
                'name': label_name,
                'labelListVisibility': 'labelShow',
                'messageListVisibility': 'show'
            }
            created_label = self.service.users().labels().create(
                userId='me', body=label_object).execute()
            logger.info(f"Label '{label_name}' oprettet: {created_label['id']}")
            return created_label['id']
        
        except HttpError as error:
            logger.error(f"Fejl ved label haandtering: {error}")
            raise
    
    def build_search_query(self) -> str:
        """Byg Gmail soegequery baseret paa config"""
        query_parts = [
            'has:attachment',
            'filename:pdf'
        ]
        
        # Tilfoej dato begraensning
        if 'days_back' in self.config:
            days = self.config['days_back']
            date_from = (datetime.now() - timedelta(days=days)).strftime('%Y/%m/%d')
            query_parts.append(f'after:{date_from}')
        
        # Tilfoej soegeord for emne/indhold
        if 'search_keywords' in self.config and self.config['search_keywords']:
            keywords = ' OR '.join(self.config['search_keywords'])
            query_parts.append(f'({keywords})')
        
        # Tilfoej specifikke afsendere
        if 'allowed_senders' in self.config and self.config['allowed_senders']:
            senders = ' OR '.join([f'from:{s}' for s in self.config['allowed_senders']])
            query_parts.append(f'({senders})')
        
        # Ekskluder allerede behandlede
        processed_label = self.config.get('processed_label', 'Videresendt_econ')
        query_parts.append(f'-label:{processed_label}')
        
        query = ' '.join(query_parts)
        logger.info(f"Soegequery: {query}")
        return query
    
    def get_pdf_attachments(self, message_id: str) -> List[Dict]:
        """Hent PDF vedhaeftninger fra en email"""
        try:
            message = self.service.users().messages().get(
                userId='me', id=message_id, format='full').execute()
            
            attachments = []
            payload = message.get('payload', {})
            
            # Hent headers
            headers = {h['name']: h['value'] for h in payload.get('headers', [])}
            subject = headers.get('Subject', 'Ingen emne')
            sender = headers.get('From', 'Ukendt afsender')
            date = headers.get('Date', '')
            
            # Funktion til at gennemgaa parts rekursivt
            def extract_parts(parts, level=0):
                for part in parts:
                    filename = part.get('filename', '')
                    
                    # Tjek om det er en PDF
                    if filename.lower().endswith('.pdf'):
                        if 'attachmentId' in part.get('body', {}):
                            att_id = part['body']['attachmentId']
                            
                            # Hent vedhaeftning
                            attachment = self.service.users().messages().attachments().get(
                                userId='me', messageId=message_id, id=att_id).execute()
                            
                            file_data = base64.urlsafe_b64decode(attachment['data'])
                            
                            attachments.append({
                                'filename': filename,
                                'data': file_data,
                                'size': len(file_data),
                                'subject': subject,
                                'sender': sender,
                                'date': date
                            })
                            logger.info(f"  PDF fundet: {filename} ({len(file_data)} bytes)")
                    
                    # Rekursivt for nested parts
                    if 'parts' in part:
                        extract_parts(part['parts'], level + 1)
            
            # Start extraction
            if 'parts' in payload:
                extract_parts(payload['parts'])
            
            return attachments
        
        except HttpError as error:
            logger.error(f"Fejl ved hentning af vedhaeftninger fra {message_id}: {error}")
            return []
    
    def create_forward_email(self, attachment_info: Dict, destination: str) -> MIMEMultipart:
        """Opret email til videresendelse"""
        msg = MIMEMultipart()
        msg['From'] = 'me'
        msg['To'] = destination
        
        # Emne med original info
        original_subject = attachment_info.get('subject', 'Bilag')
        msg['Subject'] = f"Fwd: {original_subject}"
        
        # Email body
        body_text = f"""
Automatisk videresendt bilag fra Gmail til e-conomic

Original afsender: {attachment_info.get('sender', 'Ukendt')}
Original dato: {attachment_info.get('date', 'Ukendt')}
Original emne: {original_subject}
Filnavn: {attachment_info['filename']}
Stoerrelse: {attachment_info['size']} bytes

---
Automatisk genereret af Gmail PDF Forwarder
        """
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
        
        # Tilfoej PDF vedhaeftning
        part = MIMEBase('application', 'pdf')
        part.set_payload(attachment_info['data'])
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename= {attachment_info["filename"]}'
        )
        msg.attach(part)
        
        return msg
    
    def send_email(self, message: MIMEMultipart) -> bool:
        """Send email via Gmail API"""
        try:
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            send_message = {'raw': raw_message}
            
            result = self.service.users().messages().send(
                userId='me', body=send_message).execute()
            
            logger.info(f"Email sendt succesfuldt: ID {result['id']}")
            return True
        
        except HttpError as error:
            logger.error(f"Fejl ved afsendelse af email: {error}")
            return False
    
    def mark_as_processed(self, message_id: str):
        """Marker email som behandlet med label"""
        try:
            self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': [self.processed_label_id]}
            ).execute()
            logger.info(f"Email {message_id} markeret som behandlet")
        
        except HttpError as error:
            logger.error(f"Fejl ved markering af email {message_id}: {error}")
    
    def process_messages(self):
        """Hoved-proces: Find og videresend PDF'er"""
        try:
            # Hent eller opret processed label
            processed_label = self.config.get('processed_label', 'Videresendt_econ')
            self.processed_label_id = self.get_or_create_label(processed_label)
            
            # Soeg efter relevante emails
            query = self.build_search_query()
            results = self.service.users().messages().list(
                userId='me', q=query, maxResults=self.config.get('max_emails', 100)
            ).execute()
            
            messages = results.get('messages', [])
            logger.info(f"Fandt {len(messages)} emails til behandling")
            
            if not messages:
                logger.info("Ingen emails at behandle")
                return
            
            destination = self.config['economic_receipt_email']
            
            # Behandl hver email
            for msg in messages:
                msg_id = msg['id']
                self.stats['processed'] += 1
                
                logger.info(f"\nBehandler email {msg_id}...")
                
                # Hent PDF vedhaeftninger
                attachments = self.get_pdf_attachments(msg_id)
                
                if not attachments:
                    logger.warning(f"Ingen PDF vedhaeftninger fundet i {msg_id}")
                    self.stats['skipped'] += 1
                    continue
                
                # Send hver PDF
                for attachment in attachments:
                    try:
                        # Opret og send email
                        forward_msg = self.create_forward_email(attachment, destination)
                        
                        if self.send_email(forward_msg):
                            self.stats['forwarded'] += 1
                            logger.info(f"Videresendt: {attachment['filename']}")
                        else:
                            self.stats['errors'] += 1
                    
                    except Exception as e:
                        logger.error(f"Fejl ved videresendelse af {attachment['filename']}: {e}")
                        self.stats['errors'] += 1
                
                # Marker som behandlet
                if attachments:
                    self.mark_as_processed(msg_id)
            
            # Print rapport
            self.print_report()
        
        except HttpError as error:
            logger.error(f"Gmail API fejl: {error}")
            raise
    
    def print_report(self):
        """Print samlet rapport"""
        logger.info("\n" + "="*60)
        logger.info("BEHANDLINGS RAPPORT")
        logger.info("="*60)
        logger.info(f"Emails behandlet:    {self.stats['processed']}")
        logger.info(f"PDF'er videresendt:  {self.stats['forwarded']}")
        logger.info(f"Emails sprunget over: {self.stats['skipped']}")
        logger.info(f"Fejl:                {self.stats['errors']}")
        logger.info("="*60 + "\n")
    
    def run(self):
        """Koer hele processen"""
        logger.info("Starter Gmail PDF Forwarder...")
        logger.info(f"Destination: {self.config['economic_receipt_email']}")
        
        try:
            self.authenticate()
            self.process_messages()
            logger.info("Proces gennemfoert succesfuldt!")
        
        except Exception as e:
            logger.error(f"Kritisk fejl: {e}", exc_info=True)
            raise


def main():
    """Main entry point"""
    try:
        forwarder = GmailPDFForwarder()
        forwarder.run()
    
    except KeyboardInterrupt:
        logger.info("\nAfbrudt af bruger")
    
    except Exception as e:
        logger.error(f"Program fejl: {e}", exc_info=True)
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())

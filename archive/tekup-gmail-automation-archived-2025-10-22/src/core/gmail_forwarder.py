#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gmail PDF Bilag Forwarder til e-conomic
Integreret med eksisterende Gmail OAuth credentials
"""

import os
import base64
import json
import logging
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Prøv at indlæse dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("OK: .env fil indlaest")
except ImportError:
    print("WARNING: python-dotenv ikke installeret - bruger system miljoevariabler")

from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
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
TOKEN_FILE = 'token.pickle'
LOG_FILE = 'gmail_forwarder.log'

# Setup logging
log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class GmailPDFForwarder:
    """Gmail PDF Forwarder med .env integration"""
    
    def __init__(self):
        """Initialiser med miljøvariabler"""
        self.config = self.load_config_from_env()
        self.service = None
        self.processed_label_id = None
        self.stats = {
            'processed': 0,
            'forwarded': 0,
            'errors': 0,
            'skipped': 0
        }
    
    def load_config_from_env(self) -> dict:
        """Indlæs konfiguration fra miljøvariabler"""
        config = {
            # Gmail credentials
            'gmail_client_id': os.getenv('GMAIL_CLIENT_ID'),
            'gmail_client_secret': os.getenv('GMAIL_CLIENT_SECRET'),
            'gmail_project_id': os.getenv('GMAIL_PROJECT_ID'),
            'gmail_user_email': os.getenv('GMAIL_USER_EMAIL'),
            
            # e-conomic
            'economic_receipt_email': os.getenv('ECONOMIC_RECEIPT_EMAIL'),
            
            # Forwarder settings
            'processed_label': os.getenv('PROCESSED_LABEL', 'Videresendt_econ'),
            'days_back': int(os.getenv('DAYS_BACK', '180')),
            'max_emails': int(os.getenv('MAX_EMAILS', '100')),
            
            # Søgeord og filtre
            'search_keywords': self.parse_list_env('SEARCH_KEYWORDS', 
                ['faktura', 'invoice', 'kvittering', 'receipt', 'bilag', 'moms']),
            'allowed_senders': self.parse_list_env('ALLOWED_SENDERS', [])
        }
        
        self.validate_config(config)
        return config
    
    def parse_list_env(self, env_var: str, default: list) -> list:
        """Parse komma-separeret miljøvariabel til liste"""
        value = os.getenv(env_var)
        if value and value.strip():
            return [item.strip() for item in value.split(',') if item.strip()]
        return default
    
    def validate_config(self, config: dict):
        """Valider påkrævede konfiguration"""
        required = [
            'gmail_client_id', 
            'gmail_client_secret', 
            'gmail_project_id',
            'gmail_user_email',
            'economic_receipt_email'
        ]
        
        missing = [field for field in required if not config.get(field)]
        if missing:
            raise ValueError(f"Manglende påkrævede miljøvariabler: {', '.join(missing)}")
        
        # Email validering
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        for email_field in ['gmail_user_email', 'economic_receipt_email']:
            if not re.match(email_pattern, config[email_field]):
                raise ValueError(f"Ugyldig email format: {email_field} = {config[email_field]}")
    
    def create_credentials_file(self):
        """Opret credentials.json fra miljøvariabler"""
        credentials_data = {
            "installed": {
                "client_id": self.config['gmail_client_id'],
                "project_id": self.config['gmail_project_id'],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": self.config['gmail_client_secret'],
                "redirect_uris": ["http://localhost"]
            }
        }
        
        with open('credentials.json', 'w') as f:
            json.dump(credentials_data, f, indent=2)
        
        logger.info("✅ credentials.json oprettet fra miljøvariabler")
    
    def authenticate(self):
        """Autentificer med Gmail API.
        Forsøg først service account impersonation (headless). Fald tilbage til OAuth hvis ikke muligt.
        """

        # 1) HEADLESS: Service account med domain-wide delegation (impersonation)
        sa_email = os.getenv('GOOGLE_CLIENT_EMAIL')
        sa_private_key = os.getenv('GOOGLE_PRIVATE_KEY')
        sa_impersonated_user = os.getenv('GOOGLE_IMPERSONATED_USER')

        headless_only = os.getenv('HEADLESS_ONLY', '0').lower() in ('1', 'true', 'yes')

        if sa_email and sa_private_key and sa_impersonated_user:
            try:
                logger.info("Forsøger service account impersonation (headless)...")

                # Håndter \n-escaped private key fra .env
                private_key = sa_private_key.strip().strip('"').replace('\\n', '\n')

                sa_info = {
                    "type": "service_account",
                    "client_email": sa_email,
                    "private_key": private_key,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }

                base_credentials = service_account.Credentials.from_service_account_info(
                    sa_info,
                    scopes=SCOPES,
                )

                delegated_credentials = base_credentials.with_subject(sa_impersonated_user)

                self.service = build('gmail', 'v1', credentials=delegated_credentials)
                logger.info("✅ Gmail API forbindelse oprettet via service account (impersonation)")
                return

            except Exception as e:
                if headless_only:
                    logger.error(f"Service account impersonation fejlede i headless-only mode: {e}")
                    raise
                logger.warning(f"Service account impersonation fejlede ({e}). Falder tilbage til OAuth2.")

        if headless_only:
            raise RuntimeError("HEADLESS_ONLY er aktiv, men service account variabler mangler eller er ugyldige.")

        # 2) FALLBACK: OAuth2 installed app (kræver første-gangs login)
        if not os.path.exists('credentials.json'):
            self.create_credentials_file()

        creds = None

        # Tjek eksisterende token
        if os.path.exists(TOKEN_FILE):
            with open(TOKEN_FILE, 'rb') as token:
                creds = pickle.load(token)

        # Forny eller opret nye credentials
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                logger.info("Opdaterer udløbet token...")
                creds.refresh(Request())
            else:
                logger.info("Starter OAuth2 login...")
                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)

            # Gem token til næste gang
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
            logger.info("Token gemt")

        self.service = build('gmail', 'v1', credentials=creds)
        logger.info("✅ Gmail API forbindelse oprettet via OAuth2")
    
    def get_or_create_label(self, label_name: str) -> str:
        """Opret eller hent Gmail label ID"""
        try:
            results = self.service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            
            for label in labels:
                if label['name'] == label_name:
                    logger.info(f"📂 Label fundet: {label_name}")
                    return label['id']
            
            # Opret nyt label
            label_object = {
                'name': label_name,
                'labelListVisibility': 'labelShow',
                'messageListVisibility': 'show'
            }
            created_label = self.service.users().labels().create(
                userId='me', body=label_object).execute()
            
            logger.info(f"📂 Label oprettet: {label_name}")
            return created_label['id']
        
        except HttpError as error:
            logger.error(f"❌ Label fejl: {error}")
            raise
    
    def build_search_query(self) -> str:
        """Byg Gmail søgequery"""
        query_parts = ['has:attachment', 'filename:pdf']
        
        # Dato begrænsning
        days = self.config['days_back']
        date_from = (datetime.now() - timedelta(days=days)).strftime('%Y/%m/%d')
        query_parts.append(f'after:{date_from}')
        
        # Søgeord
        if self.config['search_keywords']:
            keywords = ' OR '.join(self.config['search_keywords'])
            query_parts.append(f'({keywords})')
        
        # Tilladte afsendere
        if self.config['allowed_senders']:
            senders = ' OR '.join([f'from:{s}' for s in self.config['allowed_senders']])
            query_parts.append(f'({senders})')
        
        # Ekskluder behandlede
        query_parts.append(f'-label:{self.config["processed_label"]}')
        
        query = ' '.join(query_parts)
        logger.info(f"🔍 Søgequery: {query}")
        return query
    
    def get_pdf_attachments(self, message_id: str) -> List[Dict]:
        """Hent PDF vedhæftninger fra email"""
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
            
            # Ekstraktér PDF vedhæftninger rekursivt
            def extract_parts(parts):
                for part in parts:
                    filename = part.get('filename', '')
                    
                    if filename.lower().endswith('.pdf') and 'attachmentId' in part.get('body', {}):
                        att_id = part['body']['attachmentId']
                        
                        # Hent vedhæftning
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
                        logger.info(f"📎 PDF fundet: {filename} ({len(file_data)} bytes)")
                    
                    # Rekursiv søgning i nested parts
                    if 'parts' in part:
                        extract_parts(part['parts'])
            
            if 'parts' in payload:
                extract_parts(payload['parts'])
            
            return attachments
        
        except HttpError as error:
            logger.error(f"❌ Fejl ved hentning af vedhæftninger: {error}")
            return []
    
    def create_forward_email(self, attachment_info: Dict, destination: str) -> MIMEMultipart:
        """Opret videresendelse email"""
        msg = MIMEMultipart()
        msg['From'] = self.config['gmail_user_email']
        msg['To'] = destination
        
        original_subject = attachment_info.get('subject', 'Bilag')
        msg['Subject'] = f"Fwd: {original_subject}"
        
        # Email indhold
        body_text = f"""
Automatisk videresendt PDF bilag til e-conomic

📧 Original afsender: {attachment_info.get('sender', 'Ukendt')}
📅 Original dato: {attachment_info.get('date', 'Ukendt')}
📝 Original emne: {original_subject}
📎 Filnavn: {attachment_info['filename']}
📊 Størrelse: {attachment_info['size']:,} bytes

---
🤖 Automatisk genereret af Gmail PDF Forwarder
⏰ Videresendt: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
        
        # Tilføj PDF vedhæftning
        part = MIMEBase('application', 'pdf')
        part.set_payload(attachment_info['data'])
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="{attachment_info["filename"]}"'
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
            
            logger.info(f"✅ Email sendt: ID {result['id']}")
            return True
        
        except HttpError as error:
            logger.error(f"❌ Email fejl: {error}")
            return False
    
    def mark_as_processed(self, message_id: str):
        """Marker email som behandlet"""
        try:
            self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': [self.processed_label_id]}
            ).execute()
            logger.info(f"🏷️  Email markeret som behandlet: {message_id}")
        
        except HttpError as error:
            logger.error(f"❌ Label fejl: {error}")
    
    def process_messages(self):
        """Hovedproces: Find og videresend PDFs"""
        try:
            # Hent/opret processed label
            self.processed_label_id = self.get_or_create_label(
                self.config['processed_label'])
            
            # Søg emails
            query = self.build_search_query()
            results = self.service.users().messages().list(
                userId='me', 
                q=query, 
                maxResults=self.config['max_emails']
            ).execute()
            
            messages = results.get('messages', [])
            logger.info(f"📧 Fundet {len(messages)} emails til behandling")
            
            if not messages:
                logger.info("📭 Ingen emails at behandle")
                return
            
            destination = self.config['economic_receipt_email']
            
            # Behandl hver email
            for msg in messages:
                msg_id = msg['id']
                self.stats['processed'] += 1
                
                logger.info(f"\n📧 Behandler email: {msg_id}")
                
                # Hent PDF vedhæftninger
                attachments = self.get_pdf_attachments(msg_id)
                
                if not attachments:
                    logger.warning("📭 Ingen PDF vedhæftninger fundet")
                    self.stats['skipped'] += 1
                    continue
                
                # Send hver PDF
                for attachment in attachments:
                    try:
                        forward_msg = self.create_forward_email(attachment, destination)
                        
                        if self.send_email(forward_msg):
                            self.stats['forwarded'] += 1
                            logger.info(f"✅ Videresendt: {attachment['filename']}")
                        else:
                            self.stats['errors'] += 1
                    
                    except Exception as e:
                        logger.error(f"❌ Videresendelse fejl: {e}")
                        self.stats['errors'] += 1
                
                # Marker som behandlet
                if attachments:
                    self.mark_as_processed(msg_id)
            
            self.print_report()
        
        except HttpError as error:
            logger.error(f"❌ Gmail API fejl: {error}")
            raise
    
    def print_report(self):
        """Print behandlingsrapport"""
        logger.info("\n" + "="*60)
        logger.info("📊 BEHANDLINGS RAPPORT")
        logger.info("="*60)
        logger.info(f"📧 Emails behandlet:    {self.stats['processed']}")
        logger.info(f"📎 PDFs videresendt:    {self.stats['forwarded']}")
        logger.info(f"⏭️  Emails sprunget over: {self.stats['skipped']}")
        logger.info(f"❌ Fejl:                {self.stats['errors']}")
        logger.info("="*60)
        
        # Success rate
        total_processed = self.stats['processed']
        if total_processed > 0:
            success_rate = (self.stats['forwarded'] / total_processed) * 100
            logger.info(f"✅ Success rate: {success_rate:.1f}%")
    
    def print_config(self):
        """Print konfigurationsoversigt"""
        logger.info("\n📋 KONFIGURATION:")
        logger.info("-" * 40)
        logger.info(f"🎯 e-conomic email: {self.config['economic_receipt_email']}")
        logger.info(f"📧 Gmail konto: {self.config['gmail_user_email']}")
        logger.info(f"📅 Søgeperiode: {self.config['days_back']} dage")
        logger.info(f"📊 Max emails: {self.config['max_emails']}")
        logger.info(f"🔍 Søgeord: {', '.join(self.config['search_keywords'])}")
        
        if self.config['allowed_senders']:
            logger.info(f"✉️  Tilladte afsendere: {', '.join(self.config['allowed_senders'])}")
        else:
            logger.info("✉️  Tilladte afsendere: Alle")
            
        logger.info(f"🏷️  Label: {self.config['processed_label']}")
    
    def run(self):
        """Kør hele processen"""
        logger.info("🚀 Gmail PDF Forwarder startet")
        logger.info(f"⏰ Tid: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            self.print_config()
            self.authenticate()
            self.process_messages()
            logger.info("\n🎉 Proces gennemført succesfuldt!")
        
        except Exception as e:
            logger.error(f"💥 Kritisk fejl: {e}", exc_info=True)
            raise


def main():
    """Main entry point"""
    try:
        forwarder = GmailPDFForwarder()
        forwarder.run()
    
    except KeyboardInterrupt:
        logger.info("\n⏹️  Afbrudt af bruger")
    
    except Exception as e:
        logger.error(f"💥 Program fejl: {e}", exc_info=True)
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())

#!/usr/bin/env python3
"""
Process Missing Receipts
Fokus på de 713 transaktioner uden bilagsreference
"""

import csv
import re
from datetime import datetime
from collections import defaultdict

def parse_danish_date(date_str):
    """Parse Danish date format DD.MM.YYYY"""
    try:
        return datetime.strptime(date_str.strip('"'), '%d.%m.%Y')
    except:
        return None

def parse_amount(amount_str):
    """Parse Danish amount format with comma as decimal separator"""
    try:
        amount = amount_str.strip('"').replace(',', '.')
        return float(amount)
    except:
        return 0.0

def categorize_missing_receipts():
    """Focus on the 713 transactions without bilagsreference"""
    print("=== FOKUS: 713 TRANSAKTIONER UDEN BILAGSREFERENCE ===\n")
    
    # Load bank transactions
    transactions = []
    
    # Load kontobevaegelser (1).csv
    with open('kontobevaegelser (1).csv', 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            date = parse_danish_date(row['Dato'])
            if date:
                transactions.append({
                    'date': date,
                    'text': row['Tekst'],
                    'amount': parse_amount(row['Beløb']),
                    'balance': parse_amount(row['Saldo']),
                    'reference': row['Egen bilagsreference']
                })
    
    # Load kontobevaegelser (2).csv
    with open('kontobevaegelser (2).csv', 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            date = parse_danish_date(row['Dato'])
            if date:
                transactions.append({
                    'date': date,
                    'text': row['Tekst'],
                    'amount': parse_amount(row['Beløb']),
                    'balance': parse_amount(row['Saldo']),
                    'reference': row['Egen bilagsreference']
                })
    
    # Find transactions without bilagsreference
    no_reference = [t for t in transactions if not t['reference'] and t['amount'] < -100]
    
    print(f"Total transaktioner uden bilagsreference: {len(no_reference)}")
    print(f"Total beløb: {sum(abs(t['amount']) for t in no_reference):,.2f} kr")
    print()
    
    # Categorize by amount ranges
    print("=== KATEGORISERET EFTER BELØB ===")
    
    ranges = [
        (0, 500, "Små udgifter (100-500 kr)"),
        (500, 1000, "Mellem udgifter (500-1000 kr)"),
        (1000, 5000, "Store udgifter (1000-5000 kr)"),
        (5000, 10000, "Meget store udgifter (5000-10000 kr)"),
        (10000, float('inf'), "Ekstremt store udgifter (>10000 kr)")
    ]
    
    for min_amt, max_amt, label in ranges:
        items = [t for t in no_reference if min_amt < abs(t['amount']) <= max_amt]
        if items:
            total = sum(abs(t['amount']) for t in items)
            print(f"{label}: {len(items)} transaktioner, {total:,.2f} kr")
    
    print()
    
    # Show largest missing receipts
    print("=== TOP 20 STØRSTE MANGLENDE BILAG ===")
    no_reference.sort(key=lambda x: x['amount'])
    
    for i, t in enumerate(no_reference[:20], 1):
        print(f"{i:2d}. {t['date'].strftime('%d.%m.%Y')} | {t['text'][:50]:<50} | {t['amount']:>10,.2f} kr")
    
    print()
    
    # Categorize by vendor/type
    print("=== KATEGORISERET EFTER LEVERANDØR ===")
    vendor_categories = defaultdict(list)
    
    for t in no_reference:
        text_lower = t['text'].lower()
        
        if 'mcd' in text_lower:
            vendor_categories['Kortbetalinger (MCD)'].append(t)
        elif 'danfoods' in text_lower:
            vendor_categories['Danfoods'].append(t)
        elif 'circle k' in text_lower:
            vendor_categories['Circle K (Benzin)'].append(t)
        elif 'ok' in text_lower:
            vendor_categories['OK (Benzin)'].append(t)
        elif 'q8' in text_lower:
            vendor_categories['Q8 (Benzin)'].append(t)
        elif 'wolt' in text_lower:
            vendor_categories['Wolt (Mad)'].append(t)
        elif 'mcdonalds' in text_lower:
            vendor_categories['McDonald\'s (Mad)'].append(t)
        elif 'ikea' in text_lower:
            vendor_categories['IKEA (Inventar)'].append(t)
        elif 'johs' in text_lower and 'sørensen' in text_lower:
            vendor_categories['Johs. Sørensen'].append(t)
        elif 'larsen' in text_lower and 'jakobsen' in text_lower:
            vendor_categories['Larsen & Jakobsen (Revisor)'].append(t)
        elif 'telenor' in text_lower:
            vendor_categories['Telenor'].append(t)
        elif 'visma' in text_lower or 'economic' in text_lower:
            vendor_categories['Visma e-conomic'].append(t)
        elif 'collectia' in text_lower:
            vendor_categories['Collectia (Inkasso)'].append(t)
        elif 'viabill' in text_lower:
            vendor_categories['Viabill (Finansiering)'].append(t)
        elif 'booking' in text_lower:
            vendor_categories['Booking (Rejse)'].append(t)
        elif 'travel' in text_lower:
            vendor_categories['Travel (Rejse)'].append(t)
        elif 'europark' in text_lower:
            vendor_categories['Europark (Parkering)'].append(t)
        elif 'euroincasso' in text_lower:
            vendor_categories['EuroIncasso (Inkasso)'].append(t)
        elif 'feriekonto' in text_lower:
            vendor_categories['FerieKonto (Løn)'].append(t)
        elif 'jks' in text_lower:
            vendor_categories['JKS (Diverse)'].append(t)
        elif 'bs' in text_lower:
            vendor_categories['BS (Diverse)'].append(t)
        elif 'ls' in text_lower:
            vendor_categories['LS (Diverse)'].append(t)
        elif 'molslinje' in text_lower:
            vendor_categories['Molslinje (Transport)'].append(t)
        elif 'samsø' in text_lower:
            vendor_categories['Samsø Festival'].append(t)
        elif 'kundegebyr' in text_lower:
            vendor_categories['Kundegebyr (Bank)'].append(t)
        elif 'online banking' in text_lower:
            vendor_categories['Online Banking (Bank)'].append(t)
        elif 'lunar' in text_lower:
            vendor_categories['Lunar (Bank)'].append(t)
        elif 'revolut' in text_lower:
            vendor_categories['Revolut (Bank)'].append(t)
        elif 'mobilepay' in text_lower:
            vendor_categories['MobilePay (Betaling)'].append(t)
        elif 'transfer' in text_lower:
            vendor_categories['Transfer (Overførsel)'].append(t)
        elif 'overførsel' in text_lower:
            vendor_categories['Overførsel (Diverse)'].append(t)
        else:
            vendor_categories['Ukategoriseret'].append(t)
    
    for vendor, items in sorted(vendor_categories.items(), key=lambda x: len(x[1]), reverse=True):
        if items:
            total = sum(abs(t['amount']) for t in items)
            print(f"{vendor}: {len(items)} transaktioner, {total:,.2f} kr")
    
    print()
    
    # Monthly breakdown
    print("=== MÅNEDLIG OPDELING ===")
    monthly = defaultdict(list)
    for t in no_reference:
        month_key = f"{t['date'].year}-{t['date'].month:02d}"
        monthly[month_key].append(t)
    
    for month in sorted(monthly.keys()):
        items = monthly[month]
        total = sum(abs(t['amount']) for t in items)
        print(f"{month}: {len(items)} transaktioner, {total:,.2f} kr")
    
    print()
    
    # Action plan
    print("=== HANDLINGSPLAN ===")
    print("1. Fokus på de største manglende bilag først")
    print("2. Kategoriser efter leverandør for at finde mønstre")
    print("3. Søg efter PDF fakturaer i Gmail for hver leverandør")
    print("4. Send alle fundne bilag til e-conomic")
    print("5. Marker transaktioner som 'behandlet' når bilag er sendt")
    
    return no_reference

if __name__ == "__main__":
    missing_receipts = categorize_missing_receipts()

#!/usr/bin/env python3
"""
Reconciliation Report
Tjek hvad der mangler ift. afstemming mellem kontobevægelser og sendte bilag
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

def analyze_reconciliation():
    """Analyze what's missing for reconciliation"""
    print("=== AFSTEMNINGSRAPPORT ===\n")
    
    # Load bank transactions
    transactions = []
    
    # Load kontobevaegelser (1).csv
    print("Loading kontobevaegelser (1).csv...")
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
    print("Loading kontobevaegelser (2).csv...")
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
    
    print(f"Loaded {len(transactions)} bank transactions\n")
    
    # Find transactions without bilagsreference
    no_reference = [t for t in transactions if not t['reference'] and t['amount'] < -100]
    
    print("=== TRANSAKTIONER UDEN BILAGSREFERENCE ===")
    print(f"Total: {len(no_reference)} transaktioner")
    print(f"Total beløb: {sum(abs(t['amount']) for t in no_reference):,.2f} kr")
    print()
    
    # Categorize by vendor
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
    
    print("=== KATEGORISERET EFTER LEVERANDØR ===")
    for vendor, items in sorted(vendor_categories.items(), key=lambda x: len(x[1]), reverse=True):
        if items:
            total = sum(abs(t['amount']) for t in items)
            print(f"{vendor}: {len(items)} transaktioner, {total:,.2f} kr")
    
    print()
    
    # Find specific missing invoices mentioned by revisor
    print("=== REVISORENS MANGENDE BILAG (April 2025) ===")
    april_2025 = [t for t in transactions if t['date'].month == 4 and t['date'].year == 2025]
    
    missing_invoices = [
        ("Tilbagebetaling lån af bil", -35000.00),
        ("Bilkøb", -30000.00),
        ("Køb af fryser", -5000.00)
    ]
    
    for description, expected_amount in missing_invoices:
        found = False
        for t in april_2025:
            if abs(t['amount'] - expected_amount) < 100:  # Within 100 kr tolerance
                print(f"FUNDET: {t['date'].strftime('%d.%m.%Y')} | {t['text']} | {t['amount']:,.2f} kr")
                found = True
                break
        
        if not found:
            print(f"MANGER: {description} ({expected_amount:,.2f} kr) - IKKE FUNDET I KONTOBEVÆGELSER")
    
    print()
    
    # Find large expenses without bilagsreference
    large_expenses = [t for t in no_reference if abs(t['amount']) > 1000]
    print("=== STORE UDGIFTER UDEN BILAG (>1000 kr) ===")
    large_expenses.sort(key=lambda x: x['amount'])
    
    for expense in large_expenses[:20]:  # Show top 20
        print(f"{expense['date'].strftime('%d.%m.%Y')} | {expense['text'][:50]:<50} | {expense['amount']:>10,.2f} kr")
    
    print(f"\nTotal store udgifter uden bilag: {len(large_expenses)}")
    print(f"Total beløb: {sum(abs(t['amount']) for t in large_expenses):,.2f} kr")
    print()
    
    # Monthly breakdown
    print("=== MÅNEDLIG OPDELING AF MANGLENDE BILAG ===")
    monthly = defaultdict(list)
    for t in no_reference:
        month_key = f"{t['date'].year}-{t['date'].month:02d}"
        monthly[month_key].append(t)
    
    for month in sorted(monthly.keys()):
        items = monthly[month]
        total = sum(abs(t['amount']) for t in items)
        print(f"{month}: {len(items)} transaktioner, {total:,.2f} kr")
    
    print()
    
    # Summary
    print("=== SAMMENDRAG ===")
    print(f"Total transaktioner: {len(transactions)}")
    print(f"Transaktioner uden bilagsreference: {len(no_reference)}")
    print(f"Store udgifter uden bilag (>1000 kr): {len(large_expenses)}")
    print(f"Revisorens manglende bilag: 3 (ikke fundet i kontobevægelser)")
    print()
    
    print("=== HANDLINGSPLAN FOR AFSTEMNING ===")
    print("1. Fokus på de største manglende bilag først")
    print("2. Søg efter PDF fakturaer i Gmail for hver leverandør")
    print("3. Send alle fundne bilag til e-conomic")
    print("4. Marker transaktioner som 'behandlet' når bilag er sendt")
    print("5. Find de 3 manglende transaktioner fra april 2025")
    print("   - Tilbagebetaling lån af bil (-35.000 kr)")
    print("   - Bilkøb (-30.000 kr)")
    print("   - Køb af fryser (-5.000 kr)")
    
    return {
        'transactions': transactions,
        'no_reference': no_reference,
        'large_expenses': large_expenses,
        'vendor_categories': vendor_categories
    }

if __name__ == "__main__":
    analyze_reconciliation()

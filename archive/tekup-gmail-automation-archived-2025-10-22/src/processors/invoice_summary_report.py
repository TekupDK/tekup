#!/usr/bin/env python3
"""
Faktura Oversigt Rapport
Kategoriser alle fakturaer og giv overblik over manglende bilag
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

def categorize_transaction(text, amount):
    """Categorize transaction based on text and amount"""
    text_lower = text.lower()
    
    # Income categories
    if amount > 0:
        if 'overførsel' in text_lower or 'transfer' in text_lower:
            return "INDTÆGT: Overførsel"
        elif 'ftf-' in text_lower:
            return "INDTÆGT: Egen faktura"
        elif 'aalborg' in text_lower:
            return "INDTÆGT: Aalborg Karneval"
        else:
            return "INDTÆGT: Andet"
    
    # Expense categories
    if 'telenor' in text_lower:
        return "UDGIFT: Telenor (Telefon/Internet)"
    elif 'danfoods' in text_lower:
        return "UDGIFT: Danfoods (Fødevarer)"
    elif 'mcd' in text_lower:
        return "UDGIFT: Kortbetaling (Diverse)"
    elif 'wolt' in text_lower:
        return "UDGIFT: Wolt (Mad)"
    elif 'circle k' in text_lower:
        return "UDGIFT: Circle K (Benzin)"
    elif 'ok' in text_lower:
        return "UDGIFT: OK (Benzin)"
    elif 'q8' in text_lower:
        return "UDGIFT: Q8 (Benzin)"
    elif 'esso' in text_lower:
        return "UDGIFT: Esso (Benzin)"
    elif 'mcdonalds' in text_lower:
        return "UDGIFT: McDonald's (Mad)"
    elif 'ikea' in text_lower:
        return "UDGIFT: IKEA (Inventar)"
    elif 'larsen' in text_lower and 'jakobsen' in text_lower:
        return "UDGIFT: Larsen & Jakobsen (Revisor)"
    elif 'visma' in text_lower or 'economic' in text_lower:
        return "UDGIFT: Visma e-conomic (Regnskab)"
    elif 'collectia' in text_lower:
        return "UDGIFT: Collectia (Inkasso)"
    elif 'viabill' in text_lower:
        return "UDGIFT: Viabill (Finansiering)"
    elif 'booking' in text_lower:
        return "UDGIFT: Booking (Rejse)"
    elif 'travel' in text_lower:
        return "UDGIFT: Travel (Rejse)"
    elif 'europark' in text_lower:
        return "UDGIFT: Europark (Parkering)"
    elif 'euroincasso' in text_lower:
        return "UDGIFT: EuroIncasso (Inkasso)"
    elif 'feriekonto' in text_lower:
        return "UDGIFT: FerieKonto (Løn)"
    elif 'jks' in text_lower:
        return "UDGIFT: JKS (Diverse)"
    elif 'bs' in text_lower:
        return "UDGIFT: BS (Diverse)"
    elif 'ls' in text_lower:
        return "UDGIFT: LS (Diverse)"
    elif 'molslinje' in text_lower:
        return "UDGIFT: Molslinje (Transport)"
    elif 'johs' in text_lower and 'sørensen' in text_lower:
        return "UDGIFT: Johs. Sørensen (Diverse)"
    elif 'samsø' in text_lower:
        return "UDGIFT: Samsø Festival (Event)"
    elif 'kundegebyr' in text_lower:
        return "UDGIFT: Kundegebyr (Bank)"
    elif 'online banking' in text_lower:
        return "UDGIFT: Online Banking (Bank)"
    elif 'lunar' in text_lower:
        return "UDGIFT: Lunar (Bank)"
    elif 'revolut' in text_lower:
        return "UDGIFT: Revolut (Bank)"
    elif 'mobilepay' in text_lower:
        return "UDGIFT: MobilePay (Betaling)"
    elif 'transfer' in text_lower:
        return "UDGIFT: Transfer (Overførsel)"
    elif 'overførsel' in text_lower:
        return "UDGIFT: Overførsel (Diverse)"
    else:
        return "UDGIFT: Ukategoriseret"

def analyze_invoices():
    """Analyze and categorize all invoices"""
    print("=== FAKTURA OVERSIGT RAPPORT ===\n")
    
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
    
    print(f"Loaded {len(transactions)} transactions\n")
    
    # Categorize all transactions
    categories = defaultdict(list)
    total_income = 0
    total_expenses = 0
    
    for t in transactions:
        category = categorize_transaction(t['text'], t['amount'])
        categories[category].append(t)
        
        if t['amount'] > 0:
            total_income += t['amount']
        else:
            total_expenses += abs(t['amount'])
    
    # Print categorized overview
    print("=== KATEGORISERET OVERSIGT ===")
    for category, items in sorted(categories.items()):
        total_amount = sum(abs(item['amount']) for item in items)
        print(f"{category}: {len(items)} transaktioner, {total_amount:,.2f} kr")
    
    print(f"\nTotal indtægter: {total_income:,.2f} kr")
    print(f"Total udgifter: {total_expenses:,.2f} kr")
    print(f"Netto resultat: {total_income - total_expenses:,.2f} kr")
    print()
    
    # Find transactions without bilagsreference
    no_reference = [t for t in transactions if not t['reference'] and t['amount'] < -100]
    print("=== TRANSAKTIONER UDEN BILAGSREFERENCE (>100 kr) ===")
    no_reference.sort(key=lambda x: x['amount'])
    
    for t in no_reference[:20]:  # Show top 20
        category = categorize_transaction(t['text'], t['amount'])
        print(f"{t['date'].strftime('%d.%m.%Y')} | {t['text'][:40]:<40} | {t['amount']:>10,.2f} kr | {category}")
    
    print(f"\nTotal transaktioner uden bilagsreference: {len(no_reference)}")
    print(f"Total beløb: {sum(abs(t['amount']) for t in no_reference):,.2f} kr")
    print()
    
    # Find large expenses by category
    print("=== STORE UDGIFTER PR. KATEGORI ===")
    for category, items in categories.items():
        if category.startswith('UDGIFT:'):
            large_items = [t for t in items if t['amount'] < -1000]
            if large_items:
                total_large = sum(abs(t['amount']) for t in large_items)
                print(f"{category}: {len(large_items)} store udgifter, {total_large:,.2f} kr")
    
    print()
    
    # Find specific missing invoices
    print("=== REVISORENS MANGENDE BILAG ===")
    missing_invoices = [
        ("Tilbagebetaling lån af bil", -35000.00, "02.04.2025"),
        ("Bilkøb", -30000.00, "02.04.2025"),
        ("Køb af fryser", -5000.00, "28.04.2025")
    ]
    
    for description, expected_amount, expected_date in missing_invoices:
        found = False
        for t in transactions:
            if abs(t['amount'] - expected_amount) < 100:
                print(f"FUNDET: {t['date'].strftime('%d.%m.%Y')} | {t['text']} | {t['amount']:,.2f} kr")
                found = True
                break
        
        if not found:
            print(f"MANGER: {description} ({expected_amount:,.2f} kr) - {expected_date}")
    
    print()
    
    # Summary
    print("=== SAMMENDRAG ===")
    print(f"Total transaktioner: {len(transactions)}")
    print(f"Kategorier: {len(categories)}")
    print(f"Transaktioner uden bilagsreference: {len(no_reference)}")
    print(f"Revisorens manglende bilag: 3 (ikke fundet i kontobevægelser)")
    
    return {
        'transactions': transactions,
        'categories': categories,
        'no_reference': no_reference,
        'total_income': total_income,
        'total_expenses': total_expenses
    }

if __name__ == "__main__":
    analyze_invoices()

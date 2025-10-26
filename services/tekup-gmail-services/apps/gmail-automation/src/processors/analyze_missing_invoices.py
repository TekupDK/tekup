#!/usr/bin/env python3
"""
Krydsanalyse af kontobevægelser og sendte bilag
Find manglende fakturaer og bilag der skal sendes til e-conomic
"""

import csv
import re
from datetime import datetime, timedelta
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
        # Remove quotes and replace comma with dot
        amount = amount_str.strip('"').replace(',', '.')
        return float(amount)
    except:
        return 0.0

def analyze_bank_transactions():
    """Analyze bank transactions to find missing invoices"""
    print("=== KRYDSANALYSE: Kontobevægelser vs Sendte Bilag ===\n")
    
    # Load bank transactions
    transactions = []
    
    # Load kontobevaegelser (1).csv (Jan-Jul 2025)
    print("Loading kontobevaegelser (1).csv (Jan-Jul 2025)...")
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
    
    # Load kontobevaegelser (2).csv (Aug-Oct 2025)
    print("Loading kontobevaegelser (2).csv (Aug-Oct 2025)...")
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
    
    # Analyze by quarter
    q1_2025 = [t for t in transactions if t['date'].month in [1, 2, 3]]
    q2_2025 = [t for t in transactions if t['date'].month in [4, 5, 6]]
    q3_2025 = [t for t in transactions if t['date'].month in [7, 8, 9]]
    
    print("=== KVARTER ANALYSE 2025 ===")
    print(f"Q1 2025 (Jan-Mar): {len(q1_2025)} transaktioner")
    print(f"Q2 2025 (Apr-Jun): {len(q2_2025)} transaktioner")
    print(f"Q3 2025 (Jul-Sep): {len(q3_2025)} transaktioner")
    print()
    
    # Find large expenses (>1000 kr) without bilagsreference
    large_expenses = []
    for t in transactions:
        if t['amount'] < -1000 and not t['reference']:  # Negative amount = expense
            large_expenses.append(t)
    
    print("=== STORE UDGIFTER UDEN BILAG (>1000 kr) ===")
    large_expenses.sort(key=lambda x: x['amount'])
    
    for expense in large_expenses[:20]:  # Show top 20
        print(f"{expense['date'].strftime('%d.%m.%Y')} | {expense['text'][:50]:<50} | {expense['amount']:>10,.2f} kr")
    
    print(f"\nTotal store udgifter uden bilag: {len(large_expenses)}")
    print(f"Total beløb: {sum(t['amount'] for t in large_expenses):,.2f} kr")
    print()
    
    # Find income transactions
    income_transactions = [t for t in transactions if t['amount'] > 0]
    print("=== INDTÆGTER ===")
    income_transactions.sort(key=lambda x: x['amount'], reverse=True)
    
    for income in income_transactions[:15]:  # Show top 15
        print(f"{income['date'].strftime('%d.%m.%Y')} | {income['text'][:50]:<50} | {income['amount']:>10,.2f} kr")
    
    print(f"\nTotal indtægter: {len(income_transactions)}")
    print(f"Total beløb: {sum(t['amount'] for t in income_transactions):,.2f} kr")
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
    
    # Find Telenor transactions
    telenor_transactions = [t for t in transactions if 'telenor' in t['text'].lower()]
    print("=== TELENOR TRANSAKTIONER ===")
    for t in telenor_transactions:
        print(f"{t['date'].strftime('%d.%m.%Y')} | {t['text']} | {t['amount']:,.2f} kr")
    
    print(f"\nTotal Telenor transaktioner: {len(telenor_transactions)}")
    print(f"Total Telenor beløb: {sum(t['amount'] for t in telenor_transactions):,.2f} kr")
    print()
    
    # Find Danfoods transactions
    danfoods_transactions = [t for t in transactions if 'danfoods' in t['text'].lower()]
    print("=== DANFOODS TRANSAKTIONER ===")
    for t in danfoods_transactions:
        print(f"{t['date'].strftime('%d.%m.%Y')} | {t['text']} | {t['amount']:,.2f} kr")
    
    print(f"\nTotal Danfoods transaktioner: {len(danfoods_transactions)}")
    print(f"Total Danfoods beløb: {sum(t['amount'] for t in danfoods_transactions):,.2f} kr")
    print()
    
    # Summary
    print("=== SAMMENDRAG ===")
    print(f"Total transaktioner analyseret: {len(transactions)}")
    print(f"Store udgifter uden bilag: {len(large_expenses)}")
    print(f"Income transaktioner: {len(income_transactions)}")
    print(f"Telenor transaktioner: {len(telenor_transactions)}")
    print(f"Danfoods transaktioner: {len(danfoods_transactions)}")
    
    return {
        'transactions': transactions,
        'large_expenses': large_expenses,
        'income_transactions': income_transactions,
        'telenor_transactions': telenor_transactions,
        'danfoods_transactions': danfoods_transactions
    }

if __name__ == "__main__":
    analyze_bank_transactions()

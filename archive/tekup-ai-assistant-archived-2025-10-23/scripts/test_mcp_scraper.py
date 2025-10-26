#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for MCP Web Scraper
Verificerer at Playwright og web-scraping funktionaliteten virker
"""

import asyncio
import sys
import io
from playwright.async_api import async_playwright

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def test_playwright():
    """Test Playwright installation og funktionalitet"""
    
    print("🧪 Tester Playwright installation...")
    
    try:
        async with async_playwright() as p:
            print("✅ Playwright er installeret korrekt")
            
            print("🌐 Starter Chromium browser...")
            browser = await p.chromium.launch(headless=True)
            print("✅ Chromium browser startet")
            
            print("📄 Opretter ny side...")
            page = await browser.new_page()
            print("✅ Side oprettet")
            
            # Test med en simpel URL
            test_url = "https://example.com"
            print(f"🔍 Henter test-URL: {test_url}")
            
            await page.goto(test_url, wait_until="networkidle", timeout=30000)
            print("✅ Side hentet succesfuldt")
            
            # Hent indhold
            content = await page.content()
            title = await page.title()
            
            print(f"\n📊 Resultater:")
            print(f"   Titel: {title}")
            print(f"   Indhold længde: {len(content)} tegn")
            print(f"   Første 200 tegn: {content[:200]}...")
            
            await browser.close()
            print("\n✅ Test gennemført succesfuldt!")
            print("\n🎉 MCP Web Scraper er klar til brug!")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Fejl under test: {e}")
        print("\n💡 Løsningsforslag:")
        print("   1. Kør: python -m playwright install chromium")
        print("   2. Kontroller internetforbindelse")
        print("   3. Kontroller firewall indstillinger")
        return False

async def test_simple_fetch():
    """Test simple HTTP requests"""
    import requests
    
    print("\n🧪 Tester simple HTTP requests...")
    
    try:
        test_url = "https://example.com"
        print(f"🔍 Henter: {test_url}")
        
        response = requests.get(
            test_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            timeout=10
        )
        response.raise_for_status()
        
        print(f"✅ Status code: {response.status_code}")
        print(f"   Indhold længde: {len(response.text)} tegn")
        print("\n✅ Simple HTTP requests virker!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Fejl: {e}")
        return False

async def main():
    """Kør alle tests"""
    print("=" * 60)
    print("MCP Web Scraper - Test Suite")
    print("=" * 60)
    print()
    
    # Test 1: Simple requests
    result1 = await test_simple_fetch()
    
    # Test 2: Playwright
    result2 = await test_playwright()
    
    print("\n" + "=" * 60)
    print("Test Opsummering")
    print("=" * 60)
    print(f"Simple HTTP: {'✅ PASSED' if result1 else '❌ FAILED'}")
    print(f"Playwright:  {'✅ PASSED' if result2 else '❌ FAILED'}")
    
    if result1 and result2:
        print("\n🎉 Alle tests bestået! MCP-serveren er klar.")
        print("\nNæste skridt:")
        print("1. Følg instruktionerne i configs/claude-desktop/CURSOR_MCP_SETUP.md")
        print("2. Tilføj MCP-serveren i Cursor Settings")
        print("3. Genstart Cursor")
    else:
        print("\n⚠️ Nogle tests fejlede. Se fejlmeddelelser ovenfor.")

if __name__ == "__main__":
    asyncio.run(main())


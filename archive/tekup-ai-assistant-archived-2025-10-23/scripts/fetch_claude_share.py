#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Henter indhold fra et delt Claude-link
"""

import asyncio
import sys
import io
from playwright.async_api import async_playwright

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def fetch_claude_share(url):
    """Hent indhold fra delt Claude-samtale"""
    
    print(f"🔍 Henter Claude-samtale fra: {url}")
    print("⏳ Dette kan tage 10-30 sekunder...")
    
    try:
        async with async_playwright() as p:
            print("🌐 Starter Chromium browser...")
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Sæt user agent
            await page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })
            
            print("📄 Navigerer til siden...")
            await page.goto(url, wait_until="networkidle", timeout=60000)
            
            # Vent lidt ekstra for at sikre alt er loadet
            await asyncio.sleep(3)
            
            print("📊 Henter indhold...")
            
            # Hent titel
            title = await page.title()
            
            # Hent alt tekstindhold
            content = await page.content()
            
            # Prøv at finde samtale-indhold specifikt
            try:
                # Vent på samtale-indhold at loade
                await page.wait_for_selector('div[class*="conversation"], article, main', timeout=10000)
                
                # Ekstraher tekst fra samtale-elementer
                conversation_text = await page.evaluate('''() => {
                    const elements = document.querySelectorAll('div[class*="conversation"], div[class*="message"], article, main');
                    let text = '';
                    elements.forEach(el => {
                        text += el.innerText + '\\n\\n';
                    });
                    return text;
                }''')
                
                if conversation_text.strip():
                    content = conversation_text
            except:
                # Hvis vi ikke kan finde specifikke elementer, brug alt indhold
                content = await page.evaluate('() => document.body.innerText')
            
            await browser.close()
            
            print("\n" + "="*60)
            print("✅ INDHOLD HENTET SUCCESFULDT")
            print("="*60)
            print(f"\n📌 Titel: {title}")
            print(f"📏 Længde: {len(content)} tegn")
            print("\n" + "="*60)
            print("📄 INDHOLD:")
            print("="*60 + "\n")
            print(content)
            print("\n" + "="*60)
            
            # Gem også til fil
            output_file = "claude_share_content.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"Titel: {title}\n")
                f.write(f"URL: {url}\n")
                f.write(f"Længde: {len(content)} tegn\n")
                f.write("\n" + "="*60 + "\n")
                f.write(content)
            
            print(f"\n💾 Indhold gemt til: {output_file}")
            
            return content
            
    except Exception as e:
        print(f"\n❌ Fejl: {e}")
        print("\n💡 Mulige årsager:")
        print("   - Claude.ai har anti-bot beskyttelse")
        print("   - Timeout (siden tog for lang tid at loade)")
        print("   - Internetforbindelse")
        return None

async def main():
    url = "https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a"
    
    if len(sys.argv) > 1:
        url = sys.argv[1]
    
    await fetch_claude_share(url)

if __name__ == "__main__":
    asyncio.run(main())



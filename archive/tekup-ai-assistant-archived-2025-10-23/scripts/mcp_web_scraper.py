#!/usr/bin/env python3
"""
MCP Web Scraper Server
Henter webindhold vha. Playwright for dynamiske sider
"""

import asyncio
import sys
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent
from playwright.async_api import async_playwright
from pydantic import AnyUrl
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-web-scraper")

# Opret MCP server
app = Server("web-scraper")

@app.list_resources()
async def handle_list_resources() -> list[Resource]:
    """List tilgængelige resources"""
    return []

@app.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List tilgængelige værktøjer"""
    return [
        Tool(
            name="fetch_url",
            description="Henter indhold fra en URL vha. Playwright (kan håndtere JavaScript-renderet indhold)",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL'en der skal hentes"
                    },
                    "wait_for": {
                        "type": "string",
                        "description": "Valgfri CSS selector at vente på før scraping (f.eks. '.content')",
                        "default": None
                    }
                },
                "required": ["url"]
            }
        ),
        Tool(
            name="fetch_url_simple",
            description="Henter indhold fra en URL vha. simple HTTP requests (hurtigere, men kan ikke håndtere JavaScript)",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL'en der skal hentes"
                    }
                },
                "required": ["url"]
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Håndter værktøjskald"""
    
    if name == "fetch_url":
        url = arguments["url"]
        wait_for = arguments.get("wait_for")
        
        logger.info(f"Henter URL: {url}")
        
        try:
            async with async_playwright() as p:
                # Launch med mere realistiske browser settings
                browser = await p.chromium.launch(
                    headless=False,  # Vis browser for at undgå anti-bot
                    args=['--disable-blink-features=AutomationControlled']
                )
                context = await browser.new_context(
                    viewport={'width': 1920, 'height': 1080},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )
                page = await context.new_page()
                
                # Skjul automation flags
                await page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    })
                """)
                
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                
                # Vent lidt for at lade siden loade
                await page.wait_for_timeout(5000)
                
                # Vent på specifik selector hvis angivet
                if wait_for:
                    await page.wait_for_selector(wait_for, timeout=10000)
                
                # Hent både tekstindhold og HTML
                text_content = await page.content()
                
                await browser.close()
                
                return [
                    TextContent(
                        type="text",
                        text=f"URL: {url}\n\n{text_content}"
                    )
                ]
                
        except Exception as e:
            logger.error(f"Fejl ved hentning af {url}: {e}")
            return [
                TextContent(
                    type="text",
                    text=f"Fejl ved hentning af URL: {str(e)}"
                )
            ]
    
    elif name == "fetch_url_simple":
        import requests
        url = arguments["url"]
        
        logger.info(f"Henter URL (simple): {url}")
        
        try:
            response = requests.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                timeout=30
            )
            response.raise_for_status()
            
            return [
                TextContent(
                    type="text",
                    text=f"URL: {url}\n\n{response.text}"
                )
            ]
            
        except Exception as e:
            logger.error(f"Fejl ved hentning af {url}: {e}")
            return [
                TextContent(
                    type="text",
                    text=f"Fejl ved hentning af URL: {str(e)}"
                )
            ]
    
    raise ValueError(f"Ukendt værktøj: {name}")

async def main():
    """Kør MCP serveren"""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="web-scraper",
                server_version="1.0.0",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())


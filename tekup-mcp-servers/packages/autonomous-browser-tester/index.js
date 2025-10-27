#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import puppeteer from 'puppeteer';
import { z } from 'zod';

class AutonomousBrowserTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false, // Show browser for testing
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
    }
    return this.page;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async navigate(url) {
    const page = await this.initBrowser();
    await page.goto(url, { waitUntil: 'networkidle2' });
    return { success: true, url: page.url() };
  }

  async click(selector) {
    const page = await this.initBrowser();
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    return { success: true, selector };
  }

  async fill(selector, value) {
    const page = await this.initBrowser();
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.clear(selector);
    await page.type(selector, value);
    return { success: true, selector, value };
  }

  async screenshot(name = 'screenshot') {
    const page = await this.initBrowser();
    const screenshot = await page.screenshot({ encoding: 'base64' });
    return { success: true, name, screenshot };
  }

  async getText(selector) {
    const page = await this.initBrowser();
    await page.waitForSelector(selector, { timeout: 5000 });
    const text = await page.$eval(selector, el => el.textContent);
    return { success: true, selector, text };
  }

  async waitForElement(selector, timeout = 10000) {
    const page = await this.initBrowser();
    await page.waitForSelector(selector, { timeout });
    return { success: true, selector };
  }

  async evaluate(script) {
    const page = await this.initBrowser();
    const result = await page.evaluate(script);
    return { success: true, result };
  }

  async testDemoMode(url = 'http://localhost:8080') {
    try {
      console.error('Starting demo mode test...');

      // Navigate to the app
      await this.navigate(url);
      console.error('Navigated to app');

      // Wait for demo button and click it
      await this.waitForElement('button:has-text("Continue in Demo Mode")', 10000);
      await this.click('button:has-text("Continue in Demo Mode")');
      console.error('Clicked demo mode button');

      // Wait for dashboard to load
      await this.page.waitForTimeout(2000);
      const currentUrl = this.page.url();
      console.error(`Current URL: ${currentUrl}`);

      // Check if we're on dashboard
      const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('#/dashboard');
      console.error(`On dashboard: ${isOnDashboard}`);

      // Take screenshot
      const screenshot = await this.screenshot('demo-mode-test');

      return {
        success: isOnDashboard,
        currentUrl,
        screenshot: screenshot.screenshot,
        message: isOnDashboard ? 'Demo mode test passed!' : 'Demo mode test failed - not on dashboard'
      };
    } catch (error) {
      console.error('Demo mode test failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Demo mode test failed with error'
      };
    }
  }
}

// Global browser tester instance
const browserTester = new AutonomousBrowserTester();

// Create MCP server
const server = new McpServer({
  name: "autonomous-browser-tester",
  version: "1.0.0"
});

// Tool: Navigate to URL
server.tool(
  "navigate",
  {
    url: z.string().describe("URL to navigate to")
  },
  async ({ url }) => {
    try {
      const result = await browserTester.navigate(url);
      return {
        content: [{ type: "text", text: `Navigated to ${result.url}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Navigation failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Click element
server.tool(
  "click",
  {
    selector: z.string().describe("CSS selector for element to click")
  },
  async ({ selector }) => {
    try {
      const result = await browserTester.click(selector);
      return {
        content: [{ type: "text", text: `Clicked element: ${result.selector}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Click failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Fill input field
server.tool(
  "fill",
  {
    selector: z.string().describe("CSS selector for input field"),
    value: z.string().describe("Value to fill")
  },
  async ({ selector, value }) => {
    try {
      const result = await browserTester.fill(selector, value);
      return {
        content: [{ type: "text", text: `Filled ${result.selector} with: ${result.value}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Fill failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Take screenshot
server.tool(
  "screenshot",
  {
    name: z.string().optional().describe("Name for the screenshot")
  },
  async ({ name = 'screenshot' }) => {
    try {
      const result = await browserTester.screenshot(name);
      return {
        content: [
          { type: "text", text: `Screenshot taken: ${result.name}` },
          { type: "image", data: result.screenshot, mimeType: "image/png" }
        ]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Screenshot failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Get text from element
server.tool(
  "get_text",
  {
    selector: z.string().describe("CSS selector for element")
  },
  async ({ selector }) => {
    try {
      const result = await browserTester.getText(selector);
      return {
        content: [{ type: "text", text: `Text from ${result.selector}: ${result.text}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Get text failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Wait for element
server.tool(
  "wait_for_element",
  {
    selector: z.string().describe("CSS selector to wait for"),
    timeout: z.number().optional().describe("Timeout in milliseconds")
  },
  async ({ selector, timeout = 10000 }) => {
    try {
      const result = await browserTester.waitForElement(selector, timeout);
      return {
        content: [{ type: "text", text: `Element found: ${result.selector}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Wait for element failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Execute JavaScript
server.tool(
  "evaluate",
  {
    script: z.string().describe("JavaScript code to execute")
  },
  async ({ script }) => {
    try {
      const result = await browserTester.evaluate(script);
      return {
        content: [{ type: "text", text: `JavaScript result: ${JSON.stringify(result.result)}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `JavaScript execution failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Test demo mode specifically
server.tool(
  "test_demo_mode",
  {
    url: z.string().optional().describe("URL to test (default: http://localhost:8080)")
  },
  async ({ url = 'http://localhost:8080' }) => {
    try {
      const result = await browserTester.testDemoMode(url);
      const content = [
        { type: "text", text: `Demo mode test result: ${result.message}` },
        { type: "text", text: `Success: ${result.success}` },
        { type: "text", text: `Current URL: ${result.currentUrl || 'N/A'}` }
      ];

      if (result.screenshot) {
        content.push({ type: "image", data: result.screenshot, mimeType: "image/png" });
      }

      return { content };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Demo mode test failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: Close browser
server.tool(
  "close_browser",
  {},
  async () => {
    try {
      await browserTester.closeBrowser();
      return {
        content: [{ type: "text", text: "Browser closed successfully" }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Close browser failed: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Autonomous Browser Tester MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
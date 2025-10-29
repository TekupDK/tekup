# @tekup/autonomous-browser-tester

Autonomous browser testing MCP server using Puppeteer for the Tekup ecosystem.

## 🎯 Purpose

A powerful Model Context Protocol (MCP) server that provides autonomous browser automation capabilities, designed specifically for testing and automating web applications within the Tekup platform.

## 🚀 Features

- **Autonomous Browser Testing**: Full browser automation using Puppeteer
- **MCP Integration**: Seamlessly integrates with Tekup's MCP ecosystem
- **Visual Verification**: Screenshot capture and visual testing
- **Demo Mode Testing**: Specialized tools for testing demo functionality
- **JavaScript Execution**: Custom script execution in browser context
- **DOM Manipulation**: Element interaction, text extraction, form filling

## 📦 Installation

### Within Tekup MCP Ecosystem

```bash
# Install dependencies
cd packages/autonomous-browser-tester
npm install

# Build and start
npm run build
npm start
```

### Global Installation

```bash
npm install -g @tekup/autonomous-browser-tester
```

## 🛠️ Available Tools

The MCP server provides 9 autonomous testing tools:

### Core Browser Tools

- `navigate` - Navigate to URLs
- `click` - Click elements by CSS selector  
- `fill` - Fill input fields with values
- `get_text` - Extract text from elements
- `wait_for_element` - Wait for DOM elements
- `evaluate` - Execute custom JavaScript
- `screenshot` - Capture browser screenshots

### Specialized Tools

- `test_demo_mode` - Automated demo mode testing
- `close_browser` - Clean browser shutdown

## 🔧 Configuration

### MCP Server Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "autonomous-browser-tester": {
      "command": "node",
      "args": ["path/to/packages/autonomous-browser-tester/index.js"]
    }
  }
}
```

### Tekup Integration

```javascript
// Example usage within Tekup
const browserTester = useMcpTool('autonomous-browser-tester');

// Test dashboard demo mode
const result = await browserTester.test_demo_mode('http://localhost:8080');

// Take a screenshot
const screenshot = await browserTester.screenshot('dashboard-test');

// Navigate and interact
await browserTester.navigate('http://localhost:8080');
await browserTester.click('#demo-button');
```

## 🎯 Usage Examples

### Basic Testing

```javascript
// Navigate to application
await browserTester.navigate('http://localhost:3000');

// Wait for element and click
await browserTester.wait_for_element('#login-btn');
await browserTester.click('#login-btn');

// Fill form
await browserTester.fill('input[name="email"]', 'user@example.com');
await browserTester.fill('input[name="password"]', 'password123');

// Verify page loaded
const title = await browserTester.get_text('h1');
const screenshot = await browserTester.screenshot('login-result');
```

### Demo Mode Testing

```javascript
// Specialized demo mode testing
const result = await browserTester.test_demo_mode('http://localhost:8080');
console.log('Demo mode test:', result.message);
console.log('Success:', result.success);
console.log('Current URL:', result.currentUrl);

// Screenshot of demo mode
const screenshot = await browserTester.screenshot('demo-mode-working');
```

### Advanced JavaScript Execution

```javascript
// Execute custom JavaScript
const title = await browserTester.evaluate('document.title');

// Check localStorage
const demoMode = await browserTester.evaluate(
  'localStorage.getItem("tekup-demo-mode")'
);

// Extract complex data
const userInfo = await browserTester.evaluate(`
  {
    title: document.title,
    url: window.location.href,
    demoMode: localStorage.getItem('tekup-demo-mode'),
    buttons: document.querySelectorAll('button').length
  }
`);
```

## 🔍 Testing Workflows

### Automated Testing Pipeline

1. **Navigation Testing**
   ```javascript
   await browserTester.navigate(baseUrl);
   const currentUrl = await browserTester.evaluate('window.location.href');
   ```

2. **Element Interaction**
   ```javascript
   await browserTester.wait_for_element('.demo-button');
   await browserTester.click('.demo-button');
   ```

3. **State Verification**
   ```javascript
   const isOnDashboard = await browserTester.evaluate(
     'window.location.pathname.includes("/dashboard")'
   );
   ```

4. **Visual Verification**
   ```javascript
   const screenshot = await browserTester.screenshot('test-result');
   ```

### End-to-End Testing

```javascript
// Complete E2E test flow
const testFlow = async () => {
  // Start browser and navigate
  await browserTester.navigate('http://localhost:8080');
  
  // Test demo mode
  const demoResult = await browserTester.test_demo_mode();
  
  if (!demoResult.success) {
    throw new Error('Demo mode test failed');
  }
  
  // Verify dashboard content
  const sidebar = await browserTester.get_text('.sidebar');
  const navItems = await browserTester.get_text('.nav-items');
  
  // Take final screenshot
  const finalScreenshot = await browserTester.screenshot('e2e-complete');
  
  return {
    demoTest: demoResult.success,
    sidebar: !!sidebar,
    navItems: !!navItems,
    screenshot: !!finalScreenshot
  };
};
```

## 🔧 Technical Details

### Puppeteer Configuration

- **Headless Mode**: Disabled for visual testing
- **Browser Launch**: Configurable with security flags
- **Timeout Management**: Automatic timeout handling

### Error Handling

- **Graceful Failures**: All tools handle errors gracefully
- **Timeout Protection**: Automatic timeout for all operations  
- **Detailed Errors**: Comprehensive error messages via MCP

### Browser Management

- **Single Instance**: One browser per server session
- **State Persistence**: Maintains browser state across tool calls
- **Auto Cleanup**: Automatic cleanup on server shutdown

## 🎯 Integration Points

### Tekup Dashboard Testing

- **Demo Mode Validation**: Automated testing of demo functionality
- **Component Testing**: Interactive component validation
- **Route Testing**: Navigation and routing verification

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Test Dashboard Demo Mode
  run: |
    npm start -- --test-demo-mode http://localhost:8080
```

### Quality Assurance

- **Automated Testing**: Integration with QA pipelines
- **Visual Regression**: Screenshot comparison testing
- **User Journey Testing**: End-to-end workflow validation

## 📊 Performance

- **Startup Time**: < 30 seconds (including browser launch)
- **Operation Speed**: 100-500ms per basic operation
- **Screenshot Quality**: Base64 encoded, full-resolution
- **Memory Usage**: ~100MB for browser + server

## 🔒 Security

- **Sandboxed Execution**: Browser runs in controlled environment
- **No Persistent State**: Browser session isolated per test
- **Controlled Access**: MCP protocol ensures secure tool access

## 🚀 Future Enhancements

### Planned Features

- **Headless Mode Option**: For CI/CD environments
- **Multi-Browser Support**: Chrome, Firefox, Safari
- **Network Interception**: API call monitoring
- **Performance Metrics**: Page load time tracking
- **Cookie Management**: Session handling

### Advanced Capabilities

- **File Upload Testing**: Automated file upload workflows
- **Drag & Drop**: Complex UI interaction testing
- **Mobile Testing**: Mobile-responsive design validation
- **Cross-Browser**: Multi-browser compatibility testing

## 📚 Examples Repository

See the [Tekup Examples Repository](https://github.com/tekupdk/examples) for more comprehensive examples and integration patterns.

## 🤝 Contributing

This MCP server is part of the Tekup ecosystem. For contribution guidelines, see the main [Tekup Contributing Guide](https://github.com/tekupdk/tekup/blob/main/CONTRIBUTING.md).

## 📄 License

ISC License - part of the Tekup project ecosystem.

---

**Part of the Tekup MCP Server Suite**

For more Tekup MCP servers, visit: [tekup-mcp-servers](https://github.com/tekupdk/tekup-mcp-servers)

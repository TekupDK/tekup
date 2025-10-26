# Anthropic Claude Integration Guide

Complete integration guide for Anthropic Claude AI models in the TekUp.org platform.

## Overview

Anthropic Claude provides advanced AI capabilities with a focus on safety, helpfulness, and harmlessness. Claude excels at complex reasoning, analysis, and maintaining context over long conversations.

## Quick Start

### 1. Get API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Configure Environment
```bash
# Add to your .env file
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 3. Register Service
```typescript
import { ServiceRegistry } from '@tekup/service-registry';

const registry = new ServiceRegistry();
await registry.registerService({
  id: 'anthropic',
  name: 'Anthropic Claude',
  type: 'ai-provider',
  provider: 'Anthropic',
  baseUrl: 'https://api.anthropic.com/v1',
  apiKey: process.env.ANTHROPIC_API_KEY,
  apiKeyHeader: 'x-api-key',
  apiKeyPrefix: '',
  additionalHeaders: {
    'anthropic-version': '2023-06-01'
  }
});
```

## Authentication

Anthropic uses API key authentication with a custom header:

```typescript
const headers = {
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'Content-Type': 'application/json'
};
```

## API Endpoints

### Messages
Primary endpoint for conversational AI:

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    messages: [
      { role: 'user', content: 'Hello, Claude!' }
    ]
  })
});

const data = await response.json();
console.log(data.content[0].text);
```

### Available Models

| Model | Description | Context Window | Best For |
|-------|-------------|----------------|----------|
| claude-3-opus-20240229 | Most capable model | 200K tokens | Complex analysis, creative tasks |
| claude-3-sonnet-20240229 | Balanced performance | 200K tokens | General purpose, good speed/quality |
| claude-3-haiku-20240307 | Fastest model | 200K tokens | Simple tasks, quick responses |

## Rate Limits

Anthropic enforces rate limits based on your plan:

| Tier | Requests/min | Tokens/min |
|------|-------------|------------|
| Free | 5 | 25,000 |
| Pro | 50 | 100,000 |
| Team | 100 | 200,000 |

### Handling Rate Limits

```typescript
async function callClaude(payload, retries = 3) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '60';
      const delay = parseInt(retryAfter) * 1000;
      
      if (retries > 0) {
        console.log(`Rate limited. Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callClaude(payload, retries - 1);
      }
      throw new Error('Rate limit exceeded');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}
```

## Error Handling

Common error codes and responses:

### 400 - Bad Request
```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "messages: field required"
  }
}
```

### 401 - Authentication Error
```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}
```

### 429 - Rate Limit
```json
{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "message": "Number of requests per minute exceeded"
  }
}
```

### Error Handling Implementation

```typescript
function handleClaudeError(error) {
  const errorType = error.error?.type;
  
  switch (errorType) {
    case 'authentication_error':
      throw new Error('Claude API key is invalid. Please check your configuration.');
    
    case 'rate_limit_error':
      throw new Error('Claude rate limit exceeded. Please try again later.');
    
    case 'invalid_request_error':
      throw new Error(`Claude request error: ${error.error.message}`);
    
    case 'overloaded_error':
      throw new Error('Claude API is temporarily overloaded. Please try again.');
    
    default:
      throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
  }
}
```

## Usage Examples

### Basic Conversation

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

class ClaudeService {
  constructor(private registry: ServiceRegistry) {}

  async chat(messages, options = {}) {
    const service = this.registry.getService('anthropic');
    if (!service) throw new Error('Claude service not configured');

    const response = await fetch(`${service.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': service.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 1000,
        messages,
        temperature: options.temperature || 0.7,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.json();
      handleClaudeError(error);
    }

    return await response.json();
  }
}

// Usage
const claude = new ClaudeService(registry);
const result = await claude.chat([
  { role: 'user', content: 'Explain the benefits of TypeScript over JavaScript' }
]);

console.log(result.content[0].text);
```

### System Messages

Claude uses system messages to set context and behavior:

```typescript
const result = await claude.chat([
  { 
    role: 'user', 
    content: 'What are the key principles of good software architecture?' 
  }
], {
  system: `You are a senior software architect with expertise in enterprise systems.
  Provide detailed, practical advice based on industry best practices.
  Focus on maintainability, scalability, and team productivity.`
});
```

### Streaming Responses

```typescript
async function streamClaude(messages, options = {}) {
  const service = registry.getService('anthropic');
  
  const response = await fetch(`${service.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': service.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages,
      stream: true,
      ...options
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.type === 'content_block_delta') {
            const text = parsed.delta?.text;
            if (text) {
              process.stdout.write(text);
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

### Document Analysis

Claude excels at analyzing long documents:

```typescript
async function analyzeDocument(documentText, analysisType = 'summary') {
  const prompts = {
    summary: 'Please provide a comprehensive summary of this document, highlighting the key points and main conclusions.',
    
    critique: 'Please provide a critical analysis of this document, identifying strengths, weaknesses, and areas for improvement.',
    
    questions: 'Please generate thoughtful questions that this document raises or that could be used to test understanding of its content.',
    
    action_items: 'Please extract any action items, recommendations, or next steps mentioned in this document.'
  };

  const result = await claude.chat([
    {
      role: 'user',
      content: `${prompts[analysisType]}\n\nDocument:\n${documentText}`
    }
  ], {
    model: 'claude-3-opus-20240229', // Use most capable model for analysis
    maxTokens: 2000
  });

  return result.content[0].text;
}

// Usage
const summary = await analyzeDocument(longDocument, 'summary');
const actionItems = await analyzeDocument(longDocument, 'action_items');
```

### Code Review

```typescript
async function reviewCode(code, language = 'typescript') {
  const result = await claude.chat([
    {
      role: 'user',
      content: `Please review this ${language} code and provide feedback on:
      1. Code quality and best practices
      2. Potential bugs or issues
      3. Performance considerations
      4. Suggestions for improvement

      Code:
      \`\`\`${language}
      ${code}
      \`\`\``
    }
  ], {
    system: `You are an expert ${language} developer and code reviewer.
    Provide constructive, specific feedback with examples where appropriate.
    Focus on maintainability, performance, and adherence to best practices.`,
    model: 'claude-3-opus-20240229',
    maxTokens: 2000
  });

  return result.content[0].text;
}
```

## Monitoring & Health Checks

### Health Check Implementation

```typescript
async function checkClaudeHealth() {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime: response.headers.get('x-response-time'),
      statusCode: response.status
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}
```

### Usage Tracking

```typescript
class ClaudeMonitor {
  private usage = {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    errors: 0,
    costs: 0
  };

  trackRequest(inputTokens, outputTokens, model) {
    this.usage.requests++;
    this.usage.inputTokens += inputTokens;
    this.usage.outputTokens += outputTokens;
    this.usage.costs += this.calculateCost(inputTokens, outputTokens, model);
  }

  calculateCost(inputTokens, outputTokens, model) {
    const pricing = {
      'claude-3-opus-20240229': { input: 15, output: 75 }, // per million tokens
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
    };

    const rates = pricing[model] || pricing['claude-3-sonnet-20240229'];
    return (inputTokens / 1000000) * rates.input + (outputTokens / 1000000) * rates.output;
  }

  getStats() {
    return { ...this.usage };
  }
}
```

## Best Practices

### 1. Model Selection
- Use **Claude-3-Opus** for complex analysis, creative writing, and critical thinking
- Use **Claude-3-Sonnet** for general-purpose tasks with good balance of speed and quality
- Use **Claude-3-Haiku** for simple tasks requiring fast responses

### 2. Prompt Engineering

```typescript
// Good: Clear, specific instructions
const goodPrompt = `Please analyze this customer feedback and provide:
1. Overall sentiment (positive/negative/neutral)
2. Key themes mentioned
3. Specific action items for improvement
4. Priority level for each action item

Customer feedback: "${feedback}"`;

// Better: Include examples and constraints
const betterPrompt = `You are a customer success analyst. Analyze this feedback and provide structured output.

Format your response as:
**Sentiment:** [Positive/Negative/Neutral]
**Key Themes:** [List 3-5 main themes]
**Action Items:** [Numbered list with priority levels]

Example output:
**Sentiment:** Negative
**Key Themes:** 
- Slow response times
- Confusing interface
**Action Items:**
1. [HIGH] Improve response time SLA
2. [MEDIUM] Redesign user interface

Customer feedback: "${feedback}"`;
```

### 3. Context Management

```typescript
class ConversationManager {
  private context = [];
  private maxContextTokens = 150000; // Leave room for response

  addMessage(role, content) {
    this.context.push({ role, content });
    this.trimContext();
  }

  trimContext() {
    // Estimate tokens (rough approximation)
    let totalTokens = this.context.reduce((sum, msg) => 
      sum + Math.ceil(msg.content.length / 4), 0);

    while (totalTokens > this.maxContextTokens && this.context.length > 1) {
      // Remove oldest messages but keep system message
      if (this.context[0].role === 'system') {
        this.context.splice(1, 1);
      } else {
        this.context.shift();
      }
      
      totalTokens = this.context.reduce((sum, msg) => 
        sum + Math.ceil(msg.content.length / 4), 0);
    }
  }

  getContext() {
    return [...this.context];
  }
}
```

### 4. Response Caching

```typescript
const responseCache = new Map();

async function cachedClaudeChat(messages, options = {}) {
  const cacheKey = JSON.stringify({ messages, options });
  
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const result = await claude.chat(messages, options);
  responseCache.set(cacheKey, result);
  
  // Cache for 2 hours
  setTimeout(() => responseCache.delete(cacheKey), 7200000);
  
  return result;
}
```

## Troubleshooting

### Common Issues

1. **API Key Authentication**
   - Verify key format (starts with `sk-ant-`)
   - Check if key has proper permissions
   - Ensure correct header name (`x-api-key`)

2. **Version Compatibility**
   - Always include `anthropic-version` header
   - Use supported version: `2023-06-01`

3. **Message Format**
   - Ensure messages array is not empty
   - Alternate between 'user' and 'assistant' roles
   - Don't start with 'assistant' role

4. **Token Limits**
   - Monitor input + output token usage
   - Claude has 200K context window
   - Leave room for response tokens

### Debug Mode

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

async function debugClaudeChat(messages, options = {}) {
  if (DEBUG) {
    console.log('Claude Request:', {
      messages: messages.map(m => ({ role: m.role, contentLength: m.content.length })),
      options,
      timestamp: new Date().toISOString()
    });
  }

  const start = Date.now();
  const result = await claude.chat(messages, options);
  const duration = Date.now() - start;

  if (DEBUG) {
    console.log('Claude Response:', {
      duration: `${duration}ms`,
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens,
      model: result.model,
      timestamp: new Date().toISOString()
    });
  }

  return result;
}
```

## Security Considerations

1. **API Key Security**
   - Store keys in environment variables
   - Never expose in client-side code
   - Rotate keys regularly (quarterly recommended)

2. **Content Filtering**
   - Claude has built-in safety measures
   - Monitor for inappropriate content
   - Implement additional filtering if needed

3. **Data Privacy**
   - Claude doesn't train on API data
   - Still avoid sending sensitive information
   - Implement data anonymization where possible

## Support & Resources

- **Documentation**: [Anthropic API Docs](https://docs.anthropic.com/)
- **Status Page**: [Anthropic Status](https://status.anthropic.com/)
- **Support**: [Anthropic Support](https://support.anthropic.com/)
- **Discord**: [Anthropic Discord Community](https://discord.gg/anthropic)

## Pricing

Current pricing (as of 2024):

| Model | Input (per million tokens) | Output (per million tokens) |
|-------|----------------------------|------------------------------|
| Claude-3-Opus | $15.00 | $75.00 |
| Claude-3-Sonnet | $3.00 | $15.00 |
| Claude-3-Haiku | $0.25 | $1.25 |

Monitor usage through the Anthropic Console and implement cost controls as needed.
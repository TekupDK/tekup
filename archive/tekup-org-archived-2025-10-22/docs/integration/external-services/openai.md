# OpenAI Integration Guide

Complete integration guide for OpenAI GPT models and APIs in the TekUp.org platform.

## Overview

OpenAI provides powerful language models including GPT-4, GPT-3.5, and specialized models for various tasks. This integration enables AI-powered features across the platform.

## Quick Start

### 1. Get API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Configure Environment
```bash
# Add to your .env file
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Register Service
```typescript
import { ServiceRegistry } from '@tekup/service-registry';

const registry = new ServiceRegistry();
await registry.registerService({
  id: 'openai',
  name: 'OpenAI',
  type: 'ai-provider',
  provider: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY
});
```

## Authentication

OpenAI uses Bearer token authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};
```

## API Endpoints

### Chat Completions
Primary endpoint for conversational AI:

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello, how can you help me?' }
    ],
    max_tokens: 150,
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### Models
List available models:

```typescript
const response = await fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const models = await response.json();
```

### Embeddings
Generate text embeddings:

```typescript
const response = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-ada-002',
    input: 'Your text to embed'
  })
});
```

## Rate Limits

OpenAI enforces rate limits based on your plan:

| Plan | Requests/min | Tokens/min |
|------|-------------|------------|
| Free | 3 | 150,000 |
| Pay-as-you-go | 3,500 | 350,000 |
| Tier 1 | 3,500 | 350,000 |
| Tier 2 | 5,000 | 450,000 |

### Handling Rate Limits

```typescript
async function callOpenAI(payload, retries = 3) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      const delay = parseInt(retryAfter) * 1000;
      
      if (retries > 0) {
        console.log(`Rate limited. Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callOpenAI(payload, retries - 1);
      }
      throw new Error('Rate limit exceeded');
    }

    return await response.json();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}
```

## Error Handling

Common error codes and responses:

### 401 - Invalid Authentication
```json
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### 429 - Rate Limit Exceeded
```json
{
  "error": {
    "message": "Rate limit reached",
    "type": "requests",
    "code": "rate_limit_exceeded"
  }
}
```

### 500 - Server Error
```json
{
  "error": {
    "message": "The server had an error while processing your request",
    "type": "server_error"
  }
}
```

### Error Handling Implementation

```typescript
function handleOpenAIError(error) {
  switch (error.error?.code) {
    case 'invalid_api_key':
      throw new Error('OpenAI API key is invalid. Please check your configuration.');
    
    case 'rate_limit_exceeded':
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    
    case 'insufficient_quota':
      throw new Error('OpenAI quota exceeded. Please check your billing.');
    
    case 'model_not_found':
      throw new Error('Requested OpenAI model not found or not accessible.');
    
    default:
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }
}
```

## Usage Examples

### Basic Chat Completion

```typescript
import { ServiceRegistry } from '@tekup/service-registry';

class OpenAIService {
  constructor(private registry: ServiceRegistry) {}

  async chat(messages, options = {}) {
    const service = this.registry.getService('openai');
    if (!service) throw new Error('OpenAI service not configured');

    const response = await fetch(`${service.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${service.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4',
        messages,
        max_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7,
        ...options
      })
    });

    if (!response.ok) {
      const error = await response.json();
      handleOpenAIError(error);
    }

    return await response.json();
  }
}

// Usage
const openai = new OpenAIService(registry);
const result = await openai.chat([
  { role: 'user', content: 'Explain quantum computing in simple terms' }
]);
```

### Streaming Responses

```typescript
async function streamChat(messages) {
  const service = registry.getService('openai');
  
  const response = await fetch(`${service.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${service.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      stream: true
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
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            process.stdout.write(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

### Function Calling

```typescript
const functions = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name'
        }
      },
      required: ['location']
    }
  }
];

const result = await openai.chat([
  { role: 'user', content: 'What\'s the weather in Copenhagen?' }
], {
  functions,
  function_call: 'auto'
});

if (result.choices[0].message.function_call) {
  const functionCall = result.choices[0].message.function_call;
  const args = JSON.parse(functionCall.arguments);
  
  // Call your function
  const weatherData = await getWeather(args.location);
  
  // Send result back to OpenAI
  const followUp = await openai.chat([
    ...messages,
    result.choices[0].message,
    {
      role: 'function',
      name: functionCall.name,
      content: JSON.stringify(weatherData)
    }
  ]);
}
```

## Monitoring & Health Checks

### Health Check Implementation

```typescript
async function checkOpenAIHealth() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
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

### Usage Monitoring

```typescript
class OpenAIMonitor {
  private usage = {
    requests: 0,
    tokens: 0,
    errors: 0,
    costs: 0
  };

  trackRequest(tokens, model) {
    this.usage.requests++;
    this.usage.tokens += tokens;
    this.usage.costs += this.calculateCost(tokens, model);
  }

  trackError() {
    this.usage.errors++;
  }

  calculateCost(tokens, model) {
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };

    const rate = pricing[model] || pricing['gpt-3.5-turbo'];
    return (tokens / 1000) * rate.input; // Simplified calculation
  }

  getStats() {
    return { ...this.usage };
  }
}
```

## Best Practices

### 1. Model Selection
- Use **GPT-4** for complex reasoning and analysis
- Use **GPT-3.5-turbo** for general chat and simple tasks
- Use **text-embedding-ada-002** for embeddings

### 2. Prompt Engineering
```typescript
const systemPrompt = `You are a helpful AI assistant for TekUp.org, a Danish IT consulting company.
Always respond professionally and provide accurate technical information.
If you're unsure about something, say so rather than guessing.`;

const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userInput }
];
```

### 3. Token Management
```typescript
function estimateTokens(text) {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

function truncateToTokenLimit(text, maxTokens = 4000) {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;
  
  const ratio = maxTokens / estimatedTokens;
  return text.substring(0, Math.floor(text.length * ratio));
}
```

### 4. Caching Responses
```typescript
const responseCache = new Map();

async function cachedChat(messages, options = {}) {
  const cacheKey = JSON.stringify({ messages, options });
  
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  const result = await openai.chat(messages, options);
  responseCache.set(cacheKey, result);
  
  // Cache for 1 hour
  setTimeout(() => responseCache.delete(cacheKey), 3600000);
  
  return result;
}
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key format (starts with `sk-`)
   - Check if key has been revoked
   - Ensure sufficient credits/quota

2. **Rate Limits**
   - Implement exponential backoff
   - Monitor usage patterns
   - Consider upgrading plan

3. **High Latency**
   - Use streaming for long responses
   - Optimize prompt length
   - Consider caching frequent requests

4. **Token Limits**
   - Monitor token usage
   - Implement text truncation
   - Use appropriate models for task complexity

### Debug Mode

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

async function debugChat(messages, options = {}) {
  if (DEBUG) {
    console.log('OpenAI Request:', {
      messages,
      options,
      timestamp: new Date().toISOString()
    });
  }

  const start = Date.now();
  const result = await openai.chat(messages, options);
  const duration = Date.now() - start;

  if (DEBUG) {
    console.log('OpenAI Response:', {
      duration: `${duration}ms`,
      tokens: result.usage,
      model: result.model,
      timestamp: new Date().toISOString()
    });
  }

  return result;
}
```

## Security Considerations

1. **API Key Security**
   - Never expose keys in client-side code
   - Use environment variables
   - Rotate keys regularly

2. **Input Validation**
   - Sanitize user inputs
   - Implement content filtering
   - Monitor for prompt injection attempts

3. **Output Filtering**
   - Review AI responses for sensitive information
   - Implement content moderation
   - Log interactions for audit purposes

## Support & Resources

- **Documentation**: [OpenAI API Docs](https://platform.openai.com/docs)
- **Status Page**: [OpenAI Status](https://status.openai.com/)
- **Community**: [OpenAI Community Forum](https://community.openai.com/)
- **Support**: [OpenAI Help Center](https://help.openai.com/)

## Pricing

Current pricing (as of 2024):

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| GPT-4 | $0.03 | $0.06 |
| GPT-3.5-turbo | $0.0015 | $0.002 |
| text-embedding-ada-002 | $0.0001 | - |

Monitor usage through the OpenAI dashboard and implement cost controls as needed.
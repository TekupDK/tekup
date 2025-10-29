# @tekup-ai/llm

> Unified LLM provider abstraction for OpenAI, Gemini, and Ollama

## Installation

```bash
pnpm add @tekup-ai/llm
```

## Usage

### Basic Example

```typescript
import { createLLMProvider } from '@tekup-ai/llm';

// Create OpenAI provider
const llm = createLLMProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  temperature: 0.7
});

// Generate text
const response = await llm.generateText('Explain quantum computing in simple terms');
console.log(response.content);
```

### Streaming Example

```typescript
const stream = await llm.streamText('Write a story about AI');

for await (const chunk of stream) {
  process.stdout.write(chunk.delta);
  if (chunk.done) break;
}
```

### Chat Completion

```typescript
const response = await llm.chatCompletion({
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the capital of Denmark?' }
  ],
  temperature: 0.3
});
```

## Supported Providers

### OpenAI

```typescript
const openai = createLLMProvider('openai', {
  apiKey: 'sk-proj-...',
  model: 'gpt-4o-mini', // or 'gpt-4o'
  temperature: 0.7,
  maxTokens: 800
});
```

**Models**: `gpt-4o`, `gpt-4o-mini`

### Gemini

```typescript
const gemini = createLLMProvider('gemini', {
  apiKey: 'your-gemini-key',
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7
});
```

**Models**: `gemini-2.0-flash-exp`, `gemini-1.5-pro`

### Ollama (Local)

```typescript
const ollama = createLLMProvider('ollama', {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.1:8b'
});
```

**Models**: Any Ollama model (llama3.1:8b, mistral, etc.)

## Configuration

Environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Gemini
GEMINI_KEY=...
GEMINI_MODEL=gemini-2.0-flash-exp

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

## API Reference

### `createLLMProvider(type, config)`

Factory function to create provider instance.

**Parameters:**

- `type`: `'openai' | 'gemini' | 'ollama'`
- `config`: Provider-specific configuration

**Returns:** `LLMProvider` instance

### `LLMProvider` Interface

- `generateText(prompt: string): Promise<LLMResponse>`
- `streamText(prompt: string): AsyncIterator<LLMStreamResponse>`
- `chatCompletion(options: ChatCompletionOptions): Promise<LLMResponse>`

## License

MIT © TekUp Team

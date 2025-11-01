# 🔬 TESTING & AI FORBEDRING GUIDE - RENOS CALENDAR MCP

**Date**: 21. Oktober 2025  
**Purpose**: Forbedre testing og AI-kapaciteter  
**Status**: 🎯 **IMPLEMENTATION READY**  

---

## 📊 NUVÆRENDE STATUS

### **Hvad Vi Har**

- ✅ MCP Server med 5 AI tools
- ✅ React Chatbot Interface
- ✅ Plugin Manager System
- ✅ Docker Infrastructure
- ⚠️ Minimal testing
- ⚠️ Basic AI responses

### **Hvad Vi Mangler**

- ❌ Automated testing framework
- ❌ Integration tests
- ❌ E2E tests
- ❌ AI response quality testing
- ❌ Performance testing
- ❌ Load testing

---

## 🎯 DEL 1: TESTING FRAMEWORKS

### **1. Jest + Supertest (Express API Testing)**

**GitHub**: <https://github.com/jestjs/jest>  
**Supertest**: <https://github.com/ladjs/supertest>  

#### **Hvorfor?**

- ✅ Industry standard for TypeScript/JavaScript testing
- ✅ Indbygget mocking og spies
- ✅ Supertest perfekt til Express API testing
- ✅ Vi har allerede Jest installeret!

#### **Implementation**

```typescript
// tests/api/mcp-server.test.ts
import request from 'supertest';
import app from '../../src/http-server';

describe('MCP Server API Tests', () => {
  describe('Health Endpoint', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('version', '0.1.0');
    });
  });

  describe('Validate Booking Date', () => {
    test('should validate correct date', async () => {
      const response = await request(app)
        .post('/api/v1/tools/validate_booking_date')
        .send({
          date: '2025-10-21',
          expectedDayName: 'tirsdag',
          customerId: 'test-user'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    test('should detect wrong day name', async () => {
      const response = await request(app)
        .post('/api/v1/tools/validate_booking_date')
        .send({
          date: '2025-10-21',
          expectedDayName: 'onsdag', // Wrong day!
          customerId: 'test-user'
        })
        .expect(200);
      
      expect(response.body.success).toBe(false);
      expect(response.body.data.warnings).toContain('DAY_MISMATCH');
    });
  });
});
```

#### **Installation**

```bash
npm install --save-dev supertest @types/supertest
npm install --save-dev ts-node @types/node
```

---

### **2. Vitest (Modern Alternative til Jest)**

**GitHub**: <https://github.com/vitest-dev/vitest>  

#### **Hvorfor?**

- ✅ 10x hurtigere end Jest
- ✅ Native ESM support
- ✅ Vite integration
- ✅ Jest-compatible API

#### **Implementation**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

### **3. Playwright (E2E Testing)**

**GitHub**: <https://github.com/microsoft/playwright>  

#### **Hvorfor?**

- ✅ Cross-browser testing
- ✅ Auto-wait for elements
- ✅ Mobile testing support
- ✅ Video recording
- ✅ Perfect for chatbot UI testing

#### **Implementation**

```typescript
// tests/e2e/chatbot.spec.ts
import { test, expect } from '@playwright/test';

test('chatbot should validate booking date', async ({ page }) => {
  // Navigate to chatbot
  await page.goto('http://localhost:3005');
  
  // Type message
  await page.fill('input[placeholder="Skriv din besked her..."]', 
    'Valider booking 2025-10-21 tirsdag');
  
  // Click send
  await page.click('button[title="Send besked"]');
  
  // Wait for response
  await page.waitForSelector('.message.assistant');
  
  // Verify response
  const response = await page.textContent('.message.assistant');
  expect(response).toContain('Gyldig');
  expect(response).toContain('2025-10-21');
});

test('chatbot should show plugin manager', async ({ page }) => {
  await page.goto('http://localhost:3005');
  
  // Click plugin button
  await page.click('button[title="Plugin Manager"]');
  
  // Wait for modal
  await page.waitForSelector('text=Plugin Manager');
  
  // Verify plugins
  const plugins = await page.locator('.plugin-card').count();
  expect(plugins).toBeGreaterThan(0);
});
```

#### **Installation**

```bash
npm install --save-dev @playwright/test
npx playwright install
```

---

### **4. React Testing Library (Component Testing)**

**GitHub**: <https://github.com/testing-library/react-testing-library>  

#### **Hvorfor?**

- ✅ User-centric testing
- ✅ Best practice for React
- ✅ Integration med Jest/Vitest
- ✅ Testing accessibility

#### **Implementation**

```typescript
// chatbot/src/components/__tests__/ChatInterface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from '../ChatInterface';

describe('ChatInterface', () => {
  test('renders chat interface', () => {
    render(<ChatInterface />);
    expect(screen.getByPlaceholderText('Skriv din besked her...')).toBeInTheDocument();
  });

  test('sends message when send button clicked', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Skriv din besked her...');
    const sendButton = screen.getByTitle('Send besked');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  test('shows plugin manager when button clicked', async () => {
    render(<ChatInterface />);
    
    const pluginButton = screen.getByTitle('Plugin Manager');
    fireEvent.click(pluginButton);
    
    await waitFor(() => {
      expect(screen.getByText('Plugin Manager')).toBeInTheDocument();
    });
  });
});
```

---

## 🎯 DEL 2: AI FORBEDRING FRAMEWORKS

### **1. LangChain (Recommended)**

**GitHub**: <https://github.com/langchain-ai/langchainjs>  
**Docs**: <https://js.langchain.com/>

#### **Hvorfor?**

- ✅ Industry-leading LLM framework
- ✅ TypeScript/JavaScript support
- ✅ Chain of Thought reasoning
- ✅ Memory management
- ✅ Tool calling support (perfect for MCP!)
- ✅ RAG (Retrieval Augmented Generation)

#### **Key Features for RenOS**

```typescript
// 1. Memory Management
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';

const memory = new BufferMemory();
const chain = new ConversationChain({ llm, memory });

// 2. Tool Integration (MCP Tools!)
import { DynamicTool } from 'langchain/tools';

const validateBookingTool = new DynamicTool({
  name: "validate_booking_date",
  description: "Validates a booking date and checks for conflicts",
  func: async (input) => {
    // Call MCP tool
    const result = await callMCPTool('validate_booking_date', JSON.parse(input));
    return JSON.stringify(result);
  },
});

// 3. Chain of Thought
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const executor = await initializeAgentExecutorWithOptions(
  [validateBookingTool, checkConflictsTool],
  llm,
  {
    agentType: "chat-conversational-react-description",
    verbose: true,
  }
);
```

#### **Implementation Plan**

```typescript
// chatbot/src/services/LangChainService.ts
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

export class LangChainService {
  private llm: ChatOpenAI;
  private memory: BufferMemory;
  private chain: ConversationChain;

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
    });
    
    this.memory = new BufferMemory();
    
    this.chain = new ConversationChain({
      llm: this.llm,
      memory: this.memory,
    });
  }

  async processUserInput(input: string): Promise<string> {
    const response = await this.chain.call({ input });
    return response.response;
  }
}
```

---

### **2. LlamaIndex (RAG Framework)**

**GitHub**: <https://github.com/run-llama/LlamaIndexTS>  

#### **Hvorfor?**

- ✅ Best-in-class RAG framework
- ✅ Document indexing
- ✅ Context retrieval
- ✅ TypeScript support
- ✅ Perfect for customer intelligence!

#### **Use Case for RenOS**

```typescript
// Customer Intelligence RAG
import { VectorStoreIndex, SimpleDirectoryReader } from "llamaindex";

// 1. Index customer data
const documents = await new SimpleDirectoryReader().loadData("./customer-data");
const index = await VectorStoreIndex.fromDocuments(documents);

// 2. Query customer intelligence
const queryEngine = index.asQueryEngine();
const response = await queryEngine.query(
  "What are Jes Vestergaard's booking preferences?"
);

// 3. Use in chatbot
const customerContext = response.toString();
const aiResponse = await llm.call([
  {
    role: "system",
    content: `Customer context: ${customerContext}`
  },
  {
    role: "user",
    content: userInput
  }
]);
```

---

### **3. Rasa (Open Source Conversational AI)**

**GitHub**: <https://github.com/RasaHQ/rasa>  

#### **Hvorfor?**

- ✅ Complete conversational AI platform
- ✅ Intent recognition
- ✅ Entity extraction
- ✅ Dialogue management
- ✅ Custom actions (MCP integration!)

#### **Integration Example**

```yaml
# domain.yml
intents:
  - validate_booking
  - check_conflicts
  - create_invoice
  - track_overtime
  - get_customer_info

entities:
  - date
  - customer_name
  - booking_id

actions:
  - action_validate_booking
  - action_check_conflicts
```

```python
# actions.py
from rasa_sdk import Action
import requests

class ActionValidateBooking(Action):
    def name(self) -> str:
        return "action_validate_booking"

    async def run(self, dispatcher, tracker, domain):
        date = tracker.get_slot("date")
        customer = tracker.get_slot("customer_name")
        
        # Call MCP API
        response = requests.post(
            "http://localhost:3001/api/v1/tools/validate_booking_date",
            json={"date": date, "customerId": customer}
        )
        
        result = response.json()
        dispatcher.utter_message(text=f"Booking validation: {result}")
        return []
```

---

### **4. Botpress (Conversational AI Platform)**

**GitHub**: <https://github.com/botpress/botpress>  

#### **Hvorfor?**

- ✅ Visual flow designer
- ✅ Multi-channel support
- ✅ Built-in NLU
- ✅ Analytics dashboard
- ✅ Easy integration

---

## 🎯 DEL 3: ANBEFALET IMPLEMENTATION PLAN

### **Phase 1: Basic Testing (1-2 dage)**

```bash
# 1. Install testing dependencies
cd renos-calendar-mcp
npm install --save-dev supertest @types/supertest

# 2. Create test structure
mkdir -p tests/{unit,integration,e2e}

# 3. Write basic API tests
# Create tests/integration/api.test.ts

# 4. Run tests
npm test
```

### **Phase 2: E2E Testing (2-3 dage)**

```bash
# 1. Install Playwright
npm install --save-dev @playwright/test
npx playwright install

# 2. Create E2E tests
mkdir -p tests/e2e

# 3. Run E2E tests
npx playwright test
```

### **Phase 3: AI Improvement (3-5 dage)**

```bash
# 1. Install LangChain
npm install langchain

# 2. Integrate with chatbot
# Update chatbot/src/services/

# 3. Add memory and context
# Implement conversation history

# 4. Test AI responses
# Verify improved quality
```

### **Phase 4: RAG Implementation (3-5 dage)**

```bash
# 1. Install LlamaIndex
npm install llamaindex

# 2. Index customer data
# Create customer intelligence index

# 3. Integrate with chatbot
# Add context retrieval

# 4. Test customer queries
# Verify improved responses
```

---

## 📊 KONKRETE NÆSTE STEPS

### **Immediate (Denne uge)**

1. ✅ Install Supertest
2. ✅ Write 10 basic API tests
3. ✅ Setup CI/CD for tests
4. ✅ Run tests on every commit

### **Short-term (Næste 2 uger)**

1. ⏳ Install Playwright
2. ⏳ Write 5 E2E tests for chatbot
3. ⏳ Add screenshot comparison
4. ⏳ Setup automated testing

### **Medium-term (Næste måned)**

1. ⏳ Integrate LangChain
2. ⏳ Add conversation memory
3. ⏳ Implement tool calling
4. ⏳ Test AI quality improvements

### **Long-term (Næste kvartal)**

1. ⏳ Implement RAG with LlamaIndex
2. ⏳ Index all customer data
3. ⏳ Advanced intent recognition
4. ⏳ Multi-language support

---

## 🔗 RELEVANTE REPOS

### **Testing**

- **Jest**: <https://github.com/jestjs/jest>
- **Supertest**: <https://github.com/ladjs/supertest>
- **Vitest**: <https://github.com/vitest-dev/vitest>
- **Playwright**: <https://github.com/microsoft/playwright>
- **React Testing Library**: <https://github.com/testing-library/react-testing-library>

### **AI Frameworks**

- **LangChain**: <https://github.com/langchain-ai/langchainjs>
- **LlamaIndex**: <https://github.com/run-llama/LlamaIndexTS>
- **Rasa**: <https://github.com/RasaHQ/rasa>
- **Botpress**: <https://github.com/botpress/botpress>
- **Hugging Face Transformers**: <https://github.com/huggingface/transformers.js>

### **MCP Testing**

- **MCP SDK**: <https://github.com/modelcontextprotocol/typescript-sdk>
- **MCP Examples**: <https://github.com/modelcontextprotocol/servers>

---

## 💡 QUICK WIN: Start Med Dette

### **Test 1: Basic API Health Check**

```typescript
// tests/integration/health.test.ts
import request from 'supertest';

describe('Health Check', () => {
  test('GET /health returns 200', async () => {
    const response = await request('http://localhost:3001')
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBeDefined();
  });
});
```

### **Test 2: MCP Tool Validation**

```typescript
// tests/integration/validate-booking.test.ts
import request from 'supertest';

describe('Validate Booking Date', () => {
  test('validates correct date', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/v1/tools/validate_booking_date')
      .send({
        date: '2025-10-21',
        expectedDayName: 'tirsdag',
        customerId: 'test'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

---

## 🎯 SUCCESS METRICS

### **Testing Coverage**

- ✅ Target: 80% code coverage
- ✅ All API endpoints tested
- ✅ All React components tested
- ✅ E2E flows tested

### **AI Quality**

- ✅ Response time < 2s
- ✅ Intent recognition > 90%
- ✅ Context awareness
- ✅ Natural language understanding

---

**Status**: 🎯 **READY TO IMPLEMENT**  
**Next Action**: Install Supertest og skriv første tests  
**ETA**: 1-2 timer for basic setup  

---

_Generated by AI Assistant_  
_Date: 21. Oktober 2025, 21:35 CET_


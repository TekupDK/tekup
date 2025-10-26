# Ollama Setup - Open Source LLMs til RenOS\n\n\n\n## 🎯 Hvad er Ollama?\n\n\n\nOllama er en open source platform til at køre **lokale AI modeller** på din egen server. Fordele:\n\n\n\n- ✅ **Gratis** - Ingen API costs som OpenAI/Gemini\n\n- ✅ **Privacy** - Data forbliver på din server\n\n- ✅ **Hurtig** - Ingen netværk latency til eksterne APIs\n\n- ✅ **Dansk support** - Modeller som Llama 3.1 og Qwen 2.5 taler godt dansk\n\n- ✅ **Tilpasselig** - Kan fine-tune på Rendetalje-specific data\n\n
---
\n\n## 🚀 Hurtig Installation\n\n\n\n### 1. Installer Ollama\n\n\n\n**Windows/Mac/Linux:**
\n\n```bash\n\n# Download fra https://ollama.com/download\n\n# Eller via curl (Mac/Linux):\n\ncurl -fsSL https://ollama.com/install.sh | sh\n\n```\n\n\n\n### 2. Download en Model\n\n\n\nStart med **Llama 3.1 8B** (anbefalet til RenOS):\n\n\n\n```bash\n\n# Download Llama 3.1 8B (~4.7 GB)\n\nollama pull llama3.1:8b\n\n\n\n# Eller Mistral 7B (hurtigere, mindre)\n\nollama pull mistral:7b\n\n\n\n# Eller Qwen 2.5 7B (bedst til dansk)\n\nollama pull qwen2.5:7b\n\n```\n\n\n\n### 3. Start Ollama Service\n\n\n\n```bash\n\n# Start Ollama (kører på http://localhost:11434)\n\nollama serve\n\n```\n\n\n\n### 4. Test at det Virker\n\n\n\n```bash\n\n# Test chat i terminal\n\nollama run llama3.1:8b\n\n>>> Hej! Hvad kan du hjælpe med?
\n\n# Exit med /bye\n\n```\n\n
---
\n\n## 🔧 Integration med RenOS\n\n\n\n### Opdater `.env` fil\n\n\n\n```ini\n\n# Vælg LLM provider (openai, gemini, ollama)\n\nLLM_PROVIDER=ollama\n\n\n\n# Ollama settings (kun hvis du bruger ollama)\n\nOLLAMA_BASE_URL=http://localhost:11434\n\nOLLAMA_MODEL=llama3.1:8b\n\n```
\n\n### Brug i Friday AI\n\n\n\nKoden er allerede klar! `OllamaProvider` implementerer `LLMProvider` interface:
\n\n```typescript
// src/controllers/chatController.ts (AUTO-DETECTED)
import { OllamaProvider } from "../llm/ollamaProvider";
import { appConfig } from "../config";

// Friday AI initialiseres med Ollama hvis LLM_PROVIDER=ollama
const fridayAI = (() => {
    const provider = appConfig.llm.LLM_PROVIDER;
    
    if (provider === "ollama") {
        const ollamaProvider = new OllamaProvider(
            appConfig.llm.OLLAMA_BASE_URL ?? "http://localhost:11434"
        );
        return new FridayAI(ollamaProvider);
    }
    
    if (provider === "openai" && appConfig.llm.OPENAI_API_KEY) {
        const openaiProvider = new OpenAiProvider(appConfig.llm.OPENAI_API_KEY);
        return new FridayAI(openaiProvider);
    }
    
    // Fallback til heuristic mode
    return new FridayAI();
})();\n\n```

---
\n\n## 📊 Model Sammenligning\n\n\n\n| Model | Størrelse | RAM Krav | Dansk Support | Hastighed | Kvalitet |
|-------|-----------|----------|---------------|-----------|----------|
| **llama3.1:8b** | 4.7 GB | 8 GB | ⭐⭐⭐⭐ | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |\n\n| **mistral:7b** | 4.1 GB | 8 GB | ⭐⭐⭐ | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ |\n\n| **qwen2.5:7b** | 4.4 GB | 8 GB | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | ⭐⭐⭐⭐ |\n\n| **phi3:3.8b** | 2.2 GB | 4 GB | ⭐⭐ | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ |\n\n| **gemma2:9b** | 5.4 GB | 16 GB | ⭐⭐⭐⭐ | ⚡⚡ | ⭐⭐⭐⭐⭐ |\n\n| **llama3.1:70b** | 40 GB | 64 GB | ⭐⭐⭐⭐⭐ | ⚡ | ⭐⭐⭐⭐⭐ |\n\n
**Anbefaling til RenOS:** Start med `llama3.1:8b` - bedste balance af kvalitet, hastighed og ressourceforbrug.\n\n
---
\n\n## 💰 Cost Sammenligning\n\n\n\n### OpenAI GPT-4o-mini\n\n\n\n- **Input:** $0.150 / 1M tokens\n\n- **Output:** $0.600 / 1M tokens\n\n- **Estimeret måned (1000 chats):** ~$15-30 USD\n\n\n\n### Ollama (Local)\n\n\n\n- **Installation:** Gratis\n\n- **API costs:** $0 (kører lokalt)\n\n- **Server costs:** El + hardware afskrivning\n\n- **Estimeret måned:** ~$5-10 USD (kun el)\n\n\n\n**Besparelse:** 66-83% lavere costs! 💰\n\n
---
\n\n## 🔧 CLI Tools\n\n\n\n### Test Ollama Connection\n\n\n\n```bash\n\nnpm run ollama:test\n\n```
\n\n```typescript
// src/tools/ollamaTest.ts
import { OllamaProvider } from "../llm/ollamaProvider";

async function main() {
    const ollama = new OllamaProvider();
    
    // Test connection
    const isOnline = await ollama.testConnection();
    console.log("Ollama online:", isOnline);
    
    // List available models
    const models = await ollama.listModels();
    console.log("Available models:", models);
    
    // Test chat
    const response = await ollama.completeChat([
        { role: "system", content: "Du er Friday, en dansk AI assistent." },
        { role: "user", content: "Hvad kan du hjælpe med?" }
    ]);
    console.log("Response:", response);
}

main().catch(console.error);\n\n```
\n\n### Download Models Script\n\n\n\n```bash\n\nnpm run ollama:setup\n\n```
\n\n```typescript
// src/tools/ollamaSetup.ts
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
    console.log("📦 Downloading recommended models for RenOS...\n");
    
    const models = [
        "llama3.1:8b",    // Primary
        "mistral:7b",     // Fallback
    ];
    
    for (const model of models) {
        console.log(`⬇️  Pulling ${model}...`);
        await execAsync(`ollama pull ${model}`);
        console.log(`✅ ${model} downloaded\n`);
    }
    
    console.log("🎉 Setup complete!");
}

main().catch(console.error);\n\n```

---
\n\n## 🐳 Docker Deployment\n\n\n\n### Render.com med Ollama\n\n\n\n```yaml\n\n# render.yaml\n\nservices:\n\n  - type: web\n\n    name: tekup-renos-backend
    runtime: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: LLM_PROVIDER\n\n        value: ollama
      - key: OLLAMA_BASE_URL\n\n        value: http://ollama-service:11434
  
  - type: pserv # Private service\n\n    name: ollama-service\n\n    runtime: docker\n\n    dockerCommand: ollama serve
    dockerContext: .
    dockerfilePath: ./Dockerfile.ollama
    plan: standard # Needs 8GB RAM minimum\n\n```\n\n\n\n### Dockerfile.ollama\n\n\n\n```dockerfile\n\nFROM ollama/ollama:latest
\n\n# Pre-download models during build\n\nRUN ollama serve & \\n\n    sleep 5 && \
    ollama pull llama3.1:8b && \
    ollama pull mistral:7b

EXPOSE 11434

CMD ["ollama", "serve"]\n\n```

**Note:** Ollama kræver minimum **8 GB RAM** for `llama3.1:8b`. Render's Standard plan ($25/måned) understøtter dette.\n\n
---
\n\n## 🧪 Testing\n\n\n\n### Test Suite\n\n\n\n```typescript\n\n// tests/llm/ollamaProvider.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { OllamaProvider } from "../../src/llm/ollamaProvider";

describe("OllamaProvider", () => {
    let provider: OllamaProvider;
    
    beforeAll(async () => {
        provider = new OllamaProvider();
        
        // Skip tests hvis Ollama ikke kører
        const isOnline = await provider.testConnection();
        if (!isOnline) {
            console.warn("⚠️  Ollama not running, skipping tests");
            return;
        }
    });
    
    it("should list available models", async () => {
        const models = await provider.listModels();
        expect(models).toBeInstanceOf(Array);
    });
    
    it("should generate chat completion", async () => {
        const response = await provider.completeChat([
            { role: "system", content: "Du er Friday." },
            { role: "user", content: "Sig hej!" }
        ]);
        
        expect(response).toBeTruthy();
        expect(typeof response).toBe("string");
    });
    
    it("should handle temperature parameter", async () => {
        const response = await provider.completeChat(
            [{ role: "user", content: "Hvad er 2+2?" }],
            { temperature: 0.1 }
        );
        
        expect(response).toContain("4");
    });
});\n\n```

---
\n\n## 🚨 Troubleshooting\n\n\n\n### Problem: "Kunne ikke forbinde til Ollama"\n\n\n\n**Løsning:**
\n\n```bash\n\n# Start Ollama service\n\nollama serve\n\n\n\n# Check hvis det kører\n\ncurl http://localhost:11434/api/tags\n\n```\n\n\n\n### Problem: "Model not found"\n\n\n\n**Løsning:**
\n\n```bash\n\n# Download modellen først\n\nollama pull llama3.1:8b\n\n\n\n# List installerede modeller\n\nollama list\n\n```\n\n\n\n### Problem: "Out of memory"\n\n\n\n**Løsning:**
\n\n```bash\n\n# Brug en mindre model\n\nollama pull phi3:3.8b\n\n\n\n# Eller upgrade server RAM til 8GB+\n\n```\n\n\n\n### Problem: Langsom response\n\n\n\n**Løsning:**
\n\n1. Brug mindre model (phi3:3.8b i stedet for llama3.1:8b)\n\n2. Reducer `maxTokens` i options\n\n3. Upgrade til GPU-enabled server

---
\n\n## 📚 Yderligere Ressourcer\n\n\n\n- **Ollama Docs:** <https://github.com/ollama/ollama>\n\n- **Model Library:** <https://ollama.com/library>\n\n- **Llama 3.1 Paper:** <https://ai.meta.com/llama/>\n\n- **Mistral Docs:** <https://docs.mistral.ai/>\n\n
---
\n\n## 🎯 Next Steps\n\n\n\n1. **Test lokalt** - Installer Ollama og test med `llama3.1:8b`\n\n2. **Sammenlign kvalitet** - Run side-by-side med OpenAI\n\n3. **Measure performance** - Track response time og kvalitet\n\n4. **Deploy til staging** - Test på Render med Docker\n\n5. **Production rollout** - Switch til Ollama hvis tests succeeds\n\n
**Forventet ROI:** 70% cost reduction på LLM expenses 💰

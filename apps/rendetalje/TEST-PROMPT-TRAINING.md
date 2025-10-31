# 🧪 Test Prompt Training

## ✅ **IMPLEMENTERET**

### **1. Prompt Training System** ✅
- **Fil:** `services/tekup-ai/packages/inbox-orchestrator/src/promptTraining.ts`
- **Indeholder:**
  - SYSTEM_PROMPT med alle 24 memories
  - Training eksempler (3 eksempler)
  - `buildEnhancedPrompt()` funktion
  - Context-aware prompt generation

### **2. Gemini AI Integration** ✅
- **Fil:** `services/tekup-ai/packages/inbox-orchestrator/src/index.ts`
- **Integration:**
  - Gemini client initialization
  - Prompt training i `generateSafeReply()`
  - Fallback til template hvis AI fejler
  - Validation efter AI response

---

## 🧪 **TESTS**

### **Test 1: MEMORY_1 - Time Check**
```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad er dagens dato?"}'
```

**Forventet:**
- ✅ Korrekt dato valideret
- ✅ Time-aware response

---

### **Test 2: MEMORY_7 - Email Search First**
```bash
curl -X POST http://localhost:3011/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"threadId": "xxx", "policy": {"searchBeforeSend": true}}'
```

**Forventet:**
- ✅ Warning hvis tidligere emails fundet
- ✅ "Undgå dobbelt-tilbud!"

---

### **Test 3: MEMORY_11 + Prompt Training**
```bash
curl -X POST http://localhost:3011/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"threadId": "lead-thread-id", "policy": {"searchBeforeSend": true}}'
```

**Forventet:**
- ✅ AI genererer tilbud med prompt training
- ✅ Validation checker alle felter
- ✅ Memory rules enforced

---

## 📊 **PROMPT TRAINING FEATURES**

### **System Prompt:**
- Alle 24 memories dokumenteret
- Eksempler og best practices
- Output format guidelines
- Vigtige regler højdepunkt

### **Training Examples:**
1. Lead Response eksempel
2. Quote Generation eksempel
3. Booking Request eksempel

### **Context-Aware:**
- Relevant eksempler baseret på input
- Lead data i context
- Memories der gælder

---

## 🔧 **KONFIGURATION**

**Environment Variable:**
```bash
GEMINI_API_KEY=your-api-key
```

**Fallback:**
- Hvis Gemini ikke er tilgængelig → bruger template
- Hvis AI response ikke validerer → bruger template
- Memory rules enforced uanset AI eller template

---

**Status:** ✅ **READY FOR TESTING**

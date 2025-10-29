# 🚀 Tekup Chat Prototype - Start Guide

**Status:** ✅ Prototype Ready!  
**Oprettet:** 19. Oktober 2025  
**Tid til køreklar:** 5 minutter

---

## 📋 Hvad Er Bygget

### ✅ Frontend (app/page.tsx)

- ChatGPT-lignende interface
- Real-time message streaming UI
- Markdown rendering med code highlighting
- Auto-scroll til nye beskeder
- Loading states med animations
- Responsive design

### ✅ Backend API (app/api/chat/route.ts)

- OpenAI GPT-4o integration
- TekupVault RAG knowledge search
- Automatic source citations
- Conversation history context
- Error handling

### ✅ Features

- 💬 Clean chat interface
- 🤖 AI responses med TekupVault context
- 📚 Automatic dokumentation citations
- 🔄 Multi-turn conversations
- ⚡ Fast response times

---

## 🏃 Kom I Gang NU

### Step 1: Check Environment Variables

```bash
cd c:\Users\empir\tekup-chat
```

Åbn `.env.local` og tilføj dine API keys:

```env
# OpenAI (Required)
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
OPENAI_MODEL=gpt-4o

# TekupVault (Optional men anbefalet)
TEKUPVAULT_API_URL=https://tekupvault.onrender.com/api
TEKUPVAULT_API_KEY=your-tekupvault-key-here
```

**Hvor finder du keys:**

- **OpenAI**: <https://platform.openai.com/api-keys>
- **TekupVault**: Tjek din TekupVault deployment på Render.com

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Open Browser

```
http://localhost:3000
```

**DET ER DET! 🎉**

---

## 🧪 Test Queries

Prøv disse spørgsmål for at teste funktionalitet:

### 1. Knowledge Retrieval

```
Hvordan laver jeg en faktura i Billy.dk?
```
**Forventet:** Code example + citation fra Tekup-Billy docs

### 2. Strategic Decision

```
Skal jeg slette Tekup-org for at spare plads?
```
**Forventet:** WARNING om €360K værdi + extraction plan

### 3. Code Help

```
Vis mig hvordan jeg tilføjer en ny MCP tool
```
**Forventet:** TypeScript code + best practices

### 4. Multi-Turn Conversation

```
User: Hjælp mig med at deploye TekupVault
AI: [responds]
User: Hvordan sætter jeg environment variables op?
```
**Forventet:** Context maintained across turns

---

## 📊 Hvad Virker

✅ **Chat Interface**

- Clean UI similar til ChatGPT
- Message bubbles (user=blue, AI=white)
- Auto-scroll til nye beskeder
- Loading spinner under AI thinking

✅ **AI Integration**

- OpenAI GPT-4o streaming
- TekupVault knowledge search
- Conversation history (last 10 messages)
- Source citations automatically added

✅ **Error Handling**

- API errors shown in chat
- Graceful fallbacks
- Console logging for debugging

---

## 🔧 Hvad Mangler (Next Steps)

### Phase 2 Features (3-4 timer)

- [ ] Voice input (microphone button)
- [ ] File upload (attach documents)
- [ ] Export conversations
- [ ] Code block copy buttons

### Phase 3 Features (2-3 timer)

- [ ] Sidebar med conversation history
- [ ] Search in messages
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts

### Phase 4 (Production Ready)

- [ ] Supabase database persistence
- [ ] User authentication
- [ ] Rate limiting
- [ ] Deploy til Vercel/Render

---

## 🐛 Troubleshooting

### Issue: "OpenAI API key invalid"

```bash
# Check .env.local file
cat .env.local | grep OPENAI_API_KEY

# Verify key på OpenAI dashboard
# https://platform.openai.com/api-keys
```

### Issue: "TekupVault search failed"

```bash
# Test TekupVault directly
curl https://tekupvault.onrender.com/api/health

# Check if API key is set
cat .env.local | grep TEKUPVAULT_API_KEY
```

### Issue: Page won't load

```bash
# Check port 3000 is free
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F

# Restart dev server
npm run dev
```

### Issue: Markdown not rendering

```bash
# Verify dependencies installed
npm list react-markdown
npm list remark-gfm

# Reinstall if needed
npm install react-markdown remark-gfm
```

---

## 📁 File Structure

```
tekup-chat/
├── app/
│   ├── page.tsx              # ✅ Chat UI (DONE)
│   ├── layout.tsx            # ✅ Root layout
│   ├── globals.css           # ✅ Tailwind styles
│   └── api/
│       └── chat/
│           └── route.ts      # ✅ API endpoint (DONE)
├── .env.local                # ⚙️ Your API keys
├── package.json              # ✅ Dependencies
└── README.md                 # 📚 Main docs
```

---

## 🎯 Success Metrics

**Prototype is successful if:**

- ✅ Chat interface loads uden errors
- ✅ Messages send and receive
- ✅ AI responses appear within 3-5 seconds
- ✅ TekupVault citations shown når relevant
- ✅ Conversation context maintained

**Test it:**

1. Send 3-5 messages
2. Verify responses make sense
3. Check if sources are cited
4. Confirm conversation flow feels natural

---

## 💡 Tips & Tricks

### Hurtigere Development

```bash
# Auto-reload ved file changes (already enabled)
npm run dev

# Type checking i baggrunden
npm run type-check -- --watch
```

### Better Debugging

```javascript
// I app/api/chat/route.ts - se hvad der sendes til OpenAI
console.log('Messages sent to OpenAI:', conversationMessages);

// I app/page.tsx - debug state
console.log('Current messages:', messages);
```

### Performance Optimization

```typescript
// Limit conversation history (already done)
const recentMessages = messages.slice(-10);

// Reduce max_tokens hvis for langsomt
max_tokens: 500  // Faster, mindre detaljeret
```

---

## 🚀 Next Steps After Testing

1. **Test grundigt** (15-20 minutter)
   - Prøv forskellige query types
   - Check TekupVault integration
   - Verificer error handling

2. **Hvis det virker godt:**
   - Add voice input (2 timer)
   - Add conversation sidebar (2 timer)
   - Add file upload (3 timer)

3. **Hvis der er issues:**
   - Check console errors
   - Verify .env.local keys
   - Test TekupVault separately

---

## 📞 Need Help?

**Common Issues:**

- API key errors → Check .env.local
- No responses → Check OpenAI billing/quota
- No sources → TekupVault might be down/slow

**Debug Steps:**

1. Check browser console (F12)
2. Check terminal running `npm run dev`
3. Test API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","messages":[]}'
```

---

**Status:** ✅ PROTOTYPE READY  
**Test It:** `npm run dev` → <http://localhost:3000>  
**Duration:** 5 min setup, works immediately!

🚀 **LET'S GO!**

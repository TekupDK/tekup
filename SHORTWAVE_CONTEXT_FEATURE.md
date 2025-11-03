# 🎯 Shortwave-Style Context Tracking - IMPLEMENTERET ✅

**Dato:** 3. november 2025
**Status:** ✅ Komplet implementeret

---

## 📋 Hvad Er Dette?

Shortwave-style context tracking gør at AI'en ved hvad brugeren kigger på og har valgt i EmailTab, så når brugeren siger "slet dem her" eller "hvad synes du om denne email", så ved AI'en præcist hvad der menes.

---

## ✅ Implementation

### 1. EmailContext Provider (`EmailContext.tsx`)
- ✅ Tracks: selected threads, open thread, folder, view mode, labels, search, drafts
- ✅ `getContextForAI()` genererer formateret context string
- ✅ Automatisk syncing fra EmailTab state

### 2. Backend Context Support
- ✅ `routers.ts` - `sendMessage` accepterer `context` parameter
- ✅ `ai-router.ts` - Modtager context og tilføjer til system prompt
- ✅ Context formateret som `<system-reminder>` tag

### 3. Frontend Integration
- ✅ `App.tsx` - Wrapped med `EmailContextProvider`
- ✅ `EmailTab.tsx` - Syncer state til EmailContext automatisk
- ✅ `ChatPanel.tsx` - Henter context og sender med hver AI besked

---

## 🔄 How It Works

```
1. User interagerer med EmailTab:
   - Vælger 50 emails
   - Åbner thread "Mathias Skovsbøl..."
   - Søger efter "rengøring"

2. EmailTab opdaterer EmailContext:
   selectedThreads: [50 thread IDs]
   openThreadId: "19a469eaff6e9693"
   searchQuery: "rengøring"

3. User chattter med AI:
   "hvad synes du om dem her?"

4. ChatPanel sender context med:
   {
     content: "hvad synes du om dem her?",
     context: {
       selectedThreads: [50 IDs],
       openThreadId: "...",
       searchQuery: "rengøring"
     }
   }

5. Backend tilføjer context til system prompt:
   <system-reminder>
   User has 50 email thread(s) selected
   Selected thread IDs: 19a469eaff6e9693, ...
   User is viewing thread: 19a469eaff6e9693
   Search query: "rengøring"
   </system-reminder>

6. AI forstår "dem her" = de 50 valgte threads ✅
```

---

## 📊 Context Data Tracked

| Data Point | Description | Example |
|------------|-------------|----------|
| `selectedThreads` | Array of thread IDs user has selected | `["19a469...", "19a45a..."]` |
| `openThreadId` | Currently viewing thread | `"19a469eaff6e9693"` |
| `folder` | Current folder (inbox/sent/archive/starred) | `"inbox"` |
| `viewMode` | View mode (list/pipeline/dashboard) | `"pipeline"` |
| `selectedLabels` | Filter labels | `["Leads", "Needs Action"]` |
| `searchQuery` | Current search query | `"rengøring"` |
| `openDrafts` | Number of open drafts | `1` |
| `previewThreadId` | Thread in preview modal | `"19a469eaff6e9693"` |

---

## 🎯 Example Use Cases

### Use Case 1: "Slet dem her"
```
Context: User has 50 threads selected
User: "slet dem her"
AI: Forstår "dem her" = de 50 valgte threads
AI: "Skal jeg slette alle 50 valgte emails?"
```

### Use Case 2: "Hvad synes du om denne email?"
```
Context: openThreadId = "19a469eaff6e9693"
User: "hvad synes du om denne email?"
AI: Forstår "denne email" = thread 19a469eaff6e9693
AI: Fetcher thread data og analyserer den specifikke email
```

### Use Case 3: "Send tilbud til dem alle"
```
Context: selectedThreads = [5 thread IDs]
User: "send tilbud til dem alle"
AI: Forstår "dem alle" = de 5 valgte threads
AI: Opretter tilbud for hver thread
```

---

## 🔧 Technical Details

### Frontend (`EmailContext.tsx`)
```typescript
const emailContext = useEmailContext();

// Automatisk sync fra EmailTab
useEffect(() => {
  emailContext.updateState({
    selectedThreads: selectedEmails,
    openThreadId: selectedThreadId,
    folder: selectedFolder,
    // ...
  });
}, [selectedEmails, selectedThreadId, ...]);
```

### Backend (`ai-router.ts`)
```typescript
// Context tilføjes til system prompt
const contextString = `
<system-reminder>
User has ${context.selectedThreads.length} email thread(s) selected
User is viewing thread: ${context.openThreadId}
</system-reminder>

When user refers to "det her", "denne email", "dem", etc.,
they are referring to the above context.
`;
```

---

## ✅ Testing Checklist

- [ ] Test: Vælg emails → Chat med AI → AI forstår "dem her"
- [ ] Test: Åbn thread → Chat med AI → AI forstår "denne email"
- [ ] Test: Søg → Chat med AI → Context inkluderer search query
- [ ] Test: Pipeline view → Chat med AI → Context inkluderer viewMode
- [ ] Test: Verificer context sendes i backend logs
- [ ] Test: Verificer AI modtager context i system prompt

---

## 📝 Notes

- Context sendes kun hvis der er data (undefined værdier sendes ikke)
- Context opdateres automatisk når EmailTab state ændres
- Ingen WebSocket nødvendigt - context sendes med hver besked
- Context er optional - systemet virker også uden

---

**Last Updated:** 3. november 2025, 01:30


# RenOS Calendar MCP Chatbot

## 🤖 Chatbot Interface for RenOS Calendar MCP

En moderne chatbot interface der giver dig mulighed for at chatte med RenOS Calendar MCP ligesom Claude, Shortwave.ai og ChatGPT.

## 🚀 Quick Start

### 1. Start MCP Server
```powershell
cd C:\Users\empir\Tekup-Cloud\renos-calendar-mcp
./scripts/start-mcp-server.ps1
```

### 2. Start Chatbot
```powershell
cd C:\Users\empir\Tekup-Cloud\renos-calendar-mcp
./scripts/start-chatbot.ps1
```

### 3. Open Browser
Gå til: http://localhost:3002

## 💬 Chat Commands

### Dato Validering
```
"Valider 2025-10-21 som tirsdag"
"Tjek om 28. oktober er mandag"
```

### Konflikt Check
```
"Tjek konflikt 09:00-12:00"
"Er der dobbeltbooking i morgen?"
```

### Faktura Oprettelse
```
"Opret faktura for booking"
"Lav faktura til kunde"
```

### Overtid Tracking
```
"Tjek overtid risiko"
"Er der overtid i dag?"
```

### Kunde Memory
```
"Hent kunde data"
"Vis kunde intelligence"
```

### Hjælp
```
"hjælp"
"hvad kan du?"
```

## 🎯 Features

### ✅ Real-time Communication
- Live chat interface
- Typing indicators
- Message history
- Connection status

### ✅ MCP Tool Integration
- **validate_booking_date** - Dato/ugedag validering
- **check_booking_conflicts** - Dobbeltbooking detektion
- **auto_create_invoice** - Faktura automation
- **track_overtime_risk** - Overtid overvågning
- **get_customer_memory** - Kunde intelligence

### ✅ Smart Responses
- Context-aware replies
- Error handling
- Status indicators
- Rich formatting

### ✅ Mobile Responsive
- Works on all devices
- Touch-friendly interface
- Optimized for mobile

## 🔧 Technical Details

### Architecture
```
Browser (Port 3002)
    ↓ HTTP Requests
Chatbot Server (Express)
    ↓ API Calls
MCP Server (Port 3001)
    ↓ Tool Execution
RenOS Calendar MCP Tools
```

### Dependencies
- **Express** - Web server
- **Alpine.js** - Frontend framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Environment Variables
```env
PORT=3002
MCP_API_URL=http://localhost:3001
```

## 📱 Usage Examples

### Example 1: Dato Validering
**User**: "Valider 2025-10-21 som tirsdag"
**Assistant**: 
```
✅ Dato validering OK!
Dato: 2025-10-21
Ugedag: tirsdag
Confidence: 100%
Booking ser god ud!
```

### Example 2: Konflikt Check
**User**: "Tjek konflikt 09:00-12:00"
**Assistant**:
```
✅ Ingen konflikter fundet!
Tid: 09:00 - 12:00
Confidence: 85%
Tidsrum er ledigt!
```

### Example 3: Faktura Oprettelse
**User**: "Opret faktura for booking"
**Assistant**:
```
✅ Faktura oprettet!
Booking ID: chatbot-booking-1234567890
Status: pending
Faktura er klar til afsendelse!
```

## 🚨 Troubleshooting

### Problem: "MCP server not connected"
**Solution**: 
1. Start MCP server: `./scripts/start-mcp-server.ps1`
2. Wait for server to start
3. Refresh chatbot page

### Problem: "Tools not responding"
**Solution**:
1. Check MCP server health: http://localhost:3001/health
2. Verify environment variables
3. Check server logs

### Problem: "Build errors"
**Solution**:
```powershell
cd renos-calendar-mcp
npm run build
npm run dev:http
```

## 🎉 Ready to Chat!

Din RenOS Calendar MCP chatbot er klar til brug! 

**Start chatting nu**: http://localhost:3002

---

*Chatbot Interface v1.0.0*  
*RenOS Calendar MCP Integration*


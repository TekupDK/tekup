# 🚀 TekUp AI Assistant

**Local AI-powered assistant for automating daily business tasks**

> Build your own intelligent assistant that integrates with your existing systems - no cloud APIs, no data leaving your laptop.

---

## ⚡ Quick Facts

- **Local-First:** All AI runs on your machine (RTX 5070 + Ollama)
- **Privacy:** Zero data sent to cloud services
- **Smart:** Uses Qwen2.5-Coder 14B, Llama 3.3 8B, and Mistral 7B
- **Integrated:** Works with Billy.dk, RenOS, Google Workspace
- **Business Value:** ~25,000 DKK/month in time savings

---

## 🎯 What Can It Do?

```
You: "Opret faktura til Michael Roach for 4 timer moving clean"
AI: ✅ Done in 15 seconds (vs 6-8 minutes manually)

You: "Hvad har jeg i dag?"
AI: 📅 Shows your schedule, access codes, notes - in 5 seconds

You: "Opret fakturaer for alle jobs fra sidste uge"
AI: ✅ 12 invoices created - 1 minute total
```

**ROI: 115 minutes/day = 25,200 DKK/month saved**

---

## 📋 Getting Started

### 1. **Install & Setup** (30 minutes)
Follow the [Installation Guide](SETUP.md) to set up:
- Ollama server with 3 AI models
- Jan AI or Open WebUI interface
- MCP integrations

### 2. **Learn the Architecture** (10 minutes)
Understand how everything works in the [Architecture Overview](ARCHITECTURE.md)

### 3. **Use Daily Workflows** (5 minutes)
See practical examples in [Workflows Guide](WORKFLOWS.md)

---

## 🏗️ System Components

```
┌─ AI Models (Local) ──────────┐
│  • Qwen 14B (Coding)         │
│  • Llama 8B (General)        │
│  • Mistral 7B (Fast)         │
└──────────────────────────────┘
           ↓ (Ollama)
┌─ Chat Interface ─────────────┐
│  • Jan AI (Official)         │
│  • Open WebUI (Recommended)  │
│  • Ollama GUI                │
└──────────────────────────────┘
           ↓ (MCP Protocol)
┌─ Business Systems ───────────┐
│  • Billy.dk (Invoicing)      │
│  • RenOS (Bookings)          │
│  • Google Workspace (Mail)   │
│  • Windows (System Tasks)    │
└──────────────────────────────┘
```

---

## 📚 Documentation Index

### Core Documentation
- **[SETUP.md](SETUP.md)** - Complete installation guide (Phase 1-4)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and data flow
- **[WORKFLOWS.md](WORKFLOWS.md)** - Daily use cases and examples
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues & fixes

### API & Integration
- **[Billy.dk API](api/tekup-billy-api.md)** - Invoicing integration
- **[Daily Workflow Guide](guides/daily-workflow.md)** - Step-by-step workflows

### Examples
- **[Invoice Creation Example](examples/create-invoice.md)** - Complete walkthrough

---

## 🔄 Project Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Foundation & Documentation |
| **Phase 2** | 🔄 In Progress | Ollama + Jan AI Setup |
| **Phase 3** | ⏳ Pending | Billy.dk & RenOS Integration |
| **Phase 4** | ⏳ Pending | Advanced Features |

---

## 💡 Key Features

### ✅ Already Implemented
- Local AI inference (no cloud APIs)
- Multiple model support
- MCP web scraper for data fetching
- Comprehensive documentation
- Architecture planning

### 🔄 In Development
- Jan AI / Open WebUI setup
- Billy.dk invoice creation
- Calendar integration

### ⏳ Planned
- RenOS booking management
- System monitoring
- Chat history archival (TekupVault)

---

## 🚀 Next Steps

1. **[Start Setup Guide](SETUP.md)** - Install Ollama & Jan AI
2. **Review [Architecture](ARCHITECTURE.md)** - Understand the system
3. **Check [Workflows](WORKFLOWS.md)** - See what's possible
4. **Troubleshoot** - Use [Troubleshooting Guide](TROUBLESHOOTING.md) if needed

---

## 📊 Performance Metrics

Your Hardware:
- **CPU:** Intel Core Ultra 9 285H (16 cores) ✅
- **RAM:** 64GB ✅
- **GPU:** NVIDIA RTX 5070 (8GB VRAM) ✅
- **Storage:** 127GB free ✅

Expected Performance:
- **Qwen 14B:** 3-5 sec response time
- **Llama 8B:** 2-3 sec response time
- **Mistral 7B:** 1-2 sec response time

---

## 📝 License

This project is part of the TekUp ecosystem. All components are designed to work locally on your machine with maximum privacy and minimum cloud dependency.

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0  
**Repository:** [GitHub](https://github.com/JonasAbde/tekup-ai-assistant)

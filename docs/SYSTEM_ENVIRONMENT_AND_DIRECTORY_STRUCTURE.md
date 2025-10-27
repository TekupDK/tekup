# System Environment and Directory Structure

**Document Type:** Knowledge Base / System Documentation  
**Created:** 2025-10-27  
**Purpose:** Provide AI assistants and developers with comprehensive understanding of the development environment and directory structure  
**Location:** Tekup Knowledge Base

---

## 📋 Executive Summary

This document describes the complete Windows development environment at `C:/Users/empir`, including why there are many configuration folders (dot folders), what they're for, and how the Tekup project fits into the broader system structure.

---

## 🖥️ System Overview

### Environment Details
- **Operating System:** Windows 11
- **User Account:** empir
- **Home Directory:** `C:/Users/empir`
- **Primary Project:** Tekup (Organization: tekupdk)
- **Workspace:** `C:/Users/empir` is the default VS Code workspace

### Key Context for AI Assistants
- This is a **professional development environment** with 30+ tools installed
- The presence of many `.xxx` folders is **normal and expected**
- **Tekup** is the primary active project - RendetaljeMonorepo is legacy/archived
- Development uses modern AI-assisted workflows

---

## 📁 Understanding Dot Folders (`.xxx`)

### What Are Dot Folders?
Folders starting with `.` (period/dot) are **hidden configuration folders**. This is a Unix/Linux convention now supported by Windows. They store:
- Application settings and preferences
- Cache and temporary data
- User-specific configurations
- Tool state and history

### Why So Many?
The environment has **10+ AI coding assistants** and **20+ development tools**, and **each tool creates its own configuration folder**. This is:
- ✅ **Normal** - Standard behavior for development tools
- ✅ **Necessary** - Tools need isolated storage for settings
- ✅ **Expected** - Professional dev environments typically have 30-50 folders
- ✅ **Correct** - Not a sign of problems or clutter

### Common Dot Folders

#### AI Development Tools
| Folder | Tool | Purpose |
|--------|------|---------|
| `.kilocode/` | Kilo Code | AI coding assistant configuration, CLI tools, MCP server config |
| `.claude/` | Claude AI | Anthropic's Claude assistant settings |
| `.cursor/` | Cursor IDE | AI-powered code editor configuration |
| `.windsurf/` | Windsurf IDE | AI coding environment settings |
| `.qoder/` | Qoder | AI coding assistant data |
| `.trae/` | Trae | AI coding tool configuration |
| `.kiro/` | Kiro | AI development assistant settings |
| `.codeium/` | Codeium | AI code completion and chat |
| `.ollama/` | Ollama | Local LLM runtime for running models locally |

#### Development Infrastructure
| Folder | Tool | Purpose |
|--------|------|---------|
| `.vscode/` | VS Code | Editor extensions and settings |
| `.docker/` | Docker | Container runtime configuration |
| `.android/` | Android SDK | Android development tools and AVD |
| `.expo/` | Expo | React Native/Expo CLI configuration |
| `.maestro/` | Maestro | Mobile UI testing framework |
| `.aws/` | AWS | Cloud credentials and config |
| `.gnupg/` | GPG | Encryption keys |

#### Configuration & Security
| Folder | Purpose |
|--------|---------|
| `.scripts/` | PowerShell automation scripts (mcp-sync, cleanup, security-audit) |
| `.secrets/` | Sensitive data, API keys, credentials |
| `.mcp-shared/` | Shared MCP server configurations |

---

## 🏗️ Project Structure

### Active Projects

#### Tekup (Primary Active Project)
- **Location:** `C:/Users/empir/Tekup/`
- **Type:** Monorepo
- **Organization:** tekupdk
- **Status:** 🟢 **ACTIVE** - Primary development focus
- **Structure:**
  - `apps/` - Applications (web, mobile)
  - `packages/` - Shared packages
  - `services/` - Microservices
  - `docs/` - Comprehensive documentation (50+ MD files)
  - `rendetalje-database/` - Database
  - `tekup-mcp-servers/` - MCP servers

#### Supporting Projects
- **Tekup-Cloud** - Cloud infrastructure and services
- **tekup-database** - Database files
- **tekup-mcp-servers** - Model Context Protocol servers

### Legacy/Archived Projects
- **RendetaljeMonorepo** - ⚠️ **LEGACY/ARCHIVED** - No longer actively developed, kept for reference only

---

## 📊 Directory Categories

### By Purpose

```
C:/Users/empir/
├── 🏗️ Active Projects (Tekup ecosystem)
├── 🤖 AI Tools (10+ assistants)
├── 💻 Development Tools (Docker, VS Code, etc.)
├── 🪟 Standard Windows Folders (Desktop, Documents, etc.)
├── ⚙️ Configuration & Scripts
└── 💾 System & Cache
```

### Storage Distribution
- **Active Projects:** ~40% (Tekup and related)
- **AI Tools Config:** ~15%
- **Development Tools:** ~15%
- **System & Cache:** ~10%
- **User Data:** ~10%
- **Configuration:** ~10%

---

## 🔍 For AI Assistants: Key Insights

### Development Workflow
1. **Heavy AI Tool Usage** - Multiple AI assistants (Kilo Code, Claude, Cursor, etc.)
2. **Modern Tech Stack** - TypeScript, React Native, Docker, pnpm, Turborepo
3. **Monorepo Architecture** - Tekup uses modern monorepo patterns
4. **Container-Based** - Docker for development and deployment
5. **Automated Maintenance** - PowerShell scripts in `.scripts/`

### When Working on This System
- **Primary Focus:** All active work is in `Tekup/` directory
- **Documentation Location:** `Tekup/docs/` contains 50+ knowledge base files
- **Legacy Code:** RendetaljeMonorepo is archived - don't suggest modifications there
- **Security:** `.secrets/`, `.aws/`, `.gnupg/` contain sensitive data - never expose
- **MCP Servers:** Running knowledge-mcp, code-intelligence-mcp, database-mcp

### Common Questions Answered

**Q: Why are there so many folders in the user directory?**  
A: Each development tool creates its own configuration folder. 30-50 folders is normal for a professional development environment.

**Q: Can we delete dot folders to clean up?**  
A: No - each is actively used by installed tools. Deleting would break tool configurations.

**Q: Which project should I work on?**  
A: **Tekup** is the primary active project. RendetaljeMonorepo is legacy/archived.

**Q: Where is the Tekup knowledge base?**  
A: `Tekup/docs/` contains comprehensive project documentation and knowledge base.

---

## 📚 Related Documentation

### Complete Directory Documentation
For detailed analysis of the entire directory structure, see:
- **Main Entry:** `C:/Users/empir/README_DIRECTORY_DOCUMENTATION.md`
- **Detailed Map:** `C:/Users/empir/WINDOWS_USER_DIRECTORY_MAP.md`
- **Visual Diagrams:** `C:/Users/empir/WINDOWS_USER_DIRECTORY_VISUAL_MAP.md`

### Tekup-Specific Documentation
- [`CLAUDE_CODE_BRIEFING.md`](../CLAUDE_CODE_BRIEFING.md) - Project briefing for AI assistants
- [`WORKSPACE_GUIDE.md`](../WORKSPACE_GUIDE.md) - Workspace navigation guide
- [`README.md`](../README.md) - Project overview
- This file: `docs/SYSTEM_ENVIRONMENT_AND_DIRECTORY_STRUCTURE.md`

### MCP and AI Tools
- [`docs/MCP_COMPLETE_AUDIT_2025-10-27.md`](./MCP_COMPLETE_AUDIT_2025-10-27.md) - MCP server audit
- [`docs/MCP_SUBMODULE_INTEGRATION.md`](./MCP_SUBMODULE_INTEGRATION.md) - MCP integration guide
- `.kilocode/mcp.json` - MCP server configuration

---

## 🛠️ Maintenance Guidelines

### Regular Tasks
- **Monthly:** Run `.scripts/monthly-cleanup.ps1` to clear old caches
- **Quarterly:** Run `.scripts/security-audit.ps1` for security check
- **As Needed:** Run `.scripts/mcp-sync-check.ps1` to verify MCP servers

### What NOT to Do
- ❌ Delete dot folders without understanding their purpose
- ❌ Move configuration folders to "clean up"
- ❌ Work on RendetaljeMonorepo (it's archived)
- ❌ Expose contents of `.secrets/`, `.aws/`, `.gnupg/`

### What TO Do
- ✅ Focus all active development in Tekup/
- ✅ Document changes in Tekup/docs/
- ✅ Keep this knowledge base updated
- ✅ Use AI tools to their full potential

---

## 🎯 Quick Reference for AI Assistants

### When Starting a Task
1. **Check Project Status:** Confirm you're working in Tekup/ (active project)
2. **Review Documentation:** Check `Tekup/docs/` for relevant guides
3. **Understand Context:** This is a well-configured professional environment
4. **Respect Structure:** Don't suggest reorganizing dot folders

### When Answering Questions
1. **Directory Structure:** Reference the detailed documentation in user root
2. **Dot Folders:** Explain they're normal and necessary
3. **Project Focus:** Always emphasize Tekup as primary active project
4. **Legacy Code:** Clarify RendetaljeMonorepo is archived

### When Making Changes
1. **Work in Tekup/** - Primary active project location
2. **Update Docs** - Add to `Tekup/docs/` when relevant
3. **Use Tools** - Leverage AI assistants and MCP servers
4. **Follow Patterns** - Maintain existing monorepo structure

---

## 📝 Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-27 | Initial documentation created | Kilo Code (Docs Specialist mode) |
| 2025-10-27 | Added comprehensive environment analysis | Kilo Code (Architect mode) |
| 2025-10-27 | Clarified Tekup as primary active project | Updated per user feedback |

---

## 🔗 External References

- **Organization:** tekupdk (Sentry, GitHub, cloud services)
- **Monitoring:** Sentry.io/organizations/tekupdk/
- **Deployment:** Render.com, AWS

---

*This document is part of the Tekup knowledge base and should be referenced by AI assistants when working on system-level questions or understanding the development environment.*
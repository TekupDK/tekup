# Product Overview

Tekup-Billy is a Model Context Protocol (MCP) server that provides AI agents with access to Billy.dk accounting API. It enables invoice, customer, product, and revenue management through standardized MCP tools.

## Core Purpose

- **Primary Function**: Bridge between AI agents and Billy.dk accounting system
- **Target Users**: AI agents (Claude, ChatGPT), RenOS backend integration
- **Business Domain**: Danish accounting/invoicing via Billy.dk API
- **Deployment**: Cloud-ready HTTP service + local MCP stdio server

## Key Features

- **25 MCP Tools**: Invoice lifecycle, customer management, product catalog, revenue analytics
- **Dual Mode**: HTTP REST API (cloud) + MCP stdio (local)
- **Production Ready**: Redis scaling, caching, audit logging, rate limiting
- **Multi-Platform**: Claude.ai Web, Claude Desktop, ChatGPT, VS Code Copilot

## Architecture

- **Core**: TypeScript MCP server with Billy.dk API client
- **Caching**: Optional Supabase integration with Redis scaling
- **Security**: AES-256-GCM encryption, rate limiting, input validation
- **Monitoring**: Winston logging, audit trails, health checks

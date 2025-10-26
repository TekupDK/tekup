# Changelog - Tekup Chat

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-22

### Added
- **Session Storage**: Automatic chat history persistence using localStorage
  - Chat history automatically saved after each message
  - History restored on page reload/browser restart
  - Zero configuration required - works out of the box
- **Clear History Button**: One-click chat reset with trash icon in header
  - Only visible when chat history exists
  - Smooth visual feedback with hover effects
  - Confirms deletion with immediate UI update
- **Enhanced Loading Indicator**: Improved visual feedback during AI processing
  - Robot avatar displayed during loading
  - Spinning animation for better UX
  - Consistent with message styling

### Changed
- Updated README.md with new features and "Recent Updates" section
- Improved header UI with conditional clear button rendering

### Technical Details
- Implementation: React hooks (useEffect) with localStorage API
- Storage key: `tekup-chat-history`
- Data format: JSON array of Message objects
- Error handling: Try-catch blocks for localStorage operations
- Browser compatibility: All modern browsers with localStorage support

## [1.0.0] - 2025-10-19

### Added
- Initial release with ChatGPT-style interface
- OpenAI GPT-4o integration with streaming responses
- TekupVault RAG knowledge base integration
- Markdown rendering with syntax highlighting
- Real-time message updates
- Responsive design with Tailwind CSS
- Error handling and validation
- Multi-turn conversations with context

### Features
- Clean, modern UI similar to ChatGPT/Claude
- Searches 1,063 documents from 8 repositories
- Context-aware responses with automatic citations
- Danish language support
- Code block highlighting
- Zod schema validation

### Technical Stack
- Next.js 15 with App Router
- React 18 with TypeScript
- Tailwind CSS 4
- OpenAI API
- Supabase PostgreSQL
- Server-Sent Events for streaming

---

## Version History Summary

- **v1.1.0** (Oct 22, 2025): Session storage + UX improvements
- **v1.0.0** (Oct 19, 2025): Initial production release

---

**Maintained by:** TekUp Team  
**License:** MIT  
**Repository:** Private
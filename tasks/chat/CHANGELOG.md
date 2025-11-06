# Chat System — Changelog

All notable changes to this task will be documented here.
Format: YYYY-MM-DD · type(scope): description

## 2025-11-04

- docs: add STATUS.md and CHANGELOG.md for chat task
- docs: update PLAN.md with Phase 2 completion (AI suggestions via Gemini)
- docs: update tasks/README.md to reflect chat task in progress (Phase 3)

## 2025-11 (earlier)

- feat(chat): add icons to suggestion cards with hover states (Phase 3)
- feat(chat): replace static suggestions with AI-powered Gemini analysis
- feat(chat): implement getSuggestions TRPC endpoint
- feat(chat): add audit logging for action lifecycle events
- feat(chat): implement idempotency manager with in-memory store
- feat(chat): implement executeAction with idempotency keys
- feat(chat): implement dryRunAction TRPC endpoint
- feat(chat): finalize ActionCatalog schema and validators
- feat(chat): build and deploy MVP UI (ApprovalModal, SuggestionsBar)
- feat(chat): gate chat features with FRIDAY_ACTION_SUGGESTIONS flag

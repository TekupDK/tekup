# Tekup AI Assistant - Internal Usage Guide

**Version:** 1.0  
**Date:** October 18, 2025  
**Purpose:** Daily usage guide for Tekup team members  
**Audience:** All employees using the AI Assistant

---

## 🎯 What Is This?

The Tekup AI Assistant is an **internal tool** built specifically for our company. Think of it as:

- **Your personal Tekup expert** - Knows all 8 repositories, 1,063 documents
- **Strategic advisor** - Understands our TIER system and priorities
- **Code reference** - Instant access to patterns, examples, decisions
- **Onboarding tool** - Helps new team members learn our codebase

**NOT for customers** - This is an internal productivity tool only.

---

## 👥 Who Should Use This?

### ✅ Everyone on the Tekup Team

**Developers:**

- Finding code examples
- Understanding architecture decisions
- Debugging issues
- Learning new repositories

**Product/Project Managers:**

- Understanding technical context
- Making strategic decisions
- Prioritizing work
- Reviewing feasibility

**New Hires:**

- Onboarding to codebase
- Learning tech stack
- Understanding company conventions
- Finding documentation

**Leadership (Jonas):**

- Strategic planning
- Repository prioritization
- Architecture review
- Resource allocation

---

## 📖 Daily Use Cases

### Use Case 1: Finding Code Examples

**Scenario:** You need to implement a feature but don't know the pattern.

**How to use:**
```
You: "Show me how to validate user input in Tekup-Billy"

AI: Returns:
- Zod schema example
- Source file reference
- Related patterns in other repos
- Best practices
```

**Time saved:** 10-15 minutes of searching

---

### Use Case 2: Understanding Architecture

**Scenario:** You need to understand how a system works.

**How to use:**
```
You: "Explain the TekupVault architecture"

AI: Returns:
- High-level overview
- Key components
- Data flow
- File locations
- Related documentation
```

**Time saved:** 30+ minutes of reading multiple files

---

### Use Case 3: Strategic Decisions

**Scenario:** You're deciding which task to prioritize.

**How to use:**
```
You: "Should I work on feature X in Tekup-org or feature Y in Tekup-Billy?"

AI: Returns:
- TIER system analysis
- Strategic priorities
- Time investment comparison
- Recommendation with reasoning
```

**Value:** Prevents working on wrong priorities

---

### Use Case 4: Code Review

**Scenario:** You want to check if code follows our standards.

**How to use:**
```
You: [Paste code]
"Review this against Tekup standards"

AI: Returns:
- Pattern compliance check
- Type safety review
- Error handling analysis
- Improvement suggestions
- References to better examples
```

**Time saved:** 20+ minutes of manual review

---

### Use Case 5: Debugging Help

**Scenario:** You're stuck on an error.

**How to use:**
```
You: "I'm getting error: [error message]"

AI: Returns:
- Root cause analysis
- Specific fix for our codebase
- Prevention tips
- Related issues in docs
```

**Time saved:** 30+ minutes of debugging

---

### Use Case 6: Learning New Repository

**Scenario:** You need to work in a repo you haven't touched before.

**How to use:**
```
You: "I need to work in RendetaljeOS-Mobile. Where do I start?"

AI: Returns:
- Repository overview
- Key directories explained
- Tech stack specifics
- Common patterns
- First task suggestions
```

**Time saved:** Hours of exploration

---

## 🎨 How to Ask Good Questions

### ✅ Good Questions (Specific)

```
✅ "How do I create an invoice in Billy.dk?"
✅ "Show me the database schema for cleaning bookings"
✅ "What's the difference between Tekup-org and Tekup-Google-AI?"
✅ "Should I extract the design system from Tekup-org?"
✅ "Review this TypeScript code for Tekup standards"
```

### ❌ Bad Questions (Too Vague)

```
❌ "Help me code"
❌ "What should I do?"
❌ "Fix my bug"
❌ "Explain everything"
```

**Tip:** Be specific about:

1. Which repository/file
2. What you're trying to do
3. What you've already tried (if debugging)

---

## 🎯 Features You Should Know

### 1. Code Highlighting + Copy

When AI shows code:

- Hover over code block
- Click **Copy** button
- Paste directly into your editor
- Code is syntax-highlighted for readability

### 2. Source Citations

Every code/doc reference includes:
```
Source: Tekup-Billy/src/tools/invoices.ts (lines 45-67)
```

**Why it matters:** You can verify, learn context, see full implementation

### 3. Voice Input (Danish)

- Click microphone icon
- Speak your question in Danish
- Text appears automatically
- Great for quick questions while coding

**Browser requirement:** Chrome or Edge only

### 4. Multi-Turn Conversations

AI remembers context within a chat session:
```
Turn 1: "How do I create a booking?"
Turn 2: "How do I test it?" (AI remembers "it" = booking)
Turn 3: "What if it fails?" (AI still knows context)
```

**Tip:** Keep related questions in same chat session

### 5. Chat History

- All conversations saved
- Access past answers anytime
- Search through old chats (coming soon)
- Archive when done

---

## ⚠️ What AI Knows vs Doesn't Know

### ✅ AI KNOWS

- **All Tekup repositories** (8 repos, 1,063 docs)
- **Architecture decisions** (from docs like STRATEGIC_ANALYSIS.md)
- **Code patterns** (from actual codebase)
- **Tech stack** (TypeScript, NestJS, Prisma, etc.)
- **TIER system** (repository prioritization)
- **Company conventions** (naming, structure, etc.)
- **Historical context** (why decisions were made)

### ❌ AI DOESN'T KNOW

- **Your local uncommitted changes**
- **Private conversations** (unless documented)
- **Customer-specific data** (not indexed for privacy)
- **Future roadmap** (unless in ROADMAP.md)
- **Your personal preferences** (unless you tell it)
- **Real-time system status** (use monitoring tools)

**Important:** AI knowledge is from **last TekupVault sync**. Recent changes (last few hours) might not be indexed yet.

---

## 🔒 Security & Privacy Guidelines

### ✅ SAFE to Ask

- Code patterns and examples
- Architecture questions
- Technical documentation
- Strategic decisions
- Repository information
- Public API usage

### ⚠️ DON'T Share

- **Customer personal data** (names, emails, etc.)
- **API keys or passwords** (even in example code)
- **Production secrets** (database URLs, tokens)
- **Confidential business data** (revenue, contracts)
- **Private customer info** (unless anonymized)

**Rule of thumb:** If you wouldn't commit it to GitHub, don't put it in the chat.

---

## 📊 Usage Best Practices

### For Maximum Productivity

**1. Start Your Day with AI**
```
"What should I work on today based on Tekup priorities?"
```

**2. Before Starting New Task**
```
"Show me examples of [feature] in our codebase"
```

**3. When Stuck**
```
"I'm getting [error]. Here's my code: [paste]"
```

**4. Before Making Big Decisions**
```
"Should I [action]? What are the implications?"
```

**5. For Code Review**
```
[Paste PR diff] "Review this against Tekup standards"
```

### Time-Saving Habits

- **Create templates** for common questions
- **Use voice input** for quick queries while coding
- **Archive chats** by topic (e.g., "Billy.dk Integration")
- **Share useful answers** with team (screenshot + Slack)

---

## 🎓 Onboarding for New Team Members

### Week 1 Recommended Flow

**Day 1: Getting Oriented**
```
1. "I'm new to Tekup. Give me an overview of our repositories"
2. "What's the TIER system?"
3. "What should I focus on as a new developer?"
```

**Day 2: Tech Stack**
```
1. "Explain our tech stack"
2. "Show me our coding standards"
3. "What testing framework do we use?"
```

**Day 3: Tekup-Billy Deep Dive**
```
1. "Explain Tekup-Billy architecture"
2. "Show me how to create an MCP tool"
3. "Where are the tests?"
```

**Day 4: First PR**
```
1. "Show me recent PRs for reference"
2. "What's a good first contribution?"
3. [After coding] "Review my code for Tekup standards"
```

**Day 5: Strategic Context**
```
1. "Why did we choose NestJS over Express?"
2. "What's the extraction plan for Tekup-org?"
3. "What are our current priorities?"
```

**Goal:** Self-service onboarding, minimal senior developer time needed

---

## 📞 Getting Help

### If AI Gives Wrong Answer

1. **Try rephrasing** your question more specifically
2. **Provide more context** (which repo, what you tried)
3. **Ask for sources** ("Where did you get this from?")
4. **Verify in code** (use file citations to check)
5. **Report to team** if consistently wrong on a topic

### If AI Is Down

- Check #tech-status Slack channel
- Fallback: Use TekupVault direct search
- Escalate: Contact Jonas or DevOps

### Feature Requests

- Post in #ai-assistant Slack channel
- Include: What you want, why it's useful, how often you'd use it
- Team reviews monthly for roadmap

---

## 📈 Measuring Your Productivity Gains

### Track Your Usage (Optional)

**Before AI Assistant:**

- Time spent searching docs: ___ hours/week
- Time asking colleagues: ___ hours/week
- Time context switching: ___ hours/week

**After AI Assistant (Week 4):**

- Same questions answered by AI: ___ hours/week
- Questions to colleagues: ___ hours/week (should be less)
- Context switches: ___ (should be fewer)

**Share your wins** in team meetings!

---

## 🎯 Team Usage Goals

### Month 1

- ✅ 100% of team trained
- ✅ 50+ questions answered per developer
- ✅ 5+ hours saved per person

### Month 3

- ✅ AI first, colleagues second (for tech questions)
- ✅ New hires onboarded in 1 week (vs 4 weeks)
- ✅ Zero strategic mistakes (repo deletions, etc.)

### Month 6

- ✅ Can't imagine working without it
- ✅ Team productivity up 20%
- ✅ Knowledge retention improved

---

## 🔄 Feedback Loop

### We Want to Hear

**What's working:**

- "AI saved me X hours on [task]"
- "Found answer in 2 seconds vs 20 minutes"
- "Prevented me from making mistake"

**What's not working:**

- "AI gave wrong answer on [topic]"
- "Couldn't find [specific info]"
- "Feature request: [idea]"

**How to share:**

- Weekly: #ai-assistant Slack channel
- Monthly: Team retrospective
- Anytime: Direct message to Jonas

---

## 📋 Quick Reference Card

### Most Common Commands

| Question Type | Example |
|---------------|---------|
| **Code Example** | "Show me how to [task] in [repo]" |
| **Architecture** | "Explain [system] architecture" |
| **Strategic** | "Should I [action]?" |
| **Debugging** | "I'm getting [error], here's my code: [paste]" |
| **Review** | [Paste code] "Review for Tekup standards" |
| **Learning** | "I'm new to [repo]. Where do I start?" |

### Keyboard Shortcuts

- **Send message:** Enter
- **New line:** Shift + Enter
- **Voice input:** Click mic icon
- **Copy code:** Hover + click Copy button

### URLs

- **AI Assistant:** <http://localhost:3000> (or production URL)
- **Documentation:** `c:\Users\empir\tekup-chat\README.md`
- **Test Scenarios:** `c:\Users\empir\Tekup-Cloud\AI_ASSISTANT_USER_TEST_SCENARIOS.md`

---

## ✅ Getting Started Checklist

For new users:

- [ ] Read this usage guide
- [ ] Complete setup (QUICK_START.md)
- [ ] Try 3 example questions
- [ ] Save bookmark/desktop shortcut
- [ ] Join #ai-assistant Slack channel
- [ ] Share first "AI saved me" story

**Time to productive:** 15 minutes

---

## 🎉 Welcome to Faster Development

The Tekup AI Assistant is here to make your daily work **easier, faster, and more informed**.

**Remember:**

- It's a tool, not a replacement for thinking
- Verify critical decisions in code
- Share knowledge with team
- Give feedback to improve it

**Goal:** Spend less time searching, more time building.

---

**Questions?** Ask in #ai-assistant Slack channel  
**Issues?** Report to Jonas or DevOps  
**Ideas?** We're always improving!

**Happy coding! 🚀**

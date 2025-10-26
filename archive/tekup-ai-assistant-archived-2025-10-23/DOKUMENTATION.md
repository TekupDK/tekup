# 📚 TekUp AI Assistant - Documentation Setup Guide

## ✅ Status: MkDocs + GitHub Pages Configured

Your documentation is now set up with **MkDocs** + **Material Theme** + **GitHub Pages**.

---

## 🚀 Quick Start

### 1. **View Locally (Development)**
```powershell
cd C:\Users\empir\tekup-ai-assistant
python -m mkdocs serve --dev-addr 127.0.0.1:8000
```
➜ Open http://localhost:8000 in your browser

### 2. **Deploy to GitHub Pages**
```powershell
.\scripts\deploy-docs.ps1
```
➜ Your docs will be live at: `https://yourusername.github.io/tekup-ai-assistant/`

---

## 📁 Documentation Structure

```
tekup-ai-assistant/
├── mkdocs.yml                    ← MkDocs configuration
├── docs/
│   ├── index.md                 ← Homepage (new!)
│   ├── SETUP.md                 ← Installation guide
│   ├── ARCHITECTURE.md          ← System design
│   ├── WORKFLOWS.md             ← Daily usage examples
│   ├── TROUBLESHOOTING.md       ← Common issues
│   ├── api/
│   │   └── tekup-billy-api.md   ← Billy.dk API docs
│   ├── guides/
│   │   └── daily-workflow.md    ← Step-by-step workflows
│   └── diagrams/                ← System diagrams
├── examples/
│   └── create-invoice.md        ← Invoice example
└── site/                         ← Generated HTML (git-ignored)
    └── index.html
```

---

## 🎨 Features Configured

✅ **Material Theme** - Beautiful dark/light mode  
✅ **Search** - Full-text search of all docs  
✅ **Navigation Tabs** - Easy category browsing  
✅ **Code Highlighting** - Syntax highlighting  
✅ **Tables & Lists** - Markdown formatting  
✅ **Dark Mode Toggle** - User preference toggle  
✅ **Mobile Responsive** - Works on all devices  

---

## 🔗 GitHub Pages Setup

### Step 1: Push to GitHub
```powershell
git add .
git commit -m "feat: add MkDocs documentation"
git push origin master
```

### Step 2: Enable GitHub Pages (ONE TIME)
Go to: **Settings → Pages → Build and deployment**
- Source: Deploy from branch
- Branch: `gh-pages`
- Folder: `/ (root)`

### Step 3: Deploy
```powershell
.\scripts\deploy-docs.ps1
```

Your docs will be live in ~2 minutes at:
```
https://github.com/JonasAbde/tekup-ai-assistant/deployments/github-pages
```

---

## 📝 Adding New Pages

### To Add a New Documentation Page:

**Example: Adding "Configuration Guide"**

1. Create file: `docs/guides/configuration.md`
```markdown
# Configuration Guide

Your content here...
```

2. Update `mkdocs.yml`:
```yaml
nav:
  - Guides:
    - Configuration: docs/guides/configuration.md  # ← Add this line
```

3. Rebuild:
```powershell
python -m mkdocs build
```

---

## 🎯 Navigation Hierarchy

```
Home (docs/index.md)
├── Getting Started
│   ├── Installation (docs/SETUP.md)
│   └── Architecture (docs/ARCHITECTURE.md)
├── Documentation
│   ├── Daily Workflows (docs/WORKFLOWS.md)
│   └── Troubleshooting (docs/TROUBLESHOOTING.md)
├── API Reference
│   └── Billy.dk API (docs/api/tekup-billy-api.md)
├── Guides
│   └── Daily Workflow Guide (docs/guides/daily-workflow.md)
└── Examples
    └── Invoice Creation (examples/create-invoice.md)
```

---

## 🛠️ Configuration Files

### `mkdocs.yml`
Main configuration file:
- Site name, description, author
- Theme settings (colors, fonts)
- Navigation structure
- Plugins and extensions
- Repository links

### `docs/index.md`
Homepage with:
- Quick facts
- Use cases
- Getting started links
- System overview
- Project phases
- Performance metrics

---

## 📊 Deployment Methods

### Option 1: GitHub Pages (RECOMMENDED) ⭐
```powershell
.\scripts\deploy-docs.ps1
```
- ✅ Free hosting
- ✅ Automatic SSL/TLS
- ✅ Custom domain support
- ✅ Built-in CI/CD ready

### Option 2: Manual Build
```powershell
python -m mkdocs build
# HTML files generated in /site folder
```

### Option 3: Render.com
1. Connect GitHub repo
2. Set build command: `mkdocs build`
3. Set publish directory: `site`
4. Deploy

---

## 🚀 Automation (Future)

### GitHub Actions (Optional)
Create `.github/workflows/docs.yml`:
```yaml
name: Deploy Docs

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - run: pip install mkdocs mkdocs-material
      - run: mkdocs gh-deploy --force
```

This would auto-deploy on every push to `master`.

---

## 💡 Tips & Tricks

### Live Reload During Development
```powershell
python -m mkdocs serve
```
Edit any `.md` file and the browser auto-refreshes.

### Build without Serving
```powershell
python -m mkdocs build
```

### Check for Broken Links
```powershell
python -m mkdocs serve --strict
```

### Serve on Different Port
```powershell
python -m mkdocs serve --dev-addr 127.0.0.1:9000
```

---

## 🔧 Customization

### Change Colors
Edit `mkdocs.yml`:
```yaml
theme:
  palette:
    primary: blue     # Change to: red, green, etc.
    accent: orange    # Change to: red, green, etc.
```

### Add Custom CSS
Create `docs/stylesheets/custom.css`:
```css
/* Your custom styles */
```

Then add to `mkdocs.yml`:
```yaml
extra_css:
  - stylesheets/custom.css
```

### Add Google Analytics
Add to `mkdocs.yml`:
```yaml
extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX
```

---

## 📚 Resources

- **MkDocs Official:** https://www.mkdocs.org
- **Material Theme:** https://squidfunk.github.io/mkdocs-material/
- **Markdown Guide:** https://www.markdownguide.org
- **GitHub Pages:** https://pages.github.com

---

## ❓ Troubleshooting

### Port 8000 Already in Use
```powershell
python -m mkdocs serve --dev-addr 127.0.0.1:9000
```

### MkDocs Not Found
```powershell
pip install mkdocs mkdocs-material
```

### GitHub Pages Not Updating
1. Check: Settings → Pages → Source (should be `gh-pages` branch)
2. Wait 2-3 minutes for GitHub to process
3. Try clearing browser cache (Ctrl+Shift+Delete)

### Links Not Working
- Use relative paths: `[link](docs/SETUP.md)`
- Not absolute: `[link](/docs/SETUP.md)`

---

## 📞 Next Steps

1. ✅ **Setup Complete** - MkDocs is configured
2. 📖 **Local Preview** - Run `python -m mkdocs serve`
3. 🚀 **Deploy** - Run `.\scripts\deploy-docs.ps1`
4. ✍️ **Customize** - Edit `mkdocs.yml` as needed
5. 📝 **Add Content** - Create new `.md` files in `docs/`

---

**Last Updated:** 2025-01-15  
**Documentation Version:** 1.0.0  
**MkDocs Version:** 1.6.1  
**Material Theme Version:** 9.6.22

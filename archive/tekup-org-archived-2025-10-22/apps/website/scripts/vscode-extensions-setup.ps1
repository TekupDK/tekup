# VS Code Extensions Setup for CSS Development with Tailwind CSS 4.1
# Run this script with: powershell -ExecutionPolicy Bypass -File vscode-extensions-setup.ps1

Write-Host "🚀 Setting up VS Code Extensions for CSS Development..." -ForegroundColor Green

# Essential Extensions for CSS Development
$extensions = @(
    # Tailwind CSS Support
    "bradlc.vscode-tailwindcss",           # Tailwind CSS IntelliSense
    
    # CSS & PostCSS Support  
    "csstools.postcss",                    # PostCSS Language Support
    "zignd.html-css-class-completion",     # CSS class completion
    "pranaygp.vscode-css-peek",            # CSS Peek
    
    # Live Development
    "ms-vscode.live-server",               # Live Server (Official)
    "ritwickdey.LiveServer",               # Live Server (Alternative)
    
    # Color & Visual Helpers
    "naumovs.color-highlight",             # Color Highlight
    "ms-vscode.hexeditor",                 # Hex Editor for color work
    "johnpapa.vscode-peacock",             # Workspace color themes
    
    # CSS Grid & Flexbox
    "dzhavat.css-flexbox-cheatsheet",      # CSS Flexbox Cheatsheet
    "dzhavat.css-grid-snippets",           # CSS Grid Snippets
    
    # Code Formatting & Linting
    "esbenp.prettier-vscode",              # Prettier
    "ms-vscode.vscode-eslint",             # ESLint
    "stylelint.vscode-stylelint",          # Stylelint
    
    # Comments & Documentation
    "aaron-bond.better-comments",          # Better Comments
    "formulahendry.auto-rename-tag",       # Auto Rename Tag
    
    # Additional Productivity Extensions
    "ms-vscode.vscode-typescript-next",    # TypeScript support
    "bradlc.vscode-tailwindcss-docs",      # Tailwind CSS docs
    "formulahendry.auto-close-tag",        # Auto Close Tag
    "ms-vscode.vscode-json",               # JSON support
    "redhat.vscode-yaml",                  # YAML support
    
    # Design & Mockup Tools
    "ms-vscode.vscode-drawio-integration", # Draw.io integration
    "jock.svg",                            # SVG support
    "ms-vscode.vscode-webview-ui-toolkit"  # Webview UI Toolkit
)

Write-Host "Installing VS Code Extensions..." -ForegroundColor Yellow

foreach ($extension in $extensions) {
    Write-Host "Installing: $extension" -ForegroundColor Cyan
    try {
        code --install-extension $extension --force
        Write-Host "✅ Successfully installed: $extension" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install: $extension - $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "🔧 Creating VS Code configuration files..." -ForegroundColor Yellow

# Create .vscode directory if it doesn't exist
$vscodeDir = ".\.vscode"
if (-not (Test-Path $vscodeDir)) {
    New-Item -ItemType Directory -Path $vscodeDir
    Write-Host "Created .vscode directory" -ForegroundColor Green
}

Write-Host "✅ VS Code Extensions Installation Complete!" -ForegroundColor Green
Write-Host "📝 Next: Configure the extensions using the generated settings files" -ForegroundColor Cyan
Write-Host "🔄 Restart VS Code to activate all extensions" -ForegroundColor Cyan
# Browser Extensions Setup Guide for CSS Development

## Essential Chrome Extensions for CSS Development

### 1. React Developer Tools
**Purpose**: Component debugging and React profiling
**URL**: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
**Installation**: Click "Add to Chrome" button

### 2. CSS Peeper
**Purpose**: Extract CSS styles from any website
**URL**: https://chrome.google.com/webstore/detail/css-peeper/mbnbehikldjhnfehhnaidhjhoofhpehk
**Installation**: Click "Add to Chrome" button

### 3. Pesticide for Chrome
**Purpose**: Visualize CSS box model and layout structure
**URL**: https://chrome.google.com/webstore/detail/pesticide-for-chrome/bblbgcheenepgnnajgfpiicnbbdmmooh
**Installation**: Click "Add to Chrome" button

### 4. ColorZilla
**Purpose**: Advanced color picker and palette generator
**URL**: https://chrome.google.com/webstore/detail/colorzilla/bhlhnicpbhignbdhedgjhgdocnmhomnp
**Installation**: Click "Add to Chrome" button

### 5. Responsive Viewer
**Purpose**: Test responsive design across multiple devices
**URL**: https://chrome.google.com/webstore/detail/responsive-viewer/inmopeiepgfljkpkidclfgbgbmfcennb
**Installation**: Click "Add to Chrome" button

### 6. Window Resizer
**Purpose**: Quick viewport resizing for responsive testing
**URL**: https://chrome.google.com/webstore/detail/window-resizer/kkelicaakdanhinjdeammmilcgefonfh
**Installation**: Click "Add to Chrome" button

### 7. Web Developer
**Purpose**: Comprehensive web development toolbar
**URL**: https://chrome.google.com/webstore/detail/web-developer/bfbameneiokkgbdmiekhjnmfkcnldhhm
**Installation**: Click "Add to Chrome" button

## Chrome DevTools Configuration

### Enable CSS Source Maps
1. Open Chrome DevTools (F12)
2. Go to Settings (⚙️ gear icon)
3. Under "Preferences" → "Sources"
4. Enable "Enable CSS source maps"
5. Enable "Enable JavaScript source maps"

### Preserve Log Settings
1. In DevTools, go to Console tab
2. Click the ⚙️ settings icon in the console
3. Enable "Preserve log"
4. Enable "Show timestamps"

### CSS-Specific Settings
1. In DevTools Settings → "Experiments"
2. Enable "Allow extensions to load custom stylesheets"
3. In "Preferences" → "Elements"
4. Enable "Show user agent shadow DOM"
5. Enable "Word wrap"

## DevTools Snippets Setup
The DevTools snippets will be created automatically when you run the setup script.

## Quick Installation Script
Run this PowerShell command to open all extension URLs:

```powershell
# Open all extension URLs in Chrome
$extensions = @(
    'https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi',
    'https://chrome.google.com/webstore/detail/css-peeper/mbnbehikldjhnfehhnaidhjhoofhpehk',
    'https://chrome.google.com/webstore/detail/pesticide-for-chrome/bblbgcheenepgnnajgfpiicnbbdmmooh',
    'https://chrome.google.com/webstore/detail/colorzilla/bhlhnicpbhignbdhedgjhgdocnmhomnp',
    'https://chrome.google.com/webstore/detail/responsive-viewer/inmopeiepgfljkpkidclfgbgbmfcennb',
    'https://chrome.google.com/webstore/detail/window-resizer/kkelicaakdanhinjdeammmilcgefonfh',
    'https://chrome.google.com/webstore/detail/web-developer/bfbameneiokkgbdmiekhjnmfkcnldhhm'
)

foreach ($url in $extensions) {
    Start-Process chrome.exe $url
    Start-Sleep -Seconds 2
}
```

## Manual Installation Steps
1. Copy each URL above
2. Paste in Chrome address bar
3. Click "Add to Chrome"
4. Click "Add extension" when prompted
5. Pin important extensions to toolbar

## Post-Installation Configuration
After installing all extensions:
1. Right-click each extension icon
2. Select "Pin" to keep visible in toolbar
3. Configure extension settings as needed
4. Test each extension with your Tekup website

## Verification Checklist
- [ ] React Developer Tools installed and working
- [ ] CSS Peeper can extract styles from websites
- [ ] Pesticide shows CSS box model outlines
- [ ] ColorZilla can pick colors from pages
- [ ] Responsive Viewer shows multiple device views
- [ ] Window Resizer provides quick viewport options
- [ ] Web Developer toolbar is accessible
- [ ] DevTools CSS source maps enabled
- [ ] Console preserve log enabled
- [ ] DevTools snippets loaded

## Next Steps
After completing this setup, proceed to configure VS Code extensions for an optimal CSS development workflow.
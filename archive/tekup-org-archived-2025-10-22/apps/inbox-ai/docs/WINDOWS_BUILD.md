# Windows Build Guide for AI IMAP Inbox

## Overview

This guide explains how to build the AI IMAP Inbox application as a Windows executable (.exe) using Electron Builder.

## Prerequisites

### Required Software
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **npm**: Comes with Node.js
- **Git**: For version control (optional)

### Windows-Specific Requirements
- **Windows 10/11**: Target platforms
- **PowerShell 5.0+**: For build scripts
- **Visual Studio Build Tools**: May be required for native modules

## Quick Start

### Option 1: Using the Batch Script (Easiest)
1. Open Command Prompt or PowerShell in the project directory
2. Run the batch script:
   ```cmd
   build-windows.bat
   ```
3. Follow the interactive menu to select your build option

### Option 2: Using npm Commands
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Create Windows installer
npm run dist:win

# Create portable Windows app
npm run dist:win-portable

# Build for all platforms
npm run dist:all
```

### Option 3: Using PowerShell Script
```powershell
# Run the PowerShell build script
.\build\build-windows.ps1

# With options
.\build\build-windows.ps1 -Portable -SkipTests
```

## Build Outputs

### Generated Files
After building, you'll find the following files in the `release/` directory:

| File | Description | Use Case |
|------|-------------|----------|
| `AI IMAP Inbox Setup 1.0.0.exe` | NSIS Installer | Standard installation |
| `AI IMAP Inbox-1.0.0-portable.exe` | Portable App | No installation required |
| `win-unpacked/` | Unpacked Application | Development/testing |
| `latest.yml` | Update Metadata | Auto-updater |

### File Sizes (Approximate)
- **Installer**: 150-200 MB
- **Portable**: 200-250 MB
- **Unpacked**: 250-300 MB

## Build Configuration

### Package.json Settings
The Windows build is configured in `package.json` under the `build.win` section:

```json
{
  "win": {
    "target": [
      {"target": "nsis", "arch": ["x64"]},
      {"target": "portable", "arch": ["x64"]}
    ],
    "icon": "build/icon.ico",
    "publisherName": "AI IMAP Inbox Team",
    "requestedExecutionLevel": "asInvoker"
  }
}
```

### NSIS Installer Options
- **One-Click Install**: Disabled for user choice
- **Per-Machine Install**: Disabled (per-user by default)
- **Custom Install Path**: Enabled
- **Desktop Shortcut**: Created by default
- **Start Menu Entry**: Created automatically
- **File Associations**: .eml files open with the app

## Advanced Configuration

### Code Signing (Optional)
To sign your executable for Windows SmartScreen compatibility:

1. Obtain a code signing certificate
2. Configure in `package.json`:
   ```json
   {
     "win": {
       "certificateFile": "path/to/certificate.p12",
       "certificatePassword": "${env.CERTIFICATE_PASSWORD}"
     }
   }
   ```
3. Set environment variable:
   ```cmd
   set CERTIFICATE_PASSWORD=your_password
   ```

### Custom Icon
1. Create or convert an icon to .ico format
2. Place it at `build/icon.ico`
3. Ensure multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### Build Environment Variables
Create `.env` file in project root:
```env
# Code signing
CERTIFICATE_PASSWORD=your_cert_password

# Build options
NODE_ENV=production
ELECTRON_CACHE=.cache
```

## Troubleshooting

### Common Issues

#### 1. Native Module Compilation Errors
```bash
# Install build tools
npm install --global windows-build-tools

# Or use Visual Studio installer
# Install "Desktop development with C++" workload
```

#### 2. Icon Not Found
- Ensure `build/icon.ico` exists
- Check file path in `package.json`
- Use absolute paths if relative paths fail

#### 3. NSIS Errors
```bash
# Install NSIS manually
winget install NSIS.NSIS

# Or download from: https://nsis.sourceforge.io/
```

#### 4. Out of Memory During Build
```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096
npm run dist:win
```

#### 5. Antivirus False Positives
- Add `release/` folder to antivirus exclusions
- Use code signing to reduce false positives
- Submit files to antivirus vendors for whitelisting

### Build Performance Tips

1. **Use SSD Storage**: Significantly faster builds
2. **Exclude from Antivirus**: Add project folder to exclusions
3. **Close Other Applications**: Free up system resources
4. **Use Local Registry**: Configure npm for faster installs
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

## Distribution

### Windows Store (Optional)
To distribute via Microsoft Store:
1. Convert to MSIX format
2. Configure app manifest
3. Submit to Partner Center

### Direct Distribution
- Host installer on your website
- Use GitHub Releases for automatic updates
- Configure auto-updater in the application

### Enterprise Deployment
- Use Group Policy for silent installation
- Configure MSI packages for domain deployment
- Set up centralized update servers

## Testing

### Pre-Release Testing
1. **Manual Testing**:
   - Install on clean Windows VM
   - Test all features
   - Verify shortcuts and file associations

2. **Automated Testing**:
   ```bash
   # Run unit tests
   npm run test
   
   # Run integration tests
   npm run test:integration
   ```

3. **Performance Testing**:
   - Monitor memory usage
   - Check startup time
   - Test with large email datasets

### User Acceptance Testing
- Test on different Windows versions
- Verify with multiple user accounts
- Check accessibility features

## Deployment Checklist

- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Custom icon is included
- [ ] Version number is updated
- [ ] Code signing certificate is valid
- [ ] Installer tested on clean system
- [ ] File associations work correctly
- [ ] Auto-updater configuration is correct
- [ ] Documentation is updated
- [ ] Release notes are prepared

## Support

For build issues:
1. Check this documentation
2. Review error logs in console
3. Search GitHub issues
4. Create new issue with build logs

For Windows-specific issues:
- Include Windows version
- Provide complete error messages
- Attach build logs
- Specify antivirus software used
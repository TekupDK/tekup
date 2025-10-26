# fix-emoji.ps1

Fixes PowerShell emoji display issues by configuring UTF-8 encoding.

## Problem
PowerShell uses legacy encoding by default, causing emojis to appear as garbled text (e.g., `ƒöì` instead of ).

## Solution
Adds `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` to your PowerShell profile.

## Usage

```powershell
# Permanent fix (recommended) - adds to PowerShell profile
.\fix-emoji.ps1

# Temporary fix - current session only
.\fix-emoji.ps1 --temp

# Test if emojis display correctly
.\fix-emoji.ps1 --test
```

## After Installation
- Restart PowerShell for permanent effect
- Or continue in current session (already active)
- Run `.\fix-emoji.ps1 --test` anytime to verify

## What It Does
1. Creates PowerShell profile if it doesnt exist
2. Adds UTF-8 encoding configuration
3. Applies fix to current session immediately
4. Shows test output to verify emojis work

## Profile Location
`$PROFILE` typically points to:
`C:\Users\<username>\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`

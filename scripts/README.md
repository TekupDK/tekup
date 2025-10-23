# Tekup Scripts Directory

## Structure

### `/active/`

Current operational scripts for daily Tekup workflow

- **empty** - reserved for future active automation scripts

### `/utilities/`

Utility scripts for documentation and repository management

- `push-docs.bat` - Push documentation updates to GitHub
- `update-docs.bat` - Update and commit documentation changes  
- `quick-commit.ps1` - Quick commit and push for daily logs

### `/archive/`

Historical and one-time-use scripts (preserved for reference)

- Migration scripts from workspace restructuring
- Cleanup and setup scripts from October 2025
- Commit scripts for specific phases and tasks

## Root Level Scripts

### `clone-all-repos.ps1`

Clone all Tekup Portfolio repositories to local workspace

### `push-all-to-github.ps1`

Push all local repositories to GitHub (batch operation)

## Usage

Always run scripts from the Tekup root directory:

```powershell
cd c:\Users\empir\Tekup
.\scripts\utilities\quick-commit.ps1
```

## Notes

- Archive scripts are preserved for historical reference but shouldn't be used
- Utilities are actively maintained and safe to use
- New operational scripts should go in `/active/`

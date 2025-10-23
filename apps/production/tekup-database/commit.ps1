# Commit script to avoid PowerShell issues
param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

git commit -m $Message

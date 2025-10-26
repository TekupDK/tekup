# Starts the Voice-Agent app in Jarvis mock mode
param(
  [string]$Filter = "@tekup/voice-agent"
)

Write-Host "Starting Voice-Agent in Jarvis mock mode..." -ForegroundColor Cyan
pnpm --filter $Filter dev:jarvis:mock

# 🔧 TekUp AI Assistant - Troubleshooting

Common issues og solutions for TekUp AI Assistant setup.

## 📋 Table of Contents

1. [Ollama Issues](#ollama-issues)
2. [Jan AI Issues](#jan-ai-issues)
3. [MCP Integration Issues](#mcp-integration-issues)
4. [Performance Issues](#performance-issues)
5. [Billy.dk Integration](#billydk-integration)
6. [RenOS Integration](#renos-integration)

---

## 🤖 Ollama Issues

### Issue: Ollama won't start

**Symptoms:**
- `ollama` command not found
- "Failed to connect to Ollama" in Jan AI
- Port 11434 not listening

**Solutions:**

```powershell
# 1. Check if Ollama is installed
ollama --version

# If not found, reinstall:
winget install Ollama.Ollama

# 2. Check if service is running
tasklist | findstr ollama

# If not running, start it:
ollama serve

# 3. Check port 11434
netstat -an | findstr 11434
# Should show: LISTENING on 11434

# 4. Restart Ollama service
taskkill /F /IM ollama.exe
Start-Sleep -Seconds 2
ollama serve
```

**Prevention:**
- Add Ollama to startup programs
- Create shortcut: `ollama serve` in Startup folder

---

### Issue: Model download fails

**Symptoms:**
- Download stops at X%
- "Network error" during pull
- Disk space error

**Solutions:**

```powershell
# 1. Check disk space (need ~20GB free)
Get-PSDrive C | Select-Object Used,Free

# 2. Check internet connection
Test-NetConnection github.com -Port 443

# 3. Retry with verbose logging
ollama pull qwen2.5-coder:14b-instruct-q4_K_M --verbose

# 4. If still fails, try smaller model first
ollama pull mistral:7b-instruct-q4_K_M

# 5. Clear Ollama cache
Remove-Item -Recurse -Force $env:USERPROFILE\.ollama\models\blobs\sha256-incomplete*

# 6. Retry download
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
```

---

### Issue: Model runs very slowly (30+ seconds)

**Symptoms:**
- GPU not being used (check Task Manager)
- CPU at 100%
- Long response times

**Diagnosis:**

```powershell
# Check if NVIDIA GPU is detected
nvidia-smi

# If error, reinstall NVIDIA drivers
# Download from: https://www.nvidia.com/Download/index.aspx
```

**Solutions:**

1. **Update NVIDIA drivers:**
   - Download latest GeForce driver
   - Install and restart

2. **Verify GPU support:**
   ```powershell
   # Ollama should show GPU
   ollama run qwen2.5-coder:14b-instruct-q4_K_M "test"
   # Check Task Manager → Performance → GPU → CUDA
   ```

3. **If GPU still not used:**
   - Reinstall Ollama (might have installed CPU-only version)
   - Check CUDA toolkit: `nvcc --version`

---

## 💬 Jan AI Issues

### Issue: Jan AI won't connect to Ollama

**Symptoms:**
- "Failed to connect" error
- Ollama models not showing in Jan AI
- Timeout errors

**Solutions:**

1. **Verify Ollama is running:**
   ```powershell
   # Should return HTTP 200
   curl http://localhost:11434/api/tags
   ```

2. **Check Jan AI settings:**
   - Settings → Model Sources
   - Ensure URL is exactly: `http://localhost:11434`
   - Click "Test Connection" → should show green checkmark

3. **Firewall issues:**
   ```powershell
   # Check if Windows Firewall is blocking
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Ollama*"}
   
   # If blocked, create rule:
   New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
   ```

4. **Restart both applications:**
   ```powershell
   # Kill both
   taskkill /F /IM ollama.exe
   taskkill /F /IM jan.exe
   
   # Start Ollama first
   Start-Process ollama -ArgumentList "serve"
   
   # Wait 5 seconds
   Start-Sleep -Seconds 5
   
   # Start Jan AI
   Start-Process jan
   ```

---

### Issue: Jan AI crashes or freezes

**Symptoms:**
- App becomes unresponsive
- White screen
- Memory error

**Solutions:**

1. **Clear Jan AI cache:**
   ```powershell
   # Close Jan AI first
   Remove-Item -Recurse -Force "$env:APPDATA\jan\Cache"
   Remove-Item -Recurse -Force "$env:APPDATA\jan\GPUCache"
   ```

2. **Reset Jan AI settings:**
   ```powershell
   # Backup first
   Copy-Item "$env:APPDATA\jan" "$env:APPDATA\jan_backup" -Recurse
   
   # Remove settings
   Remove-Item "$env:APPDATA\jan\settings.json"
   ```

3. **Reinstall Jan AI:**
   ```powershell
   winget uninstall Jan.Jan
   winget install Jan.Jan
   ```

---

## 🔌 MCP Integration Issues

### Issue: Billy MCP not responding

**Symptoms:**
- "Tool not found" error
- Invoice creation fails
- Timeout errors

**Diagnosis:**

```powershell
# 1. Test Tekup-Billy API directly
curl https://tekup-billy.onrender.com/health

# 2. Check if MCP config exists
Test-Path "$env:APPDATA\jan\extensions\mcp-config.json"

# 3. Validate JSON syntax
Get-Content "$env:APPDATA\jan\extensions\mcp-config.json" | ConvertFrom-Json
```

**Solutions:**

1. **Verify Tekup-Billy is running:**
   - Visit: https://tekup-billy.onrender.com
   - Should show API status page

2. **Check MCP config:**
   ```json
   {
     "mcpServers": {
       "tekup-billy": {
         "url": "https://tekup-billy.onrender.com",
         "timeout": 30000
       }
     }
   }
   ```

3. **Check API key (if required):**
   - Ensure `.env` has `BILLY_API_KEY`
   - Verify key is valid

4. **Restart Jan AI** to reload MCP config

---

### Issue: MCP tools not showing in Jan AI

**Symptoms:**
- Can't see `create_invoice` tool
- AI doesn't know about Billy integration

**Solutions:**

1. **Verify MCP config location:**
   ```powershell
   # Jan AI looks here:
   $env:APPDATA\jan\extensions\mcp-config.json
   
   # Or here:
   $env:USERPROFILE\.jan\extensions\mcp-config.json
   
   # Create if missing:
   New-Item -ItemType Directory -Force -Path "$env:APPDATA\jan\extensions"
   ```

2. **Check Jan AI logs:**
   - Jan AI → Settings → Advanced → Show Logs
   - Look for "MCP" errors

3. **Minimal test config:**
   ```json
   {
     "mcpServers": {
       "test": {
         "command": "node",
         "args": ["-e", "console.log('MCP test')"]
       }
     }
   }
   ```

---

## ⚡ Performance Issues

### Issue: High RAM usage (>40GB)

**Symptoms:**
- System slows down
- Ollama using 20GB+ RAM
- Chrome crashes

**Solutions:**

1. **Check what's using RAM:**
   ```powershell
   Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 ProcessName,@{Name="RAM(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}
   ```

2. **Limit Ollama context:**
   - Shorter conversations use less RAM
   - Restart Ollama periodically
   
3. **Close unused apps:**
   ```powershell
   # Kill Chrome if not needed
   taskkill /F /IM chrome.exe
   ```

4. **Use smaller model temporarily:**
   ```powershell
   # Switch to Mistral 7B (uses ~4GB vs 8GB)
   ollama run mistral:7b-instruct-q4_K_M
   ```

---

### Issue: Slow AI responses (>30 seconds)

**Symptoms:**
- Every response takes 30+ seconds
- GPU shows 0% usage
- CPU at 100%

**Root causes & fixes:**

1. **GPU not being used:**
   - Update NVIDIA drivers
   - Reinstall Ollama
   - Check `nvidia-smi` shows GPU

2. **Model too large:**
   - Qwen 14B might be too big if RAM is low
   - Try Llama 8B instead:
     ```powershell
     ollama run llama3.3:8b-instruct-q5_K_M
     ```

3. **Thermal throttling:**
   - Check GPU temperature: `nvidia-smi`
   - If >80°C, improve cooling
   - Reduce GPU clock if needed

4. **Background processes:**
   ```powershell
   # Find CPU hogs
   Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
   ```

---

## 💰 Billy.dk Integration

### Issue: "Customer not found" errors

**Symptoms:**
- AI can't find customer by name
- list_customers returns empty

**Solutions:**

1. **Test API manually:**
   ```powershell
   curl "https://tekup-billy.onrender.com/billy/customers?search=Michael"
   ```

2. **Check customer name spelling:**
   - AI needs exact match
   - Try: "Michael Roach" not "Michael R."

3. **Update customer search logic:**
   - Fuzzy matching might be needed
   - See `tekup-billy` repo for improvements

---

### Issue: Invoice creation fails

**Symptoms:**
- "Unknown error" when creating invoice
- 500 error from Billy API
- Missing required fields

**Diagnosis:**

```powershell
# Test invoice creation manually
$body = @{
    contactId = "test-customer-id"
    lines = @(
        @{
            description = "Test service"
            quantity = 2
            unitPrice = 349
        }
    )
} | ConvertTo-Json

curl -X POST "https://tekup-billy.onrender.com/billy/invoices" `
     -H "Content-Type: application/json" `
     -d $body
```

**Solutions:**

1. **Check Billy.dk API status:**
   - Visit Billy.dk
   - Check for maintenance

2. **Verify API credentials:**
   - Check `.env` in Tekup-Billy
   - Regenerate API key if expired

3. **Check invoice data:**
   - Customer ID must exist
   - Quantity must be >0
   - Unit price must be >0

---

## 🗓️ RenOS Integration

### Issue: Bookings not syncing

**Symptoms:**
- AI shows old bookings
- Calendar out of date
- Missing recent entries

**Solutions:**

1. **Check RenOS API:**
   ```powershell
   curl "https://renos-backend.onrender.com/api/bookings"
   ```

2. **Clear cache (if implemented):**
   - Restart MCP server
   - Force refresh in Jan AI

3. **Check database connection:**
   - RenOS backend logs
   - Supabase/PostgreSQL status

---

### Issue: Access codes missing

**Symptoms:**
- AI shows booking without access code
- "null" or "-" for code

**Solutions:**

1. **Check database:**
   - Verify `accessCode` field exists
   - Check if it's populated

2. **Update query:**
   - Ensure MCP fetches all fields
   - Include `accessCode` in SELECT

3. **Manual entry:**
   - Update RenOS booking with code
   - Refresh AI query

---

## 🆘 Emergency Reset

If everything is broken:

```powershell
# 1. Stop all services
taskkill /F /IM ollama.exe
taskkill /F /IM jan.exe
taskkill /F /IM node.exe

# 2. Clear caches
Remove-Item -Recurse -Force "$env:APPDATA\jan\Cache"
Remove-Item -Recurse -Force "$env:USERPROFILE\.ollama\models\blobs\sha256-incomplete*"

# 3. Restart Ollama
Start-Process ollama -ArgumentList "serve"
Start-Sleep -Seconds 5

# 4. Test Ollama
curl http://localhost:11434/api/tags

# 5. Start Jan AI
Start-Process jan

# 6. Reconfigure from scratch
# Follow SETUP.md Phase 1-3 again
```

---

## 📞 Getting Help

### Check Logs

**Ollama logs:**
```powershell
# Windows Event Viewer
eventvwr
# → Windows Logs → Application → Source: Ollama
```

**Jan AI logs:**
- Jan AI → Settings → Advanced → Show Logs

**MCP logs:**
- Console output where MCP server runs

### Collect Debug Info

```powershell
# System info
systeminfo | findstr /C:"OS Name" /C:"Total Physical Memory"

# GPU info
nvidia-smi

# Ollama info
ollama list
ollama --version

# Network connectivity
Test-NetConnection github.com -Port 443
Test-NetConnection localhost -Port 11434

# Save to file
systeminfo > debug-info.txt
nvidia-smi >> debug-info.txt
ollama list >> debug-info.txt
```

### Report Issue

Include:
1. Error message (exact text)
2. Steps to reproduce
3. System info (from above)
4. Screenshots (if UI issue)
5. Logs (relevant sections)

**Where to report:**
- GitHub Issues: `tekup-ai-assistant`
- Or check `chat.md` for previous discussions

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**See also:** [SETUP.md](SETUP.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [WORKFLOWS.md](WORKFLOWS.md)



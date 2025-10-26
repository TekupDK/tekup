# Quick test script to verify Service Worker is disabled
# Run in Chrome DevTools Console after deployment

Write-Host "🧪 Testing Service Worker Status..." -ForegroundColor Cyan

@"
// Test 1: Check Service Worker registrations
console.log('🔍 Test 1: Checking Service Worker registrations...');
navigator.serviceWorker.getRegistrations().then(regs => {
  if (regs.length === 0) {
    console.log('✅ PASS: No Service Workers registered');
  } else {
    console.log('❌ FAIL: Found ' + regs.length + ' Service Workers');
    regs.forEach(r => console.log('  - ' + r.active?.scriptURL));
  }
});

// Test 2: Check cache storage
console.log('🔍 Test 2: Checking cache storage...');
caches.keys().then(keys => {
  if (keys.length === 0) {
    console.log('✅ PASS: No caches found');
  } else {
    console.log('❌ FAIL: Found ' + keys.length + ' caches');
    keys.forEach(k => console.log('  - ' + k));
  }
});

// Test 3: Check if hash-based filenames are working
console.log('🔍 Test 3: Checking asset filenames...');
const scripts = Array.from(document.querySelectorAll('script[src*="/assets/"]'));
const styles = Array.from(document.querySelectorAll('link[href*="/assets/"]'));

const hasHash = (url) => /\.[a-f0-9]{8,}\.(js|css)/.test(url);

const scriptCheck = scripts.every(s => hasHash(s.src));
const styleCheck = styles.every(s => hasHash(s.href));

if (scriptCheck && styleCheck) {
  console.log('✅ PASS: All assets have hash-based filenames');
  console.log('  Scripts:', scripts.map(s => s.src.split('/').pop()));
  console.log('  Styles:', styles.map(s => s.href.split('/').pop()));
} else {
  console.log('❌ FAIL: Some assets missing hash');
}

// Test 4: Check cache-control headers
console.log('🔍 Test 4: Checking cache-control headers...');
fetch('/', { method: 'HEAD' }).then(res => {
  const cacheControl = res.headers.get('cache-control');
  if (cacheControl && cacheControl.includes('no-cache')) {
    console.log('✅ PASS: HTML has no-cache header');
    console.log('  Cache-Control: ' + cacheControl);
  } else {
    console.log('⚠️ WARNING: Expected no-cache header');
    console.log('  Cache-Control: ' + cacheControl);
  }
});

console.log('');
console.log('📊 Test Summary:');
console.log('- Test 1: Service Worker removal');
console.log('- Test 2: Cache cleared');
console.log('- Test 3: Hash-based filenames');
console.log('- Test 4: Cache-control headers');
console.log('');
console.log('✅ If all tests pass, cache-busting should work without Ctrl+Shift+R!');
"@

Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "1. Open Chrome DevTools (F12)" -ForegroundColor White
Write-Host "2. Go to Console tab" -ForegroundColor White
Write-Host "3. Copy the code above (the JavaScript part)" -ForegroundColor White
Write-Host "4. Paste into Console and press Enter" -ForegroundColor White
Write-Host "5. Check that all tests pass ✅" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Quick Links:" -ForegroundColor Yellow
Write-Host "Production: https://www.renos.dk" -ForegroundColor Cyan
Write-Host "Local: http://localhost:5173" -ForegroundColor Cyan

# Advanced CSS Testing Infrastructure
# Comprehensive testing suite for CSS regression, accessibility, performance, and compatibility

param(
    [string]$Action = "help",
    [string]$Directory = ".",
    [string]$TestType = "all",
    [string]$Browser = "chrome",
    [string]$OutputFormat = "json",
    [switch]$Verbose,
    [switch]$Watch,
    [string]$Baseline = "",
    [switch]$Help
)

# Color output function
function Write-ColorOutput {
    param([string]$Text, [string]$Color = "White")
    $colors = @{
        "Red" = [System.ConsoleColor]::Red
        "Green" = [System.ConsoleColor]::Green
        "Yellow" = [System.ConsoleColor]::Yellow
        "Blue" = [System.ConsoleColor]::Blue
        "Magenta" = [System.ConsoleColor]::Magenta
        "Cyan" = [System.ConsoleColor]::Cyan
        "White" = [System.ConsoleColor]::White
    }
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🧪 Advanced CSS Testing Infrastructure" "Cyan"
    Write-Host ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-Host "  .\css-testing.ps1 -Action <action> [OPTIONS]"
    Write-Host ""
    Write-ColorOutput "ACTIONS:" "Yellow"
    Write-Host "  regression     - Run visual regression tests"
    Write-Host "  accessibility  - Run accessibility tests on CSS"
    Write-Host "  performance    - Analyze CSS performance metrics"
    Write-Host "  compatibility  - Test cross-browser compatibility"
    Write-Host "  coverage       - Analyze CSS coverage and usage"
    Write-Host "  animation      - Profile CSS animations and transitions"
    Write-Host "  responsive     - Test responsive breakpoints"
    Write-Host "  specificity    - Analyze CSS specificity conflicts"
    Write-Host "  validation     - Validate CSS syntax and best practices"
    Write-Host "  baseline       - Create baseline screenshots/metrics"
    Write-Host "  compare        - Compare current state with baseline"
    Write-Host "  report         - Generate comprehensive test report"
    Write-Host ""
    Write-ColorOutput "OPTIONS:" "Yellow"
    Write-Host "  -Directory <path>     Directory to test (default: current)"
    Write-Host "  -TestType <type>      Specific test type to run (default: all)"
    Write-Host "  -Browser <name>       Browser for testing (chrome, firefox, edge)"
    Write-Host "  -OutputFormat <fmt>   Output format (json, html, xml, csv)"
    Write-Host "  -Baseline <path>      Path to baseline files for comparison"
    Write-Host "  -Verbose             Enable verbose output"
    Write-Host "  -Watch               Watch for changes and re-test"
    Write-Host "  -Help                Show this help message"
    Write-Host ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-Host "  .\css-testing.ps1 -Action regression -Browser chrome"
    Write-Host "  .\css-testing.ps1 -Action accessibility -Verbose"
    Write-Host "  .\css-testing.ps1 -Action baseline"
    Write-Host "  .\css-testing.ps1 -Action compare -Baseline ./baselines"
    exit 0
}

if ($Help -or $Action -eq "help") { Show-Help }

# Dependency check
function Test-Dependencies {
    $dependencies = @{
        "node" = "Node.js is required for CSS testing tools"
        "npm" = "npm is required to install testing packages"
    }
    
    $missing = @()
    foreach ($dep in $dependencies.Keys) {
        if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
            $missing += "$dep - $($dependencies[$dep])"
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-ColorOutput "❌ Missing dependencies:" "Red"
        $missing | ForEach-Object { Write-Host "  • $_" }
        return $false
    }
    return $true
}

# Install testing packages if needed
function Install-TestingPackages {
    Write-ColorOutput "📦 Checking testing packages..." "Yellow"
    
    $packages = @(
        "puppeteer",
        "pixelmatch",
        "css-tree",
        "stylelint",
        "axe-core",
        "lighthouse",
        "css-analyzer",
        "postcss",
        "postcss-cli"
    )
    
    $packageJson = @"
{
  "name": "css-testing-suite",
  "version": "1.0.0",
  "dependencies": {
    "puppeteer": "^21.0.0",
    "pixelmatch": "^5.3.0",
    "css-tree": "^2.3.0",
    "stylelint": "^16.0.0",
    "axe-core": "^4.8.0",
    "lighthouse": "^11.0.0",
    "css-analyzer": "^1.0.0",
    "postcss": "^8.4.0",
    "postcss-cli": "^11.0.0",
    "chokidar": "^3.5.0"
  }
}
"@
    
    $tempPackageFile = Join-Path $env:TEMP "css-testing-package.json"
    $packageJson | Out-File -FilePath $tempPackageFile -Encoding UTF8
    
    try {
        Push-Location $env:TEMP
        npm install --prefix css-testing $(Join-Path $env:TEMP "css-testing-package.json") --silent
        Write-ColorOutput "✅ Testing packages ready" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Failed to install testing packages: $($_.Exception.Message)" "Red"
        return $false
    } finally {
        Pop-Location
        Remove-Item $tempPackageFile -ErrorAction SilentlyContinue
    }
}

# Visual regression testing
function Test-VisualRegression {
    param([string]$dir, [string]$baseline)
    
    Write-ColorOutput "📸 Running visual regression tests..." "Blue"
    
    $regressionScript = @"
const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

async function runRegressionTests() {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--disable-web-security', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const testUrls = [
        'http://localhost:3000',
        'http://localhost:3000/about',
        'http://localhost:3000/contact'
    ];
    
    const results = [];
    const outputDir = './css-test-results/regression';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const url of testUrls) {
        console.log(\`📸 Testing: \${url}\`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle0' });
            
            // Wait for any animations to complete
            await page.waitForTimeout(2000);
            
            const pageName = url.split('/').pop() || 'index';
            const screenshotPath = path.join(outputDir, \`\${pageName}-current.png\`);
            const baselinePath = path.join('$baseline', \`\${pageName}-baseline.png\`);
            const diffPath = path.join(outputDir, \`\${pageName}-diff.png\`);
            
            // Take current screenshot
            await page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                type: 'png'
            });
            
            // Compare with baseline if it exists
            if (fs.existsSync(baselinePath)) {
                const currentImg = fs.readFileSync(screenshotPath);
                const baselineImg = fs.readFileSync(baselinePath);
                
                if (currentImg.length === baselineImg.length) {
                    const diff = pixelmatch(currentImg, baselineImg, null, 1920, 1080, {
                        threshold: 0.1
                    });
                    
                    results.push({
                        url,
                        pageName,
                        pixelDifference: diff,
                        passed: diff === 0,
                        screenshotPath,
                        baselinePath,
                        diffPath: diff > 0 ? diffPath : null
                    });
                    
                    console.log(\`  \${diff === 0 ? '✅' : '❌'} \${pageName}: \${diff} pixels different\`);
                } else {
                    results.push({
                        url,
                        pageName,
                        error: 'Image dimensions differ',
                        passed: false
                    });
                }
            } else {
                console.log(\`  ⚠️ No baseline found for \${pageName}\`);
                results.push({
                    url,
                    pageName,
                    status: 'no-baseline',
                    screenshotPath
                });
            }
            
        } catch (error) {
            console.error(\`❌ Error testing \${url}: \${error.message}\`);
            results.push({
                url,
                error: error.message,
                passed: false
            });
        }
    }
    
    await browser.close();
    
    // Save results
    const resultsFile = path.join(outputDir, 'regression-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(\`\\n📊 Regression test complete. Results saved to: \${resultsFile}\`);
    
    return results;
}

runRegressionTests().catch(console.error);
"@
    
    $scriptFile = Join-Path $env:TEMP "regression-test.js"
    $regressionScript | Out-File -FilePath $scriptFile -Encoding UTF8
    
    try {
        node $scriptFile
        Write-ColorOutput "✅ Visual regression tests completed" "Green"
    } catch {
        Write-ColorOutput "❌ Visual regression tests failed: $($_.Exception.Message)" "Red"
    } finally {
        Remove-Item $scriptFile -ErrorAction SilentlyContinue
    }
}

# Accessibility testing
function Test-Accessibility {
    param([string]$dir)
    
    Write-ColorOutput "♿ Running accessibility tests..." "Blue"
    
    $accessibilityScript = @"
const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const fs = require('fs');
const path = require('path');

async function runAccessibilityTests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const testUrls = [
        'http://localhost:3000',
        'http://localhost:3000/about',
        'http://localhost:3000/contact'
    ];
    
    const results = [];
    const outputDir = './css-test-results/accessibility';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const url of testUrls) {
        console.log(\`♿ Testing accessibility: \${url}\`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle0' });
            
            const axeResults = await new AxePuppeteer(page)
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                .analyze();
            
            const pageName = url.split('/').pop() || 'index';
            
            // Analyze CSS-related accessibility issues
            const cssRelatedIssues = axeResults.violations.filter(violation => 
                violation.tags.includes('cat.color') || 
                violation.tags.includes('cat.sensory-and-visual') ||
                violation.id.includes('color-contrast') ||
                violation.id.includes('focus')
            );
            
            results.push({
                url,
                pageName,
                violations: axeResults.violations.length,
                cssViolations: cssRelatedIssues.length,
                passes: axeResults.passes.length,
                incomplete: axeResults.incomplete.length,
                details: {
                    violations: axeResults.violations,
                    cssRelatedIssues
                }
            });
            
            console.log(\`  \${cssRelatedIssues.length === 0 ? '✅' : '❌'} \${pageName}: \${cssRelatedIssues.length} CSS accessibility issues\`);
            
        } catch (error) {
            console.error(\`❌ Error testing accessibility for \${url}: \${error.message}\`);
            results.push({
                url,
                error: error.message
            });
        }
    }
    
    await browser.close();
    
    // Save results
    const resultsFile = path.join(outputDir, 'accessibility-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(\`\\n♿ Accessibility tests complete. Results saved to: \${resultsFile}\`);
    
    return results;
}

runAccessibilityTests().catch(console.error);
"@
    
    $scriptFile = Join-Path $env:TEMP "accessibility-test.js"
    $accessibilityScript | Out-File -FilePath $scriptFile -Encoding UTF8
    
    try {
        node $scriptFile
        Write-ColorOutput "✅ Accessibility tests completed" "Green"
    } catch {
        Write-ColorOutput "❌ Accessibility tests failed: $($_.Exception.Message)" "Red"
    } finally {
        Remove-Item $scriptFile -ErrorAction SilentlyContinue
    }
}

# Performance testing
function Test-Performance {
    param([string]$dir)
    
    Write-ColorOutput "⚡ Running CSS performance tests..." "Blue"
    
    $performanceScript = @"
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runPerformanceTests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    await page.coverage.startCSSCoverage();
    
    const testUrls = [
        'http://localhost:3000',
        'http://localhost:3000/about',
        'http://localhost:3000/contact'
    ];
    
    const results = [];
    const outputDir = './css-test-results/performance';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const url of testUrls) {
        console.log(\`⚡ Testing performance: \${url}\`);
        
        try {
            // Measure navigation timing
            const startTime = Date.now();
            await page.goto(url, { waitUntil: 'networkidle0' });
            const loadTime = Date.now() - startTime;
            
            // Get performance metrics
            const metrics = await page.metrics();
            
            // Get CSS coverage
            const cssCoverage = await page.coverage.stopCSSCoverage();
            await page.coverage.startCSSCoverage();
            
            // Calculate CSS statistics
            let totalCSSBytes = 0;
            let usedCSSBytes = 0;
            const cssFiles = [];
            
            for (const entry of cssCoverage) {
                if (entry.url.includes('.css')) {
                    totalCSSBytes += entry.text.length;
                    
                    const usedBytes = entry.ranges.reduce((sum, range) => {
                        return sum + (range.end - range.start);
                    }, 0);
                    
                    usedCSSBytes += usedBytes;
                    cssFiles.push({
                        url: entry.url,
                        totalBytes: entry.text.length,
                        usedBytes,
                        coverage: (usedBytes / entry.text.length) * 100
                    });
                }
            }
            
            // Measure render blocking resources
            const renderBlockingCSS = await page.evaluate(() => {
                const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                return cssLinks.map(link => ({
                    href: link.href,
                    media: link.media,
                    blocking: !link.media || link.media === 'all' || link.media === 'screen'
                }));
            });
            
            // Test paint timing
            const paintTimings = await page.evaluate(() => {
                const paintEntries = performance.getEntriesByType('paint');
                const result = {};
                paintEntries.forEach(entry => {
                    result[entry.name] = entry.startTime;
                });
                return result;
            });
            
            const pageName = url.split('/').pop() || 'index';
            
            results.push({
                url,
                pageName,
                loadTime,
                metrics: {
                    ...metrics,
                    paintTimings
                },
                css: {
                    totalBytes: totalCSSBytes,
                    usedBytes: usedCSSBytes,
                    coverage: totalCSSBytes > 0 ? (usedCSSBytes / totalCSSBytes) * 100 : 0,
                    files: cssFiles,
                    renderBlocking: renderBlockingCSS.filter(css => css.blocking).length
                }
            });
            
            console.log(\`  ⚡ \${pageName}: Load time: \${loadTime}ms, CSS coverage: \${Math.round((usedCSSBytes / totalCSSBytes) * 100)}%\`);
            
        } catch (error) {
            console.error(\`❌ Error testing performance for \${url}: \${error.message}\`);
            results.push({
                url,
                error: error.message
            });
        }
    }
    
    await page.coverage.stopCSSCoverage();
    await browser.close();
    
    // Save results
    const resultsFile = path.join(outputDir, 'performance-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(\`\\n⚡ Performance tests complete. Results saved to: \${resultsFile}\`);
    
    return results;
}

runPerformanceTests().catch(console.error);
"@
    
    $scriptFile = Join-Path $env:TEMP "performance-test.js"
    $performanceScript | Out-File -FilePath $scriptFile -Encoding UTF8
    
    try {
        node $scriptFile
        Write-ColorOutput "✅ Performance tests completed" "Green"
    } catch {
        Write-ColorOutput "❌ Performance tests failed: $($_.Exception.Message)" "Red"
    } finally {
        Remove-Item $scriptFile -ErrorAction SilentlyContinue
    }
}

# CSS validation and linting
function Test-Validation {
    param([string]$dir)
    
    Write-ColorOutput "🔍 Running CSS validation and linting..." "Blue"
    
    $validationScript = @"
const fs = require('fs');
const path = require('path');
const csstree = require('css-tree');
const { glob } = require('glob');

async function runValidationTests() {
    const cssFiles = glob.sync('**/*.css', { cwd: '$dir', absolute: true });
    const results = [];
    const outputDir = './css-test-results/validation';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(\`🔍 Found \${cssFiles.length} CSS files to validate\`);
    
    for (const file of cssFiles) {
        console.log(\`  🔍 Validating: \${path.basename(file)}\`);
        
        try {
            const css = fs.readFileSync(file, 'utf8');
            
            // Parse CSS
            let ast;
            const parseErrors = [];
            
            try {
                ast = csstree.parse(css, {
                    filename: file,
                    positions: true
                });
            } catch (error) {
                parseErrors.push({
                    type: 'parse-error',
                    message: error.message,
                    line: error.line,
                    column: error.column
                });
            }
            
            const issues = [...parseErrors];
            const stats = {
                rules: 0,
                selectors: 0,
                declarations: 0,
                atRules: 0,
                comments: 0
            };
            
            if (ast) {
                // Analyze CSS structure and find issues
                csstree.walk(ast, function(node) {
                    switch (node.type) {
                        case 'Rule':
                            stats.rules++;
                            
                            // Check for overly specific selectors
                            if (node.prelude) {
                                const selectorText = csstree.generate(node.prelude);
                                stats.selectors++;
                                
                                // High specificity warning
                                const specificity = (selectorText.match(/#/g) || []).length * 100 +
                                                  (selectorText.match(/\\./g) || []).length * 10 +
                                                  (selectorText.match(/\\w+/g) || []).length;
                                
                                if (specificity > 300) {
                                    issues.push({
                                        type: 'high-specificity',
                                        message: \`High specificity selector: \${selectorText} (specificity: \${specificity})\`,
                                        selector: selectorText,
                                        specificity,
                                        line: node.loc ? node.loc.start.line : null
                                    });
                                }
                            }
                            break;
                            
                        case 'Declaration':
                            stats.declarations++;
                            
                            // Check for vendor prefixes without standard property
                            if (node.property.startsWith('-webkit-') || 
                                node.property.startsWith('-moz-') || 
                                node.property.startsWith('-ms-')) {
                                
                                const standardProp = node.property.replace(/^-\\w+-/, '');
                                issues.push({
                                    type: 'vendor-prefix',
                                    message: \`Vendor prefix without standard property: \${node.property}\`,
                                    property: node.property,
                                    standardProperty: standardProp,
                                    line: node.loc ? node.loc.start.line : null
                                });
                            }
                            
                            // Check for !important usage
                            if (node.important) {
                                issues.push({
                                    type: 'important-usage',
                                    message: \`Usage of !important: \${node.property}\`,
                                    property: node.property,
                                    line: node.loc ? node.loc.start.line : null
                                });
                            }
                            break;
                            
                        case 'Atrule':
                            stats.atRules++;
                            break;
                            
                        case 'Comment':
                            stats.comments++;
                            break;
                    }
                });
            }
            
            results.push({
                file: path.relative('$dir', file),
                valid: parseErrors.length === 0,
                issues,
                stats,
                size: css.length,
                lines: css.split('\\n').length
            });
            
            const issueCount = issues.length;
            console.log(\`    \${issueCount === 0 ? '✅' : '⚠️ '} \${issueCount} issues found\`);
            
        } catch (error) {
            console.error(\`❌ Error validating \${file}: \${error.message}\`);
            results.push({
                file: path.relative('$dir', file),
                error: error.message
            });
        }
    }
    
    // Save results
    const resultsFile = path.join(outputDir, 'validation-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(\`\\n🔍 Validation complete. Results saved to: \${resultsFile}\`);
    
    return results;
}

runValidationTests().catch(console.error);
"@
    
    $scriptFile = Join-Path $env:TEMP "validation-test.js"
    $validationScript | Out-File -FilePath $scriptFile -Encoding UTF8
    
    try {
        node $scriptFile
        Write-ColorOutput "✅ CSS validation completed" "Green"
    } catch {
        Write-ColorOutput "❌ CSS validation failed: $($_.Exception.Message)" "Red"
    } finally {
        Remove-Item $scriptFile -ErrorAction SilentlyContinue
    }
}

# Create baseline
function Create-Baseline {
    param([string]$dir)
    
    Write-ColorOutput "📁 Creating baseline screenshots and metrics..." "Blue"
    
    $baselineDir = "./css-test-results/baseline"
    if (-not (Test-Path $baselineDir)) {
        New-Item -ItemType Directory -Path $baselineDir -Force | Out-Null
    }
    
    # Run visual regression with baseline creation
    Test-VisualRegression -dir $dir -baseline $baselineDir
    
    Write-ColorOutput "✅ Baseline created in $baselineDir" "Green"
}

# Generate comprehensive report
function Generate-Report {
    param([string]$dir)
    
    Write-ColorOutput "📊 Generating comprehensive test report..." "Blue"
    
    $reportScript = @"
const fs = require('fs');
const path = require('path');

function generateHTMLReport() {
    const resultsDir = './css-test-results';
    const reportDir = path.join(resultsDir, 'reports');
    
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Collect all test results
    const testResults = {
        regression: loadResults('regression/regression-results.json'),
        accessibility: loadResults('accessibility/accessibility-results.json'),
        performance: loadResults('performance/performance-results.json'),
        validation: loadResults('validation/validation-results.json')
    };
    
    function loadResults(fileName) {
        try {
            const filePath = path.join(resultsDir, fileName);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.warn(\`Could not load \${fileName}: \${error.message}\`);
        }
        return null;
    }
    
    // Generate HTML report
    const htmlReport = \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Test Results Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'p3-red': 'color(display-p3 1 0 0)',
                        'p3-green': 'color(display-p3 0 1 0)',
                        'p3-blue': 'color(display-p3 0 0 1)',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen">
    <div class="container mx-auto px-6 py-8">
        <header class="mb-8">
            <h1 class="text-4xl font-bold text-cyan-400 mb-2">🧪 CSS Test Results</h1>
            <p class="text-gray-300">Generated on \${new Date().toLocaleString()}</p>
        </header>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            \${generateSummaryCard('Visual Regression', testResults.regression, 'bg-purple-800')}
            \${generateSummaryCard('Accessibility', testResults.accessibility, 'bg-green-800')}
            \${generateSummaryCard('Performance', testResults.performance, 'bg-blue-800')}
            \${generateSummaryCard('Validation', testResults.validation, 'bg-orange-800')}
        </div>
        
        <div class="space-y-8">
            \${generateDetailSection('Visual Regression Tests', testResults.regression, generateRegressionDetails)}
            \${generateDetailSection('Accessibility Tests', testResults.accessibility, generateAccessibilityDetails)}
            \${generateDetailSection('Performance Tests', testResults.performance, generatePerformanceDetails)}
            \${generateDetailSection('Validation Tests', testResults.validation, generateValidationDetails)}
        </div>
    </div>
    
    <script>
        // Interactive features
        function toggleSection(id) {
            const section = document.getElementById(id);
            section.classList.toggle('hidden');
        }
        
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
        }
    </script>
</body>
</html>
    \`;
    
    function generateSummaryCard(title, results, bgClass) {
        if (!results || !Array.isArray(results)) {
            return \`
                <div class="\${bgClass} rounded-lg p-6">
                    <h3 class="text-xl font-semibold mb-2">\${title}</h3>
                    <p class="text-gray-300">No results available</p>
                </div>
            \`;
        }
        
        const total = results.length;
        const passed = results.filter(r => r.passed || r.issues?.length === 0).length;
        const failed = total - passed;
        
        return \`
            <div class="\${bgClass} rounded-lg p-6">
                <h3 class="text-xl font-semibold mb-2">\${title}</h3>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span>Total:</span>
                        <span class="font-mono">\${total}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Passed:</span>
                        <span class="font-mono text-green-400">\${passed}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Failed:</span>
                        <span class="font-mono text-red-400">\${failed}</span>
                    </div>
                </div>
            </div>
        \`;
    }
    
    function generateDetailSection(title, results, detailGenerator) {
        if (!results) return '';
        
        return \`
            <section class="bg-gray-800 rounded-lg p-6">
                <h2 class="text-2xl font-semibold mb-4 cursor-pointer" onclick="toggleSection('\${title.replace(/\\s+/g, '-').toLowerCase()}-details')">
                    \${title} 
                    <span class="text-gray-400 text-sm">(\${results.length} tests)</span>
                </h2>
                <div id="\${title.replace(/\\s+/g, '-').toLowerCase()}-details">
                    \${detailGenerator(results)}
                </div>
            </section>
        \`;
    }
    
    function generateRegressionDetails(results) {
        return results.map(result => \`
            <div class="border-l-4 \${result.passed ? 'border-green-500' : 'border-red-500'} pl-4 mb-4">
                <h4 class="font-semibold">\${result.pageName}</h4>
                <p class="text-sm text-gray-400">\${result.url}</p>
                \${result.pixelDifference !== undefined ? 
                    \`<p class="text-sm">Pixel difference: \${result.pixelDifference}</p>\` : 
                    ''
                }
                \${result.error ? \`<p class="text-red-400 text-sm">Error: \${result.error}</p>\` : ''}
            </div>
        \`).join('');
    }
    
    function generateAccessibilityDetails(results) {
        return results.map(result => \`
            <div class="border-l-4 \${result.cssViolations === 0 ? 'border-green-500' : 'border-red-500'} pl-4 mb-4">
                <h4 class="font-semibold">\${result.pageName}</h4>
                <p class="text-sm text-gray-400">\${result.url}</p>
                <p class="text-sm">CSS Violations: \${result.cssViolations || 0}</p>
                <p class="text-sm">Total Violations: \${result.violations || 0}</p>
            </div>
        \`).join('');
    }
    
    function generatePerformanceDetails(results) {
        return results.map(result => \`
            <div class="border-l-4 border-blue-500 pl-4 mb-4">
                <h4 class="font-semibold">\${result.pageName}</h4>
                <p class="text-sm text-gray-400">\${result.url}</p>
                <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>Load Time: \${result.loadTime}ms</div>
                    <div>CSS Coverage: \${Math.round(result.css?.coverage || 0)}%</div>
                    <div>CSS Size: \${Math.round((result.css?.totalBytes || 0) / 1024)}KB</div>
                    <div>Render Blocking: \${result.css?.renderBlocking || 0}</div>
                </div>
            </div>
        \`).join('');
    }
    
    function generateValidationDetails(results) {
        return results.map(result => \`
            <div class="border-l-4 \${result.issues?.length === 0 ? 'border-green-500' : 'border-yellow-500'} pl-4 mb-4">
                <h4 class="font-semibold">\${result.file}</h4>
                <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>Issues: \${result.issues?.length || 0}</div>
                    <div>Rules: \${result.stats?.rules || 0}</div>
                    <div>Size: \${Math.round((result.size || 0) / 1024)}KB</div>
                    <div>Lines: \${result.lines || 0}</div>
                </div>
            </div>
        \`).join('');
    }
    
    const reportPath = path.join(reportDir, 'css-test-report.html');
    fs.writeFileSync(reportPath, htmlReport);
    
    console.log(\`📊 HTML report generated: \${reportPath}\`);
    
    return reportPath;
}

generateHTMLReport();
"@
    
    $scriptFile = Join-Path $env:TEMP "report-generator.js"
    $reportScript | Out-File -FilePath $scriptFile -Encoding UTF8
    
    try {
        node $scriptFile
        Write-ColorOutput "✅ Comprehensive report generated" "Green"
    } catch {
        Write-ColorOutput "❌ Report generation failed: $($_.Exception.Message)" "Red"
    } finally {
        Remove-Item $scriptFile -ErrorAction SilentlyContinue
    }
}

# Main execution logic
try {
    Write-ColorOutput "🧪 CSS Testing Infrastructure" "Cyan"
    Write-Host ""
    
    if (-not (Test-Dependencies)) {
        exit 1
    }
    
    if (-not (Install-TestingPackages)) {
        exit 1
    }
    
    Write-ColorOutput "📋 Test Configuration:" "Green"
    Write-Host "  Action: $Action"
    Write-Host "  Directory: $(Resolve-Path $Directory)"
    Write-Host "  Test Type: $TestType"
    Write-Host "  Browser: $Browser"
    Write-Host "  Output Format: $OutputFormat"
    if ($Baseline) { Write-Host "  Baseline: $Baseline" }
    Write-Host ""
    
    switch ($Action.ToLower()) {
        "regression" { 
            Test-VisualRegression -dir $Directory -baseline $Baseline 
        }
        "accessibility" { 
            Test-Accessibility -dir $Directory 
        }
        "performance" { 
            Test-Performance -dir $Directory 
        }
        "validation" { 
            Test-Validation -dir $Directory 
        }
        "baseline" { 
            Create-Baseline -dir $Directory 
        }
        "compare" { 
            if (-not $Baseline) {
                Write-ColorOutput "❌ Baseline path required for comparison" "Red"
                exit 1
            }
            Test-VisualRegression -dir $Directory -baseline $Baseline 
        }
        "report" { 
            Generate-Report -dir $Directory 
        }
        "all" {
            Write-ColorOutput "🔄 Running all tests..." "Yellow"
            Test-VisualRegression -dir $Directory -baseline $Baseline
            Test-Accessibility -dir $Directory
            Test-Performance -dir $Directory
            Test-Validation -dir $Directory
            Generate-Report -dir $Directory
        }
        default {
            Write-ColorOutput "❌ Unknown action: $Action" "Red"
            Show-Help
        }
    }
    
    Write-ColorOutput "✅ CSS testing completed successfully!" "Green"
    
} catch {
    Write-ColorOutput "❌ CSS testing failed: $($_.Exception.Message)" "Red"
    if ($Verbose) {
        Write-Host $_.ScriptStackTrace
    }
    exit 1
}
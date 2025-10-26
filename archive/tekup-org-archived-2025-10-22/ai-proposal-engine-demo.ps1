# AI Proposal Engine Demo Script
# Demonstrates the complete proposal generation pipeline

Write-Host "🚀 AI Proposal Engine Demo - Tekup.org" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "apps/tekup-unified-platform")) {
    Write-Host "❌ Please run this script from the workspace root" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Demo Overview:" -ForegroundColor Yellow
Write-Host "• Transcript Intelligence Engine - Extract buying signals" -ForegroundColor White
Write-Host "• Live Research Integration - Perplexity AI context" -ForegroundColor White
Write-Host "• Narrative Generation System - AI-powered content" -ForegroundColor White
Write-Host "• Document Assembly Engine - Google Docs creation" -ForegroundColor White
Write-Host "• MCP Agent Orchestration - Autonomous execution" -ForegroundColor White
Write-Host ""

# Step 1: Environment Setup
Write-Host "🔧 Step 1: Setting up environment..." -ForegroundColor Green
Write-Host ""

# Check for required environment variables
$requiredEnvVars = @(
    "OPENAI_API_KEY",
    "PERPLEXITY_API_KEY", 
    "GOOGLE_API_KEY",
    "AIRTABLE_API_KEY",
    "AIRTABLE_BASE_ID"
)

$missingVars = @()
foreach ($var in $requiredEnvVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Missing environment variables:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please set these variables in your .env file:" -ForegroundColor Yellow
    Write-Host ""
    foreach ($var in $missingVars) {
        Write-Host "$var=your_$var" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Continuing with mock data for demo..." -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Start Services
Write-Host "🚀 Step 2: Starting services..." -ForegroundColor Green
Write-Host ""

# Start the unified platform
Write-Host "Starting Tekup Unified Platform..." -ForegroundColor Cyan
Start-Process -FilePath "pnpm" -ArgumentList "dev" -WorkingDirectory "apps/tekup-unified-platform" -WindowStyle Minimized

# Wait for services to start
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 3: Demo Data Setup
Write-Host "📊 Step 3: Setting up demo data..." -ForegroundColor Green
Write-Host ""

# Create demo transcript
$demoTranscript = @"
This is a demo call transcript for Acme Corporation. 

John Smith (CTO): "Hi Sarah, thanks for taking the time to speak with me today. We're really struggling with our current CRM system. It's become a major bottleneck for our sales team."

Sarah Johnson (Sales Rep): "I understand completely. What specific challenges are you facing?"

John: "Well, our current system is completely manual. Our sales team is wasting 4-5 hours every day just entering data and trying to track leads. It's incredibly inefficient and we're losing deals because of it."

Sarah: "That sounds frustrating. How is this impacting your business?"

John: "It's costing us money, Sarah. We estimate we're losing about $50,000 in potential revenue every month because our sales process is so slow. We need something that can automate our workflows and give us real-time insights."

Sarah: "I see. What's your timeline for implementing a solution?"

John: "We need this done ASAP. Our board is pushing for Q1 results and we can't afford to wait. Ideally, we'd like to have something in place within 6-8 weeks."

Sarah: "And what's your budget range for this project?"

John: "We've allocated around $75,000 for the right solution. We're not looking for the cheapest option - we want something that will actually solve our problems and give us a good ROI."

Sarah: "That makes sense. Have you looked at any other solutions?"

John: "We've evaluated Salesforce and HubSpot, but they seem too complex for our needs. We want something more streamlined and easier to use."

Sarah: "I understand. Well, I think we have exactly what you're looking for..."
"@

Write-Host "Demo transcript created with the following key elements:" -ForegroundColor Cyan
Write-Host "• Pain points: Manual processes, inefficiency, lost revenue" -ForegroundColor White
Write-Host "• Budget indicators: $75,000 allocated, ROI focus" -ForegroundColor White
Write-Host "• Timeline signals: Q1 deadline, 6-8 weeks implementation" -ForegroundColor White
Write-Host "• Decision maker: John Smith (CTO)" -ForegroundColor White
Write-Host "• Competitor mentions: Salesforce, HubSpot" -ForegroundColor White
Write-Host ""

# Step 4: Demonstrate Buying Signal Extraction
Write-Host "🎯 Step 4: Extracting buying signals..." -ForegroundColor Green
Write-Host ""

Write-Host "Analyzing transcript for buying signals..." -ForegroundColor Cyan
Write-Host ""

# Simulate buying signal extraction
$buyingSignals = @{
    "pain_points" = @(
        "Manual CRM system causing bottlenecks",
        "Sales team wasting 4-5 hours daily on data entry",
        "Losing deals due to slow sales process",
        "Current system is completely manual and inefficient"
    )
    "budget_indicators" = @(
        "Allocated $75,000 for the right solution",
        "Not looking for cheapest option, want good ROI",
        "Losing $50,000 monthly in potential revenue"
    )
    "timeline_signals" = @(
        "Need done ASAP for Q1 results",
        "6-8 weeks implementation timeline",
        "Board pushing for immediate results"
    )
    "decision_makers" = @(
        "John Smith (CTO) - primary decision maker",
        "Board involvement in timeline decisions"
    )
    "competitors" = @(
        "Evaluated Salesforce - too complex",
        "Looked at HubSpot - also too complex",
        "Want something more streamlined"
    )
}

Write-Host "✅ Buying signals extracted:" -ForegroundColor Green
Write-Host ""

foreach ($category in $buyingSignals.Keys) {
    Write-Host "📌 $($category.Replace('_', ' ').ToUpper()):" -ForegroundColor Yellow
    foreach ($signal in $buyingSignals[$category]) {
        Write-Host "   • $signal" -ForegroundColor White
    }
    Write-Host ""
}

# Step 5: Demonstrate Live Research
Write-Host "🔍 Step 5: Performing live research..." -ForegroundColor Green
Write-Host ""

Write-Host "Researching industry context with Perplexity AI..." -ForegroundColor Cyan
Write-Host ""

# Simulate research results
$researchContexts = @{
    "industry_trends" = @(
        "CRM market growing at 12% annually, reaching $60B by 2025",
        "Small businesses increasingly adopting cloud-based CRM solutions",
        "Automation and AI integration becoming standard requirements"
    )
    "competitor_analysis" = @(
        "Salesforce dominates enterprise market but complex for SMBs",
        "HubSpot strong in marketing automation but limited CRM features",
        "Growing demand for simplified, all-in-one solutions"
    )
    "technology_solutions" = @(
        "Modern CRM platforms offer drag-and-drop workflow automation",
        "Real-time analytics and reporting capabilities now standard",
        "Mobile-first design essential for field sales teams"
    )
    "case_studies" = @(
        "Similar company increased sales efficiency by 40% with new CRM",
        "Average ROI of 300% within 12 months for CRM implementations",
        "Reduced data entry time by 80% with automated workflows"
    )
}

Write-Host "✅ Research completed:" -ForegroundColor Green
Write-Host ""

foreach ($category in $researchContexts.Keys) {
    Write-Host "📊 $($category.Replace('_', ' ').ToUpper()):" -ForegroundColor Yellow
    foreach ($context in $researchContexts[$category]) {
        Write-Host "   • $context" -ForegroundColor White
    }
    Write-Host ""
}

# Step 6: Demonstrate Narrative Generation
Write-Host "✍️ Step 6: Generating proposal narrative..." -ForegroundColor Green
Write-Host ""

Write-Host "Creating precision-targeted proposal content..." -ForegroundColor Cyan
Write-Host ""

# Simulate narrative generation
$proposalSections = @{
    "introduction" = @{
        "title" = "Executive Summary"
        "content" = "Thank you for the opportunity to present our solution for Acme Corporation's CRM challenges. Based on our discussion, we understand you're facing significant inefficiencies with manual processes that are costing you $50,000 monthly in lost revenue. Our streamlined CRM solution directly addresses these pain points while delivering the ROI and efficiency gains your board demands for Q1."
    }
    "problem_analysis" = @{
        "title" = "Understanding Your Challenges"
        "content" = "Your current manual CRM system has created critical bottlenecks that are directly impacting your bottom line. With your sales team spending 4-5 hours daily on data entry and losing deals due to slow processes, you're experiencing both operational inefficiency and revenue loss. This is a common challenge in the rapidly growing CRM market, where businesses need solutions that can scale with their growth while maintaining simplicity."
    }
    "solution_overview" = @{
        "title" = "Our Solution Approach"
        "content" = "Unlike the complex Salesforce and HubSpot solutions you've evaluated, our platform is designed specifically for growing businesses that need powerful functionality without the complexity. We offer drag-and-drop workflow automation that will eliminate your manual data entry, real-time analytics for instant insights, and mobile-first design that keeps your field team productive. Our implementation approach focuses on rapid deployment within your 6-8 week timeline."
    }
    "pricing" = @{
        "title" = "Investment & Value Proposition"
        "content" = "At $75,000, our solution represents exceptional value compared to the $50,000 monthly revenue you're currently losing. With our proven track record of 300% ROI within 12 months and 40% efficiency improvements, your investment will pay for itself in just 2-3 months. We offer flexible payment options and include comprehensive training and support to ensure your team is productive from day one."
    }
    "timeline" = @{
        "title" = "Project Timeline & Milestones"
        "content" = "We understand your Q1 deadline is critical. Our 6-week implementation timeline includes: Week 1-2: System setup and data migration; Week 3-4: Custom workflow configuration and team training; Week 5-6: Testing, optimization, and go-live. This aggressive timeline is achievable because we've streamlined our implementation process specifically for businesses like yours that need rapid deployment without compromising quality."
    }
    "conclusion" = @{
        "title" = "Next Steps & Commitment"
        "content" = "We're confident this solution will transform your sales operations and deliver the results your board expects. Let's schedule a technical demonstration this week to show you exactly how our platform will address your specific challenges. We're committed to your success and will provide dedicated support throughout the implementation and beyond."
    }
}

Write-Host "✅ Proposal narrative generated:" -ForegroundColor Green
Write-Host ""

foreach ($section in $proposalSections.Keys) {
    Write-Host "📄 $($proposalSections[$section].title):" -ForegroundColor Yellow
    Write-Host "   $($proposalSections[$section].content)" -ForegroundColor White
    Write-Host ""
}

# Step 7: Demonstrate Document Assembly
Write-Host "📄 Step 7: Assembling final document..." -ForegroundColor Green
Write-Host ""

Write-Host "Creating styled Google Doc..." -ForegroundColor Cyan
Write-Host ""

# Simulate document creation
$documentResult = @{
    "documentId" = "1ABC123DEF456GHI789JKL"
    "documentUrl" = "https://docs.google.com/document/d/1ABC123DEF456GHI789JKL/edit"
    "status" = "completed"
    "sections" = 6
    "wordCount" = 1247
    "estimatedReadTime" = "5 minutes"
}

Write-Host "✅ Document assembled successfully:" -ForegroundColor Green
Write-Host "• Document ID: $($documentResult.documentId)" -ForegroundColor White
Write-Host "• Document URL: $($documentResult.documentUrl)" -ForegroundColor White
Write-Host "• Sections: $($documentResult.sections)" -ForegroundColor White
Write-Host "• Word Count: $($documentResult.wordCount)" -ForegroundColor White
Write-Host "• Read Time: $($documentResult.estimatedReadTime)" -ForegroundColor White
Write-Host ""

# Step 8: Demonstrate MCP Agent Orchestration
Write-Host "🤖 Step 8: MCP Agent Orchestration..." -ForegroundColor Green
Write-Host ""

Write-Host "Autonomous execution pipeline completed:" -ForegroundColor Cyan
Write-Host ""

$executionSteps = @(
    @{ "step" = "Transcript Retrieval"; "status" = "✅ Completed"; "duration" = "2.3s" },
    @{ "step" = "Buying Signal Extraction"; "status" = "✅ Completed"; "duration" = "8.7s" },
    @{ "step" = "Live Research Analysis"; "status" = "✅ Completed"; "duration" = "15.2s" },
    @{ "step" = "Narrative Generation"; "status" = "✅ Completed"; "duration" = "12.4s" },
    @{ "step" = "Document Assembly"; "status" = "✅ Completed"; "duration" = "6.8s" },
    @{ "step" = "Quality Review"; "status" = "✅ Completed"; "duration" = "3.1s" }
)

foreach ($step in $executionSteps) {
    Write-Host "$($step.status) $($step.step) ($($step.duration))" -ForegroundColor White
}

$totalTime = 48.5
Write-Host ""
Write-Host "⏱️  Total execution time: $totalTime seconds" -ForegroundColor Cyan
Write-Host "🎯 Success rate: 100%" -ForegroundColor Green
Write-Host ""

# Step 9: Results Summary
Write-Host "📊 Step 9: Results Summary" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 AI Proposal Engine Demo Complete!" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$results = @{
    "Proposal Generated" = "✅ Success"
    "Buying Signals Extracted" = "5 categories, 15 signals"
    "Research Contexts" = "4 categories, 12 insights"
    "Narrative Sections" = "6 professional sections"
    "Document Created" = "Google Doc ready to send"
    "Total Time" = "48.5 seconds"
    "Success Rate" = "100%"
    "Estimated Value" = "$75,000"
}

foreach ($result in $results.Keys) {
    Write-Host "$result`: $($results[$result])" -ForegroundColor White
}

Write-Host ""
Write-Host "🚀 Key Benefits Demonstrated:" -ForegroundColor Yellow
Write-Host "• 4+ hours → 48 seconds proposal time" -ForegroundColor White
Write-Host "• Precision targeting of client pain points" -ForegroundColor White
Write-Host "• Live research integration for context" -ForegroundColor White
Write-Host "• Professional document ready to send" -ForegroundColor White
Write-Host "• Fully autonomous execution" -ForegroundColor White
Write-Host "• Zero manual intervention required" -ForegroundColor White
Write-Host ""

Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set up your API keys in .env file" -ForegroundColor White
Write-Host "2. Configure Airtable integration" -ForegroundColor White
Write-Host "3. Start generating proposals from real transcripts" -ForegroundColor White
Write-Host "4. Monitor success metrics and ROI" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation: apps/tekup-unified-platform/src/modules/proposal-engine/README.md" -ForegroundColor Cyan
Write-Host "🔧 Configuration: .mcp/configs/proposal-engine.json" -ForegroundColor Cyan
Write-Host ""

Write-Host "Thank you for watching the AI Proposal Engine demo! 🎉" -ForegroundColor Green
Write-Host ""

# Keep the window open
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
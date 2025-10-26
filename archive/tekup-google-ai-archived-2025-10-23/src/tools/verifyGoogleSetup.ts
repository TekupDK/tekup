/**
 * Google Service Account Verification Tool
 * 
 * This tool helps diagnose Google authentication issues by checking:
 * - Environment variables are set
 * - Private key format is valid
 * - Service account credentials are readable
 * - Project ID matches expected format
 */

import { googleConfig } from "../config";
import { logger } from "../logger";

interface VerificationResult {
    check: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ WARNING";
    message: string;
    details?: string;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: VerificationResult["status"], message: string, details?: string) {
    results.push({ check, status, message, details });
}

function verifyEnvironmentVariables() {
    console.log("\n🔍 Checking Environment Variables...\n");

    // Check PROJECT_ID
    if (googleConfig.GOOGLE_PROJECT_ID) {
        addResult(
            "GOOGLE_PROJECT_ID",
            "✅ PASS",
            `Project ID set: ${googleConfig.GOOGLE_PROJECT_ID}`
        );
    } else {
        addResult(
            "GOOGLE_PROJECT_ID",
            "❌ FAIL",
            "GOOGLE_PROJECT_ID is not set in .env",
            "Add: GOOGLE_PROJECT_ID=your-project-id"
        );
    }

    // Check CLIENT_EMAIL
    if (googleConfig.GOOGLE_CLIENT_EMAIL) {
        const emailPattern = /^.+@.+\.iam\.gserviceaccount\.com$/;
        if (emailPattern.test(googleConfig.GOOGLE_CLIENT_EMAIL)) {
            addResult(
                "GOOGLE_CLIENT_EMAIL",
                "✅ PASS",
                `Service account email: ${googleConfig.GOOGLE_CLIENT_EMAIL.split("@")[0].substring(0, 4)}****@${googleConfig.GOOGLE_CLIENT_EMAIL.split("@")[1]}`
            );
        } else {
            addResult(
                "GOOGLE_CLIENT_EMAIL",
                "⚠️ WARNING",
                "Email doesn't match service account pattern",
                "Expected format: name@project-id.iam.gserviceaccount.com"
            );
        }
    } else {
        addResult(
            "GOOGLE_CLIENT_EMAIL",
            "❌ FAIL",
            "GOOGLE_CLIENT_EMAIL is not set in .env",
            "Add: GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com"
        );
    }

    // Check PRIVATE_KEY
    if (googleConfig.GOOGLE_PRIVATE_KEY) {
        const key = googleConfig.GOOGLE_PRIVATE_KEY;

        if (key.includes("BEGIN PRIVATE KEY") && key.includes("END PRIVATE KEY")) {
            addResult(
                "GOOGLE_PRIVATE_KEY",
                "✅ PASS",
                "Private key format looks correct",
                `Key length: ${key.length} characters`
            );
        } else {
            addResult(
                "GOOGLE_PRIVATE_KEY",
                "❌ FAIL",
                "Private key doesn't contain BEGIN/END markers",
                "Check that you copied the entire key including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----"
            );
        }

        // Check for proper newline escaping
        if (key.includes("\\n")) {
            addResult(
                "PRIVATE_KEY Newlines",
                "✅ PASS",
                "Private key uses escaped newlines (\\n)"
            );
        } else if (key.includes("\n")) {
            addResult(
                "PRIVATE_KEY Newlines",
                "⚠️ WARNING",
                "Private key contains literal newlines",
                "Consider using \\n instead for better compatibility"
            );
        }
    } else {
        addResult(
            "GOOGLE_PRIVATE_KEY",
            "❌ FAIL",
            "GOOGLE_PRIVATE_KEY is not set in .env",
            'Add: GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"'
        );
    }

    // Check IMPERSONATED_USER
    if (googleConfig.GOOGLE_IMPERSONATED_USER) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(googleConfig.GOOGLE_IMPERSONATED_USER)) {
            addResult(
                "GOOGLE_IMPERSONATED_USER",
                "✅ PASS",
                `Impersonated user: ${googleConfig.GOOGLE_IMPERSONATED_USER}`
            );
        } else {
            addResult(
                "GOOGLE_IMPERSONATED_USER",
                "⚠️ WARNING",
                "Email format looks unusual",
                "Expected: user@domain.com"
            );
        }
    } else {
        addResult(
            "GOOGLE_IMPERSONATED_USER",
            "❌ FAIL",
            "GOOGLE_IMPERSONATED_USER is not set in .env",
            "Add: GOOGLE_IMPERSONATED_USER=user@yourdomain.com"
        );
    }
}

function verifyProjectMatch() {
    console.log("\n🔍 Checking Project ID Consistency...\n");

    if (googleConfig.GOOGLE_PROJECT_ID && googleConfig.GOOGLE_CLIENT_EMAIL) {
        const projectFromEmail = googleConfig.GOOGLE_CLIENT_EMAIL.split("@")[1]?.split(".")[0];

        if (projectFromEmail === googleConfig.GOOGLE_PROJECT_ID) {
            addResult(
                "Project ID Match",
                "✅ PASS",
                "Project ID matches service account email"
            );
        } else {
            addResult(
                "Project ID Match",
                "⚠️ WARNING",
                `Mismatch: PROJECT_ID="${googleConfig.GOOGLE_PROJECT_ID}" but email suggests "${projectFromEmail}"`,
                "This might be intentional if using cross-project service accounts"
            );
        }
    }
}

function printResults() {
    console.log("\n" + "=".repeat(80));
    console.log("📊 VERIFICATION RESULTS");
    console.log("=".repeat(80) + "\n");

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const result of results) {
        console.log(`${result.status} ${result.check}`);
        console.log(`   ${result.message}`);
        if (result.details) {
            console.log(`   ℹ️  ${result.details}`);
        }
        console.log();

        if (result.status === "✅ PASS") passed++;
        if (result.status === "❌ FAIL") failed++;
        if (result.status === "⚠️ WARNING") warnings++;
    }

    console.log("=".repeat(80));
    console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️ Warnings: ${warnings}`);
    console.log("=".repeat(80) + "\n");
}

function printNextSteps() {
    const hasFails = results.some(r => r.status === "❌ FAIL");

    if (hasFails) {
        console.log("🔧 NEXT STEPS:\n");
        console.log("1. Fix the failed checks above by updating your .env file");
        console.log("2. Make sure you copied the entire private key from Google Cloud Console");
        console.log("3. Run this verification again: npm run verify:google\n");
        console.log("📖 See docs/SETUP_CHECKLIST.md for detailed setup instructions\n");
    } else {
        console.log("✨ Environment variables look good!\n");
        console.log("🔧 NEXT STEPS:\n");
        console.log("1. Verify Domain-wide Delegation is enabled in Google Cloud Console");
        console.log("   → https://console.cloud.google.com/iam-admin/serviceaccounts?project=" + googleConfig.GOOGLE_PROJECT_ID);
        console.log("\n2. Authorize scopes in Google Workspace Admin Console");
        console.log("   → https://admin.google.com/ac/owl/domainwidedelegation");
        console.log("   → Add these scopes:");
        console.log("     https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/calendar.readonly");
        console.log("\n3. Wait 5-10 minutes for changes to propagate");
        console.log("\n4. Test the connection:");
        console.log("   npm run data:fetch");
        console.log("\n📖 See docs/SETUP_CHECKLIST.md for complete step-by-step guide\n");
    }
}

function main() {
    console.log("\n🔐 Google Service Account Verification Tool\n");
    console.log("This tool checks if your Google service account is configured correctly.\n");

    try {
        verifyEnvironmentVariables();
        verifyProjectMatch();
        printResults();
        printNextSteps();

        const hasFails = results.some(r => r.status === "❌ FAIL");
        process.exit(hasFails ? 1 : 0);
    } catch (error) {
        logger.error({ err: error }, "Verification failed with unexpected error");
        console.error("\n❌ Verification failed:", error);
        process.exit(1);
    }
}

try {
    main();
} catch (error) {
    logger.error({ err: error }, "Main execution failed");
    console.error("\n❌ Execution failed:", error);
    process.exit(1);
}

import { mkdir, writeFile } from "fs/promises";
import { resolve as resolvePath } from "path";
import process from "process";
import { googleConfig, isLiveMode, testConfig } from "../config";
import { logger } from "../logger";
import { sendGenericEmail, type GmailDraftSummary } from "../services/gmailService";
import { createCalendarEvent, type CalendarActionResult } from "../services/calendarService";

type CliOptions = { allowDryRun: boolean };

function parseArgs(): CliOptions {
    return {
        allowDryRun: process.argv.includes("--allow-dry-run"),
    };
}

function ensureLiveMode(options: CliOptions): void {
    if (isLiveMode || options.allowDryRun) {
        return;
    }

    logger.error(
        { runMode: googleConfig.RUN_MODE },
        "RUN_MODE must be 'live' to execute the smoke test. Re-run with RUN_MODE=live or use --allow-dry-run."
    );
    process.exitCode = 1;
    process.exit(1);
}

function resolveEmailRecipient(): string {
    const recipient =
        testConfig.SMOKETEST_EMAIL_TO ??
        googleConfig.DEFAULT_EMAIL_FROM ??
        googleConfig.GOOGLE_IMPERSONATED_USER ??
        googleConfig.GOOGLE_CLIENT_EMAIL;

    if (!recipient) {
        throw new Error(
            "No email recipient configured. Set SMOKETEST_EMAIL_TO or ensure DEFAULT_EMAIL_FROM/GOOGLE_IMPERSONATED_USER is defined."
        );
    }

    return recipient;
}

function ensureNotDryRun(isDryRun: boolean, allowDryRun: boolean, message: string): void {
    if (isDryRun && !allowDryRun) {
        throw new Error(message);
    }
}

async function sendSmokeEmail(
    recipient: string,
    subject: string,
    timezone: string,
    allowDryRun: boolean
): Promise<GmailDraftSummary> {
    const now = new Date();
    const emailBody = `<!DOCTYPE html>
<html lang="da">
  <body>
    <p>Hej fra RenOS 🤖</p>
    <p>Dette er en automatisk smoke test, der bekræfter at Gmail-impersonation virker.</p>
    <p>Tidspunkt: ${now.toLocaleString("da-DK", { timeZone: timezone })}</p>
    <p>Hvis du modtager denne mail, er live-adgangen sat korrekt op.</p>
  </body>
</html>`;

    const result = await sendGenericEmail({ to: recipient, subject, body: emailBody });

    ensureNotDryRun(
        result.dryRun,
        allowDryRun,
        "Email was not sent because the system is in dry-run mode or credentials are missing."
    );

    return result;
}

async function createSmokeEvent(
    recipient: string,
    subject: string,
    timezone: string,
    calendarId: string,
    allowDryRun: boolean
): Promise<CalendarActionResult> {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const result = await createCalendarEvent({
        summary: subject,
        description: "RenOS smoke test – bekræfter live kalenderadgang.",
        start: { dateTime: start.toISOString(), timeZone: timezone },
        end: { dateTime: end.toISOString(), timeZone: timezone },
        attendees: [{ email: recipient }],
        calendarId,
    });

    ensureNotDryRun(
        result.dryRun,
        allowDryRun,
        "Calendar event was not created because the system is in dry-run mode or credentials are missing."
    );

    return result;
}

async function persistReport(report: object, timestamp: number): Promise<string> {
    const reportsDir = resolvePath(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const filename = resolvePath(reportsDir, `google-live-test-${timestamp}.json`);
    await writeFile(filename, JSON.stringify(report, null, 2), "utf-8");
    return filename;
}

interface SmokeTestOutcome {
    emailId: string;
    calendarId: string;
    reportFile: string;
    dryRun: boolean;
}

function resolveTimezone(): string {
    return testConfig.SMOKETEST_TIMEZONE;
}

function resolveCalendarId(): string {
    return testConfig.SMOKETEST_CALENDAR_ID ?? "primary";
}

function buildSubject(timestamp: number): string {
    return `RenOS Live Smoke Test ${new Date(timestamp).toISOString()}`;
}

async function executeSmokeTest(options: CliOptions): Promise<SmokeTestOutcome> {
    const timestamp = Date.now();
    const subject = buildSubject(timestamp);
    const timezone = resolveTimezone();
    const calendarId = resolveCalendarId();
    const recipient = resolveEmailRecipient();

    const emailResult = await sendSmokeEmail(recipient, subject, timezone, options.allowDryRun);
    const calendarResult = await createSmokeEvent(
        recipient,
        subject,
        timezone,
        calendarId,
        options.allowDryRun
    );

    const report = {
        executedAt: new Date(timestamp).toISOString(),
        runMode: googleConfig.RUN_MODE,
        allowDryRun: options.allowDryRun,
        email: emailResult,
        calendar: calendarResult,
    };

    const reportFile = await persistReport(report, timestamp);

    return {
        emailId: emailResult.id,
        calendarId: calendarResult.id,
        reportFile,
        dryRun: emailResult.dryRun || calendarResult.dryRun,
    };
}

async function main(): Promise<void> {
    const options = parseArgs();
    ensureLiveMode(options);

    const outcome = await executeSmokeTest(options);

    if (outcome.dryRun) {
        logger.warn(outcome, "Google smoke test completed in dry-run mode");
        return;
    }

    logger.info(outcome, "Google live smoke test completed successfully");
}

main().catch((error: unknown) => {
    logger.error({ error }, "Google live smoke test failed");
    process.exitCode = 1;
});

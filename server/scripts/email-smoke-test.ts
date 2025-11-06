/*
  Email Smoke Test
  - Sends an email to self with a unique subject
  - Waits for the thread to appear
  - Archives (remove INBOX), verifies
  - Marks UNREAD/READ via thread label modification, verifies
  - Deletes the thread (permanent delete)
  - Prints a concise summary

  Run (dev env): pnpm tsx server/scripts/email-smoke-test.ts
  Prefer via npm script with dotenv: pnpm run test:email-smoke
*/

import "dotenv/config";
import {
  getGmailThread,
  modifyGmailThread,
  searchGmailThreads,
  sendGmailMessage,
} from "../google-api";

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function now() {
  return new Date().toISOString();
}

async function main() {
  const user = process.env.GOOGLE_IMPERSONATED_USER;
  if (!user) {
    console.error("GOOGLE_IMPERSONATED_USER is not set. Aborting.");
    process.exit(1);
  }

  const subject = `[SMOKE TEST] ${now()}`;
  const body = `This is an automated smoke-test email.\n\nTime: ${now()}\nUser: ${user}`;

  const results: Record<string, string> = {};
  let threadId = "";

  console.log("\n=== Email Smoke Test ===\n");
  console.log("Step 1: Sending email to self ...");
  try {
    const sendRes = await sendGmailMessage({ to: user, subject, body });
    results.send = `OK (messageId=${sendRes.id}, threadId=${sendRes.threadId})`;
    threadId = sendRes.threadId;
    if (!threadId) {
      // If Gmail API didn't return a threadId, we'll find by search
      console.log("No threadId from send; will locate by search.");
    }
  } catch (err: any) {
    console.error("Send failed:", err?.message || err);
    results.send = `FAIL: ${err?.message || err}`;
    printSummaryAndExit(results, 1);
    return; // for TS
  }

  console.log("Step 2: Locating thread via search ...");
  const query = `subject:\"${subject}\"`;
  try {
    let foundId = threadId;
    for (let i = 0; i < 30; i++) {
      const list = await searchGmailThreads({ query, maxResults: 5 });
      const found = list.find(t => t.subject === subject || t.id === threadId);
      if (found) {
        foundId = found.id;
        break;
      }
      await sleep(1000);
    }
    if (!foundId) throw new Error("Thread not found after sending");
    threadId = foundId;
    results.locate = `OK (threadId=${threadId})`;
  } catch (err: any) {
    console.error("Locate failed:", err?.message || err);
    results.locate = `FAIL: ${err?.message || err}`;
    printSummaryAndExit(results, 1);
    return;
  }

  console.log("Step 3: Archive thread (remove INBOX) and verify ...");
  try {
    await modifyGmailThread({ threadId, removeLabelIds: ["INBOX"] });
    // wait a bit for label change to reflect
    await sleep(1000);
    const t = await getGmailThread(threadId);
    if (!t) throw new Error("getGmailThread returned null");
    const labels = Array.isArray((t as any).labels)
      ? ((t as any).labels as string[])
      : [];
    const inInbox = labels.includes("INBOX");
    if (inInbox) throw new Error("Thread still has INBOX label after archive");
    results.archive = "OK";
  } catch (err: any) {
    console.error("Archive failed:", err?.message || err);
    results.archive = `FAIL: ${err?.message || err}`;
  }

  console.log("Step 4: Mark UNREAD then READ via thread labels and verify ...");
  try {
    await modifyGmailThread({ threadId, addLabelIds: ["UNREAD"] });
    await sleep(1000);
    let t = await getGmailThread(threadId);
    if (!t) throw new Error("getGmailThread returned null");
    let labels = Array.isArray((t as any).labels)
      ? ((t as any).labels as string[])
      : [];
    if (!labels.includes("UNREAD")) throw new Error("UNREAD not present");

    await modifyGmailThread({ threadId, removeLabelIds: ["UNREAD"] });
    await sleep(1000);
    t = await getGmailThread(threadId);
    if (!t) throw new Error("getGmailThread returned null");
    labels = Array.isArray((t as any).labels)
      ? ((t as any).labels as string[])
      : [];
    if (labels.includes("UNREAD")) throw new Error("UNREAD still present");

    results.toggleRead = "OK";
  } catch (err: any) {
    console.error("Toggle read/unread failed:", err?.message || err);
    results.toggleRead = `FAIL: ${err?.message || err}`;
  }

  console.log(
    "Step 5: Move the thread to TRASH (safer than permanent delete) ..."
  );
  try {
    await modifyGmailThread({ threadId, addLabelIds: ["TRASH"] });
    await sleep(1000);
    const t = await getGmailThread(threadId);
    if (!t) throw new Error("getGmailThread returned null after trash");
    const labels = Array.isArray((t as any).labels)
      ? ((t as any).labels as string[])
      : [];
    if (!labels.includes("TRASH"))
      throw new Error("TRASH not present after operation");
    results.delete = "OK (trashed)";
  } catch (err: any) {
    console.error("Trash failed:", err?.message || err);
    results.delete = `FAIL: ${err?.message || err}`;
  }

  printSummaryAndExit(results, 0);
}

function printSummaryAndExit(results: Record<string, string>, code: number) {
  console.log("\n=== Smoke Test Summary ===");
  const keys = ["send", "locate", "archive", "toggleRead", "delete"];
  for (const k of keys) {
    if (results[k]) {
      console.log(`${k.padEnd(10)}: ${results[k]}`);
    }
  }
  const failed = Object.values(results).some(v => v.startsWith("FAIL"));
  console.log("\nResult:", failed ? "FAIL" : "OK");
  process.exit(code || (failed ? 1 : 0));
}

main().catch(err => {
  console.error("Unhandled error in smoke test:", err);
  process.exit(1);
});

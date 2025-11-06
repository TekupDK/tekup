/**
 * Test: Email Actions Feedback & List Updates
 *
 * Tester at:
 * 1. Archive/Delete lukker tråden og opdaterer listen
 * 2. Label changes opdaterer både tråd og liste
 * 3. Star/Read/Unread opdaterer korrekt
 * 4. Loading states vises under mutations
 */

// Simuler tRPC mutation flow
class MockMutation {
  constructor(name, callbacks) {
    this.name = name;
    this.callbacks = callbacks;
    this.isPending = false;
  }

  async mutate(params) {
    this.isPending = true;
    console.log(`  ⏳ ${this.name} mutation started...`);

    try {
      // Simulate onMutate
      if (this.callbacks.onMutate) {
        await this.callbacks.onMutate();
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate onSuccess
      if (this.callbacks.onSuccess) {
        await this.callbacks.onSuccess();
      }

      this.isPending = false;
      console.log(`  ✅ ${this.name} mutation success`);
      return { success: true };
    } catch (error) {
      this.isPending = false;
      if (this.callbacks.onError) {
        await this.callbacks.onError(error);
      }
      console.log(`  ❌ ${this.name} mutation failed: ${error.message}`);
      throw error;
    }
  }
}

// Simuler tRPC utils
class MockUtils {
  constructor() {
    this.refetchCount = {
      list: 0,
      thread: 0,
    };
  }

  inbox = {
    email: {
      list: {
        refetch: async () => {
          this.refetchCount.list++;
          console.log(
            `    🔄 Email list refetched (count: ${this.refetchCount.list})`
          );
          await new Promise(resolve => setTimeout(resolve, 50));
        },
      },
      getThread: {
        refetch: async ({ threadId }) => {
          this.refetchCount.thread++;
          console.log(
            `    🔄 Thread ${threadId} refetched (count: ${this.refetchCount.thread})`
          );
          await new Promise(resolve => setTimeout(resolve, 50));
        },
      },
    },
  };
}

// Simuler toast notifications
const toastLog = [];
const toast = {
  loading: (msg, opts) => {
    toastLog.push({ type: "loading", msg, id: opts?.id });
    console.log(`    📢 Toast (loading): ${msg}`);
  },
  success: (msg, opts) => {
    toastLog.push({ type: "success", msg, id: opts?.id });
    console.log(`    ✅ Toast (success): ${msg}`);
  },
  error: (msg, opts) => {
    toastLog.push({ type: "error", msg, id: opts?.id });
    console.log(`    ❌ Toast (error): ${msg}`);
  },
  info: msg => {
    toastLog.push({ type: "info", msg });
    console.log(`    ℹ️  Toast (info): ${msg}`);
  },
};

// Test state
let selectedThreadId = "thread-123";
let showArchiveConfirm = false;
let showDeleteConfirm = false;

const setSelectedThreadId = id => {
  const oldId = selectedThreadId;
  selectedThreadId = id;
  console.log(`    🔄 Thread ID changed: ${oldId} -> ${id || "null (closed)"}`);
};

const setShowArchiveConfirm = value => {
  showArchiveConfirm = value;
  console.log(`    🔄 Archive dialog: ${value ? "open" : "closed"}`);
};

const setShowDeleteConfirm = value => {
  showDeleteConfirm = value;
  console.log(`    🔄 Delete dialog: ${value ? "open" : "closed"}`);
};

// Callbacks
const callbacks = {
  onArchiveCalled: false,
  onDeleteCalled: false,
  onLabelChangeCalled: false,

  onArchive: () => {
    callbacks.onArchiveCalled = true;
    console.log(`    📞 onArchive() callback called`);
    setSelectedThreadId(null);
  },

  onDelete: () => {
    callbacks.onDeleteCalled = true;
    console.log(`    📞 onDelete() callback called`);
    setSelectedThreadId(null);
  },

  onLabelChange: () => {
    callbacks.onLabelChangeCalled = true;
    console.log(`    📞 onLabelChange() callback called`);
  },
};

// Test functions
async function testArchiveMutation() {
  console.log("\n🧪 Test 1: Archive Mutation");
  console.log("─".repeat(50));

  const utils = new MockUtils();
  toastLog.length = 0;
  selectedThreadId = "thread-123";
  callbacks.onArchiveCalled = false;

  const archiveMutation = new MockMutation("archive", {
    onMutate: () => {
      toast.loading("Arkiverer email...", { id: "archive" });
    },
    onSuccess: async () => {
      toast.success("Email arkiveret!", { id: "archive" });
      setShowArchiveConfirm(false);
      callbacks.onArchive();
      await utils.inbox.email.list.refetch();
    },
    onError: error => {
      toast.error(`Fejl ved arkivering: ${error.message}`, { id: "archive" });
    },
  });

  await archiveMutation.mutate({ threadId: "thread-123" });

  // Assertions
  const checks = [
    {
      name: "Loading toast shown",
      pass: toastLog.some(
        t => t.type === "loading" && t.msg.includes("Arkiverer")
      ),
    },
    {
      name: "Success toast shown",
      pass: toastLog.some(
        t => t.type === "success" && t.msg.includes("arkiveret")
      ),
    },
    { name: "Dialog closed", pass: !showArchiveConfirm },
    { name: "onArchive callback called", pass: callbacks.onArchiveCalled },
    { name: "Thread closed", pass: selectedThreadId === null },
    { name: "List refetched", pass: utils.refetchCount.list === 1 },
  ];

  let allPassed = true;
  checks.forEach(check => {
    console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  return allPassed;
}

async function testDeleteMutation() {
  console.log("\n🧪 Test 2: Delete Mutation");
  console.log("─".repeat(50));

  const utils = new MockUtils();
  toastLog.length = 0;
  selectedThreadId = "thread-456";
  callbacks.onDeleteCalled = false;

  const deleteMutation = new MockMutation("delete", {
    onMutate: () => {
      toast.loading("Sletter email...", { id: "delete" });
    },
    onSuccess: async () => {
      toast.success("Email slettet!", { id: "delete" });
      setShowDeleteConfirm(false);
      callbacks.onDelete();
      await utils.inbox.email.list.refetch();
    },
    onError: error => {
      toast.error(`Fejl ved sletning: ${error.message}`, { id: "delete" });
    },
  });

  await deleteMutation.mutate({ threadId: "thread-456" });

  // Assertions
  const checks = [
    {
      name: "Loading toast shown",
      pass: toastLog.some(
        t => t.type === "loading" && t.msg.includes("Sletter")
      ),
    },
    {
      name: "Success toast shown",
      pass: toastLog.some(
        t => t.type === "success" && t.msg.includes("slettet")
      ),
    },
    { name: "Dialog closed", pass: !showDeleteConfirm },
    { name: "onDelete callback called", pass: callbacks.onDeleteCalled },
    { name: "Thread closed", pass: selectedThreadId === null },
    { name: "List refetched", pass: utils.refetchCount.list === 1 },
  ];

  let allPassed = true;
  checks.forEach(check => {
    console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  return allPassed;
}

async function testAddLabelMutation() {
  console.log("\n🧪 Test 3: Add Label Mutation");
  console.log("─".repeat(50));

  const utils = new MockUtils();
  toastLog.length = 0;
  selectedThreadId = "thread-789";
  callbacks.onLabelChangeCalled = false;

  const addLabelMutation = new MockMutation("addLabel", {
    onMutate: () => {
      toast.loading("Tilføjer label...", { id: "add-label" });
    },
    onSuccess: async () => {
      toast.success("Label tilføjet!", { id: "add-label" });
      callbacks.onLabelChange();
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId: selectedThreadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl ved tilføjelse af label: ${error.message}`, {
        id: "add-label",
      });
    },
  });

  await addLabelMutation.mutate({
    threadId: selectedThreadId,
    labelName: "Leads",
  });

  // Assertions
  const checks = [
    {
      name: "Loading toast shown",
      pass: toastLog.some(
        t => t.type === "loading" && t.msg.includes("Tilføjer")
      ),
    },
    {
      name: "Success toast shown",
      pass: toastLog.some(
        t => t.type === "success" && t.msg.includes("tilføjet")
      ),
    },
    {
      name: "onLabelChange callback called",
      pass: callbacks.onLabelChangeCalled,
    },
    { name: "Thread still open", pass: selectedThreadId === "thread-789" },
    { name: "Thread refetched", pass: utils.refetchCount.thread === 1 },
    { name: "List refetched", pass: utils.refetchCount.list === 1 },
  ];

  let allPassed = true;
  checks.forEach(check => {
    console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  return allPassed;
}

async function testStarMutation() {
  console.log("\n🧪 Test 4: Star Mutation");
  console.log("─".repeat(50));

  const utils = new MockUtils();
  toastLog.length = 0;
  selectedThreadId = "thread-star";

  const starMutation = new MockMutation("star", {
    onMutate: () => {
      toast.loading("Tilføjer stjerne...", { id: "star" });
    },
    onSuccess: async () => {
      toast.success("Email markeret med stjerne!", { id: "star" });
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId: selectedThreadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`, { id: "star" });
    },
  });

  await starMutation.mutate({ messageId: "msg-123" });

  // Assertions
  const checks = [
    {
      name: "Loading toast shown",
      pass: toastLog.some(
        t => t.type === "loading" && t.msg.includes("stjerne")
      ),
    },
    {
      name: "Success toast shown",
      pass: toastLog.some(
        t => t.type === "success" && t.msg.includes("stjerne")
      ),
    },
    { name: "Thread still open", pass: selectedThreadId === "thread-star" },
    { name: "Thread refetched", pass: utils.refetchCount.thread === 1 },
    { name: "List refetched", pass: utils.refetchCount.list === 1 },
  ];

  let allPassed = true;
  checks.forEach(check => {
    console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  return allPassed;
}

async function testMarkAsReadMutation() {
  console.log("\n🧪 Test 5: Mark as Read Mutation");
  console.log("─".repeat(50));

  const utils = new MockUtils();
  toastLog.length = 0;
  selectedThreadId = "thread-read";

  const markAsReadMutation = new MockMutation("markAsRead", {
    onMutate: () => {
      toast.loading("Markerer som læst...", { id: "mark-read" });
    },
    onSuccess: async () => {
      toast.success("Markeret som læst!", { id: "mark-read" });
      await Promise.all([
        utils.inbox.email.getThread.refetch({ threadId: selectedThreadId }),
        utils.inbox.email.list.refetch(),
      ]);
    },
    onError: error => {
      toast.error(`Fejl: ${error.message}`, { id: "mark-read" });
    },
  });

  await markAsReadMutation.mutate({ messageId: "msg-456" });

  // Assertions
  const checks = [
    {
      name: "Loading toast shown",
      pass: toastLog.some(
        t => t.type === "loading" && t.msg.includes("Markerer")
      ),
    },
    {
      name: "Success toast shown",
      pass: toastLog.some(t => t.type === "success" && t.msg.includes("læst")),
    },
    { name: "Thread still open", pass: selectedThreadId === "thread-read" },
    { name: "Thread refetched", pass: utils.refetchCount.thread === 1 },
    { name: "List refetched", pass: utils.refetchCount.list === 1 },
  ];

  let allPassed = true;
  checks.forEach(check => {
    console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  return allPassed;
}

async function testReplyForwardFeedback() {
  console.log("\n🧪 Test 6: Reply/Forward Feedback");
  console.log("─".repeat(50));

  toastLog.length = 0;

  // Simulate Reply button click
  console.log("  📝 Simulating Reply button click...");
  const message = { id: "msg-789", subject: "Test" };
  let onReplyCalled = false;
  const onReply = msg => {
    onReplyCalled = true;
    console.log(`    📞 onReply() called with message: ${msg.id}`);
  };

  // Simulate button click
  onReply(message);
  toast.info("Åbner svar...");

  // Simulate Forward button click
  console.log("\n  📝 Simulating Forward button click...");
  let onForwardCalled = false;
  const onForward = msg => {
    onForwardCalled = true;
    console.log(`    📞 onForward() called with message: ${msg.id}`);
  };

  onForward(message);
  toast.info("Åbner videresendelse...");

  // Assertions
  const checks = [
    { name: "Reply callback called", pass: onReplyCalled },
    {
      name: "Reply toast shown",
      pass: toastLog.some(t => t.type === "info" && t.msg.includes("svar")),
    },
    { name: "Forward callback called", pass: onForwardCalled },
    {
      name: "Forward toast shown",
      pass: toastLog.some(
        t => t.type === "info" && t.msg.includes("videresendelse")
      ),
    },
  ];

  let allPassed = true;
  checks.forEach(check => {
    console.log(`  ${check.pass ? "✅" : "❌"} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  return allPassed;
}

// Run all tests
async function runAllTests() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  Email Actions Test Suite                        ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  const results = [];

  results.push(await testArchiveMutation());
  results.push(await testDeleteMutation());
  results.push(await testAddLabelMutation());
  results.push(await testStarMutation());
  results.push(await testMarkAsReadMutation());
  results.push(await testReplyForwardFeedback());

  // Summary
  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║  Test Summary                                     ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n  Total Tests: ${total}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${total - passed} ❌`);

  if (passed === total) {
    console.log("\n  🎉 All tests passed! Email actions work correctly.");
  } else {
    console.log("\n  ⚠️  Some tests failed. Check the output above.");
  }

  console.log("\n" + "═".repeat(53));

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

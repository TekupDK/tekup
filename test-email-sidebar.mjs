/**
 * Test EmailSidebar og EmailTab logik
 * Kør: node test-email-sidebar.mjs
 */

// Simuler buildQuery funktionen fra EmailTab
function buildQuery(selectedFolder, selectedLabels, searchQuery) {
  let query = "";

  // Folder queries
  if (selectedFolder === "inbox") query = "in:inbox";
  else if (selectedFolder === "sent") query = "in:sent";
  else if (selectedFolder === "archive") query = "-in:inbox";
  else if (selectedFolder === "starred") query = "is:starred";

  // Add label filters
  if (selectedLabels.length > 0) {
    const labelQuery = selectedLabels.map(label => `label:${label}`).join(" ");
    query = query ? `${query} ${labelQuery}` : labelQuery;
  }

  // Add search query
  if (searchQuery && searchQuery.trim()) {
    query = query ? `${query} ${searchQuery}` : searchQuery;
  }

  return query || "in:inbox";
}

// Test cases
const tests = [
  {
    name: "Test 1: Inbox kun",
    folder: "inbox",
    labels: [],
    search: "",
    expected: "in:inbox",
  },
  {
    name: "Test 2: Sent kun",
    folder: "sent",
    labels: [],
    search: "",
    expected: "in:sent",
  },
  {
    name: "Test 3: Archive kun",
    folder: "archive",
    labels: [],
    search: "",
    expected: "-in:inbox",
  },
  {
    name: "Test 4: Starred kun",
    folder: "starred",
    labels: [],
    search: "",
    expected: "is:starred",
  },
  {
    name: "Test 5: Inbox + Leads label",
    folder: "inbox",
    labels: ["Leads"],
    search: "",
    expected: "in:inbox label:Leads",
  },
  {
    name: "Test 6: Sent + Finance label",
    folder: "sent",
    labels: ["Finance"],
    search: "",
    expected: "in:sent label:Finance",
  },
  {
    name: "Test 7: Archive + multiple labels",
    folder: "archive",
    labels: ["Afsluttet", "Finance"],
    search: "",
    expected: "-in:inbox label:Afsluttet label:Finance",
  },
  {
    name: "Test 8: Inbox + Needs Reply label",
    folder: "inbox",
    labels: ["Needs Reply"],
    search: "",
    expected: "in:inbox label:Needs Reply",
  },
  {
    name: "Test 9: Starred + search query",
    folder: "starred",
    labels: [],
    search: "faktura",
    expected: "is:starred faktura",
  },
  {
    name: "Test 10: Inbox + label + search",
    folder: "inbox",
    labels: ["Finance"],
    search: "beløb",
    expected: "in:inbox label:Finance beløb",
  },
  {
    name: "Test 11: Multiple labels kun (ingen folder selected - bruger default)",
    folder: "inbox",
    labels: ["Leads", "Needs Reply"],
    search: "",
    expected: "in:inbox label:Leads label:Needs Reply",
  },
  {
    name: "Test 12: Label med mellemrum",
    folder: "inbox",
    labels: ["Venter på svar"],
    search: "",
    expected: "in:inbox label:Venter på svar",
  },
  {
    name: "Test 13: Empty state (fallback)",
    folder: null, // simulerer ingen valg
    labels: [],
    search: "",
    expected: "in:inbox", // fallback
  },
];

console.log("🧪 Kører EmailSidebar/EmailTab Query Tests...\n");

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = buildQuery(test.folder || "inbox", test.labels, test.search);
  const success = result === test.expected;

  if (success) {
    console.log(`✅ ${test.name}`);
    console.log(`   Query: "${result}"`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    console.log(`   Forventet: "${test.expected}"`);
    console.log(`   Fik:       "${result}"`);
    failed++;
  }
  console.log();
});

console.log("═".repeat(60));
console.log(`📊 Resultat: ${passed}/${tests.length} tests bestået`);
if (failed > 0) {
  console.log(`⚠️  ${failed} tests fejlede`);
  process.exit(1);
} else {
  console.log("🎉 Alle tests bestået!");
  process.exit(0);
}

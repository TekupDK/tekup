/**
 * Test EmailSidebar label filtering
 * Kør: node test-label-filtering.mjs
 */

// Simuler label data fra Gmail API
const allLabelsFromGmail = [
  { id: "Label_1", name: "Leads", type: "user" },
  { id: "Label_2", name: "Needs Reply", type: "user" },
  { id: "Label_3", name: "Finance", type: "user" },
  { id: "Label_4", name: "Afsluttet", type: "user" },
  { id: "Label_5", name: "Venter på svar", type: "user" },
  { id: "Label_6", name: "I kalender", type: "user" },
  // System labels (skal filtreres væk)
  { id: "INBOX", name: "INBOX", type: "system" },
  { id: "SENT", name: "SENT", type: "system" },
  { id: "STARRED", name: "STARRED", type: "system" },
  { id: "ARCHIVE", name: "ARCHIVE", type: "system" },
  // Andre user labels
  { id: "Label_7", name: "Mangler Svar", type: "user" },
  { id: "Label_8", name: "Fast Rengøring", type: "user" },
  { id: "Label_9", name: "Flytterengøring", type: "user" },
  { id: "Label_10", name: "Engangsopgaver", type: "user" },
  { id: "Label_11", name: "Rengøring Århus", type: "user" },
  { id: "Label_12", name: "Rengøring.nu", type: "user" },
  { id: "Label_13", name: "Blocked", type: "user" },
  { id: "Label_14", name: "Notes", type: "user" },
  { id: "Label_15", name: "Hovedrengøring", type: "user" },
  { id: "Label_16", name: "AdHelp", type: "user" },
];

// Backend filter (kun user labels)
const userLabels = allLabelsFromGmail
  .filter(label => label.type === "user")
  .map(label => ({ id: label.id, name: label.name }));

// Frontend standard labels filter
const standardLabels = userLabels.filter(label =>
  [
    "Leads",
    "Needs Reply",
    "Venter på svar",
    "I kalender",
    "Finance",
    "Afsluttet",
  ].includes(label.name)
);

// Frontend andre labels filter
const otherLabels = userLabels.filter(
  label =>
    ![
      "Leads",
      "Needs Reply",
      "Venter på svar",
      "I kalender",
      "Finance",
      "Afsluttet",
      "INBOX",
      "SENT",
      "STARRED",
      "ARCHIVE",
    ].includes(label.name)
);

// Label farve mapping
function getLabelColor(name) {
  if (name === "Leads") return "blue";
  if (name === "Needs Reply" || name === "Venter på svar") return "red";
  if (name === "I kalender") return "green";
  if (name === "Finance") return "yellow";
  if (name === "Afsluttet") return "gray";
  return "default";
}

console.log("🧪 Kører Label Filtering Tests...\n");

console.log("📊 Total labels fra Gmail API:", allLabelsFromGmail.length);
console.log("   └─ User labels:", userLabels.length);
console.log(
  "   └─ System labels:",
  allLabelsFromGmail.filter(l => l.type === "system").length
);
console.log();

console.log("✅ User Labels (efter backend filter):");
userLabels.forEach(label => {
  console.log(`   - ${label.name} (${label.id})`);
});
console.log();

console.log("🏷️  Standard Labels (synlige i EmailSidebar):");
standardLabels.forEach(label => {
  const color = getLabelColor(label.name);
  console.log(`   - ${label.name} → ${color} farve`);
});
console.log();

console.log("📁 Andre Labels (max 10 vist):");
const displayedOtherLabels = otherLabels.slice(0, 10);
displayedOtherLabels.forEach(label => {
  console.log(`   - ${label.name}`);
});
if (otherLabels.length > 10) {
  console.log(`   ... og ${otherLabels.length - 10} flere (ikke vist)`);
}
console.log();

console.log("═".repeat(60));

// Verifikation tests
const tests = [
  {
    name: "Alle system labels er filtreret væk",
    check: () =>
      userLabels.every(
        l =>
          l.name !== "INBOX" &&
          l.name !== "SENT" &&
          l.name !== "STARRED" &&
          l.name !== "ARCHIVE"
      ),
  },
  {
    name: "Alle standard labels har farver",
    check: () => standardLabels.every(l => getLabelColor(l.name) !== "default"),
  },
  {
    name: "Standard labels er korrekt antal (6)",
    check: () => standardLabels.length === 6,
  },
  {
    name: "Andre labels indeholder IKKE standard labels",
    check: () =>
      !otherLabels.some(l =>
        [
          "Leads",
          "Needs Reply",
          "Venter på svar",
          "I kalender",
          "Finance",
          "Afsluttet",
        ].includes(l.name)
      ),
  },
  {
    name: "Andre labels er korrekt antal",
    check: () => otherLabels.length === 10, // 16 user labels - 6 standard = 10
  },
  {
    name: "Max 10 andre labels vises",
    check: () => displayedOtherLabels.length <= 10,
  },
];

let passed = 0;
let failed = 0;

console.log("🔍 Verifikation:\n");
tests.forEach(test => {
  const result = test.check();
  if (result) {
    console.log(`✅ ${test.name}`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    failed++;
  }
});

console.log("\n" + "═".repeat(60));
console.log(`📊 Resultat: ${passed}/${tests.length} tests bestået`);

if (failed > 0) {
  console.log(`⚠️  ${failed} tests fejlede`);
  process.exit(1);
} else {
  console.log("🎉 Alle label filtering tests bestået!");
  process.exit(0);
}

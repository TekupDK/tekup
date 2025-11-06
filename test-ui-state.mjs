/**
 * Test EmailTab UI State Management
 * Kør: node test-ui-state.mjs
 */

// Simuler React state
class EmailTabState {
  constructor() {
    this.selectedFolder = "inbox";
    this.selectedLabels = [];
    this.searchQuery = "";
  }

  // Simuler folder change
  onFolderChange(folder) {
    this.selectedFolder = folder;
    console.log(`  → Folder ændret til: ${folder}`);
  }

  // Simuler label toggle
  onLabelToggle(labelName) {
    if (this.selectedLabels.includes(labelName)) {
      this.selectedLabels = this.selectedLabels.filter(l => l !== labelName);
      console.log(`  → Label fjernet: ${labelName}`);
    } else {
      this.selectedLabels = [...this.selectedLabels, labelName];
      console.log(`  → Label tilføjet: ${labelName}`);
    }
  }

  // Simuler search change
  onSearchChange(query) {
    this.searchQuery = query;
    console.log(`  → Søgning ændret til: "${query}"`);
  }

  // Build query (samme som EmailTab)
  buildQuery() {
    let query = "";

    if (this.selectedFolder === "inbox") query = "in:inbox";
    else if (this.selectedFolder === "sent") query = "in:sent";
    else if (this.selectedFolder === "archive") query = "-in:inbox";
    else if (this.selectedFolder === "starred") query = "is:starred";

    if (this.selectedLabels.length > 0) {
      const labelQuery = this.selectedLabels
        .map(label => `label:${label}`)
        .join(" ");
      query = query ? `${query} ${labelQuery}` : labelQuery;
    }

    if (this.searchQuery.trim()) {
      query = query ? `${query} ${this.searchQuery}` : this.searchQuery;
    }

    return query || "in:inbox";
  }

  getState() {
    return {
      folder: this.selectedFolder,
      labels: [...this.selectedLabels],
      search: this.searchQuery,
      query: this.buildQuery(),
    };
  }
}

console.log("🧪 Kører UI State Management Tests...\n");

const scenarios = [
  {
    name: "Scenario 1: Bruger starter med inbox",
    actions: state => {
      // Initial state
    },
    expectedQuery: "in:inbox",
  },
  {
    name: "Scenario 2: Bruger vælger 'Sendte'",
    actions: state => {
      state.onFolderChange("sent");
    },
    expectedQuery: "in:sent",
  },
  {
    name: "Scenario 3: Bruger går tilbage til inbox og vælger Leads",
    actions: state => {
      state.onFolderChange("inbox");
      state.onLabelToggle("Leads");
    },
    expectedQuery: "in:inbox label:Leads",
  },
  {
    name: "Scenario 4: Bruger tilføjer Finance label",
    actions: state => {
      state.onLabelToggle("Finance");
    },
    expectedQuery: "in:inbox label:Leads label:Finance",
  },
  {
    name: "Scenario 5: Bruger fjerner Leads label",
    actions: state => {
      state.onLabelToggle("Leads");
    },
    expectedQuery: "in:inbox label:Finance",
  },
  {
    name: "Scenario 6: Bruger skifter til Archive",
    actions: state => {
      state.onFolderChange("archive");
    },
    expectedQuery: "-in:inbox label:Finance",
  },
  {
    name: "Scenario 7: Bruger tilføjer søgning",
    actions: state => {
      state.onSearchChange("faktura");
    },
    expectedQuery: "-in:inbox label:Finance faktura",
  },
  {
    name: "Scenario 8: Bruger clearer labels",
    actions: state => {
      state.onLabelToggle("Finance"); // Toggle off
    },
    expectedQuery: "-in:inbox faktura",
  },
  {
    name: "Scenario 9: Bruger går til Starred",
    actions: state => {
      state.onFolderChange("starred");
    },
    expectedQuery: "is:starred faktura",
  },
  {
    name: "Scenario 10: Bruger clearer search",
    actions: state => {
      state.onSearchChange("");
    },
    expectedQuery: "is:starred",
  },
];

let passed = 0;
let failed = 0;

const state = new EmailTabState();

scenarios.forEach((scenario, index) => {
  console.log(`\n${scenario.name}`);

  scenario.actions(state);

  const currentQuery = state.buildQuery();
  const success = currentQuery === scenario.expectedQuery;

  if (success) {
    console.log(`  ✅ Query korrekt: "${currentQuery}"`);
    passed++;
  } else {
    console.log(`  ❌ Query fejl!`);
    console.log(`     Forventet: "${scenario.expectedQuery}"`);
    console.log(`     Fik:       "${currentQuery}"`);
    failed++;
  }

  console.log(
    `  📊 State: folder=${state.selectedFolder}, labels=[${state.selectedLabels.join(", ")}], search="${state.searchQuery}"`
  );
});

console.log("\n" + "═".repeat(60));
console.log(`📊 Resultat: ${passed}/${scenarios.length} scenarios bestået`);

if (failed > 0) {
  console.log(`⚠️  ${failed} scenarios fejlede`);
  process.exit(1);
} else {
  console.log("🎉 Alle UI state management tests bestået!");
  process.exit(0);
}

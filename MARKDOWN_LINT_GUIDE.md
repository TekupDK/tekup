# TekupDK Markdown Linting Guide

## 📋 Oversigt

Dette dokument beskriver markdownlint konfigurationen for hele TekupDK monorepo'et, baseret på [markdownlint v0.38.0](https://github.com/DavidAnson/markdownlint/tree/v0.38.0).

**Formål:**

- Ensartet markdown formatering på tværs af alle projekter
- Automatisk fejlretning med `markdown:fix`
- Forbedret læsbarhed og vedligeholdelse af dokumentation
- CI/CD integration for kvalitetssikring

## 🚀 Hurtig Start

### Installation

```bash
# I root af Tekup monorepo
pnpm install
```

### Kommandoer

```bash
# Tjek alle markdown filer for fejl
pnpm markdown:lint

# Ret automatisk fejl i alle markdown filer
pnpm markdown:fix

# Kør fuld check med konfiguration
pnpm markdown:check
```

## 📖 Regel Reference

### ✅ Aktiverede Regler

#### MD001 - Heading levels should only increment by one level at a time

**Status:** ✅ Aktiveret

**Forklaring:** Overskrifter skal følge hierarkisk rækkefølge (h1 → h2 → h3), ikke hoppe niveauer.

**Dårligt:**
```markdown
# Heading 1
### Heading 3 (springer h2 over)
```

**Godt:**
```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Hvorfor:** Sikrer semantisk korrekt dokumentstruktur og forbedrer tilgængelighed.

---

#### MD003 - Heading style

**Status:** ✅ Aktiveret (style: "atx")

**Forklaring:** Brug ATX-stil overskrifter (`#`) i stedet for Setext-stil (understreget).

**Dårligt:**
```markdown
Heading 1
=========

Heading 2
---------
```

**Godt:**
```markdown
# Heading 1
## Heading 2
```

**Hvorfor:** ATX-stil er mere læsbar, konsistent og fungerer på alle niveauer (h1-h6).

---

#### MD004 - Unordered list style

**Status:** ✅ Aktiveret (style: "dash")

**Forklaring:** Brug bindestreg (`-`) til uordnede lister, ikke asterisk (`*`) eller plus (`+`).

**Dårligt:**
```markdown
* Item 1
* Item 2
+ Item 3
```

**Godt:**
```markdown
- Item 1
- Item 2
- Item 3
```

**Hvorfor:** Konsistent liste-stil på tværs af hele kodebasen. Bindestreg er mest læsbar.

---

#### MD007 - Unordered list indentation

**Status:** ✅ Aktiveret (indent: 2)

**Forklaring:** Indrykke nested lister med 2 mellemrum.

**Dårligt:**
```markdown
- Item 1
   - Nested item (3 spaces)
- Item 2
```

**Godt:**
```markdown
- Item 1
  - Nested item (2 spaces)
- Item 2
```

**Hvorfor:** Konsistent indrykning forbedrer læsbarhed og formatering.

---

#### MD010 - Hard tabs

**Status:** ✅ Aktiveret (code_blocks: true, spaces_per_tab: 2)

**Forklaring:** Brug spaces i stedet for tabs, inklusiv i kode-blokke.

**Hvorfor:** Tabs vises forskelligt i forskellige editorer. Spaces sikrer konsistent formatering.

---

#### MD012 - Multiple consecutive blank lines

**Status:** ✅ Aktiveret (maximum: 2)

**Forklaring:** Maksimalt 2 tomme linjer efter hinanden.

**Dårligt:**
```markdown
## Heading



Content (4 blank lines)
```

**Godt:**
```markdown
## Heading


Content (2 blank lines max)
```

**Hvorfor:** Forbedrer læsbarhed uden at være for restriktiv. 2 linjer er nok til at adskille sektioner.

---

#### MD024 - Multiple headings with the same content

**Status:** ✅ Aktiveret (siblings_only: true)

**Forklaring:** Tillad ens overskrifter hvis de ikke er søskende (samme niveau).

**Tilladt:**
```markdown
# Documentation
## Installation

# API Reference
## Installation (OK - forskellig sektion)
```

**Ikke tilladt:**
```markdown
## Installation
### Step 1
## Installation (FEJL - samme niveau)
```

**Hvorfor:** Giver fleksibilitet til at have ens overskrifter i forskellige sektioner.

---

#### MD025 - Multiple top-level headings in the same document

**Status:** ✅ Aktiveret (front_matter_title: "")

**Forklaring:** Kun én h1 (`#`) per dokument (ignorerer front matter title).

**Hvorfor:** Sikrer klar dokumentstruktur med én primær titel.

---

#### MD026 - Trailing punctuation in heading

**Status:** ✅ Aktiveret (punctuation: ".,;:!")

**Forklaring:** Ingen punktum, komma, semikolon, kolon eller udråbstegn i slutningen af overskrifter.

**Dårligt:**
```markdown
## Installation Guide.
## Getting Started!
```

**Godt:**
```markdown
## Installation Guide
## Getting Started?  (? er tilladt)
```

**Hvorfor:** Overskrifter er titler, ikke sætninger.

---

#### MD029 - Ordered list item prefix

**Status:** ✅ Aktiveret (style: "ordered")

**Forklaring:** Brug sekventielle numre (1, 2, 3) i stedet for alle "1."

**Dårligt:**
```markdown
1. First
1. Second
1. Third
```

**Godt:**
```markdown
1. First
2. Second
3. Third
```

**Hvorfor:** Mere læsbart og nemmere at vedligeholde.

---

#### MD030 - Spaces after list markers

**Status:** ✅ Aktiveret (alle: 1 space)

**Forklaring:** Nøjagtigt 1 mellemrum efter liste-markører.

**Dårligt:**
```markdown
-  Item (2 spaces)
-Item (0 spaces)
```

**Godt:**
```markdown
- Item (1 space)
```

**Hvorfor:** Konsistent formatering.

---

#### MD033 - Inline HTML

**Status:** ✅ Aktiveret (med tilladte elementer)

**Forklaring:** Tillad kun specifikke HTML-tags for avanceret formatering.

**Tilladte tags:**

- `<details>`, `<summary>` - Collapsible sections
- `<br>` - Line breaks
- `<img>`, `<a>` - Billeder og links
- `<kbd>` - Keyboard keys
- `<sub>`, `<sup>` - Subscript/superscript
- `<div>`, `<span>` - Layout
- `<table>`, `<tr>`, `<td>`, `<th>`, `<thead>`, `<tbody>` - Tabeller

**Hvorfor:** Balance mellem ren markdown og nødvendige HTML-features.

---

#### MD034 - Bare URL used

**Status:** ✅ Aktiveret

**Forklaring:** URLs skal enten være links eller i kode-blokke.

**Dårligt:**
```markdown
Se https://example.com for mere info
```

**Godt:**
```markdown
Se <https://example.com> for mere info
Se [Example](https://example.com) for mere info
Se `https://example.com` for mere info
```

**Hvorfor:** Sikrer at links fungerer korrekt i alle markdown-parsere.

---

#### MD035 - Horizontal rule style

**Status:** ✅ Aktiveret (style: "---")

**Forklaring:** Brug tre bindestreger (`---`) til horisontale linjer.

**Dårligt:**
```markdown
***
___
- - -
```

**Godt:**
```markdown
---
```

**Hvorfor:** Konsistent stil og mest læsbar.

---

#### MD046 - Code block style

**Status:** ✅ Aktiveret (style: "fenced")

**Forklaring:** Brug fenced code blocks (```) i stedet for indented (4 spaces).

**Dårligt:**
```markdown
    const x = 1;
    console.log(x);
```

**Godt:**
````markdown
```javascript
const x = 1;
console.log(x);
```
````

**Hvorfor:** Fenced blocks understøtter syntax highlighting og er mere tydelige.

---

#### MD048 - Code fence style

**Status:** ✅ Aktiveret (style: "backtick")

**Forklaring:** Brug backticks (```) i stedet for tildes (~~~) til code fences.

**Dårligt:**
```markdown
~~~javascript
code
~~~
```

**Godt:**
````markdown
```javascript
code
```
````

**Hvorfor:** Backticks er mere almindelige og understøttes bredt.

---

#### MD049 - Emphasis style

**Status:** ✅ Aktiveret (style: "underscore")

**Forklaring:** Brug underscore (`_italic_`) til italic tekst.

**Dårligt:**
```markdown
*italic text*
```

**Godt:**
```markdown
_italic text_
```

**Hvorfor:** Konsistent stil og undgår konflikt med bold (asterisk).

---

#### MD050 - Strong style

**Status:** ✅ Aktiveret (style: "asterisk")

**Forklaring:** Brug asterisk (`**bold**`) til fed tekst.

**Dårligt:**
```markdown
__bold text__
```

**Godt:**
```markdown
**bold text**
```

**Hvorfor:** Konsistent stil og mest almindelig konvention.

---

#### MD052 - Reference links and images should use a label that is defined

**Status:** ✅ Aktiveret (shortcut_syntax: false)

**Forklaring:** Kræv eksplicit link-labels, ikke shortcut syntax.

**Dårligt:**
```markdown
[link]
[link]: url
```

**Godt:**
```markdown
[link text][link]
[link]: url
```

**Hvorfor:** Mere eksplicit og nemmere at vedligeholde.

---

#### MD053 - Link and image reference definitions should be needed

**Status:** ✅ Aktiveret (ignored_definitions: ["//"])

**Forklaring:** Alle definerede link-referencer skal bruges (ignorerer "//" kommentarer).

**Hvorfor:** Fjerner ubrugt "dead code" i dokumentation.

---

### ❌ Deaktiverede Regler

#### MD013 - Line length

**Status:** ❌ Deaktiveret

**Hvorfor:**

- Markdown line-wrapping kan gøre diffs svære at læse
- Moderne editorer håndterer lange linjer godt
- URLs og kode-eksempler kan naturligt være lange
- Giver mere fleksibilitet til forfattere

**Note:** Overvej at aktivere med `line_length: 120` hvis der er behov for strengere formatering.

---

#### MD031 - Fenced code blocks should be surrounded by blank lines

**Status:** ❌ Deaktiveret

**Hvorfor:**

- Nogle parsere håndterer dette forskelligt
- Kan være for restriktiv i nested strukturer (lister med kode)
- Blank lines tilføjes ofte automatisk af prettier/andre formatters

---

#### MD036 - Emphasis used instead of a heading

**Status:** ❌ Deaktiveret

**Hvorfor:**

- False positives når bold tekst bruges legitimt (ikke som heading)
- Især problematisk i API dokumentation og tekniske specs
- Forfattere ved bedst hvornår noget skal være en heading

---

#### MD040 - Fenced code blocks should have a language specified

**Status:** ❌ Deaktiveret

**Hvorfor:**

- Nogle kode-eksempler er plaintext eller pseudo-code
- Output fra terminaler skal ikke have language
- Kan være for restriktiv for hurtigt kladde-arbejde

**Anbefaling:** Tilføj altid language når det giver mening for syntax highlighting.

---

#### MD041 - First line in file should be a top level heading

**Status:** ❌ Deaktiveret

**Hvorfor:**

- Mange filer har front matter, badges, eller notices først
- README.md starter ofte med billede eller beskrivelse
- For restriktiv for reelle use cases

---

#### MD051 - Link fragments should be valid

**Status:** ❌ Deaktiveret

**Hvorfor:**

- Fragment validation kan fejle på dynamisk genereret indhold
- Kan være false positives hvis dokumentet ændres
- Validering kræver fuld parsing af alle refererede dokumenter

**Note:** Manuelt tjek vigtige links i CI/CD eller pre-commit hooks.

---

## 🏗️ Struktur

### Konfigurationsfiler

```
Tekup/
├── .markdownlint.json          # Central konfiguration for hele monorepo
├── .markdownlintignore         # Ekskluderede filer/directories
├── package.json                # Scripts: markdown:lint, markdown:fix, markdown:check
└── MARKDOWN_LINT_GUIDE.md      # Dette dokument
```

### Underprojekter

Underprojekter kan have deres egne `.markdownlint.json` filer, som overskriver root-konfigurationen:

```
apps/rendetalje/.markdownlint.json
apps/production/tekup-billy/.markdownlint.json
tekup-vault/.markdownlint.json
```

**Arvningsrækkefølge:**

1. Lokal `.markdownlint.json` (højeste prioritet)
2. Root `.markdownlint.json`
3. Markdownlint defaults

---

## 🎯 Best Practices

### 1. Kør lint før commit

```bash
# Ret automatisk fejl
pnpm markdown:fix

# Tjek for resterende fejl
pnpm markdown:lint
```

### 2. Tilføj til Git pre-commit hook

```bash
# I .husky/pre-commit eller lignende
pnpm markdown:lint
```

### 3. CI/CD Integration

```yaml
# GitHub Actions eksempel
- name: Lint Markdown
  run: pnpm markdown:lint
```

### 4. Ignore specifikke fejl

Brug kommentarer til at disable regler lokalt:

```markdown
<!-- markdownlint-disable MD013 -->
This is a very long line that would normally fail MD013 but is now ignored.
<!-- markdownlint-enable MD013 -->
```

Eller disable for hele dokumentet:

```markdown
<!-- markdownlint-disable MD013 MD033 -->
# Document content
```

### 5. EditorConfig integration

Installer markdownlint extension i VS Code for real-time linting:

- **VS Code:** [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)

---

## 🔧 Vedligeholdelse

### Opdatering af regler

1. Rediger `.markdownlint.json`
2. Test med `pnpm markdown:lint`
3. Ret fejl med `pnpm markdown:fix`
4. Opdater denne guide hvis nødvendigt
5. Commit ændringer

### Tilføjelse af nye ignorerede filer

Rediger `.markdownlintignore` og tilføj paths eller patterns.

### Opdatering af markdownlint

```bash
pnpm update markdownlint-cli2
```

Tjek [release notes](https://github.com/DavidAnson/markdownlint/releases) for breaking changes.

---

## 📚 Ressourcer

- [Markdownlint Documentation](https://github.com/DavidAnson/markdownlint)
- [Markdownlint Rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)
- [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2)
- [Markdown Guide](https://www.markdownguide.org/)

---

## 🤝 Bidrag

Har du forslag til regelændringer eller forbedringer? Åbn en PR eller issue i Tekup monorepo.

**Retningslinjer:**

1. Forklar hvorfor reglen skal ændres
2. Giv eksempler på problemer med nuværende setup
3. Tjek at alle eksisterende docs stadig er kompatible

---

## 📝 Version History

- **2025-10-29:** Initial markdownlint setup for TekupDK (v0.38.0)
  - Central `.markdownlint.json` med 25+ konfigurerede regler
  - `.markdownlintignore` med smart ekskludering
  - 3 npm scripts: `markdown:lint`, `markdown:fix`, `markdown:check`
  - Omfattende dokumentation med forklaring af hver regel

---

**Maintained by:** TekupDK Team  
**Last Updated:** 2025-10-29

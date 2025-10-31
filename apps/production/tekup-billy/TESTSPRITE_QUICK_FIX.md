# TestSprite File Upload - Quick Fix

## Problem

File picker prøver at bruge HTTP URL i stedet for lokal filsti.

## Løsning

### Option 1: Brug File Picker Navigation (Anbefalet)

1. I TestSprite file picker:
   - **IKKE** brug adresselinjen direkte
   - **I STEDET:** Naviger via folder hierarki:
     - Start fra `C:\Users\empir\`
     - Naviger til: `Tekup` → `apps` → `production` → `tekup-billy` → `docs`
   - Vælg `PROJECT_SPEC.md`

### Option 2: Brug Projekt Root

Jeg har kopieret filen til projektroden:

- **Sti:** `C:\Users\empir\Tekup\apps\production\tekup-billy\PROJECT_SPEC.md`
- Naviger direkte til projektroden og vælg filen derfra

### Option 3: Drag & Drop

Prøv at trække filen fra File Explorer direkte ind i TestSprite upload area.

---

**Korrekt filsti:**

```
C:\Users\empir\Tekup\apps\production\tekup-billy\docs\PROJECT_SPEC.md
```

eller (kopi i root):

```
C:\Users\empir\Tekup\apps\production\tekup-billy\PROJECT_SPEC.md
```

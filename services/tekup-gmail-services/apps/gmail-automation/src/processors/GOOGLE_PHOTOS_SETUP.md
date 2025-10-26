# Google Photos Receipt Processing Setup

## Problem
Du har kvitteringsbilleder gemt i Google Photos, som skal sendes til e-conomic for afstemning.

## Løsning
Vi har oprettet to løsninger til at håndtere kvitteringsbilleder:

### 1. Automatisk Google Photos API (Avanceret)
- **Fil:** `google_photos_receipt_processor.py`
- **Kræver:** Google Photos API autentificering
- **Fordel:** Fuldt automatisk
- **Ulempe:** Kompleks setup

### 2. Manuel Proces (Anbefalet)
- **Fil:** `manual_receipt_processor.py`
- **Kræver:** Download billeder fra Google Photos
- **Fordel:** Simpel og pålidelig
- **Ulempe:** Manuel proces

## Manuel Proces - Trin for Trin

### Trin 1: Download Kvitteringsbilleder fra Google Photos
1. Åbn Google Photos på din computer
2. Søg efter kvitteringer:
   - Søg på "kvittering", "receipt", "faktura", "bilag"
   - Søg på leverandørnavne: "danfoods", "telenor", "circle k", etc.
3. Vælg alle relevante billeder
4. Download dem til en mappe på din computer (f.eks. `C:\receipt_photos`)

### Trin 2: Kør Manuel Receipt Processor
```bash
python manual_receipt_processor.py C:\receipt_photos
```

### Trin 3: Verificer Resultater
- Scriptet konverterer billeder til PDFs
- Sender PDFs til e-conomic (788bilag1714566@e-conomic.dk)
- Markerer dem som "TekUp Manual Receipt Processing"

## Understøttede Billedformater
- JPG/JPEG
- PNG
- BMP
- TIFF
- WebP

## Eksempel på Brug
```bash
# Opret mappe til kvitteringsbilleder
mkdir receipt_photos

# Download billeder fra Google Photos til mappen
# (Manuel proces i Google Photos)

# Kør processor
python manual_receipt_processor.py receipt_photos
```

## Resultat
- Alle kvitteringsbilleder konverteres til PDFs
- PDFs sendes automatisk til e-conomic
- Billeder matcher med transaktioner i kontobevægelser
- Forbedrer afstemning mellem bank og e-conomic

## Tips
1. **Organiser billeder:** Sorter efter dato eller leverandør
2. **Kontroller kvalitet:** Sørg for at tekst er læselig
3. **Batch processing:** Behandl flere billeder ad gangen
4. **Backup:** Gem originale billeder som backup

## Fejlfinding
- **"Folder does not exist":** Tjek stien til mappen
- **"No images found":** Kontroller at billeder er i understøttede formater
- **"Failed to send":** Tjek Gmail autentificering
- **"Conversion error":** Kontroller billedkvalitet

## Næste Skridt
Efter at have sendt kvitteringsbilleder til e-conomic:
1. Tjek e-conomic for modtagne bilag
2. Match bilag med transaktioner i kontobevægelser
3. Opdater bilagsreferencer i banktransaktioner
4. Genkør afstemningsrapport for at se forbedring

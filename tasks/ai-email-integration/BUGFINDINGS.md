# Bugfund – 2025-11-05

## 1. Gmail-arkivering fejler i praksis

- **Placering:** `server/google-api.ts:20`
- **Problem:** OAuth-scope-listen mangler `https://www.googleapis.com/auth/gmail.modify`, men modulet kører `users.messages.modify` og `users.threads.modify` (fx linjer 607 og 715). Uden `gmail.modify` svarer Gmail API med 403 på arkivér/slet/markér-læst.
- **Konsekvens:** Alle “Archive/Delete/Mark read”-handlinger i EmailTab fejler for servicekontoen; UI’et viser fejltosts.
- **Forslag:** Tilføj `gmail.modify` til `SCOPES` i `server/google-api.ts` (samme scope er allerede i brug i `server/gmail-labels.ts`).

## 2. Log ud-knap rydder ikke session

- **Placering:** `client/src/pages/ChatInterface.tsx:53`
- **Problem:** `handleLogout` laver kun redirect til `getLoginUrl()` og kalder ikke `logout`-mutationen fra `useAuth`. Session-cookie og TRPC-cache bliver liggende.
- **Konsekvens:** Brugeren fremstår stadig logget ind efter “Log ud”, og serveren får ikke besked om at lukke sessionen.
- **Forslag:** Injicér `logout` fra `useAuth()` og kald `await logout()` før redirect (evt. fallback til login-URL ved fejl).

## 3. Link-klik i e-mailvisning blokeres

- **Placering:** `client/src/components/EmailIframeView.tsx:142`
- **Problem:** `<iframe sandbox="allow-same-origin">` mangler `allow-popups`. Selvom `srcDoc` sætter `<base target="_blank">`, vil sandboxen uden `allow-popups` forhindre åbning af links.
- **Konsekvens:** Brugere kan ikke åbne eksterne links direkte fra mails.
- **Forslag:** Udvid attributten til `sandbox="allow-same-origin allow-popups"` (og evt. `allow-popups-to-escape-sandbox` hvis nødvendigt).

## 4. Ødelagte danske specialtegn i UI

- **Placering:** `client/src/components/ChatPanel.tsx:128` og `:487` (plus flere toasts/modaler)
- **Problem:** Hardkodede tekster er gemt med forkert encoding og gengives som `�` (“Handling udf�rt!”, “Fil-upload underst�ttes snart”, “Pr�v igen” osv.).
- **Konsekvens:** UI’et ser ufærdigt ud for danske brugere.
- **Forslag:** Gem berørte filer i UTF-8 og erstat strenge med korrekte tegn (fx `"Handling udført!"`). Scan øvrige komponenter for samme problem.

## 5. HTML-til-tekst strip dropper linjeskift

- **Placering:** `server/google-api.ts:223` (`stripHtmlToText`)
- **Problem:** Regexen for `<br>` er `/<(\s*br\s*\/? )>/gi`, hvilket kun matcher `<br >`. Normale `<br>`/`<br/>` bliver aldrig til linjeskift, og efterfølgende tag-stripning fjerner alt format.
- **Konsekvens:** Plain-text-snippets i emaillisten bliver til én lang linje.
- **Forslag:** Ret regexen til fx `/\<\s*br\s*\/?\s*>/gi` eller erstat `<br>` separat, før du stripper tags.

## 6. Email-liste skjuler alt ældre end 7 dage

- **Placering:** `client/src/components/inbox/EmailTab.tsx:245-278`
- **Problem:** Gruppelogikken har kun `TODAY`, `YESTERDAY` og `LAST_7_DAYS`. Ældre mails havner i ingen bucket og rendres ikke.
- **Konsekvens:** Brugeren kan ikke finde ældre tråde; arkiv/bulk-handlinger virker ikke.
- **Forslag:** Tilføj en “OLDER”-gruppe eller fjern begrænsningen, så alle mails vises.

## 7. Label-filtrering fejler for navne med mellemrum

- **Placering:** `client/src/components/inbox/EmailTab.tsx:119-123`
- **Problem:** `buildQuery` genererer `label:${label}` uden citationstegn. Labels som “Needs Reply” eller “Venter på svar” bliver til `label:Needs Reply`, som Gmail tolker som `label:Needs` + frit søgefelt “Reply”.
- **Konsekvens:** Filteret virker ikke for labels med mellemrum eller specialtegn – søgeresultatet bliver for bredt.
- **Forslag:** Wrap label-navne i anførselstegn og escap specialtegn, fx `label:"${label.replace('"', '\"')}"`.

## 8. “Arkiv”-visning inkluderer spam og papirkurv

- **Placering:** `client/src/components/inbox/EmailTab.tsx:112-118`
- **Problem:** Folderen “archive” giver query `-in:inbox`. Gmail betragter også spam og papirkurv som “ikke inbox”, så de dukker op i listen.
- **Konsekvens:** Arkivfanen viser spam/slettede mails i stedet for kun arkiverede.
- **Forslag:** Stram filteret op: fx `-in:inbox -in:spam -in:trash` (og evt. `-category:{…}` hvis nødvendigt).

## 9. Standard labels og pipeline-mapping rammer ikke pga. encoding

- **Placering:** `client/src/components/inbox/EmailSidebar.tsx:39-67` og `client/src/components/inbox/EmailPipelineView.tsx:315-326`
- **Problem:** Koden sammenligner mod strenge som `"Venter p� svar"` (forkert encoding). Gmail leverer `"Venter på svar"`, så filtreringen fejler.
- **Konsekvens:**
  - Labelen vises aldrig under “standard labels”, så brugeren kan ikke toggl’e den.
  - `inferStageFromEmail` opdager ikke labelen, så pipeline-viewet placerer mailen i default-kolonnen.
- **Forslag:** Ret strenge til korrekte danske tegn og sørg for at alle mapping-tabeller bruger samme encoding.

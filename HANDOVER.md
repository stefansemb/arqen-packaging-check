# Överlämning: Arqen Packaging Check (2026-10-06)

## Vad det är
Verktyg nr 6 till samidatools.com. Det visar titel och thumbnail i YouTubes flöde (startsidan på dator, flödet i mobilen, sökningen och "Up next", i mörkt och ljust läge, bredvid upp till 3 konkurrenter) och ger en checklista för titel, thumbnail, beskrivning, kapitel och taggar. Det körs helt i webbläsaren och allt som visas är på engelska.

- **Idé:** från AgentTubes "discoverability preflight" och min egen idé om att förhandsvisa titel och thumbnail (2026-10-06). Reglerna liknar dem Arqen AI Studio redan följer (taggar under 500 tecken, kapitel).
- **Lokalt:** konfigurationen `arqen-packaging-check` i Studios `.claude/launch.json` (port 5180). Tester: `node --test`.
- **Filer:** `checks.js` (reglerna, rena funktioner), `checks.test.mjs`, `app.js`, `index.html`, `style.css`.
- **Licens:** MIT. Planen är ett publikt repo, `stefansemb/arqen-packaging-check`, som skapas när användaren säger till.

## Läge: första versionen, testad lokalt 2026-10-06
- 5 tester gröna, inga fel i konsolen, ljust och mörkt läge fungerar, och ingen horisontell scroll i mobilbredd.
- Inställningarna sparas i webbläsaren (localStorage), men bilderna sparas inte.

## Nästa steg
1. Användaren provar.
2. Repot, publicering på samidatools.com/packaging-check/ med en egen delningsbild gjord i Arqen Share Image, ett kort på startsidan och plats i projektlistan och XP.
3. Efter det: den gemensamma e-postlistan (valfri anmälan), sedan Search Console och lanseringen av samidatools.com.
4. Idéer: Shorts-flödet (9:16), ett test för thumbnailens läsbarhet i liten storlek, och import av titel, beskrivning och taggar från Arqen AI Studios `publish.json`.

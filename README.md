# Setpass

Träningsapp i stil med Hevy/SmartGym. Byggs först som webbapp (PWA) och packas sedan som iPhone-app med Capacitor.

## Funktioner
- **Scheman** – skapa pass med övningar, set, reps, vikt, vilotid, anteckningar och supersets
- **Aktivt pass** – bocka av set, "Förra"-kolumn med förra passets värden, vilotimer med ljud/vibration (+/−15 s)
- **Övningsbibliotek** – 876 övningar med bilder, sök (svenska/engelska) och filter på muskel, utrustning och kategori
- **Egna övningar** – med egna bilder
- **Historik, rekord och grafer** – uppskattat 1RM, tyngsta vikt, volym, reps; PR visas när passet avslutas
- **Svenska och engelska**, **ljust/mörkt tema**, kg/lb
- **Offline först** – all data sparas lokalt i IndexedDB, export/import som JSON-backup

## Kom igång
```bash
npm install
npm run dev       # utvecklingsserver
npm test          # enhetstester
npm run build     # produktionsbygge i dist/
```

## Teknik
React + TypeScript + Vite, Dexie (IndexedDB), vite-plugin-pwa. HashRouter så att appen fungerar i Capacitor.

## Övningsdata
Från [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense). `npm run data` hämtar om datan till `public/data/exercises.json`.
Bilderna hämtas från jsDelivr och cachas offline av service workern. Svenska namn finns för de vanligaste övningarna i `src/i18n/names-sv.ts`.

> **Inför App Store:** licensen för själva bilderna i free-exercise-db är oklar (se issue #12 i deras repo).
> Bildkällan är isolerad i `src/lib/exercises.ts` (`imageUrl`) så den kan bytas mot ett köpt paket.

## Till iPhone (senare)
Kräver Mac med Xcode och Apple Developer-konto.
```bash
npm i @capacitor/core @capacitor/ios && npm i -D @capacitor/cli
npx cap init Setpass se.setpass.app --web-dir dist
npm run build && npx cap add ios && npx cap open ios
```

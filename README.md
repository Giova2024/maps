# MiniMaps

App web gratuita di mappe in stile Google Maps, costruita con **React + TypeScript + Vite**.

## Funzionalità
- 🔍 **Ricerca luoghi** con suggerimenti in tempo reale (navigabili anche da tastiera ↑ ↓ Invio)
- 🗺️ **Viste**: Strade / Satellite / Scuro
- 🧭 **Percorsi** (Da → A) con distanza e tempo stimato su strada reale
- 📏 **Misuratore di distanza** (clic multipli, distanza totale live)
- 🔎 **Ricerca POI** vicino al centro mappa (ristoranti, bar, benzinai, hotel, ospedali, supermercati, farmacie, scuole)
- 📍 **Geolocalizzazione** e 🚶 **tracciamento GPS live**
- ★ **Preferiti** salvati nel browser (`localStorage`) con export/import JSON
- 🔗 **Condivisione link** con coordinate e zoom (deep link `?lat=..&lng=..&z=..`)
- 🖨️ **Stampa mappa**
- 📱 Layout adatto anche a smartphone

## Tecnologie
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [react-leaflet](https://react-leaflet.js.org/) / [Leaflet](https://leafletjs.com/) con tile **OpenStreetMap** / **Esri** (satellite) / **CARTO** (scuro)
- [Tailwind CSS 4](https://tailwindcss.com/) per lo stile, [zustand](https://zustand.docs.pmnd.rs/) per lo stato
- **Nominatim** (geocoding), **OSRM** (routing), **Overpass API** (POI) — servizi pubblici gratuiti con rate-limit, adatti all'uso personale. Se il server Overpass principale è sovraccarico si passa automaticamente a un server alternativo.

## Struttura
```
src/
  App.tsx              layout e deep link
  store.ts             stato globale (zustand): mappa, pannelli, marker, preferiti…
  lib/api.ts           Nominatim, OSRM, Overpass
  lib/storage.ts       localStorage con ripiego in memoria
  components/
    MapView.tsx        mappa, livelli, marker, percorso, misura, GPS
    SearchBar.tsx      ricerca con suggerimenti
    Panels.tsx         pannelli Percorso / Misura / POI / Preferiti
    Controls.tsx       pulsanti laterali, cambio vista, box info, notifiche
```

## Sviluppo
Serve [Node.js](https://nodejs.org/) 20 o superiore.
```bash
npm install
npm run dev       # server di sviluppo su http://localhost:5173
npm run build     # build di produzione in dist/
npm run preview   # anteprima della build
```

> La build usa percorsi relativi: la cartella `dist/` funziona in qualunque sottocartella di un sito,
> ma va servita da un server web (non si apre con doppio clic su `index.html`).

## Pubblicazione su GitHub Pages
Il workflow `.github/workflows/deploy.yml` compila e pubblica automaticamente a ogni push su `main`.
Basta, una sola volta, su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Il sito sarà su `https://giova2024.github.io/maps/`.

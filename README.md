# MiniMaps

Un'app web gratuita, in un **singolo file HTML** (`index.html`), che funziona come Google Maps.
Si usa aprendo `index.html` nel browser (serve una connessione internet per le mappe).

## Funzionalità
- 🔍 **Ricerca luoghi** con suggerimenti in tempo reale
- 🗺️ **Viste**: Strade / Satellite / Scuro
- 🧭 **Percorsi** (Da → A) con distanza e tempo stimato su strada reale
- 📏 **Misuratore di distanza** (clic multipli, distanza totale live)
- 🔎 **Ricerca POI** vicino al centro mappa (ristoranti, bar, benzinai, hotel, ospedali, supermercati, farmacie, scuole)
- 📍 **Geolocalizzazione** e 🚶 **tracciamento GPS live**
- ★ **Preferiti** salvati nel browser (`localStorage`) con export/import JSON
- 🔗 **Condivisione link** con coordinate e zoom (deep link)
- 🖨️ **Stampa mappa**

## Tecnologie
- [Leaflet](https://leafletjs.com/) + tile **OpenStreetMap** / **Esri** (satellite) / **CARTO** (scuro)
- **Nominatim** (geocoding), **OSRM** (routing), **Overpass API** (POI) — tutti servizi pubblici gratuiti, con rate-limit. Adatti all'uso personale, non a carichi elevati.

## Pubblicazione su GitHub Pages
1. Crea un repository su https://github.com/new
2. Dalla cartella del progetto:
   ```bash
   git remote add origin https://github.com/TUO-UTENTE/TUO-REPO.git
   git branch -M main
   git push -u origin main
   ```
3. Su GitHub: **Settings → Pages → Source: main / (root)** → Save.
4. Il sito sarà disponibile su `https://TUO-UTENTE.github.io/TUO-REPO/`
   (i link di condivisione funzioneranno ovunque).

> Suggerimento: installa la GitHub CLI (`gh`) per gestire il repo da terminale.

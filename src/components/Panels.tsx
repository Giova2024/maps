import { useRef, useState, type ReactNode } from 'react'
import L, { type LatLngTuple } from 'leaflet'
import { geocode, POI_CATEGORIES, route as fetchRoute, searchPoi, ServiceBusyError } from '../lib/api'
import { formatDuration, shortLabel } from '../lib/format'
import { useStore } from '../store'
import { Button, Card, inputClass } from './ui'

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const closePanel = useStore(s => s.closePanel)
  return (
    <Card className="mt-2 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Chiudi"
          className="cursor-pointer rounded px-2 text-lg leading-none text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </div>
      {children}
    </Card>
  )
}

// lascia spazio al pannello in alto e ai controlli a destra
const FIT_OPTIONS: L.FitBoundsOptions = { paddingTopLeft: [40, 280], paddingBottomRight: [80, 60] }

const Row = ({ children }: { children: ReactNode }) => <div className="mt-2 flex gap-2 *:flex-1">{children}</div>

function DirectionsPanel() {
  const { map, setRoute, setInfo, notify } = useStore()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)

  async function go() {
    if (!from.trim() || !to.trim()) return notify('Inserisci partenza e destinazione.')
    setBusy(true)
    try {
      const [[a], [b]] = await Promise.all([geocode(from.trim()), geocode(to.trim())])
      if (!a || !b) return notify('Luoghi non trovati.')
      const pa: LatLngTuple = [a.lat, a.lng]
      const pb: LatLngTuple = [b.lat, b.lng]
      const r = await fetchRoute(pa, pb)
      if (!r) return notify('Percorso non disponibile.')
      setRoute({ ...r, from: pa, to: pb })
      map?.fitBounds(L.latLngBounds(r.coords), FIT_OPTIONS)
      setInfo(<>🚗 <b>{(r.distance / 1000).toFixed(1)} km</b> · circa <b>{formatDuration(r.duration)}</b></>)
    } catch {
      notify('Errore nel calcolo del percorso.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="🧭 Percorso in auto">
      <form onSubmit={e => { e.preventDefault(); go() }} className="space-y-2">
        <label className="block text-xs text-gray-600">
          Da
          <input className={`${inputClass} mt-1`} value={from} onChange={e => setFrom(e.target.value)} placeholder="Punto di partenza" />
        </label>
        <label className="block text-xs text-gray-600">
          A
          <input className={`${inputClass} mt-1`} value={to} onChange={e => setTo(e.target.value)} placeholder="Destinazione" />
        </label>
        <Row>
          <Button type="submit" disabled={busy}>{busy ? 'Calcolo…' : 'Mostra percorso'}</Button>
          <Button variant="danger" onClick={() => { setRoute(null); setInfo(null); setFrom(''); setTo('') }}>
            Cancella
          </Button>
        </Row>
      </form>
    </Panel>
  )
}

function MeasurePanel() {
  const { closePanel, clearMeasure, setInfo, measurePts } = useStore()
  return (
    <Panel title="📏 Misuratore di distanza">
      <p className="text-sm text-gray-600">
        {measurePts.length
          ? 'Continua a cliccare per aggiungere punti.'
          : 'Clicca sulla mappa per aggiungere punti. La distanza totale si aggiorna automaticamente.'}
      </p>
      <Row>
        <Button onClick={closePanel}>Fine</Button>
        <Button variant="danger" onClick={() => { clearMeasure(); setInfo(null) }}>Cancella</Button>
      </Row>
    </Panel>
  )
}

function PoiPanel() {
  const { map, setPois, setInfo } = useStore()
  const [cat, setCat] = useState(0)
  const [busy, setBusy] = useState(false)

  async function go() {
    if (!map) return
    const { type, key } = POI_CATEGORIES[cat]
    const c = map.getCenter()
    setBusy(true)
    setInfo('🔎 Ricerca in corso…')
    try {
      const found = await searchPoi(type, key, c.lat, c.lng)
      setPois(found)
      if (!found.length) setInfo('🔎 Nessun risultato nelle vicinanze.')
      else {
        map.fitBounds(L.latLngBounds(found.map(p => [p.lat, p.lng])), { ...FIT_OPTIONS, maxZoom: 16 })
        setInfo(<>🔎 Trovati <b>{found.length}</b> risultati.</>)
      }
    } catch (e) {
      setInfo(e instanceof ServiceBusyError
        ? '🔎 Il servizio dei punti di interesse è sovraccarico, riprova tra poco.'
        : '🔎 Errore nella ricerca.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="🔎 Punti di interesse vicino al centro mappa">
      <select className={inputClass} value={cat} onChange={e => setCat(Number(e.target.value))} aria-label="Categoria">
        {POI_CATEGORIES.map((p, i) => <option key={p.key} value={i}>{p.label}</option>)}
      </select>
      <Row>
        <Button onClick={go} disabled={busy}>{busy ? 'Ricerca…' : 'Cerca qui'}</Button>
        <Button variant="danger" onClick={() => { setPois([]); setInfo(null) }}>Cancella</Button>
      </Row>
    </Panel>
  )
}

function FavoritesPanel() {
  const { favorites, removeFavorite, importFavorites, flyTo, closePanel, notify } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  function exportFavs() {
    const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'preferiti.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importFavs(file: File) {
    try {
      const n = importFavorites(JSON.parse(await file.text()))
      notify(`Importati ${n} preferiti.`)
    } catch {
      notify('File non valido.')
    }
  }

  return (
    <Panel title="★ Luoghi preferiti">
      <div className="mb-2 flex gap-2">
        <Button className="px-3! py-1.5! text-xs" onClick={exportFavs} disabled={!favorites.length}>⬇ Esporta</Button>
        <Button className="px-3! py-1.5! text-xs" onClick={() => fileRef.current?.click()}>⬆ Importa</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) importFavs(f)
            e.target.value = ''
          }}
        />
      </div>
      {favorites.length === 0 ? (
        <p className="p-1.5 text-sm text-gray-500">Nessun preferito salvato.</p>
      ) : (
        <ul className="max-h-[50vh] overflow-y-auto">
          {favorites.map((f, i) => (
            <li key={`${f.lat},${f.lng}`} className="flex items-center border-b border-gray-100 last:border-0">
              <button
                type="button"
                title={f.label}
                className="flex-1 cursor-pointer truncate px-1.5 py-2 text-left text-sm hover:bg-gray-100"
                onClick={() => { flyTo(f.lat, f.lng, f.label); closePanel() }}
              >
                {shortLabel(f.label)}
              </button>
              <button
                type="button"
                aria-label={`Elimina ${shortLabel(f.label)}`}
                className="cursor-pointer px-2 text-lg text-red-600 hover:bg-red-50"
                onClick={() => removeFavorite(i)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default function ActivePanel() {
  const panel = useStore(s => s.panel)
  switch (panel) {
    case 'directions': return <DirectionsPanel />
    case 'measure': return <MeasurePanel />
    case 'poi': return <PoiPanel />
    case 'favorites': return <FavoritesPanel />
    default: return null
  }
}

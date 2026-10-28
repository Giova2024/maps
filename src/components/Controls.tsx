import { useStore, type LayerId, type PanelId } from '../store'
import { Button } from './ui'

async function copyText(t: string) {
  try {
    await navigator.clipboard.writeText(t)
    return true
  } catch {
    return false
  }
}

export function SideControls() {
  const { map, panel, gps, togglePanel, setGps, setInfo, flyTo, notify, reset } = useStore()

  const panelBtn = (id: PanelId, icon: string, title: string) => (
    <Button variant="icon" title={title} aria-label={title} active={panel === id} onClick={() => togglePanel(id)}>
      {icon}
    </Button>
  )

  async function share() {
    if (!map) return
    const c = map.getCenter()
    const base = location.href.split(/[?#]/)[0]
    const link = `${base}?lat=${c.lat.toFixed(5)}&lng=${c.lng.toFixed(5)}&z=${map.getZoom()}`
    const ok = await copyText(link)
    setInfo(
      <>
        🔗 {ok ? 'Link copiato negli appunti!' : 'Copia manualmente:'}
        <br />
        <span className="text-[11px] break-all select-all">{link}</span>
      </>,
    )
  }

  function locate() {
    if (!navigator.geolocation) return notify('Geolocalizzazione non supportata.')
    navigator.geolocation.getCurrentPosition(
      pos => flyTo(pos.coords.latitude, pos.coords.longitude, '📍 La tua posizione'),
      () => notify('Impossibile ottenere la posizione.'),
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {panelBtn('directions', '🧭', 'Percorso')}
      {panelBtn('poi', '🔎', 'Punti di interesse')}
      {panelBtn('measure', '📏', 'Misura distanza')}
      {panelBtn('favorites', '★', 'Preferiti')}
      <Button variant="icon" title="Condividi posizione" aria-label="Condividi posizione" onClick={share}>🔗</Button>
      <Button variant="icon" title="Tracciamento GPS live" aria-label="Tracciamento GPS live" active={gps} onClick={() => setGps(!gps)}>
        🚶
      </Button>
      <Button variant="icon" title="La mia posizione" aria-label="La mia posizione" onClick={locate}>📍</Button>
      <Button variant="icon" title="Stampa mappa" aria-label="Stampa mappa" onClick={() => window.print()}>🖨️</Button>
      <Button variant="icon" title="Reimposta" aria-label="Reimposta" onClick={reset}>🗺️</Button>
    </div>
  )
}

const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'street', label: 'Strade' },
  { id: 'sat', label: 'Satellite' },
  { id: 'dark', label: 'Scuro' },
]

export function LayerSwitch() {
  const layer = useStore(s => s.layer)
  const setLayer = useStore(s => s.setLayer)
  return (
    <div className="flex overflow-hidden rounded-lg bg-white shadow-md" role="radiogroup" aria-label="Tipo di mappa">
      {LAYERS.map(l => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={layer === l.id}
          onClick={() => setLayer(l.id)}
          className={`cursor-pointer px-3 py-2.5 text-[13px] ${
            layer === l.id ? 'bg-blue-600 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function InfoBox() {
  const info = useStore(s => s.info)
  const setInfo = useStore(s => s.setInfo)
  if (!info) return null
  return (
    <div className="flex max-w-72 items-start gap-2 rounded-lg bg-white/95 px-3 py-2 text-[13px] text-gray-800 shadow-md">
      <div className="flex-1">{info}</div>
      <button type="button" aria-label="Chiudi" onClick={() => setInfo(null)} className="cursor-pointer text-gray-400 hover:text-gray-700">
        ×
      </button>
    </div>
  )
}

export function Toast() {
  const toast = useStore(s => s.toast)
  if (!toast) return null
  return (
    <div role="status" className="rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
      {toast}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import {
  CircleMarker, MapContainer, Marker, Polyline, Popup, ScaleControl, TileLayer, Tooltip, ZoomControl, useMapEvents,
} from 'react-leaflet'
import { DEFAULT_VIEW, measureTotal, useStore, type LayerId, type Place } from '../store'
import { formatDistance } from '../lib/format'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// con un bundler le icone di default di Leaflet vanno ricollegate a mano
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const TILES: Record<LayerId, { url: string; attribution: string }> = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap' },
  sat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '© CARTO' },
}

const ORANGE = '#e8710a'

function ClickHandler() {
  const measuring = useStore(s => s.panel === 'measure')
  const addMeasurePoint = useStore(s => s.addMeasurePoint)
  const addMarker = useStore(s => s.addMarker)
  useMapEvents({
    click(e) {
      if (measuring) addMeasurePoint([e.latlng.lat, e.latlng.lng])
      else addMarker(e.latlng.lat, e.latlng.lng, `📌 ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
    },
  })
  return null
}

function PlaceMarker({ place }: { place: Place }) {
  const addFavorite = useStore(s => s.addFavorite)
  const notify = useStore(s => s.notify)
  return (
    <Marker position={[place.lat, place.lng]}>
      <Popup>
        <div className="max-w-56">
          <div>{place.label}</div>
          <button
            type="button"
            className="mt-1 cursor-pointer font-semibold text-blue-600 hover:underline"
            onClick={() =>
              notify(addFavorite({ lat: place.lat, lng: place.lng, label: place.label })
                ? '★ Salvato nei preferiti'
                : 'Già presente nei preferiti')
            }
          >
            ★ Salva nei preferiti
          </button>
        </div>
      </Popup>
    </Marker>
  )
}

function MeasureLayer() {
  const pts = useStore(s => s.measurePts)
  const setInfo = useStore(s => s.setInfo)

  useEffect(() => {
    if (!pts.length) return
    setInfo(<>📏 Distanza: <b>{formatDistance(measureTotal(pts))}</b> ({pts.length} punti)</>)
  }, [pts, setInfo])

  if (!pts.length) return null
  return (
    <>
      <Polyline positions={pts} pathOptions={{ color: ORANGE, weight: 3, dashArray: '6,6' }} />
      {pts.map((p, i) => (
        <CircleMarker key={i} center={p} radius={5} pathOptions={{ color: ORANGE, fillColor: '#fff', fillOpacity: 1 }}>
          <Tooltip>Punto {i + 1}</Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}

function GpsLayer() {
  const gps = useStore(s => s.gps)
  const map = useStore(s => s.map)
  const setGps = useStore(s => s.setGps)
  const setInfo = useStore(s => s.setInfo)
  const notify = useStore(s => s.notify)
  const markerRef = useRef<L.Marker>(null)

  useEffect(() => {
    if (!gps || !map) return
    if (!navigator.geolocation) {
      notify('Geolocalizzazione non supportata.')
      setGps(false)
      return
    }
    setInfo('🚶 Tracciamento GPS attivo…')
    let first = true
    const id = navigator.geolocation.watchPosition(
      pos => {
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        if (first) { map.setView(ll, 16); first = false } else map.panTo(ll)
        const m = markerRef.current
        if (m) {
          m.setLatLng(ll)
          m.setPopupContent(`🚶 Sei qui<br>${ll[0].toFixed(5)}, ${ll[1].toFixed(5)}`).openPopup()
        } else {
          markerRef.current = L.marker(ll).addTo(map)
            .bindPopup(`🚶 Sei qui<br>${ll[0].toFixed(5)}, ${ll[1].toFixed(5)}`).openPopup()
        }
      },
      () => { notify('GPS non disponibile.'); setGps(false) },
      { enableHighAccuracy: true, maximumAge: 1000 },
    )
    return () => {
      navigator.geolocation.clearWatch(id)
      markerRef.current?.remove()
      markerRef.current = null
      setInfo(null)
    }
  }, [gps, map, notify, setGps, setInfo])

  return null
}

export default function MapView() {
  const setMap = useStore(s => s.setMap)
  const layer = useStore(s => s.layer)
  const markers = useStore(s => s.markers)
  const route = useStore(s => s.route)
  const pois = useStore(s => s.pois)
  const measuring = useStore(s => s.panel === 'measure')
  const tile = TILES[layer]

  return (
    <MapContainer
      ref={setMap}
      center={DEFAULT_VIEW.center}
      zoom={DEFAULT_VIEW.zoom}
      zoomControl={false}
      className={`absolute inset-0 z-0 ${measuring ? 'cursor-crosshair' : ''}`}
    >
      <TileLayer key={layer} url={tile.url} attribution={tile.attribution} maxZoom={19} />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomright" imperial={false} />
      <ClickHandler />

      {markers.map(m => <PlaceMarker key={m.id} place={m} />)}

      {route && (
        <>
          <Polyline positions={route.coords} pathOptions={{ color: '#1a73e8', weight: 5, opacity: 0.8 }} />
          <Marker position={route.from}><Popup>🟢 Partenza</Popup></Marker>
          <Marker position={route.to}><Popup>🔴 Arrivo</Popup></Marker>
        </>
      )}

      {pois.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]}><Popup>🔎 {p.name}</Popup></Marker>
      ))}

      <MeasureLayer />
      <GpsLayer />
    </MapContainer>
  )
}

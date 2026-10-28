import { create } from 'zustand'
import L, { type LatLngTuple, type Map as LeafletMap } from 'leaflet'
import type { ReactNode } from 'react'
import type { Poi, Route } from './lib/api'
import { safeStorage } from './lib/storage'

export type LayerId = 'street' | 'sat' | 'dark'
export type PanelId = 'directions' | 'poi' | 'measure' | 'favorites'

export interface Place { id: number; lat: number; lng: number; label: string }
export interface Favorite { lat: number; lng: number; label: string }

export const DEFAULT_VIEW = { center: [41.9028, 12.4964] as LatLngTuple, zoom: 6 }
const FAV_KEY = 'minimaps_favorites'

function loadFavorites(): Favorite[] {
  try {
    const v = JSON.parse(safeStorage.get(FAV_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter(isValidFav) : []
  } catch { return [] }
}
const persistFavorites = (f: Favorite[]) => safeStorage.set(FAV_KEY, JSON.stringify(f))
function isValidFav(f: unknown): f is Favorite {
  const v = f as Favorite
  return !!v && typeof v.lat === 'number' && typeof v.lng === 'number'
}

export const measureTotal = (pts: LatLngTuple[]) =>
  pts.reduce((sum, p, i) => (i ? sum + L.latLng(pts[i - 1]).distanceTo(p) : 0), 0)

let nextId = 1
let toastTimer: ReturnType<typeof setTimeout> | undefined

interface State {
  map: LeafletMap | null
  layer: LayerId
  panel: PanelId | null
  info: ReactNode | null
  toast: string | null
  markers: Place[]
  route: (Route & { from: LatLngTuple; to: LatLngTuple }) | null
  measurePts: LatLngTuple[]
  pois: Poi[]
  gps: boolean
  favorites: Favorite[]

  setMap: (m: LeafletMap | null) => void
  setLayer: (l: LayerId) => void
  togglePanel: (p: PanelId) => void
  closePanel: () => void
  setInfo: (i: ReactNode | null) => void
  notify: (msg: string) => void
  addMarker: (lat: number, lng: number, label: string) => void
  flyTo: (lat: number, lng: number, label: string, zoom?: number) => void
  setRoute: (r: State['route']) => void
  addMeasurePoint: (p: LatLngTuple) => void
  clearMeasure: () => void
  setPois: (p: Poi[]) => void
  setGps: (on: boolean) => void
  addFavorite: (f: Favorite) => boolean
  removeFavorite: (index: number) => void
  importFavorites: (list: unknown) => number
  reset: () => void
}

export const useStore = create<State>()((set, get) => ({
  map: null,
  layer: 'street',
  panel: null,
  info: null,
  toast: null,
  markers: [],
  route: null,
  measurePts: [],
  pois: [],
  gps: false,
  favorites: loadFavorites(),

  setMap: map => set({ map }),
  setLayer: layer => set({ layer }),
  togglePanel: p => set(s => ({ panel: s.panel === p ? null : p })),
  closePanel: () => set({ panel: null }),
  setInfo: info => set({ info }),
  notify: toast => {
    clearTimeout(toastTimer)
    set({ toast })
    toastTimer = setTimeout(() => set({ toast: null }), 3500)
  },
  addMarker: (lat, lng, label) => set(s => ({ markers: [...s.markers, { id: nextId++, lat, lng, label }] })),
  flyTo: (lat, lng, label, zoom = 15) => {
    get().map?.setView([lat, lng], zoom)
    get().addMarker(lat, lng, label)
  },
  setRoute: route => set({ route }),
  addMeasurePoint: p => set(s => ({ measurePts: [...s.measurePts, p] })),
  clearMeasure: () => set({ measurePts: [] }),
  setPois: pois => set({ pois }),
  setGps: gps => set({ gps }),
  addFavorite: f => {
    const favs = get().favorites
    if (favs.some(x => x.lat === f.lat && x.lng === f.lng)) return false
    const next = [...favs, f]
    persistFavorites(next)
    set({ favorites: next })
    return true
  },
  removeFavorite: i => {
    const next = get().favorites.filter((_, j) => j !== i)
    persistFavorites(next)
    set({ favorites: next })
  },
  importFavorites: list => {
    if (!Array.isArray(list)) throw new Error('Formato non valido')
    const cur = [...get().favorites]
    let added = 0
    for (const f of list) {
      if (isValidFav(f) && !cur.some(c => c.lat === f.lat && c.lng === f.lng)) {
        cur.push({ lat: f.lat, lng: f.lng, label: String(f.label ?? `${f.lat}, ${f.lng}`) })
        added++
      }
    }
    persistFavorites(cur)
    set({ favorites: cur })
    return added
  },
  reset: () => {
    set({ markers: [], route: null, measurePts: [], pois: [], gps: false, panel: null, info: null })
    get().map?.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom)
  },
}))

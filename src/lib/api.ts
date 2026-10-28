// Servizi pubblici gratuiti (con rate-limit): Nominatim, OSRM, Overpass
import type { LatLngTuple } from 'leaflet'

export interface GeoResult { lat: number; lng: number; label: string }

export async function geocode(q: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const data: { lat: string; lon: string; display_name: string }[] = await res.json()
  return data.map(d => ({ lat: parseFloat(d.lat), lng: parseFloat(d.lon), label: d.display_name }))
}

export interface Route { coords: LatLngTuple[]; distance: number; duration: number }

export async function route(from: LatLngTuple, to: LatLngTuple): Promise<Route | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  const r = data.routes?.[0]
  if (!r) return null
  return {
    coords: r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as LatLngTuple),
    distance: r.distance,
    duration: r.duration,
  }
}

export const POI_CATEGORIES = [
  { type: 'amenity', key: 'restaurant', label: 'Ristoranti' },
  { type: 'amenity', key: 'cafe', label: 'Bar / Caffè' },
  { type: 'amenity', key: 'fuel', label: 'Benzinai' },
  { type: 'tourism', key: 'hotel', label: 'Hotel' },
  { type: 'amenity', key: 'hospital', label: 'Ospedali' },
  { type: 'shop', key: 'supermarket', label: 'Supermercati' },
  { type: 'amenity', key: 'pharmacy', label: 'Farmacie' },
  { type: 'amenity', key: 'school', label: 'Scuole' },
] as const

export interface Poi { id: number; lat: number; lng: number; name: string }

// i server Overpass pubblici sono spesso sovraccarichi: si prova il successivo se uno non risponde
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

export class ServiceBusyError extends Error {}

export async function searchPoi(type: string, key: string, lat: number, lng: number, radius = 2000): Promise<Poi[]> {
  const q = `[out:json][timeout:25];(node["${type}"="${key}"](around:${radius},${lat},${lng}););out body 50;`
  let res: Response | null = null
  for (const url of OVERPASS_SERVERS) {
    try {
      res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal: AbortSignal.timeout(30_000) })
      if (res.ok) break
    } catch {
      res = null
    }
  }
  if (!res?.ok) throw new ServiceBusyError('Overpass non disponibile')
  const data: { elements: { id: number; lat?: number; lon?: number; tags?: { name?: string } }[] } = await res.json()
  return data.elements
    .filter(el => el.lat != null && el.lon != null)
    .map(el => ({ id: el.id, lat: el.lat!, lng: el.lon!, name: el.tags?.name ?? 'Senza nome' }))
}

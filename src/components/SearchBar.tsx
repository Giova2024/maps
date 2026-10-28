import { useEffect, useRef, useState } from 'react'
import { geocode, type GeoResult } from '../lib/api'
import { shortLabel } from '../lib/format'
import { useStore } from '../store'
import { Button, Card } from './ui'

export default function SearchBar() {
  const flyTo = useStore(s => s.flyTo)
  const notify = useStore(s => s.notify)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const skipNext = useRef(false)

  // suggerimenti con debounce; la richiesta precedente viene annullata
  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return }
    const q = query.trim()
    if (q.length < 3) { setSuggestions([]); return }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      geocode(q, ctrl.signal)
        .then(r => { setSuggestions(r); setHighlight(-1); setOpen(true) })
        .catch(() => {})
    }, 400)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function pick(r: GeoResult) {
    flyTo(r.lat, r.lng, r.label)
    skipNext.current = true
    setQuery(shortLabel(r.label))
    setOpen(false)
  }

  async function search() {
    if (highlight >= 0 && suggestions[highlight]) return pick(suggestions[highlight])
    const q = query.trim()
    if (!q) return
    try {
      const [first] = await geocode(q)
      if (first) pick(first)
      else notify('Nessun risultato trovato.')
    } catch {
      notify('Errore nella ricerca.')
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search()
    else if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      setOpen(true)
      setHighlight(h => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault()
      setHighlight(h => (h <= 0 ? suggestions.length - 1 : h - 1))
    }
  }

  return (
    <div ref={boxRef} className="w-full">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cerca un luogo…"
          autoComplete="off"
          aria-label="Cerca un luogo"
          className="min-w-0 flex-1 rounded-lg bg-white px-4 py-3 text-[15px] shadow-md outline-none focus:ring-2 focus:ring-blue-200"
        />
        <Button onClick={search}>Cerca</Button>
      </div>
      {open && suggestions.length > 0 && (
        <Card className="mt-2 overflow-hidden">
          <ul role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={`${s.lat},${s.lng},${i}`}
                role="option"
                aria-selected={i === highlight}
                onClick={() => pick(s)}
                onMouseEnter={() => setHighlight(i)}
                className={`cursor-pointer border-b border-gray-100 px-4 py-2.5 text-sm last:border-0 ${
                  i === highlight ? 'bg-gray-100' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{shortLabel(s.label)}</div>
                <div className="truncate text-xs text-gray-500">{s.label}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

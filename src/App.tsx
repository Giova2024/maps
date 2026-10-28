import { useEffect, useRef } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import ActivePanel from './components/Panels'
import { InfoBox, LayerSwitch, SideControls, Toast } from './components/Controls'
import { useStore } from './store'

// deep link: ?lat=..&lng=..&z=..
function useDeepLink() {
  const map = useStore(s => s.map)
  const flyTo = useStore(s => s.flyTo)
  const done = useRef(false)
  useEffect(() => {
    if (!map || done.current) return
    done.current = true
    const p = new URLSearchParams(location.search)
    const lat = parseFloat(p.get('lat') ?? '')
    const lng = parseFloat(p.get('lng') ?? '')
    if (!isNaN(lat) && !isNaN(lng)) flyTo(lat, lng, '📍 Posizione condivisa', parseInt(p.get('z') ?? '') || 12)
  }, [map, flyTo])
}

export default function App() {
  useDeepLink()
  return (
    <div className="relative h-dvh w-full overflow-hidden font-sans">
      <MapView />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3 print:hidden">
        <div className="pointer-events-auto w-full max-w-[620px] pr-14 sm:pr-0">
          <SearchBar />
          <ActivePanel />
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] print:hidden sm:top-1/2 sm:-translate-y-1/2">
        <SideControls />
      </div>

      <div className="absolute bottom-7 left-3 z-[1000] flex flex-col items-start gap-2 print:hidden">
        <InfoBox />
        <LayerSwitch />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-[1100] flex justify-center print:hidden">
        <Toast />
      </div>
    </div>
  )
}

export const formatDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`)

export function formatDuration(sec: number) {
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${min % 60} min`
}

// "Colosseo, Roma, …" → "Colosseo"; le etichette di sole coordinate restano intere
export const shortLabel = (label: string) =>
  /-?\d+\.\d+, -?\d+\.\d+$/.test(label) ? label : label.split(',')[0] || label

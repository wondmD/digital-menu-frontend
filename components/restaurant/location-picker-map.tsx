"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"

type Coordinates = { lat: number; lng: number }

const DEFAULT_CENTER: Coordinates = { lat: 9.03, lng: 38.74 }

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function ClickHandler({ onPick }: { onPick: (coords: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function CenterUpdater({ value }: { value: Coordinates }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !map.getContainer?.()) return
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16), { animate: true })
  }, [map, value.lat, value.lng])
  return null
}

function PinnedMarker({ value }: { value: Coordinates }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const pane = map.getPane("markerPane")
    if (!pane) return

    const marker = L.marker([value.lat, value.lng], { icon: markerIcon })
    marker.addTo(map)

    return () => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker)
      }
    }
  }, [map, value.lat, value.lng])

  return null
}

export function LocationPickerMap({
  value,
  onChange,
}: {
  value: Coordinates | null
  onChange: (coords: Coordinates) => void
}) {
  const center = useMemo(() => value || DEFAULT_CENTER, [value])

  return (
    <div className="h-80 w-full overflow-hidden rounded-2xl border border-border/60">
      <MapContainer center={[center.lat, center.lng]} zoom={15} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <CenterUpdater value={center} />
        {value ? <PinnedMarker value={value} /> : null}
      </MapContainer>
    </div>
  )
}

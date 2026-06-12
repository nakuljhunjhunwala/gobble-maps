"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

// Mumbai
const DEFAULT_CENTER: [number, number] = [72.8777, 19.076];

export interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  /**
   * Controlled re-position: when this changes to a non-null value the marker
   * jumps there and the map flies to it (search result). The uncontrolled
   * drag/click behavior is otherwise unaffected.
   */
  flyTo?: { lat: number; lng: number } | null;
}

export default function MapPicker({ lat, lng, onChange, flyTo }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  // Only the initial position matters — the marker owns it afterwards.
  const initialRef = useRef({ lat, lng });

  useEffect(() => {
    if (!containerRef.current) return;

    const { lat: initLat, lng: initLng } = initialRef.current;
    const hasPos = initLat !== null && initLng !== null;
    const center: [number, number] = hasPos
      ? [initLng as number, initLat as number]
      : DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center,
      zoom: hasPos ? 14 : 11,
    });

    const marker = new maplibregl.Marker({ draggable: true, color: "#1D7FB8" })
      .setLngLat(center)
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onChangeRef.current(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Search result → re-position marker + fly the map there.
  useEffect(() => {
    if (!flyTo || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([flyTo.lng, flyTo.lat]);
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 15 });
  }, [flyTo]);

  return (
    <div
      ref={containerRef}
      style={{ height: 220, borderRadius: 12, overflow: "hidden" }}
    />
  );
}

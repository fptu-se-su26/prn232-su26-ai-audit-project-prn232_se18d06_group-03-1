import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { Expand, ExternalLink, X } from "lucide-react";

export type LocationMapProps = {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  googleMapsUrl?: string;
  className?: string;
};

const vehicleMarkerIcon = L.divIcon({
  className: "",
  html: `
    <span style="
      position:relative;
      display:flex;
      width:38px;
      height:46px;
      align-items:center;
      justify-content:center;
    ">
      <span style="
        position:absolute;
        left:50%;
        bottom:2px;
        width:28px;
        height:10px;
        transform:translateX(-50%);
        border-radius:9999px;
        background:rgba(15,23,42,0.18);
        filter:blur(2px);
      "></span>
      <svg width="34" height="43" viewBox="0 0 42 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative;filter:drop-shadow(0 12px 18px rgba(15,23,42,0.24));">
        <path d="M21 50C21 50 38 31.9 38 18.8C38 9.3 30.4 2 21 2C11.6 2 4 9.3 4 18.8C4 31.9 21 50 21 50Z" fill="url(#pinGradient)" stroke="white" stroke-width="4"/>
        <circle cx="21" cy="19" r="7" fill="white"/>
        <defs>
          <linearGradient id="pinGradient" x1="7" y1="6" x2="37" y2="42" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7c3aed"/>
            <stop offset="0.58" stop-color="#a855f7"/>
            <stop offset="1" stop-color="#ec4899"/>
          </linearGradient>
        </defs>
      </svg>
    </span>
  `,
  iconSize: [38, 46],
  iconAnchor: [19, 43],
  popupAnchor: [0, -40],
});

function MapResize({ tick }: { tick: number }) {
  const map = useMap();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [map, tick]);

  return null;
}

function LocationMapCanvas({
  position,
  title,
  address,
  className,
  zoom,
  resizeTick,
  zoomControl = true,
}: {
  position: [number, number];
  title: string;
  address?: string;
  className: string;
  zoom: number;
  resizeTick: number;
  zoomControl?: boolean;
}) {
  return (
    <MapContainer
      center={position}
      zoom={zoom}
      scrollWheelZoom={false}
      zoomControl={false}
      className={className}
    >
      <MapResize tick={resizeTick} />
      {zoomControl && <ZoomControl position="topleft" />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Marker position={position} icon={vehicleMarkerIcon}>
        <Popup>
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{title}</p>
            {address && <p className="text-xs text-slate-600">{address}</p>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default function VehicleLocationMap({
  latitude,
  longitude,
  title = "Vá»‹ trÃ­ xe",
  address,
  googleMapsUrl,
  className = "",
}: LocationMapProps) {
  const position: [number, number] = [latitude, longitude];
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedMap = isExpanded && typeof document !== "undefined"
    ? createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="flex h-[78vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                {address && <p className="truncate text-xs text-slate-500">{address}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Mở Google Maps
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  title="ÄÃ³ng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              <LocationMapCanvas
                position={position}
                title={title}
                address={address}
                className="h-full w-full"
                zoom={17}
                resizeTick={1}
              />
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div className={["relative overflow-hidden rounded-xl border border-violet-100 bg-slate-100 shadow-sm", className].join(" ")}>
        <LocationMapCanvas
          position={position}
          title={title}
          address={address}
          className="h-72 w-full"
          zoom={16}
          resizeTick={0}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] h-20 bg-gradient-to-b from-violet-900/10 to-transparent" />
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="absolute right-3 top-3 z-[1100] inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-700 shadow-lg backdrop-blur transition-colors hover:bg-violet-50"
          title="Má»Ÿ rá»™ng báº£n Ä‘á»“"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>
      {expandedMap}
    </>
  );
}

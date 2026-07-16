import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const zoomControlStyles = `
  .leaflet-control-zoom { border: none !important; margin: 8px !important; }
  .leaflet-control-zoom a { width: 24px !important; height: 24px !important; line-height: 24px !important; font-size: 13px !important; font-weight: 700 !important; }
  .leaflet-control-zoom a:first-child { border-radius: 6px 6px 0 0 !important; margin-bottom: 2px !important; }
  .leaflet-control-zoom a:last-child { border-radius: 0 0 6px 6px !important; }
`;

type MapWithPinProps = {
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
};

function MapControls({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    const Control = L.Control.extend({
      options: { position: "topright" },
      onAdd() {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control flex flex-col gap-0.5");

        const centerBtn = L.DomUtil.create("a", "flex h-6 w-6 items-center justify-center bg-white text-slate-500 hover:bg-slate-50 rounded shadow-sm cursor-pointer text-[11px]", container);
        centerBtn.innerHTML = "📍";
        centerBtn.title = "Về vị trí xe";
        centerBtn.setAttribute("role", "button");
        L.DomEvent.on(centerBtn, "click", () => {
          map.setView([latitude, longitude], 15, { animate: true });
        });

        const fullBtn = L.DomUtil.create("a", "flex h-6 w-6 items-center justify-center bg-white text-slate-500 hover:bg-slate-50 rounded shadow-sm cursor-pointer text-[11px]", container);
        fullBtn.innerHTML = "⛶";
        fullBtn.title = "Toàn màn hình";
        fullBtn.setAttribute("role", "button");
        L.DomEvent.on(fullBtn, "click", () => {
          const el = map.getContainer();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            el.requestFullscreen();
          }
        });

        return container;
      },
    });

    const control = new Control();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, latitude, longitude]);

  return null;
}

export default function MapWithPin({ latitude, longitude, address, className }: MapWithPinProps) {
  return (
    <>
      <style>{zoomControlStyles}</style>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        className={className ?? "h-56 w-full rounded-xl z-0"}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>{address}</Popup>
        </Marker>
        <MapControls latitude={latitude} longitude={longitude} />
      </MapContainer>
    </>
  );
}
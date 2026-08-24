"use client";

/**
 * خريطة الأسطوات — «القريب منك يوصلك توّا».
 *
 * Leaflet + OpenStreetMap (مجاني، بدون مفاتيح API). الأسطى اللي حدّد
 * موقعه عند التسجيل يظهر في مكانه بالضبط؛ اللي ما حدّدش يظهر عند مركز
 * مدينته مع إزاحة بسيطة ثابتة (مشتقة من معرّفه) حتى ما تتكدس الدبابيس.
 *
 * زر «موقعي» يطلب إذن الموقع من المتصفح، يوسّط الخريطة عليك، ويبلّغ
 * الأب بالمسافة لكل أسطى (لترتيب «الأقرب أولاً»).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { findService } from "@/lib/services";
import { cityCoords, type City } from "@/lib/market";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

export type MapUsta = {
  id: string;
  full_name: string;
  trade: string;
  city: string;
  lat: number | null;
  lng: number | null;
  avg_rating: number | null;
  ratings_count: number;
  accepted_count: number;
};

/** لون دبوس كل مهنة — نفس عائلة تدرجات البلاطات. */
const tradeColors: Record<string, string> = {
  electrician: "#2A4A7F",
  plumber: "#14876C",
  heating: "#E67E3B",
  cleaning: "#6B3D7D",
  painter: "#DE5F6D",
  gardener: "#4A7346",
  removals: "#4A5C6E",
  assembly: "#C99A3E",
  rentals: "#4B4E9E",
  delivery: "#3B7EA1",
  carpenter: "#8B5E34",
  blacksmith: "#3E4A52",
};

/** إزاحة حتمية صغيرة (~±1كم) مشتقة من المعرّف — للأسطى بدون موقع دقيق. */
function jitter(id: string): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = ((h % 1000) / 1000 - 0.5) * 0.02;
  const b = (((Math.floor(h / 1000) % 1000) / 1000 - 0.5) * 0.02) as number;
  return { dLat: a, dLng: b };
}

export function positionOf(u: MapUsta): { lat: number; lng: number } | null {
  if (u.lat != null && u.lng != null) return { lat: u.lat, lng: u.lng };
  const base = cityCoords[u.city as City];
  if (!base) return null;
  const j = jitter(u.id);
  return { lat: base.lat + j.dLat, lng: base.lng + j.dLng };
}

/** مسافة تقريبية بالكيلومتر (haversine مبسطة). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
}

let leafletPromise: Promise<unknown> | null = null;
function loadLeaflet(): Promise<unknown> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = (window as { L?: unknown }).L;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve((window as { L?: unknown }).L);
    script.onerror = () => reject(new Error("leaflet failed to load"));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

export function UstaMap({
  ustas,
  onLocated,
}: {
  ustas: MapUsta[];
  onLocated?: (pos: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [locating, setLocating] = useState(false);

  /* تهيئة الخريطة مرة وحدة */
  useEffect(() => {
    let cancelled = false;
    void loadLeaflet()
      .then((leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = leaflet as any;
        const map = L.map(containerRef.current, {
          center: [32.6, 15.5],
          zoom: 6,
          scrollWheelZoom: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 18,
        }).addTo(map);
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => setStatus("failed"));
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* رسم الدبابيس كلما تغيّرت القائمة */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const bounds: [number, number][] = [];
    for (const u of ustas) {
      const pos = positionOf(u);
      if (!pos) continue;
      const color = tradeColors[u.trade] ?? "#0B7F58";
      const tradeName = findService(u.trade)?.name ?? u.trade;
      // دبّوس باسم المهنة — الزبون يشوف بعينه أن «كل شيء موجود وقريب»
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:inline-flex;align-items:center;gap:6px;background:${color};color:#fff;padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:700;white-space:nowrap;border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.35);font-family:'IBM Plex Sans Arabic',sans-serif;">
                 <span style="width:7px;height:7px;border-radius:50%;background:#fff;flex-shrink:0;"></span>${escapeHtml(tradeName)}
               </div>`,
        iconAnchor: [36, 16],
      });
      const marker = L.marker([pos.lat, pos.lng], { icon }).addTo(map);
      const stars =
        u.avg_rating != null
          ? `★ ${u.avg_rating} <span style="color:#7A879A">(${u.ratings_count})</span>`
          : "أسطى جديد";
      const exact = u.lat != null ? "" : " · موقع تقريبي (مركز المدينة)";
      marker.bindPopup(
        `<div dir="rtl" style="font-family:inherit; text-align:right; min-width:170px">
           <div style="font-weight:700; font-size:15px; margin-bottom:2px">${escapeHtml(u.full_name)}</div>
           <div style="font-size:12.5px; color:#34455A">${escapeHtml(findService(u.trade)?.name ?? u.trade)} · ${escapeHtml(u.city)}${exact}</div>
           <div style="font-size:12.5px; color:#8A6210; margin:4px 0">${stars}</div>
           <a href="/usta/${u.id}" style="display:inline-block; margin-top:4px; color:#0B7F58; font-weight:700; text-decoration:none">شوف البروفايل ←</a>
         </div>`
      );
      markersRef.current.push(marker);
      bounds.push([pos.lat, pos.lng]);
    }
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [ustas, status]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        L.circleMarker([pos.lat, pos.lng], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#F26D5B",
          fillOpacity: 1,
        })
          .addTo(mapRef.current)
          .bindPopup("📍 إنت هنا");
        mapRef.current.setView([pos.lat, pos.lng], 12);
        onLocated?.(pos);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocated]);

  if (status === "failed") {
    return (
      <p style={{ color: "var(--ink-3)", fontSize: "14px", padding: "24px 0" }}>
        ما قدرناش نحمّلو الخريطة توّا — جرّب تحديث الصفحة.
      </p>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          height: "520px",
          borderRadius: "18px",
          border: "1px solid var(--line)",
          overflow: "hidden",
          background: "var(--paper-2, #eee)",
          zIndex: 0,
        }}
        aria-label="خريطة الأسطوات القريبين منك"
      />
      <button
        type="button"
        onClick={locateMe}
        disabled={locating || status !== "ready"}
        style={{
          position: "absolute",
          top: "12px",
          insetInlineStart: "12px",
          zIndex: 500,
          padding: "10px 18px",
          borderRadius: "999px",
          border: 0,
          background: "linear-gradient(135deg, #10B981, #0B7F58)",
          color: "#fff",
          fontSize: "13.5px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 6px 20px -6px rgba(11,31,51,0.4)",
          fontFamily: "inherit",
        }}
      >
        {locating ? "جاري تحديد موقعك…" : "📍 وريني الأقرب ليّ"}
      </button>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { UnitKerja } from "@/types";

interface UnitKerjaMapProps {
  data: UnitKerja[];
}

const JENIS_COLORS: Record<string, string> = {
  KC: "#2563eb",
  KCP: "#9333ea",
  KK: "#d97706",
  Unit: "#059669",
};

export function UnitKerjaMap({ data }: UnitKerjaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-2.5, 118],
        zoom: 5,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const markers = data
      .filter((item) => item.latitude && item.longitude)
      .map((item) => {
        const color = JENIS_COLORS[item.jenis] || "#6b7280";

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            position: relative;
            width: 40px; height: 40px;
          ">
            <svg width="40" height="40" viewBox="0 0 40 40" style="display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35));">
              <defs>
                <linearGradient id="grad${item.jenis}" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:${color};stop-opacity:1.0" />
                  <stop offset="100%" style="stop-color:${color}cc;stop-opacity:1.0" />
                </linearGradient>
              </defs>
              <path d="M20 0 C12 0 6 7 6 14 C6 24 20 40 20 40 C20 40 34 24 34 14 C34 7 28 0 20 0Z"
                fill="url(#grad${item.jenis})" stroke="white" stroke-width="1.5" />
              <circle cx="20" cy="14" r="6" fill="white" opacity="0.3" />

            </svg>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([parseFloat(item.longitude!), parseFloat(item.latitude!)], {
          icon,
        });

        const taskCount = item._count?.tasks ?? 0;
        const tasks = item.tasks ?? [];

        const STATUS_BADGE: Record<string, string> = {
          todo: "#9ca3af",
          in_progress: "#3b82f6",
          review: "#f59e0b",
          completed: "#10b981",
        };
        const STATUS_LABEL: Record<string, string> = {
          todo: "To Do",
          in_progress: "In Progress",
          review: "Review",
          completed: "Completed",
        };

        marker.bindPopup(`
          <div style="min-width:260px;max-width:320px;font-family:system-ui,sans-serif;">
            <!-- Header -->
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e5e7eb;">
              <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;margin-top:4px;"></div>
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span style="font-size:14px;color:#6b7280;font-weight:400;">${item.jenis}</span> 
                <span style="font-weight:700;font-size:14px;color:#111;line-height:1.3;">${item.nama}</span>
                </div>
                <span style="font-size:10px;font-weight:600;color:white;background:${color};padding:1px 7px;border-radius:999px;line-height:18px;display:inline-block;margin-top:3px;">${item.kode}</span>
              </div>
            </div>

            <!-- Alamat -->
            ${
              item.alamat
                ? `<div style="display:flex;gap:8px;margin-bottom:12px;font-size:12px;color:#4b5563;line-height:1.5;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${item.alamat}</span>
              </div>`
                : '<div style="height:4px;"></div>'
            }

            <!-- Tasks section -->
            <div style="border-top:1px solid #f3f4f6;padding-top:10px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
                <span style="font-size:12px;font-weight:600;color:#374151;">Task</span>
                <span style="font-size:10px;font-weight:500;color:#6b7280;background:#f3f4f6;padding:0 6px;border-radius:999px;line-height:18px;">${taskCount}</span>
              </div>
              ${
                tasks.length > 0
                  ? tasks
                      .map(
                        (t) => `
                <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;margin-bottom:3px;background:#f9fafb;font-size:12px;">
                  <div style="width:7px;height:7px;border-radius:50%;background:${STATUS_BADGE[t.status] || "#9ca3af"};flex-shrink:0;" title="${STATUS_LABEL[t.status] || t.status}"></div>
                  <span style="flex:1;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title}</span>
                  <span style="font-size:10px;color:#6b7280;background:#e5e7eb;padding:0 5px;border-radius:4px;line-height:16px;flex-shrink:0;">${STATUS_LABEL[t.status] || t.status}</span>
                </div>`
                      )
                      .join("")
                  : taskCount > 0
                    ? `<p style="margin:0;font-size:12px;color:#9ca3af;font-style:italic;">+${taskCount} Another task...</p>`
                    : `<p style="margin:0;font-size:12px;color:#9ca3af;font-style:italic;">There's no task</p>`
              }
              ${
                tasks.length > 0 && taskCount > tasks.length
                  ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af;text-align:right;">+${taskCount - tasks.length} lainnya</p>`
                  : ""
              }
            </div>
          </div>
        `);

        return marker;
      });

    const markerGroup = L.featureGroup(markers);
    markerGroup.addTo(mapRef.current);

    if (markers.length > 0) {
      mapRef.current.fitBounds(markerGroup.getBounds().pad(0.1));
    }

    return () => {
      markerGroup.clearLayers();
    };
  }, [data]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full rounded-lg border overflow-hidden"
      style={{ height: "70vh", minHeight: "400px" }}
    />
  );
}

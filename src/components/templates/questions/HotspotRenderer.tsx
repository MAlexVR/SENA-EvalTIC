"use client";

interface ZonaHotspot {
  id: string;
  etiqueta: string;
  forma: "rect" | "circle" | "polygon";
  coordenadas: number[];
}

interface HotspotRendererProps {
  imagen: string;
  imagenAlt: string;
  zonas: ZonaHotspot[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Renders a hotspot question: an image with clickable SVG overlay zones.
 * Each zone can be a rect, circle, or polygon.
 * Clicking a zone toggles its ID in selectedIds.
 */
export function HotspotRenderer({
  imagen,
  imagenAlt,
  zonas,
  selectedIds,
  onChange,
}: HotspotRendererProps) {
  const toggleZona = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((z) => z !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  if (!imagen) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg border-2 border-dashed border-sena-gray-dark/20 bg-sena-gray-light/30">
        <p className="text-sm text-sena-gray-dark/50 italic">
          Imagen no disponible
        </p>
      </div>
    );
  }

  return (
    <div className="relative inline-block max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagen}
        alt={imagenAlt}
        className="max-w-full h-auto block rounded-lg"
        style={{ pointerEvents: "none" }}
      />
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {zonas.map((zona) => {
          const isSelected = selectedIds.includes(zona.id);
          const commonProps = {
            "aria-label": zona.etiqueta,
            role: "button" as const,
            tabIndex: 0,
            style: { pointerEvents: "all" as const, cursor: "pointer" },
            fill: isSelected ? "rgba(57, 169, 0, 0.4)" : "rgba(255, 255, 255, 0.01)",
            stroke: isSelected ? "#39A900" : "#0032FF",
            strokeWidth: "0.5",
            onClick: () => toggleZona(zona.id),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") toggleZona(zona.id);
            },
          };

          if (zona.forma === "rect") {
            const [x, y, w, h] = zona.coordenadas;
            return (
              <rect
                key={zona.id}
                x={x}
                y={y}
                width={w}
                height={h}
                {...commonProps}
              />
            );
          }

          if (zona.forma === "circle") {
            const [cx, cy, r] = zona.coordenadas;
            return (
              <circle
                key={zona.id}
                cx={cx}
                cy={cy}
                r={r}
                {...commonProps}
              />
            );
          }

          if (zona.forma === "polygon") {
            // coordenadas: flat array [x1, y1, x2, y2, ...]
            const points: string[] = [];
            for (let i = 0; i + 1 < zona.coordenadas.length; i += 2) {
              points.push(`${zona.coordenadas[i]},${zona.coordenadas[i + 1]}`);
            }
            return (
              <polygon
                key={zona.id}
                points={points.join(" ")}
                {...commonProps}
              />
            );
          }

          return null;
        })}
      </svg>
      {/* Zone labels tooltip row */}
      {zonas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {zonas.map((zona) => {
            const isSelected = selectedIds.includes(zona.id);
            return (
              <button
                key={zona.id}
                type="button"
                onClick={() => toggleZona(zona.id)}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${
                  isSelected
                    ? "bg-sena-green text-white border-sena-green"
                    : "bg-white text-sena-blue border-sena-gray-dark/20 hover:border-sena-green"
                }`}
              >
                {zona.etiqueta}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

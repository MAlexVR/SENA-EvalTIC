"use client";

interface HotspotRendererProps {
  imagen: string;
  imagenAlt: string;
  click: { x: number; y: number } | null;
  onChange: (click: { x: number; y: number }) => void;
}

export function HotspotRenderer({ imagen, imagenAlt, click, onChange }: HotspotRendererProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange({ x, y });
  };

  if (!imagen) {
    return (
      <div className="flex items-center justify-center h-40 rounded-lg border-2 border-dashed border-sena-gray-dark/20 bg-sena-gray-light/30">
        <p className="text-sm text-sena-gray-dark/50 italic">Imagen no disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="relative inline-block max-w-full cursor-crosshair select-none rounded-lg overflow-hidden"
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagen}
          alt={imagenAlt}
          className="max-w-full h-auto block"
          draggable={false}
        />
        {click && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${click.x}%`,
              top: `${click.y}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <path
                d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
                fill="#0032FF"
              />
              <circle cx="14" cy="14" r="5" fill="white" />
            </svg>
          </div>
        )}
      </div>
      {click ? (
        <p className="text-xs text-sena-gray-dark/60">
          Marcaste ({click.x.toFixed(1)}%, {click.y.toFixed(1)}%) — Haz clic en otro punto para cambiar.
        </p>
      ) : (
        <p className="text-xs text-sena-gray-dark/50 italic">
          Haz clic sobre la imagen para marcar tu respuesta.
        </p>
      )}
    </div>
  );
}

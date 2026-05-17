"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle, FileJson, X, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPO_LABELS, type TipoPregunta } from "@/types/preguntas";

const TIPO_COLORS: Record<TipoPregunta, string> = {
  seleccion_unica: "text-sena-blue",
  seleccion_multiple: "text-amber-600",
  emparejamiento: "text-sena-green",
  verdadero_falso: "text-purple-600",
  completar: "text-cyan-600",
  ordenamiento: "text-orange-600",
  hotspot: "text-rose-600",
  clasificacion: "text-teal-600",
  numerica: "text-indigo-600",
};

interface ParsedStats {
  total: number;
  porTipo: Partial<Record<TipoPregunta, number>>;
}

interface JsonUploaderProps {
  onPreguntasLoad: (preguntas: unknown[]) => void;
  onClear?: () => void;
  className?: string;
}

function parsePreguntas(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (typeof json === "object" && json !== null && "preguntas" in json) {
    const withPreguntas = json as { preguntas: unknown };
    if (Array.isArray(withPreguntas.preguntas)) return withPreguntas.preguntas;
  }
  throw new Error("El archivo JSON no tiene la estructura esperada. Debe ser un array de preguntas o tener la propiedad 'preguntas'.");
}

function getStats(preguntas: unknown[]): ParsedStats {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typed = preguntas as any[];
  const porTipo: Partial<Record<TipoPregunta, number>> = {};
  const todosLosTipos = Object.keys(TIPO_LABELS) as TipoPregunta[];

  for (const tipo of todosLosTipos) {
    const count = typed.filter((p) => p.tipo === tipo).length;
    if (count > 0) {
      porTipo[tipo] = count;
    }
  }

  return {
    total: typed.length,
    porTipo,
  };
}

export function JsonUploader({ onPreguntasLoad, onClear, className }: JsonUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stats, setStats] = useState<ParsedStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setError("El archivo debe ser de tipo JSON (.json)");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("El archivo no puede superar los 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const preguntas = parsePreguntas(parsed);
        const parsedStats = getStats(preguntas);
        setFileName(file.name);
        setStats(parsedStats);
        setError(null);
        onPreguntasLoad(preguntas);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al parsear el archivo JSON");
        setStats(null);
        setFileName(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    setFileName(null);
    setStats(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  const tiposPresentes = stats
    ? (Object.keys(stats.porTipo) as TipoPregunta[])
    : [];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          isDragOver
            ? "border-sena-green bg-sena-green/5"
            : fileName
            ? "border-sena-green/40 bg-sena-green/5"
            : "border-sena-gray-dark/20 bg-sena-gray-light/50 hover:border-sena-green/50 hover:bg-sena-green/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex flex-col items-center gap-2">
          {fileName ? (
            <FileJson size={32} className="text-sena-green" />
          ) : (
            <Upload size={32} className="text-sena-gray-dark/40" />
          )}
          {fileName ? (
            <div>
              <p className="text-sm font-semibold text-sena-green">{fileName}</p>
              <p className="text-xs text-sena-gray-dark/50 mt-0.5">
                Haga clic para cambiar el archivo
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-sena-blue">
                Arrastre su archivo preguntas.json aquí
              </p>
              <p className="text-xs text-sena-gray-dark/50 mt-0.5">
                o haga clic para seleccionar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template download link */}
      {!fileName && (
        <p className="text-xs text-center text-sena-gray-dark/40">
          ¿No tienes un archivo?{" "}
          <a
            href="/api/instructor/templates/preguntas"
            download="plantilla-preguntas.json"
            className="text-sena-blue underline underline-offset-2 hover:text-sena-green"
          >
            <FileDown size={11} className="inline mr-0.5 mb-0.5" />
            Descargar plantilla JSON de ejemplo
          </a>
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats preview */}
      {stats && (
        <div className="bg-sena-green/5 border border-sena-green/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-sena-green" />
              <p className="text-sm font-bold text-sena-blue">
                {stats.total} preguntas cargadas
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-sena-gray-dark/50 hover:text-red-500 h-auto p-1"
            >
              <X size={14} />
            </Button>
          </div>
          {tiposPresentes.length > 0 && (
            <div
              className={cn(
                "grid gap-2 text-center",
                tiposPresentes.length <= 3
                  ? "grid-cols-3"
                  : tiposPresentes.length <= 4
                  ? "grid-cols-4"
                  : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5",
              )}
            >
              {tiposPresentes.map((tipo) => (
                <div
                  key={tipo}
                  className="bg-white rounded-lg p-2 border border-sena-gray-dark/10"
                >
                  <p className={cn("text-xl font-black", TIPO_COLORS[tipo])}>
                    {stats.porTipo[tipo]}
                  </p>
                  <p className="text-[10px] text-sena-gray-dark/60 leading-tight">
                    {TIPO_LABELS[tipo]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

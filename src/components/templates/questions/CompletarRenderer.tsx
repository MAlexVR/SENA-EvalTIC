"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SegmentoTexto {
  tipo: "texto";
  contenido: string;
}

interface SegmentoEspacio {
  tipo: "espacio";
  id: string;
  opciones?: string[];
  // respuestaCorrecta is stripped by sanitizarParaCliente — never present on client
}

type Segmento = SegmentoTexto | SegmentoEspacio;

interface CompletarRendererProps {
  segmentos: Segmento[];
  espacios: Record<string, string>;
  onChange: (espacioId: string, valor: string) => void;
}

export function CompletarRenderer({
  segmentos,
  espacios,
  onChange,
}: CompletarRendererProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-1 leading-loose text-base text-sena-blue">
      {segmentos.map((segmento, index) => {
        if (segmento.tipo === "texto") {
          return (
            <span key={index} className="text-sena-blue">
              {segmento.contenido}
            </span>
          );
        }

        // Espacio — either select (if opciones) or free text input
        const currentValue = espacios[segmento.id] ?? "";

        if (segmento.opciones && segmento.opciones.length > 0) {
          return (
            <Select
              key={segmento.id}
              value={currentValue}
              onValueChange={(val) => onChange(segmento.id, val)}
            >
              <SelectTrigger className="inline-flex h-8 w-36 border-sena-green/60 focus:ring-sena-green text-sm align-baseline">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {segmento.opciones.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        // Free text input — narrow inline width
        return (
          <Input
            key={segmento.id}
            type="text"
            value={currentValue}
            onChange={(e) => onChange(segmento.id, e.target.value)}
            className="inline-block h-8 w-28 text-sm border-sena-green/60 focus-visible:ring-sena-green align-baseline"
            placeholder="..."
          />
        );
      })}
    </div>
  );
}

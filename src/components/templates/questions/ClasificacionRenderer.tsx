"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Categoria {
  id: string;
  etiqueta: string;
}

interface Elemento {
  id: string;
  texto: string;
}

interface ClasificacionRendererProps {
  categorias: Categoria[];
  elementos: Elemento[];
  clasificacion: Record<string, string[]>;
  onChange: (clasificacion: Record<string, string[]>) => void;
}

/**
 * Renders a classification question using a Select dropdown per element.
 * This avoids nested DndContext issues (the outer PreguntasEditor uses DnD).
 * Each element gets a dropdown with all available categories.
 * Selecting a category removes the element from any previous category
 * and adds it to the selected one.
 */
export function ClasificacionRenderer({
  categorias,
  elementos,
  clasificacion,
  onChange,
}: ClasificacionRendererProps) {
  // Build reverse map: elementoId → categoriaId (current student assignment)
  const elementoToCategoria: Record<string, string> = {};
  for (const [catId, elemIds] of Object.entries(clasificacion)) {
    for (const elemId of elemIds) {
      elementoToCategoria[elemId] = catId;
    }
  }

  const handleSelect = (elementoId: string, categoriaId: string) => {
    // Remove element from any previous category
    const newClasificacion: Record<string, string[]> = {};
    for (const cat of categorias) {
      const prev = clasificacion[cat.id] ?? [];
      newClasificacion[cat.id] = prev.filter((id) => id !== elementoId);
    }

    // Add to the selected category (unless "sin-clasificar" sentinel)
    if (categoriaId && categoriaId !== "__none__") {
      newClasificacion[categoriaId] = [
        ...(newClasificacion[categoriaId] ?? []),
        elementoId,
      ];
    }

    onChange(newClasificacion);
  };

  return (
    <div className="space-y-3">
      {elementos.map((elemento) => {
        const currentCat = elementoToCategoria[elemento.id] ?? "";
        const catLabel = categorias.find((c) => c.id === currentCat)?.etiqueta;

        return (
          <div
            key={elemento.id}
            className="flex items-center gap-3 p-3 border border-sena-gray-dark/15 rounded-lg bg-white"
          >
            {/* Element text */}
            <span className="flex-1 text-sm font-medium text-sena-blue">
              {elemento.texto}
            </span>

            {/* Current assignment badge */}
            {catLabel && (
              <Badge
                variant="outline"
                className="shrink-0 text-xs border-teal-400 text-teal-600 bg-teal-50"
              >
                {catLabel}
              </Badge>
            )}

            {/* Category selector */}
            <div className="w-48 shrink-0">
              <Select
                value={currentCat || "__none__"}
                onValueChange={(val) => handleSelect(elemento.id, val)}
              >
                <SelectTrigger className="h-8 text-sm border-sena-gray-dark/30 focus:ring-sena-green">
                  <SelectValue placeholder="Selecciona categoría…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-sena-gray-dark/50 italic">Sin clasificar</span>
                  </SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

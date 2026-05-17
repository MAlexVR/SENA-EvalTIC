"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GripVertical, Pencil, Trash2, Plus, Save, PlusCircle, Loader2, AlertCircle, FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pregunta, TipoPregunta, Opcion, Par } from "@/types/preguntas";
import { TIPO_LABELS } from "@/types/preguntas";

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function newBlankPregunta(tipo: TipoPregunta): Pregunta {
  const base = { id: genId(), tipo, enunciado: "", retroalimentacion: "" };
  if (tipo === "emparejamiento") {
    return { ...base, tipo: "emparejamiento", pares: [{ izquierda: "", derecha: "" }, { izquierda: "", derecha: "" }] };
  }
  if (tipo === "verdadero_falso") {
    return { ...base, tipo: "verdadero_falso", respuestaCorrecta: ["verdadero"] } as unknown as Pregunta;
  }
  if (tipo === "numerica") {
    return { ...base, tipo: "numerica", respuestaCorrecta: 0, tolerancia: 0, unidad: "" } as unknown as Pregunta;
  }
  if (tipo === "ordenamiento") {
    const e1 = genId();
    const e2 = genId();
    return {
      ...base,
      tipo: "ordenamiento",
      instruccion: "",
      elementos: [
        { id: e1, texto: "" },
        { id: e2, texto: "" },
      ],
      respuestaCorrecta: [e1, e2],
    } as unknown as Pregunta;
  }
  if (tipo === "completar") {
    return {
      ...base,
      tipo: "completar",
      instruccion: "",
      segmentos: [],
    } as unknown as Pregunta;
  }
  const opciones: Opcion[] = [
    { id: "a", texto: "" },
    { id: "b", texto: "" },
    { id: "c", texto: "" },
    { id: "d", texto: "" },
  ];
  if (tipo === "seleccion_unica") {
    return { ...base, tipo: "seleccion_unica", opciones, respuestaCorrecta: "" };
  }
  return { ...base, tipo: "seleccion_multiple", opciones, respuestaCorrecta: [] };
}

const TIPO_COLORS: Record<TipoPregunta, string> = {
  seleccion_unica: "border-sena-blue text-sena-blue",
  seleccion_multiple: "border-amber-500 text-amber-600",
  emparejamiento: "border-sena-green text-sena-green",
  verdadero_falso: "border-purple-500 text-purple-600",
  completar: "border-cyan-500 text-cyan-600",
  ordenamiento: "border-orange-500 text-orange-600",
  hotspot: "border-rose-500 text-rose-600",
  clasificacion: "border-teal-500 text-teal-600",
  numerica: "border-indigo-500 text-indigo-600",
};

// ── Sortable item ─────────────────────────────────────────────────────────────

function SortablePreguntaItem({
  pregunta,
  index,
  onEdit,
  onDelete,
}: {
  pregunta: Pregunta;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: pregunta.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 bg-white border border-sena-gray-dark/10 rounded-xl px-4 py-3 shadow-sm",
        isDragging && "opacity-50 ring-2 ring-sena-green/30 shadow-lg"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-sena-gray-dark/30 hover:text-sena-gray-dark/60 cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Arrastrar"
      >
        <GripVertical size={18} />
      </button>

      {/* Number */}
      <span className="text-xs font-bold text-sena-gray-dark/40 w-5 shrink-0 text-center">
        {index + 1}
      </span>

      {/* Type badge */}
      <Badge
        variant="outline"
        className={cn("text-[10px] font-bold shrink-0", TIPO_COLORS[pregunta.tipo])}
      >
        {TIPO_LABELS[pregunta.tipo]}
      </Badge>

      {/* Text */}
      <p className="flex-1 text-sm text-sena-gray-dark/80 truncate">
        {pregunta.enunciado || <span className="text-sena-gray-dark/30 italic">Sin texto</span>}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sena-blue hover:bg-sena-blue/5"
          onClick={onEdit}
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

function EditPreguntaDialog({
  pregunta,
  open,
  onClose,
  onSave,
}: {
  pregunta: Pregunta | null;
  open: boolean;
  onClose: () => void;
  onSave: (p: Pregunta) => void;
}) {
  const [draft, setDraft] = useState<Pregunta | null>(pregunta);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync draft when dialog opens
  if (open && pregunta && draft?.id !== pregunta.id) {
    setDraft(pregunta);
    setValidationError(null);
  }

  if (!draft) return null;

  const updateDraft = (update: Partial<Pregunta>) =>
    setDraft((prev) => (prev ? { ...prev, ...update } as Pregunta : prev));

  const handleTypeChange = (tipo: TipoPregunta) => {
    if (!draft) return;
    const base = { id: draft.id, enunciado: draft.enunciado, retroalimentacion: "retroalimentacion" in draft ? draft.retroalimentacion : "" };
    setDraft(newBlankPregunta(tipo));
    setDraft((prev) => prev ? { ...prev, id: base.id, enunciado: base.enunciado, retroalimentacion: base.retroalimentacion } as Pregunta : prev);
  };

  const validate = (): string | null => {
    if (!draft.enunciado.trim()) return "El texto de la pregunta es requerido.";
    if (draft.tipo === "emparejamiento") {
      if (draft.pares.length < 2) return "Se requieren al menos 2 pares.";
      if (draft.pares.some((p) => !p.izquierda.trim() || !p.derecha.trim()))
        return "Todos los pares deben tener texto en ambos lados.";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((draft as any).tipo === "verdadero_falso") {
      const vf = draft as unknown as { respuestaCorrecta: string[] };
      if (!vf.respuestaCorrecta?.[0]) return "Debe seleccionar la respuesta correcta.";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((draft as any).tipo === "numerica") {
      const num = draft as unknown as { respuestaCorrecta: number; tolerancia: number };
      if (num.respuestaCorrecta === undefined || num.respuestaCorrecta === null || isNaN(num.respuestaCorrecta))
        return "Debe ingresar la respuesta correcta.";
      if (num.tolerancia === undefined || num.tolerancia === null || isNaN(num.tolerancia) || num.tolerancia < 0)
        return "La tolerancia debe ser un número mayor o igual a 0.";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((draft as any).tipo === "ordenamiento") {
      const ord = draft as unknown as { elementos: { id: string; texto: string }[]; respuestaCorrecta: string[] };
      if (!ord.elementos || ord.elementos.length < 2) return "Se requieren al menos 2 elementos.";
      if (ord.elementos.some((e) => !e.texto.trim())) return "Todos los elementos deben tener texto.";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((draft as any).tipo === "completar") {
      const comp = draft as unknown as { segmentos: any[] };
      const espacios = (comp.segmentos ?? []).filter((s: any) => s.tipo === "espacio");
      if (espacios.length === 0) return "Debe incluir al menos un espacio [[id]] en la oración.";
      const espaciosInvalidos = espacios.filter((s: any) => !s.respuestaCorrecta?.trim());
      if (espaciosInvalidos.length > 0) return "Todos los espacios deben tener una respuesta correcta.";
    } else {
      const opts = draft.opciones;
      if (opts.length < 2) return "Se requieren al menos 2 opciones.";
      if (opts.some((o) => !o.texto.trim())) return "Todas las opciones deben tener texto.";
      if (draft.tipo === "seleccion_unica") {
        if (!draft.respuestaCorrecta) return "Debe seleccionar una respuesta correcta.";
      } else {
        if (!draft.respuestaCorrecta.length) return "Debe seleccionar al menos una respuesta correcta.";
      }
    }
    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) { setValidationError(error); return; }
    setValidationError(null);
    onSave(draft!);
  };

  // ── Opción actions ──
  const addOpcion = () => {
    if (draft.tipo === "emparejamiento") return;
    const newId = String.fromCharCode(97 + draft.opciones.length); // a, b, c...
    updateDraft({ opciones: [...draft.opciones, { id: newId, texto: "" }] } as Partial<Pregunta>);
  };

  const updateOpcion = (idx: number, texto: string) => {
    if (draft.tipo === "emparejamiento") return;
    const opciones = draft.opciones.map((o, i) => (i === idx ? { ...o, texto } : o));
    updateDraft({ opciones } as Partial<Pregunta>);
  };

  const removeOpcion = (idx: number) => {
    if (draft.tipo === "emparejamiento") return;
    const opciones = draft.opciones.filter((_, i) => i !== idx);
    updateDraft({ opciones } as Partial<Pregunta>);
  };

  // ── Par actions ──
  const addPar = () => {
    if (draft.tipo !== "emparejamiento") return;
    updateDraft({ pares: [...draft.pares, { izquierda: "", derecha: "" }] } as Partial<Pregunta>);
  };

  const updatePar = (idx: number, side: "izquierda" | "derecha", value: string) => {
    if (draft.tipo !== "emparejamiento") return;
    const pares: Par[] = draft.pares.map((p, i) => (i === idx ? { ...p, [side]: value } : p));
    updateDraft({ pares } as Partial<Pregunta>);
  };

  const removePar = (idx: number) => {
    if (draft.tipo !== "emparejamiento") return;
    updateDraft({ pares: draft.pares.filter((_, i) => i !== idx) } as Partial<Pregunta>);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sena-blue">
            {draft.enunciado ? "Editar pregunta" : "Nueva pregunta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Type */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-sena-blue">Tipo de pregunta</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={draft.tipo}
              onChange={(e) => handleTypeChange(e.target.value as TipoPregunta)}
            >
              <option value="seleccion_unica">Selección única</option>
              <option value="seleccion_multiple">Selección múltiple</option>
              <option value="emparejamiento">Emparejamiento</option>
              <option value="verdadero_falso">Verdadero / Falso</option>
              <option value="numerica">Numérica</option>
              <option value="ordenamiento">Ordenamiento</option>
              <option value="completar">Completar espacios</option>
            </select>
          </div>

          {/* Text */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-sena-blue">Texto de la pregunta *</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              value={draft.enunciado}
              onChange={(e) => updateDraft({ enunciado: e.target.value })}
              placeholder="Escriba aquí el enunciado de la pregunta..."
            />
          </div>

          {/* ── Opciones (selección única / múltiple) ── */}
          {(draft.tipo === "seleccion_unica" || draft.tipo === "seleccion_multiple") && (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-sena-blue">
                  Opciones {draft.tipo === "seleccion_unica" ? "(selecciona la correcta)" : "(selecciona las correctas)"}
                </Label>
                {draft.opciones.map((op, idx) => (
                  <div key={op.id} className="flex items-center gap-2">
                    {draft.tipo === "seleccion_unica" ? (
                      <input
                        type="radio"
                        name={`respuesta-${draft.id}`}
                        checked={draft.respuestaCorrecta === op.id}
                        onChange={() => updateDraft({ respuestaCorrecta: op.id } as Partial<Pregunta>)}
                        className="shrink-0 accent-sena-green"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={draft.respuestaCorrecta.includes(op.id)}
                        onChange={(e) => {
                          const current = draft.respuestaCorrecta as string[];
                          const next = e.target.checked
                            ? [...current, op.id]
                            : current.filter((id) => id !== op.id);
                          updateDraft({ respuestaCorrecta: next } as Partial<Pregunta>);
                        }}
                        className="shrink-0 accent-sena-green"
                      />
                    )}
                    <span className="text-xs font-bold text-sena-gray-dark/40 w-4">{op.id})</span>
                    <Input
                      className="h-8 text-sm"
                      value={op.texto}
                      onChange={(e) => updateOpcion(idx, e.target.value)}
                      placeholder={`Opción ${op.id.toUpperCase()}`}
                    />
                    {draft.opciones.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:bg-red-50 shrink-0"
                        onClick={() => removeOpcion(idx)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                ))}
                {draft.opciones.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-sena-green hover:text-sena-green-dark h-7"
                    onClick={addOpcion}
                  >
                    <Plus size={12} />
                    Agregar opción
                  </Button>
                )}
              </div>
            </>
          )}

          {/* ── Pares (emparejamiento) ── */}
          {draft.tipo === "emparejamiento" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-sena-blue">Pares a relacionar</Label>
              {draft.pares.map((par, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    className="h-8 text-sm"
                    value={par.izquierda}
                    onChange={(e) => updatePar(idx, "izquierda", e.target.value)}
                    placeholder="Concepto"
                  />
                  <span className="text-sena-gray-dark/40 shrink-0">↔</span>
                  <Input
                    className="h-8 text-sm"
                    value={par.derecha}
                    onChange={(e) => updatePar(idx, "derecha", e.target.value)}
                    placeholder="Definición"
                  />
                  {draft.pares.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:bg-red-50 shrink-0"
                      onClick={() => removePar(idx)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-sena-green hover:text-sena-green-dark h-7"
                onClick={addPar}
              >
                <Plus size={12} />
                Agregar par
              </Button>
            </div>
          )}

          {/* ── Verdadero / Falso ── */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(draft as any).tipo === "verdadero_falso" && (() => {
            const draftVf = draft as unknown as { id: string; tipo: string; respuestaCorrecta: string[] };
            return (
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-sena-blue">Respuesta correcta *</Label>
                <div className="flex gap-3">
                  {(["verdadero", "falso"] as const).map((valor) => {
                    const isSelected = draftVf.respuestaCorrecta?.[0] === valor;
                    return (
                      <label
                        key={valor}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-sena-green bg-sena-green/5 text-sena-green font-bold"
                            : "border-sena-gray-dark/20 text-sena-gray-dark/60 hover:border-sena-green/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`vf-${draftVf.id}`}
                          checked={isSelected}
                          onChange={() =>
                            setDraft((prev) =>
                              prev
                                ? ({ ...prev, respuestaCorrecta: [valor] } as unknown as Pregunta)
                                : prev
                            )
                          }
                          className="accent-sena-green"
                        />
                        {valor === "verdadero" ? "Verdadero" : "Falso"}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Numérica ── */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(draft as any).tipo === "numerica" && (() => {
            const draftNum = draft as unknown as { respuestaCorrecta: number; tolerancia: number; unidad?: string };
            return (
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-sena-blue">Respuesta correcta *</Label>
                  <Input
                    type="number"
                    step="any"
                    className="h-8 text-sm"
                    value={draftNum.respuestaCorrecta ?? ""}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? ({ ...prev, respuestaCorrecta: parseFloat(e.target.value) } as unknown as Pregunta)
                          : prev
                      )
                    }
                    placeholder="Ej: 299792458"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-sena-blue">Tolerancia (margen de error permitido) *</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    className="h-8 text-sm"
                    value={draftNum.tolerancia ?? 0}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? ({ ...prev, tolerancia: parseFloat(e.target.value) } as unknown as Pregunta)
                          : prev
                      )
                    }
                    placeholder="0"
                  />
                  <p className="text-[10px] text-sena-gray-dark/50">
                    0 = coincidencia exacta. Ejemplo: tolerancia 5 acepta entre 95 y 105 si la respuesta es 100.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-sena-blue">Unidad (opcional)</Label>
                  <Input
                    type="text"
                    className="h-8 text-sm"
                    value={draftNum.unidad ?? ""}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? ({ ...prev, unidad: e.target.value } as unknown as Pregunta)
                          : prev
                      )
                    }
                    placeholder="m/s"
                  />
                </div>
              </div>
            );
          })()}

          {/* ── Ordenamiento ── */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(draft as any).tipo === "ordenamiento" && (() => {
            const draftOrd = draft as unknown as {
              id: string;
              instruccion?: string;
              elementos: { id: string; texto: string }[];
              respuestaCorrecta: string[];
            };

            const addElemento = () => {
              const newId = genId();
              const newElementos = [...draftOrd.elementos, { id: newId, texto: "" }];
              setDraft((prev) =>
                prev
                  ? ({ ...prev, elementos: newElementos, respuestaCorrecta: newElementos.map((e) => e.id) } as unknown as Pregunta)
                  : prev
              );
            };

            const updateElementoTexto = (idx: number, texto: string) => {
              const newElementos = draftOrd.elementos.map((e, i) =>
                i === idx ? { ...e, texto } : e
              );
              setDraft((prev) =>
                prev ? ({ ...prev, elementos: newElementos } as unknown as Pregunta) : prev
              );
            };

            const removeElemento = (idx: number) => {
              const newElementos = draftOrd.elementos.filter((_, i) => i !== idx);
              setDraft((prev) =>
                prev
                  ? ({ ...prev, elementos: newElementos, respuestaCorrecta: newElementos.map((e) => e.id) } as unknown as Pregunta)
                  : prev
              );
            };

            const moveElemento = (fromIdx: number, toIdx: number) => {
              const newElementos = [...draftOrd.elementos];
              const [moved] = newElementos.splice(fromIdx, 1);
              newElementos.splice(toIdx, 0, moved);
              setDraft((prev) =>
                prev
                  ? ({ ...prev, elementos: newElementos, respuestaCorrecta: newElementos.map((e) => e.id) } as unknown as Pregunta)
                  : prev
              );
            };

            return (
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-sena-blue">Instrucción (opcional)</Label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    value={draftOrd.instruccion ?? ""}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev ? ({ ...prev, instruccion: e.target.value } as unknown as Pregunta) : prev
                      )
                    }
                    placeholder="Ej: Ordena los pasos del proceso de forma correcta."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-sena-blue">
                    Elementos y orden correcto *
                  </Label>
                  <p className="text-[10px] text-sena-gray-dark/50">
                    Agrega los elementos. El orden de la lista define la respuesta correcta. Usa los botones ↑↓ para reordenar.
                  </p>
                  {draftOrd.elementos.map((elem, idx) => (
                    <div key={elem.id} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sena-gray-dark/40 w-5 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        className="h-8 text-sm flex-1"
                        value={elem.texto}
                        onChange={(e) => updateElementoTexto(idx, e.target.value)}
                        placeholder={`Elemento ${idx + 1}`}
                      />
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-6 text-sena-gray-dark/40 hover:text-sena-blue"
                          onClick={() => idx > 0 && moveElemento(idx, idx - 1)}
                          disabled={idx === 0}
                          aria-label="Mover arriba"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-6 text-sena-gray-dark/40 hover:text-sena-blue"
                          onClick={() => idx < draftOrd.elementos.length - 1 && moveElemento(idx, idx + 1)}
                          disabled={idx === draftOrd.elementos.length - 1}
                          aria-label="Mover abajo"
                        >
                          ↓
                        </Button>
                      </div>
                      {draftOrd.elementos.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:bg-red-50 shrink-0"
                          onClick={() => removeElemento(idx)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-sena-green hover:text-sena-green-dark h-7"
                    onClick={addElemento}
                  >
                    <Plus size={12} />
                    Agregar elemento
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* ── Completar espacios ── */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(draft as any).tipo === "completar" && (() => {
            const draftComp = draft as unknown as {
              instruccion?: string;
              segmentos: Array<{ tipo: "texto" | "espacio"; contenido?: string; id?: string; respuestaCorrecta?: string; opciones?: string[] }>;
            };

            // Parse [[id]] tokens from raw text to build segmentos array
            const parseOracion = (oracion: string) => {
              const parts = oracion.split(/(\[\[[\w-]+\]\])/g);
              const segs: typeof draftComp.segmentos = [];
              const existingEspacios = draftComp.segmentos.filter((s) => s.tipo === "espacio");

              for (const part of parts) {
                const match = part.match(/^\[\[([\w-]+)\]\]$/);
                if (match) {
                  const id = match[1];
                  const existing = existingEspacios.find((s) => s.id === id);
                  segs.push({
                    tipo: "espacio",
                    id,
                    respuestaCorrecta: existing?.respuestaCorrecta ?? "",
                    opciones: existing?.opciones ?? [],
                  });
                } else if (part) {
                  segs.push({ tipo: "texto", contenido: part });
                }
              }
              return segs;
            };

            // Reconstruct raw oracion text from segmentos for the textarea
            const buildOracion = (segs: typeof draftComp.segmentos) =>
              segs.map((s) => (s.tipo === "texto" ? s.contenido : `[[${s.id}]]`)).join("");

            const rawOracion = buildOracion(draftComp.segmentos);
            const espacioSegs = draftComp.segmentos.filter((s) => s.tipo === "espacio") as Array<{
              tipo: "espacio"; id: string; respuestaCorrecta?: string; opciones?: string[];
            }>;

            const handleOracionChange = (value: string) => {
              const newSegmentos = parseOracion(value);
              setDraft((prev) => prev ? ({ ...prev, segmentos: newSegmentos } as unknown as Pregunta) : prev);
            };

            const updateEspacio = (id: string, field: "respuestaCorrecta" | "opciones", value: string | string[]) => {
              const newSegmentos = draftComp.segmentos.map((s) =>
                s.tipo === "espacio" && s.id === id ? { ...s, [field]: value } : s
              );
              setDraft((prev) => prev ? ({ ...prev, segmentos: newSegmentos } as unknown as Pregunta) : prev);
            };

            return (
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-sena-blue">Instrucción (opcional)</Label>
                  <textarea
                    className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    value={draftComp.instruccion ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => prev ? ({ ...prev, instruccion: e.target.value } as unknown as Pregunta) : prev)
                    }
                    placeholder="Ej: Completa los espacios con la palabra correcta."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-sena-blue">Oración con espacios *</Label>
                  <p className="text-[10px] text-sena-gray-dark/50">
                    Escribe la oración y usa {"[[id]]"} para marcar cada espacio en blanco. Ejemplo: El agua hierve a {"[[temp]]"} grados.
                  </p>
                  <textarea
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono"
                    value={rawOracion}
                    onChange={(e) => handleOracionChange(e.target.value)}
                    placeholder="El agua hierve a [[temp]] grados Celsius a presión estándar."
                  />
                </div>

                {espacioSegs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-sena-blue">Configurar espacios detectados *</Label>
                    {espacioSegs.map((espacio) => (
                      <div key={espacio.id} className="border border-sena-gray-dark/10 rounded-lg p-3 space-y-2 bg-sena-gray-light/30">
                        <p className="text-xs font-bold text-cyan-600">Espacio: [[{espacio.id}]]</p>
                        <div className="grid gap-1">
                          <Label className="text-[10px] text-sena-gray-dark/70">Respuesta correcta *</Label>
                          <Input
                            className="h-7 text-xs"
                            value={espacio.respuestaCorrecta ?? ""}
                            onChange={(e) => updateEspacio(espacio.id, "respuestaCorrecta", e.target.value)}
                            placeholder="Respuesta esperada"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[10px] text-sena-gray-dark/70">
                            Opciones para dropdown (opcional, separadas por coma)
                          </Label>
                          <Input
                            className="h-7 text-xs"
                            value={(espacio.opciones ?? []).join(", ")}
                            onChange={(e) => {
                              const opts = e.target.value
                                .split(",")
                                .map((o) => o.trim())
                                .filter(Boolean);
                              updateEspacio(espacio.id, "opciones", opts);
                            }}
                            placeholder="Ej: 0, 100, -273"
                          />
                          <p className="text-[10px] text-sena-gray-dark/40">
                            Si está vacío, el aprendiz escribirá libremente. Si tiene opciones, verá un menú desplegable.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Retroalimentación */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-sena-blue">
              Retroalimentación (opcional)
            </Label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              value={"retroalimentacion" in draft ? (draft.retroalimentacion ?? "") : ""}
              onChange={(e) => updateDraft({ retroalimentacion: e.target.value })}
              placeholder="Explicación de la respuesta correcta..."
            />
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {validationError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            className="bg-sena-green hover:bg-sena-green-dark text-white font-bold"
          >
            Guardar pregunta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PreguntasEditorProps {
  evaluacionId: string;
  evaluacionNombre: string;
  initialPreguntas: Pregunta[];
}

export function PreguntasEditor({
  evaluacionId,
  evaluacionNombre,
  initialPreguntas,
}: PreguntasEditorProps) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(initialPreguntas);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dialog state
  const [editingPregunta, setEditingPregunta] = useState<Pregunta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPreguntas((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === active.id);
        const newIndex = prev.findIndex((p) => p.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }, []);

  const openNew = () => {
    setEditingPregunta(newBlankPregunta("seleccion_unica"));
    setDialogOpen(true);
  };

  const openEdit = (p: Pregunta) => {
    setEditingPregunta(p);
    setDialogOpen(true);
  };

  const handleSavePregunta = (updated: Pregunta) => {
    setPreguntas((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx === -1) return [...prev, updated];
      return prev.map((p) => (p.id === updated.id ? updated : p));
    });
    setHasChanges(true);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/instructor/evaluaciones/${evaluacionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preguntas }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Error al guardar");
        return;
      }
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky save bar */}
      <div className={cn(
        "sticky top-0 z-10 flex items-center justify-between py-3 px-4 rounded-xl border transition-all",
        hasChanges
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-sena-gray-dark/10"
      )}>
        <div>
          {hasChanges ? (
            <p className="text-sm font-semibold text-amber-700">Cambios sin guardar</p>
          ) : saveSuccess ? (
            <p className="text-sm font-semibold text-sena-green">¡Cambios guardados correctamente!</p>
          ) : (
            <p className="text-sm text-sena-gray-dark/50">
              {preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""} en el banco
            </p>
          )}
          {saveError && (
            <p className="text-xs text-red-600 mt-0.5">{saveError}</p>
          )}
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={!hasChanges || saving}
          className={cn(
            "gap-2 font-bold",
            hasChanges
              ? "bg-sena-green hover:bg-sena-green-dark text-white"
              : "bg-sena-gray-light text-sena-gray-dark/40"
          )}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Question list */}
      {preguntas.length === 0 ? (
        <div className="text-center py-16 text-sena-gray-dark/50 border-2 border-dashed border-sena-gray-dark/10 rounded-xl space-y-2">
          <p className="font-semibold">Sin preguntas</p>
          <p className="text-sm mt-1">Agrega preguntas usando el botón de abajo.</p>
          <a
            href="/api/instructor/templates/preguntas"
            download={`plantilla-preguntas-${evaluacionNombre.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}.json`}
            className="inline-flex items-center gap-1.5 text-xs text-sena-blue underline underline-offset-2 hover:text-sena-green mt-1"
          >
            <FileDown size={13} />
            Descargar plantilla JSON de ejemplo
          </a>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={preguntas.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {preguntas.map((p, idx) => (
                <SortablePreguntaItem
                  key={p.id}
                  pregunta={p}
                  index={idx}
                  onEdit={() => openEdit(p)}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add button + template download */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2 border-dashed border-sena-green text-sena-green hover:bg-sena-green hover:text-white font-semibold"
          onClick={openNew}
        >
          <PlusCircle size={16} />
          Agregar pregunta
        </Button>
        {preguntas.length > 0 && (
          <Button variant="outline" className="gap-2 text-sena-green border-sena-green/30 hover:bg-sena-green/5" asChild>
            <a href={`/api/instructor/evaluaciones/${evaluacionId}/preguntas`}>
              <FileDown size={15} />
              Descargar banco
            </a>
          </Button>
        )}
        <Button variant="outline" className="gap-2 text-sena-blue border-sena-blue/30 hover:bg-sena-blue/5" asChild>
          <a
            href="/api/instructor/templates/preguntas"
            download={`plantilla-preguntas-${evaluacionNombre.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}.json`}
          >
            <FileDown size={15} />
            Plantilla JSON
          </a>
        </Button>
      </div>

      {/* Edit dialog */}
      <EditPreguntaDialog
        pregunta={editingPregunta}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSavePregunta}
      />
    </div>
  );
}

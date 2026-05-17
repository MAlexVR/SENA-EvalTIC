"use client";

import { useState, useEffect } from "react";
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
import { GripVertical } from "lucide-react";

interface OrdenamientoItem {
  id: string;
  texto: string;
}

interface OrdenamientoRendererProps {
  elementos: OrdenamientoItem[];
  onChange: (orden: string[]) => void;
}

function SortableOrdenamientoItem({
  item,
  position,
}: {
  item: OrdenamientoItem;
  position: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 shadow-sm select-none ${
        isDragging
          ? "opacity-50 ring-2 ring-sena-green/30 shadow-lg border-sena-green/30"
          : "border-sena-gray-dark/20 hover:border-sena-green/40"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="text-sena-gray-dark/30 hover:text-sena-gray-dark/60 cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical size={18} />
      </button>

      <span className="w-6 h-6 rounded-full bg-sena-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
        {position}
      </span>

      <span className="text-sm text-sena-blue leading-relaxed flex-1">
        {item.texto}
      </span>
    </div>
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function OrdenamientoRenderer({
  elementos,
  onChange,
}: OrdenamientoRendererProps) {
  // Shuffle once on mount — never re-shuffle on re-renders
  const [items, setItems] = useState<OrdenamientoItem[]>(() =>
    shuffleArray(elementos),
  );

  // Notify parent of initial (shuffled) order on mount
  useEffect(() => {
    onChange(items.map((i) => i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(prev, oldIndex, newIndex);
        onChange(newItems.map((i) => i.id));
        return newItems;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <SortableOrdenamientoItem
              key={item.id}
              item={item}
              position={index + 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

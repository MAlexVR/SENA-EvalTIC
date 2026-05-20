export interface Opcion {
  id: string;
  texto: string;
}

export interface Par {
  izquierda: string;
  derecha: string;
}

export interface PreguntaSeleccionUnica {
  id: string;
  tipo: "seleccion_unica";
  enunciado: string;
  opciones: Opcion[];
  respuestaCorrecta: string;
  retroalimentacion?: string;
}

export interface PreguntaSeleccionMultiple {
  id: string;
  tipo: "seleccion_multiple";
  enunciado: string;
  opciones: Opcion[];
  respuestaCorrecta: string[];
  retroalimentacion?: string;
}

export interface PreguntaEmparejamiento {
  id: string;
  tipo: "emparejamiento";
  enunciado: string;
  pares: Par[];
  retroalimentacion?: string;
}

export interface PreguntaVerdaderoFalso {
  id: string | number;
  tipo: "verdadero_falso";
  enunciado?: string;
  texto?: string;
  respuestaCorrecta: ("verdadero" | "falso")[];
  retroalimentacion?: string;
}

export interface SegmentoTexto {
  tipo: "texto";
  contenido: string;
}

export interface SegmentoEspacio {
  tipo: "espacio";
  id: string;
  opciones?: string[];
  respuestaCorrecta: string;
}

export interface PreguntaCompletar {
  id: string | number;
  tipo: "completar";
  enunciado?: string;
  instruccion: string;
  segmentos: (SegmentoTexto | SegmentoEspacio)[];
  retroalimentacion?: string;
}

export interface PreguntaOrdenamiento {
  id: string | number;
  tipo: "ordenamiento";
  enunciado?: string;
  instruccion: string;
  elementos: { id: string; texto: string }[];
  respuestaCorrecta: string[];
  retroalimentacion?: string;
}

export interface ZonaCorrecta {
  cx: number;     // 0–100 (% del ancho de imagen)
  cy: number;     // 0–100 (% del alto de imagen)
  radio: number;  // 0–100 (% del ancho, radio de tolerancia configurable)
}

export interface PreguntaHotspot {
  id: string | number;
  tipo: "hotspot";
  enunciado?: string;
  instruccion: string;
  imagen: string;
  imagenAlt: string;
  zonaCorrecta: ZonaCorrecta;
  retroalimentacion?: string;
}

export interface PreguntaClasificacion {
  id: string | number;
  tipo: "clasificacion";
  enunciado?: string;
  instruccion: string;
  categorias: { id: string; etiqueta: string }[];
  elementos: { id: string; texto: string }[];
  respuestaCorrecta: Record<string, string[]>;
  retroalimentacion?: string;
}

export interface PreguntaNumerica {
  id: string | number;
  tipo: "numerica";
  enunciado?: string;
  texto?: string;
  unidad?: string;
  respuestaCorrecta: number;
  tolerancia: number;
  retroalimentacion?: string;
}

export type Pregunta =
  | PreguntaSeleccionUnica
  | PreguntaSeleccionMultiple
  | PreguntaEmparejamiento
  | PreguntaVerdaderoFalso
  | PreguntaCompletar
  | PreguntaOrdenamiento
  | PreguntaHotspot
  | PreguntaClasificacion
  | PreguntaNumerica;

export type TipoPregunta =
  | "seleccion_unica"
  | "seleccion_multiple"
  | "emparejamiento"
  | "verdadero_falso"
  | "completar"
  | "ordenamiento"
  | "hotspot"
  | "clasificacion"
  | "numerica";

export const TIPO_LABELS: Record<TipoPregunta, string> = {
  seleccion_unica: "Selección única",
  seleccion_multiple: "Selección múltiple",
  emparejamiento: "Emparejamiento",
  verdadero_falso: "Verdadero / Falso",
  completar: "Completar espacios",
  ordenamiento: "Ordenamiento",
  hotspot: "Punto activo",
  clasificacion: "Clasificación",
  numerica: "Numérica",
};

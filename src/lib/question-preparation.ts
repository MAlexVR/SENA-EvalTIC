import { shuffleArray } from "@/lib/shuffle";
import type { TipoPregunta } from "@/types/preguntas";

export function prepareQuestionsForClient(
  banco: any[],
  dist: Record<string, number>,
  aleatorizarOpciones: boolean,
): any[] {
  const tiposValidos = Object.keys(dist);
  const porTipo: Record<string, any[]> = {};
  for (const p of banco) {
    const t = p.tipo as string;
    if (tiposValidos.includes(t)) {
      if (!porTipo[t]) porTipo[t] = [];
      porTipo[t].push(p);
    }
  }

  const seleccionadas: any[] = [];
  for (const [tipo, cantidad] of Object.entries(dist)) {
    if (!cantidad || cantidad <= 0) continue;
    const disponibles = porTipo[tipo] ?? [];
    const shuffled = shuffleArray([...disponibles]);
    seleccionadas.push(...shuffled.slice(0, cantidad));
  }

  return shuffleArray(seleccionadas).map((p: any) => {
    const pregunta = JSON.parse(JSON.stringify(p));
    if (!pregunta.enunciado && pregunta.texto) {
      pregunta.enunciado = pregunta.texto;
    }
    pregunta.id = String(pregunta.id);
    if (aleatorizarOpciones && pregunta.opciones) {
      pregunta.opciones = shuffleArray([...pregunta.opciones]);
    }
    return sanitizarParaCliente(pregunta, p.tipo as TipoPregunta);
  });
}

export function sanitizarParaCliente(pregunta: any, tipo: TipoPregunta): any {
  const q = { ...pregunta };
  delete q.respuestaCorrecta;
  delete q.retroalimentacion;
  delete q.tolerancia;

  switch (tipo) {
    case "hotspot":
      if (Array.isArray(q.zonas)) {
        q.zonas = q.zonas.map((z: any) => {
          const zona = { ...z };
          delete zona.esCorrecta;
          return zona;
        });
      }
      break;
    case "completar":
      if (Array.isArray(q.segmentos)) {
        q.segmentos = q.segmentos.map((s: any) => {
          if (s.tipo === "espacio") {
            const seg = { ...s };
            delete seg.respuestaCorrecta;
            return seg;
          }
          return s;
        });
      }
      break;
    case "emparejamiento":
      if (Array.isArray(q.pares)) {
        const izquierdas = q.pares.map((p: any) => p.izquierda);
        const derechas = q.pares.map((p: any) => p.derecha);
        q.izquierdas = izquierdas;
        q.derechas = shuffleArray([...derechas]);
        delete q.pares;
      }
      break;
    case "ordenamiento":
      if (Array.isArray(q.elementos)) {
        q.elementos = shuffleArray([...q.elementos]);
      }
      break;
    case "clasificacion":
      if (Array.isArray(q.elementos)) {
        q.elementos = shuffleArray([...q.elementos]);
      }
      break;
  }
  return q;
}

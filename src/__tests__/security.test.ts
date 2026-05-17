import { describe, it, expect } from "vitest";
import { sanitizarParaCliente } from "@/lib/question-preparation";

// Helper: simula sanitizarResultado (mantiene retroalimentacion, elimina respuestas)
function sanitizarResultado(q: any): any {
  const r = sanitizarParaCliente(q, q.tipo);
  if (q.retroalimentacion) r.retroalimentacion = q.retroalimentacion;
  return r;
}

describe("Seguridad — sanitizarParaCliente nunca expone respuestas correctas", () => {
  it("seleccion_unica: elimina respuestaCorrecta", () => {
    const p = {
      id: "1", tipo: "seleccion_unica",
      enunciado: "¿Qué capa enruta paquetes?",
      opciones: [{ id: "a", texto: "Red" }, { id: "b", texto: "Transporte" }],
      respuestaCorrecta: ["a"],
      retroalimentacion: "La capa de Red enruta.",
    };
    const r = sanitizarParaCliente(p, "seleccion_unica");
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
  });

  it("seleccion_multiple: elimina respuestaCorrecta", () => {
    const p = {
      id: "2", tipo: "seleccion_multiple",
      enunciado: "¿Cuáles son protocolos de transporte?",
      opciones: [{ id: "a", texto: "TCP" }, { id: "b", texto: "HTTP" }, { id: "c", texto: "UDP" }],
      respuestaCorrecta: ["a", "c"],
      retroalimentacion: "TCP y UDP son de transporte.",
    };
    const r = sanitizarParaCliente(p, "seleccion_multiple");
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
  });

  it("hotspot: elimina zonaCorrecta (coordenadas del punto correcto)", () => {
    const p = {
      id: "3", tipo: "hotspot",
      instruccion: "Haz clic en el router.",
      imagen: "url", imagenAlt: "Diagrama",
      zonaCorrecta: { cx: 50, cy: 20, radio: 12 },
      respuestaCorrecta: ["any"],
      retroalimentacion: "El router es la gateway.",
      tolerancia: 5,
    };
    const r = sanitizarParaCliente(p, "hotspot");
    expect(r.zonaCorrecta).toBeUndefined();
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.tolerancia).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
    expect(r.imagen).toBe("url");
  });

  it("completar: elimina respuestaCorrecta de segmentos tipo espacio", () => {
    const p = {
      id: "4", tipo: "completar",
      instruccion: "Completa:",
      segmentos: [
        { tipo: "texto", contenido: "El protocolo " },
        { tipo: "espacio", id: "s1", opciones: ["TCP", "UDP"], respuestaCorrecta: "TCP" },
        { tipo: "texto", contenido: " es orientado a conexión." },
      ],
      retroalimentacion: "TCP garantiza entrega.",
    };
    const r = sanitizarParaCliente(p, "completar");
    expect(r.segmentos[1].respuestaCorrecta).toBeUndefined();
    expect(r.segmentos[1].opciones).toEqual(["TCP", "UDP"]);
    expect(r.segmentos[0].contenido).toBe("El protocolo ");
    expect(r.retroalimentacion).toBeUndefined();
  });

  it("numerica: elimina respuestaCorrecta y tolerancia", () => {
    const p = {
      id: "5", tipo: "numerica",
      enunciado: "¿Cuántas capas tiene el modelo OSI?",
      respuestaCorrecta: 7,
      tolerancia: 0,
      retroalimentacion: "Son 7 capas.",
    };
    const r = sanitizarParaCliente(p, "numerica");
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.tolerancia).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
  });

  it("ordenamiento: elimina respuestaCorrecta y baraja elementos", () => {
    const p = {
      id: "6", tipo: "ordenamiento",
      instruccion: "Ordena las capas OSI de menor a mayor:",
      elementos: [
        { id: "e1", texto: "Física" },
        { id: "e2", texto: "Red" },
        { id: "e3", texto: "Aplicación" },
      ],
      respuestaCorrecta: ["e1", "e2", "e3"],
      retroalimentacion: "Física → Red → Aplicación.",
    };
    const r = sanitizarParaCliente(p, "ordenamiento");
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
    expect(r.elementos).toHaveLength(3);
  });

  it("clasificacion: elimina respuestaCorrecta (mapa categoría→elementos)", () => {
    const p = {
      id: "7", tipo: "clasificacion",
      instruccion: "Clasifica los protocolos:",
      categorias: [{ id: "cat1", etiqueta: "Transporte" }, { id: "cat2", etiqueta: "Aplicación" }],
      elementos: [{ id: "el1", texto: "TCP" }, { id: "el2", texto: "HTTP" }],
      respuestaCorrecta: { cat1: ["el1"], cat2: ["el2"] },
      retroalimentacion: "TCP es transporte, HTTP es aplicación.",
    };
    const r = sanitizarParaCliente(p, "clasificacion");
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
    expect(r.categorias).toHaveLength(2);
  });

  it("verdadero_falso: elimina respuestaCorrecta", () => {
    const p = {
      id: "8", tipo: "verdadero_falso",
      enunciado: "UDP garantiza la entrega de paquetes.",
      respuestaCorrecta: ["falso"],
      retroalimentacion: "UDP no garantiza entrega.",
    };
    const r = sanitizarParaCliente(p, "verdadero_falso");
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBeUndefined();
  });
});

describe("Seguridad — sanitizarResultado mantiene retroalimentacion pero elimina respuestas", () => {
  it("hotspot: retroalimentacion visible, zonaCorrecta oculta", () => {
    const p = {
      id: "hs1", tipo: "hotspot",
      instruccion: "Haz clic en el router.",
      imagen: "url", imagenAlt: "Diagrama",
      zonaCorrecta: { cx: 50, cy: 20, radio: 12 },
      respuestaCorrecta: ["any"],
      retroalimentacion: "El router es la puerta de enlace.",
    };
    const r = sanitizarResultado(p);
    expect(r.zonaCorrecta).toBeUndefined();
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBe("El router es la puerta de enlace.");
  });

  it("seleccion_unica: retroalimentacion visible, respuesta correcta oculta", () => {
    const p = {
      id: "su1", tipo: "seleccion_unica",
      enunciado: "¿Qué protocolo usa la capa 4?",
      opciones: [{ id: "a", texto: "TCP" }, { id: "b", texto: "IP" }],
      respuestaCorrecta: ["a"],
      retroalimentacion: "TCP está en capa 4.",
    };
    const r = sanitizarResultado(p);
    expect(r.respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBe("TCP está en capa 4.");
  });

  it("completar: segmentos sin respuestaCorrecta, retroalimentacion visible", () => {
    const p = {
      id: "c1", tipo: "completar",
      instruccion: "Completa:",
      segmentos: [
        { tipo: "espacio", id: "s1", respuestaCorrecta: "TCP" },
      ],
      retroalimentacion: "TCP es orientado a conexión.",
    };
    const r = sanitizarResultado(p);
    expect(r.segmentos[0].respuestaCorrecta).toBeUndefined();
    expect(r.retroalimentacion).toBe("TCP es orientado a conexión.");
  });
});

describe("Seguridad — sanitizarParaCliente no muta el objeto original", () => {
  it("hotspot: el original conserva zonaCorrecta después de sanitizar", () => {
    const original = {
      id: "hs1", tipo: "hotspot" as const,
      instruccion: "test", imagen: "url", imagenAlt: "alt",
      zonaCorrecta: { cx: 50, cy: 20, radio: 12 },
      respuestaCorrecta: ["any"],
      retroalimentacion: "feedback",
    };
    sanitizarParaCliente(original, "hotspot");
    expect(original.zonaCorrecta).toEqual({ cx: 50, cy: 20, radio: 12 });
    expect(original.respuestaCorrecta).toBeDefined();
    expect(original.retroalimentacion).toBe("feedback");
  });

  it("completar: el original conserva respuestaCorrecta de segmentos", () => {
    const original = {
      id: "c1", tipo: "completar" as const,
      instruccion: "test",
      segmentos: [{ tipo: "espacio", id: "s1", respuestaCorrecta: "TCP" }],
    };
    sanitizarParaCliente(original, "completar");
    expect((original.segmentos[0] as any).respuestaCorrecta).toBe("TCP");
  });
});

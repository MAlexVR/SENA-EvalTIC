import { describe, it, expect } from "vitest";
import {
  sanitizarParaCliente,
  prepareQuestionsForClient,
} from "@/lib/question-preparation";

describe("sanitizarParaCliente", () => {
  describe("hotspot", () => {
    it("elimina esCorrecta de cada zona", () => {
      const pregunta = {
        id: "1",
        tipo: "hotspot",
        instruccion: "Haga clic en la zona correcta",
        imagen: "https://example.com/img.png",
        imagenAlt: "Diagrama",
        respuestaCorrecta: ["z1"],
        retroalimentacion: "Correcto",
        tolerancia: 0,
        zonas: [
          { id: "z1", etiqueta: "Zona A", forma: "rect", coordenadas: [0, 0, 100, 100], esCorrecta: true },
          { id: "z2", etiqueta: "Zona B", forma: "rect", coordenadas: [100, 0, 200, 100], esCorrecta: false },
        ],
      };

      const result = sanitizarParaCliente(pregunta, "hotspot");

      expect(result.respuestaCorrecta).toBeUndefined();
      expect(result.retroalimentacion).toBeUndefined();
      expect(result.tolerancia).toBeUndefined();
      for (const zona of result.zonas) {
        expect(zona.esCorrecta).toBeUndefined();
      }
      expect(result.zonas[0].id).toBe("z1");
      expect(result.zonas[1].id).toBe("z2");
    });

    it("no muta el objeto original", () => {
      const pregunta = {
        id: "1",
        tipo: "hotspot",
        instruccion: "test",
        imagen: "url",
        imagenAlt: "alt",
        respuestaCorrecta: ["z1"],
        retroalimentacion: "x",
        zonas: [{ id: "z1", etiqueta: "A", forma: "rect", coordenadas: [], esCorrecta: true }],
      };

      sanitizarParaCliente(pregunta, "hotspot");

      expect(pregunta.respuestaCorrecta).toBeDefined();
      expect(pregunta.zonas[0].esCorrecta).toBe(true);
    });
  });

  describe("completar", () => {
    it("elimina respuestaCorrecta de segmentos tipo espacio", () => {
      const pregunta = {
        id: "2",
        tipo: "completar",
        instruccion: "Completa la oración",
        respuestaCorrecta: "irrelevante",
        retroalimentacion: "Bien hecho",
        segmentos: [
          { tipo: "texto", contenido: "El cielo es " },
          { tipo: "espacio", id: "e1", opciones: ["azul", "rojo"], respuestaCorrecta: "azul" },
          { tipo: "texto", contenido: " durante el día." },
          { tipo: "espacio", id: "e2", opciones: ["negro", "gris"], respuestaCorrecta: "negro" },
        ],
      };

      const result = sanitizarParaCliente(pregunta, "completar");

      expect(result.respuestaCorrecta).toBeUndefined();
      expect(result.retroalimentacion).toBeUndefined();

      const espacios = result.segmentos.filter((s: any) => s.tipo === "espacio");
      for (const espacio of espacios) {
        expect(espacio.respuestaCorrecta).toBeUndefined();
      }

      const textos = result.segmentos.filter((s: any) => s.tipo === "texto");
      for (const texto of textos) {
        expect(texto.contenido).toBeDefined();
      }
    });

    it("preserva opciones en segmentos espacio", () => {
      const pregunta = {
        id: "3",
        tipo: "completar",
        instruccion: "test",
        segmentos: [
          { tipo: "espacio", id: "e1", opciones: ["opA", "opB"], respuestaCorrecta: "opA" },
        ],
      };

      const result = sanitizarParaCliente(pregunta, "completar");
      const espacio = result.segmentos[0];

      expect(espacio.opciones).toEqual(["opA", "opB"]);
      expect(espacio.id).toBe("e1");
      expect(espacio.respuestaCorrecta).toBeUndefined();
    });
  });

  describe("verdadero_falso", () => {
    it("elimina respuestaCorrecta de raíz", () => {
      const pregunta = {
        id: "4",
        tipo: "verdadero_falso",
        enunciado: "El agua hierve a 100°C",
        respuestaCorrecta: ["verdadero"],
        retroalimentacion: "Correcto bajo presión estándar",
      };

      const result = sanitizarParaCliente(pregunta, "verdadero_falso");

      expect(result.respuestaCorrecta).toBeUndefined();
      expect(result.retroalimentacion).toBeUndefined();
      expect(result.enunciado).toBe("El agua hierve a 100°C");
    });
  });

  describe("numerica", () => {
    it("elimina respuestaCorrecta y tolerancia", () => {
      const pregunta = {
        id: "5",
        tipo: "numerica",
        enunciado: "¿Cuántos lados tiene un hexágono?",
        respuestaCorrecta: 6,
        tolerancia: 0,
        unidad: "lados",
        retroalimentacion: "Seis",
      };

      const result = sanitizarParaCliente(pregunta, "numerica");

      expect(result.respuestaCorrecta).toBeUndefined();
      expect(result.tolerancia).toBeUndefined();
      expect(result.retroalimentacion).toBeUndefined();
      expect(result.unidad).toBe("lados");
    });
  });

  describe("ordenamiento", () => {
    it("elimina respuestaCorrecta y mezcla elementos", () => {
      const pregunta = {
        id: "6",
        tipo: "ordenamiento",
        instruccion: "Ordena los pasos",
        elementos: [
          { id: "a", texto: "Paso 1" },
          { id: "b", texto: "Paso 2" },
          { id: "c", texto: "Paso 3" },
        ],
        respuestaCorrecta: ["a", "b", "c"],
        retroalimentacion: "Orden correcto",
      };

      const result = sanitizarParaCliente(pregunta, "ordenamiento");

      expect(result.respuestaCorrecta).toBeUndefined();
      expect(result.retroalimentacion).toBeUndefined();
      expect(result.elementos).toHaveLength(3);
      const ids = result.elementos.map((e: any) => e.id).sort();
      expect(ids).toEqual(["a", "b", "c"]);
    });
  });
});

describe("prepareQuestionsForClient", () => {
  it("solo retorna tipos que están en dist", () => {
    const banco = [
      { id: "1", tipo: "seleccion_unica", enunciado: "Q1", opciones: [], respuestaCorrecta: "a" },
      { id: "2", tipo: "seleccion_multiple", enunciado: "Q2", opciones: [], respuestaCorrecta: ["a"] },
      { id: "3", tipo: "verdadero_falso", enunciado: "Q3", respuestaCorrecta: ["verdadero"] },
      { id: "4", tipo: "numerica", enunciado: "Q4", respuestaCorrecta: 5, tolerancia: 0 },
    ];

    const dist = { seleccion_unica: 1, verdadero_falso: 1 };
    const result = prepareQuestionsForClient(banco, dist, false);

    expect(result).toHaveLength(2);
    const tipos = result.map((p: any) => p.tipo);
    expect(tipos).toContain("seleccion_unica");
    expect(tipos).toContain("verdadero_falso");
    expect(tipos).not.toContain("seleccion_multiple");
    expect(tipos).not.toContain("numerica");
  });

  it("nunca filtra más preguntas de las disponibles", () => {
    const banco = [
      { id: "1", tipo: "seleccion_unica", enunciado: "Q1", opciones: [], respuestaCorrecta: "a" },
    ];

    const dist = { seleccion_unica: 5 };
    const result = prepareQuestionsForClient(banco, dist, false);

    expect(result).toHaveLength(1);
  });

  it("elimina respuestaCorrecta de todas las preguntas retornadas", () => {
    const banco = [
      { id: "1", tipo: "seleccion_unica", enunciado: "Q1", opciones: [], respuestaCorrecta: "a" },
      { id: "2", tipo: "verdadero_falso", enunciado: "Q2", respuestaCorrecta: ["verdadero"] },
      {
        id: "3",
        tipo: "completar",
        instruccion: "Completa",
        respuestaCorrecta: "x",
        segmentos: [
          { tipo: "espacio", id: "e1", respuestaCorrecta: "x" },
        ],
      },
    ];

    const dist = { seleccion_unica: 1, verdadero_falso: 1, completar: 1 };
    const result = prepareQuestionsForClient(banco, dist, false);

    for (const p of result) {
      expect(p.respuestaCorrecta).toBeUndefined();
      if (p.tipo === "completar" && Array.isArray(p.segmentos)) {
        for (const s of p.segmentos) {
          if (s.tipo === "espacio") {
            expect(s.respuestaCorrecta).toBeUndefined();
          }
        }
      }
    }
  });

  it("normaliza texto → enunciado cuando enunciado no está presente", () => {
    const banco = [
      { id: "1", tipo: "seleccion_unica", texto: "Pregunta legada", opciones: [], respuestaCorrecta: "a" },
    ];

    const dist = { seleccion_unica: 1 };
    const result = prepareQuestionsForClient(banco, dist, false);

    expect(result[0].enunciado).toBe("Pregunta legada");
  });

  it("convierte id a string", () => {
    const banco = [
      { id: 42, tipo: "seleccion_unica", enunciado: "Q", opciones: [], respuestaCorrecta: "a" },
    ];

    const dist = { seleccion_unica: 1 };
    const result = prepareQuestionsForClient(banco, dist, false);

    expect(result[0].id).toBe("42");
  });
});

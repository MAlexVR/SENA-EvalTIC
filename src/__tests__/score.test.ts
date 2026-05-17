import { describe, it, expect } from "vitest";
import { calcularCreditoPregunta } from "@/lib/score";

describe("calcularCreditoPregunta — numerica", () => {
  const preguntaBase = {
    id: "num1",
    tipo: "numerica",
    enunciado: "¿Cuál es la velocidad de la luz en el vacío?",
    respuestaCorrecta: 299792458,
    tolerancia: 0,
    unidad: "m/s",
  };

  it("retorna 1 cuando la respuesta es exacta y tolerancia es 0", () => {
    const respuesta = { preguntaId: "num1", valorNumerico: 299792458 };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(1);
  });

  it("retorna 1 cuando la respuesta está dentro de la tolerancia", () => {
    const pregunta = { ...preguntaBase, respuestaCorrecta: 100, tolerancia: 5 };
    const respuesta = { preguntaId: "num1", valorNumerico: 104 };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(1);
  });

  it("retorna 0 cuando la respuesta está fuera de la tolerancia", () => {
    const pregunta = { ...preguntaBase, respuestaCorrecta: 100, tolerancia: 5 };
    const respuesta = { preguntaId: "num1", valorNumerico: 106 };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(0);
  });

  it("retorna 0 cuando valorNumerico es undefined (sin respuesta)", () => {
    const respuesta = { preguntaId: "num1" };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });

  it("retorna 0 cuando tolerancia es 0 y el valor está cerca pero no es exacto", () => {
    const respuesta = { preguntaId: "num1", valorNumerico: 299792457 };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });
});

describe("calcularCreditoPregunta — ordenamiento", () => {
  const preguntaBase = {
    id: "ord1",
    tipo: "ordenamiento",
    instruccion: "Ordena los pasos del método científico.",
    elementos: [
      { id: "e1", texto: "Observación" },
      { id: "e2", texto: "Hipótesis" },
      { id: "e3", texto: "Experimentación" },
      { id: "e4", texto: "Conclusión" },
    ],
    respuestaCorrecta: ["e1", "e2", "e3", "e4"],
  };

  it("retorna 1 cuando todas las posiciones son correctas", () => {
    const respuesta = { preguntaId: "ord1", ordenamiento: ["e1", "e2", "e3", "e4"] };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(1);
  });

  it("retorna 0.5 cuando la mitad de posiciones son correctas", () => {
    // Positions 0 and 3 match (e1 and e4); positions 1 and 2 swapped
    const respuesta = { preguntaId: "ord1", ordenamiento: ["e1", "e3", "e2", "e4"] };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0.5);
  });

  it("retorna 0 cuando ninguna posición es correcta", () => {
    const respuesta = { preguntaId: "ord1", ordenamiento: ["e4", "e3", "e2", "e1"] };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });

  it("retorna 0 cuando el ordenamiento está vacío (sin respuesta)", () => {
    const respuesta = { preguntaId: "ord1", ordenamiento: [] };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });

  it("retorna 0 cuando respuestaApp no tiene campo ordenamiento", () => {
    const respuesta = { preguntaId: "ord1" };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });
});

describe("calcularCreditoPregunta — completar", () => {
  const preguntaBase = {
    id: "comp1",
    tipo: "completar",
    instruccion: "Completa los espacios con los valores correctos.",
    segmentos: [
      { tipo: "texto", contenido: "El agua se congela a " },
      { tipo: "espacio", id: "temp", respuestaCorrecta: "0", opciones: ["0", "100", "-273"] },
      { tipo: "texto", contenido: " grados y hierve a " },
      { tipo: "espacio", id: "ebull", respuestaCorrecta: "100" },
      { tipo: "texto", contenido: " grados." },
    ],
  };

  it("retorna 1 cuando todos los espacios son correctos", () => {
    const respuesta = { preguntaId: "comp1", espacios: { temp: "0", ebull: "100" } };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(1);
  });

  it("retorna 0.5 cuando uno de dos espacios es correcto", () => {
    const respuesta = { preguntaId: "comp1", espacios: { temp: "0", ebull: "50" } };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0.5);
  });

  it("retorna 0 cuando todos los espacios son incorrectos", () => {
    const respuesta = { preguntaId: "comp1", espacios: { temp: "50", ebull: "200" } };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });

  it("retorna 1 con comparación case-insensitive (Bogotá === bogotá)", () => {
    const pregunta = {
      id: "comp2",
      tipo: "completar",
      segmentos: [
        { tipo: "espacio", id: "ciudad", respuestaCorrecta: "Bogotá" },
      ],
    };
    const respuesta = { preguntaId: "comp2", espacios: { ciudad: "bogotá" } };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(1);
  });

  it("retorna 0 cuando espacios está vacío (sin respuesta)", () => {
    const respuesta = { preguntaId: "comp1", espacios: {} };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });
});

describe("calcularCreditoPregunta — clasificacion", () => {
  const preguntaBase = {
    id: "clas1",
    tipo: "clasificacion",
    instruccion: "Clasifica cada organismo en el reino al que pertenece.",
    categorias: [
      { id: "c1", etiqueta: "Reino Animal" },
      { id: "c2", etiqueta: "Reino Vegetal" },
      { id: "c3", etiqueta: "Reino Fungi" },
    ],
    elementos: [
      { id: "e1", texto: "León" },
      { id: "e2", texto: "Roble" },
      { id: "e3", texto: "Champiñón" },
      { id: "e4", texto: "Mariposa" },
      { id: "e5", texto: "Helecho" },
    ],
    respuestaCorrecta: {
      c1: ["e1", "e4"],
      c2: ["e2", "e5"],
      c3: ["e3"],
    },
  };

  it("retorna 1 cuando todos los elementos están clasificados correctamente", () => {
    const respuesta = {
      preguntaId: "clas1",
      clasificacion: { c1: ["e1", "e4"], c2: ["e2", "e5"], c3: ["e3"] },
    };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(1);
  });

  it("retorna 0.6 cuando 3 de 5 elementos están en la categoría correcta", () => {
    // e1→c1✓, e4→c1✓, e2→c2✓, e5→c3✗(correct=c2), e3→c2✗(correct=c3)
    const respuesta = {
      preguntaId: "clas1",
      clasificacion: { c1: ["e1", "e4"], c2: ["e2", "e3"], c3: ["e5"] },
    };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0.6);
  });

  it("retorna 0 cuando todos los elementos están en categorías incorrectas", () => {
    // Correct: c1=[e1,e4], c2=[e2,e5], c3=[e3]
    // Student: c1=[e2,e3], c2=[e4,e3] — wait, we need none to match
    // c1 should have e1,e4 → put e2,e3 there (wrong)
    // c2 should have e2,e5 → put e1,e4 there (wrong)
    // c3 should have e3 → put e5 there (wrong)
    const respuesta = {
      preguntaId: "clas1",
      clasificacion: { c1: ["e2", "e3"], c2: ["e1", "e4"], c3: ["e5"] },
    };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });

  it("retorna 0 cuando clasificacion está vacío (sin respuesta)", () => {
    const respuesta = { preguntaId: "clas1", clasificacion: {} };
    expect(calcularCreditoPregunta(preguntaBase, respuesta)).toBe(0);
  });
});

describe("calcularCreditoPregunta — verdadero_falso", () => {
  const pregunta = {
    id: "vf1",
    tipo: "verdadero_falso",
    enunciado: "El agua hierve a 100°C a nivel del mar.",
    respuestaCorrecta: ["verdadero"],
    retroalimentacion: "Correcto bajo presión estándar.",
  };

  it("retorna 1 cuando la respuesta es correcta", () => {
    const respuesta = { preguntaId: "vf1", respuestaIds: ["verdadero"] };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(1);
  });

  it("retorna 0 cuando la respuesta es incorrecta", () => {
    const respuesta = { preguntaId: "vf1", respuestaIds: ["falso"] };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(0);
  });

  it("retorna 0 cuando no hay respuesta (respuestaIds undefined)", () => {
    const respuesta = { preguntaId: "vf1" };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(0);
  });

  it("retorna 0 cuando respuestaApp es undefined", () => {
    expect(calcularCreditoPregunta(pregunta, undefined)).toBe(0);
  });

  it("retorna 1 cuando la respuesta correcta es falso y el aprendiz responde falso", () => {
    const preguntaFalso = { ...pregunta, respuestaCorrecta: ["falso"] };
    const respuesta = { preguntaId: "vf1", respuestaIds: ["falso"] };
    expect(calcularCreditoPregunta(preguntaFalso, respuesta)).toBe(1);
  });

  it("retorna 0 cuando respuestaIds es un arreglo vacío", () => {
    const respuesta = { preguntaId: "vf1", respuestaIds: [] };
    expect(calcularCreditoPregunta(pregunta, respuesta)).toBe(0);
  });
});

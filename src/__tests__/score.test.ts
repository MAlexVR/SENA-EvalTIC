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

import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/auth-utils";

type Params = { params: Promise<{ type: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  await requireInstructor();
  const { type } = await params;

  // ── Plantilla de aprendices (.xlsx) ───────────────────────────────────────
  if (type === "aprendices") {
    const XLSX = await import("xlsx");

    const templateData = [
      ["tipoDocumento", "cedula", "nombres", "apellidos", "email", "Correo Institucional", "Correo Personal"],
      ["CC", "1020304050", "Juan Carlos", "Pérez Gómez", "jcperez@soy.sena.edu.co", "jcperez@soy.sena.edu.co", "juancarlos@gmail.com"],
      ["TI", "1000123456", "María Alejandra", "González Ruiz", "", "magonzalez@soy.sena.edu.co", ""],
      ["CE", "987654321", "Luis Fernando", "Martínez Díaz", "lmartinez@gmail.com", "", "lmartinez@gmail.com"],
    ];

    const ws = (XLSX as any).utils.aoa_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 15 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
    ];

    const wb = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(wb, ws, "Aprendices");

    const buf = (XLSX as any).write(wb, { type: "buffer", bookType: "xlsx" }) as Uint8Array;
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="plantilla-aprendices.xlsx"',
      },
    });
  }

  // ── Plantilla de preguntas (.json) ────────────────────────────────────────
  if (type === "preguntas") {
    const template = {
      preguntas: [
        {
          id: "p1",
          tipo: "seleccion_unica",
          texto: "¿Cuál es el principal objetivo del modelo OSI?",
          opciones: [
            { id: "a", texto: "Estandarizar las comunicaciones en red" },
            { id: "b", texto: "Proveer acceso a Internet" },
            { id: "c", texto: "Administrar direcciones IP" },
            { id: "d", texto: "Gestionar contraseñas" },
          ],
          respuestaCorrecta: ["a"],
          retroalimentacion:
            "El modelo OSI define un marco estándar para las comunicaciones en red dividido en 7 capas.",
        },
        {
          id: "p2",
          tipo: "seleccion_multiple",
          texto: "¿Cuáles de los siguientes son protocolos de capa de transporte?",
          opciones: [
            { id: "a", texto: "TCP" },
            { id: "b", texto: "HTTP" },
            { id: "c", texto: "UDP" },
            { id: "d", texto: "FTP" },
          ],
          respuestaCorrecta: ["a", "c"],
          retroalimentacion:
            "TCP y UDP operan en la capa de transporte. HTTP y FTP operan en la capa de aplicación.",
        },
        {
          id: "p3",
          tipo: "emparejamiento",
          texto: "Relaciona cada capa del modelo OSI con su función principal:",
          pares: [
            { izquierda: "Capa Física", derecha: "Transmisión de bits por el medio" },
            { izquierda: "Capa de Red", derecha: "Enrutamiento de paquetes" },
            {
              izquierda: "Capa de Transporte",
              derecha: "Control de flujo extremo a extremo",
            },
            {
              izquierda: "Capa de Aplicación",
              derecha: "Interfaz con las aplicaciones del usuario",
            },
          ],
          retroalimentacion:
            "Cada capa del modelo OSI tiene una responsabilidad bien definida en el proceso de comunicación.",
        },
      ],
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-preguntas.json"',
      },
    });
  }

  // ── Plantilla verdadero_falso (.json) ─────────────────────────────────────
  if (type === "verdadero_falso") {
    const template = {
      tipo: "verdadero_falso",
      enunciado: "El sol es una estrella.",
      respuestaCorrecta: ["verdadero"],
      retroalimentacion: "Correcto. El sol es la estrella más cercana a la Tierra.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-verdadero-falso.json"',
      },
    });
  }

  // ── Plantilla numerica (.json) ────────────────────────────────────────────
  if (type === "numerica") {
    const template = {
      tipo: "numerica",
      enunciado: "¿Cuál es la velocidad de la luz en el vacío?",
      respuestaCorrecta: 299792458,
      tolerancia: 0,
      unidad: "m/s",
      retroalimentacion:
        "La velocidad de la luz en el vacío es exactamente 299,792,458 m/s.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-numerica.json"',
      },
    });
  }

  // ── Plantilla ordenamiento (.json) ───────────────────────────────────────
  if (type === "ordenamiento") {
    const template = {
      tipo: "ordenamiento",
      instruccion: "Ordena los pasos del método científico de forma correcta.",
      elementos: [
        { id: "e1", texto: "Observación del fenómeno" },
        { id: "e2", texto: "Formulación de hipótesis" },
        { id: "e3", texto: "Experimentación" },
        { id: "e4", texto: "Análisis de resultados" },
        { id: "e5", texto: "Conclusión" },
      ],
      respuestaCorrecta: ["e1", "e2", "e3", "e4", "e5"],
      retroalimentacion:
        "El método científico sigue este orden lógico de pasos.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="plantilla-ordenamiento.json"',
      },
    });
  }

  // ── Plantilla completar (.json) ───────────────────────────────────────────
  if (type === "completar") {
    const template = {
      tipo: "completar",
      instruccion: "Completa la oración con los términos correctos.",
      segmentos: [
        { tipo: "texto", contenido: "El agua se congela a " },
        { tipo: "espacio", id: "temp", respuestaCorrecta: "0", opciones: ["0", "100", "-273"] },
        { tipo: "texto", contenido: " grados Celsius y hierve a " },
        { tipo: "espacio", id: "ebull", respuestaCorrecta: "100" },
        { tipo: "texto", contenido: " grados Celsius." },
      ],
      retroalimentacion:
        "Los puntos de cambio de fase del agua a presión estándar son 0°C y 100°C.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-completar.json"',
      },
    });
  }

  // ── Plantilla clasificacion (.json) ──────────────────────────────────────
  if (type === "clasificacion") {
    const template = {
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
      retroalimentacion:
        "Los animales pertenecen al reino Animal, las plantas al reino Vegetal y los hongos al reino Fungi.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-clasificacion.json"',
      },
    });
  }

  return NextResponse.json({ error: "Tipo de plantilla no válido" }, { status: 400 });
}

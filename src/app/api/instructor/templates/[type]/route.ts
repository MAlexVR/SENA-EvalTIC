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
          retroalimentacion: "El modelo OSI define un marco estándar para las comunicaciones en red dividido en 7 capas.",
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
          retroalimentacion: "TCP y UDP operan en la capa de transporte. HTTP y FTP operan en la capa de aplicación.",
        },
        {
          id: "p3",
          tipo: "emparejamiento",
          texto: "Relaciona cada capa del modelo OSI con su función principal:",
          pares: [
            { izquierda: "Capa Física", derecha: "Transmisión de bits por el medio" },
            { izquierda: "Capa de Red", derecha: "Enrutamiento de paquetes" },
            { izquierda: "Capa de Transporte", derecha: "Control de flujo extremo a extremo" },
            { izquierda: "Capa de Aplicación", derecha: "Interfaz con las aplicaciones del usuario" },
          ],
          retroalimentacion: "Cada capa del modelo OSI tiene una responsabilidad bien definida en el proceso de comunicación.",
        },
        {
          id: "p4",
          tipo: "verdadero_falso",
          texto: "El protocolo UDP garantiza la entrega ordenada de los paquetes.",
          respuestaCorrecta: ["falso"],
          retroalimentacion: "UDP es un protocolo no orientado a conexión que NO garantiza entrega ni orden. Esa es responsabilidad de TCP.",
        },
        {
          id: "p5",
          tipo: "numerica",
          texto: "¿Cuántas capas tiene el modelo OSI?",
          respuestaCorrecta: 7,
          tolerancia: 0,
          retroalimentacion: "El modelo OSI está compuesto exactamente por 7 capas: Física, Enlace de datos, Red, Transporte, Sesión, Presentación y Aplicación.",
        },
        {
          id: "p6",
          tipo: "ordenamiento",
          instruccion: "Ordena las capas del modelo OSI de la más baja (física) a la más alta (aplicación):",
          elementos: [
            { id: "e1", texto: "Capa de Red" },
            { id: "e2", texto: "Capa Física" },
            { id: "e3", texto: "Capa de Aplicación" },
            { id: "e4", texto: "Capa de Transporte" },
            { id: "e5", texto: "Capa de Enlace de datos" },
          ],
          respuestaCorrecta: ["e2", "e5", "e1", "e4", "e3"],
          retroalimentacion: "El orden correcto de menor a mayor es: Física → Enlace de datos → Red → Transporte → Aplicación.",
        },
        {
          id: "p7",
          tipo: "completar",
          instruccion: "Completa el enunciado con los términos correctos:",
          segmentos: [
            { tipo: "texto", contenido: "El protocolo " },
            { tipo: "espacio", id: "s1", opciones: ["TCP", "UDP", "HTTP", "FTP"], respuestaCorrecta: "TCP" },
            { tipo: "texto", contenido: " opera en la capa de transporte y garantiza la entrega " },
            { tipo: "espacio", id: "s2", respuestaCorrecta: "confiable" },
            { tipo: "texto", contenido: " de los datos." },
          ],
          retroalimentacion: "TCP (Transmission Control Protocol) es orientado a conexión y provee entrega confiable y ordenada.",
        },
        {
          id: "p8",
          tipo: "clasificacion",
          instruccion: "Clasifica cada protocolo según la capa del modelo OSI en la que opera:",
          categorias: [
            { id: "cat1", etiqueta: "Capa de Transporte" },
            { id: "cat2", etiqueta: "Capa de Aplicación" },
            { id: "cat3", etiqueta: "Capa de Red" },
          ],
          elementos: [
            { id: "el1", texto: "TCP" },
            { id: "el2", texto: "HTTP" },
            { id: "el3", texto: "IP" },
            { id: "el4", texto: "UDP" },
            { id: "el5", texto: "DNS" },
            { id: "el6", texto: "ICMP" },
          ],
          respuestaCorrecta: {
            cat1: ["el1", "el4"],
            cat2: ["el2", "el5"],
            cat3: ["el3", "el6"],
          },
          retroalimentacion: "TCP y UDP son de transporte; HTTP y DNS son de aplicación; IP e ICMP operan en la capa de red.",
        },
        {
          id: "p9",
          tipo: "hotspot",
          instruccion: "En el diagrama de topología de red, haz clic sobre el dispositivo que actúa como puerta de enlace predeterminada (default gateway) para los equipos de la LAN.",
          imagen: "",
          imagenAlt: "Diagrama de red en estrella con router, switch central y cuatro equipos conectados",
          zonaCorrecta: { cx: 50, cy: 20, radio: 12 },
          retroalimentacion: "El router es el default gateway porque conecta la LAN con redes externas y enruta el tráfico saliente.",
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
      texto: "El protocolo TCP garantiza la entrega ordenada y confiable de los datos.",
      respuestaCorrecta: ["verdadero"],
      retroalimentacion: "Correcto. TCP es un protocolo orientado a conexión que establece un canal confiable antes de transmitir datos, garantizando orden y entrega.",
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
      texto: "¿Cuántas capas define el modelo OSI?",
      respuestaCorrecta: 7,
      tolerancia: 0,
      retroalimentacion: "El modelo OSI define exactamente 7 capas: Física, Enlace de datos, Red, Transporte, Sesión, Presentación y Aplicación.",
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
      instruccion: "Ordena las capas del modelo OSI de la más baja (física) a la más alta (aplicación):",
      elementos: [
        { id: "e1", texto: "Capa de Red" },
        { id: "e2", texto: "Capa Física" },
        { id: "e3", texto: "Capa de Aplicación" },
        { id: "e4", texto: "Capa de Transporte" },
        { id: "e5", texto: "Capa de Enlace de datos" },
      ],
      respuestaCorrecta: ["e2", "e5", "e1", "e4", "e3"],
      retroalimentacion: "El orden correcto de menor a mayor es: Física → Enlace de datos → Red → Transporte → Aplicación.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-ordenamiento.json"',
      },
    });
  }

  // ── Plantilla completar (.json) ───────────────────────────────────────────
  if (type === "completar") {
    const template = {
      tipo: "completar",
      instruccion: "Completa el enunciado con los términos correctos:",
      segmentos: [
        { tipo: "texto", contenido: "El protocolo " },
        { tipo: "espacio", id: "s1", opciones: ["TCP", "UDP", "HTTP", "FTP"], respuestaCorrecta: "TCP" },
        { tipo: "texto", contenido: " opera en la capa de transporte y garantiza la entrega " },
        { tipo: "espacio", id: "s2", respuestaCorrecta: "confiable" },
        { tipo: "texto", contenido: " de los datos." },
      ],
      retroalimentacion: "TCP (Transmission Control Protocol) es orientado a conexión y provee entrega confiable y ordenada de los datos.",
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
      instruccion: "Clasifica cada protocolo según la capa del modelo OSI en la que opera:",
      categorias: [
        { id: "cat1", etiqueta: "Capa de Transporte" },
        { id: "cat2", etiqueta: "Capa de Aplicación" },
        { id: "cat3", etiqueta: "Capa de Red" },
      ],
      elementos: [
        { id: "el1", texto: "TCP" },
        { id: "el2", texto: "HTTP" },
        { id: "el3", texto: "IP" },
        { id: "el4", texto: "UDP" },
        { id: "el5", texto: "DNS" },
        { id: "el6", texto: "ICMP" },
      ],
      respuestaCorrecta: {
        cat1: ["el1", "el4"],
        cat2: ["el2", "el5"],
        cat3: ["el3", "el6"],
      },
      retroalimentacion: "TCP y UDP son protocolos de transporte; HTTP y DNS operan en la capa de aplicación; IP e ICMP pertenecen a la capa de red.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-clasificacion.json"',
      },
    });
  }

  // ── Plantilla hotspot (.json) ─────────────────────────────────────────────
  if (type === "hotspot") {
    const template = {
      tipo: "hotspot",
      instruccion: "En el diagrama de topología de red, haz clic sobre el dispositivo que actúa como puerta de enlace predeterminada (default gateway) para los equipos de la LAN.",
      imagen: "",
      imagenAlt: "Diagrama de red en estrella con router, switch central y cuatro equipos conectados",
      zonaCorrecta: { cx: 50, cy: 20, radio: 12 },
      retroalimentacion: "El router es el default gateway porque conecta la LAN con redes externas y enruta el tráfico saliente.",
    };

    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="plantilla-hotspot.json"',
      },
    });
  }

  return NextResponse.json({ error: "Tipo de plantilla no válido" }, { status: 400 });
}

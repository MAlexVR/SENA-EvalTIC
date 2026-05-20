import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { APP_CONFIG } from "@/lib/config";
import { calcularPuntaje } from "@/lib/score";
import { enviarCorreoResultado, enviarCorreoPrevisualizacion } from "@/lib/email";
import { sanitizarParaCliente } from "@/lib/question-preparation";
import allQuestions from "@/data/preguntas.json";
import fs from "fs";
import path from "path";

const COMPLETED_EVALUATIONS_FILE = path.join(
  process.cwd(),
  "src/data/evaluaciones-completadas.json",
);

function sanitizarResultado(q: any): any {
  const r = sanitizarParaCliente(q, q.tipo);
  // Re-agregar retroalimentacion para la vista de resultado
  if (q.retroalimentacion) r.retroalimentacion = q.retroalimentacion;
  return r;
}

const finalizarSchema = z.object({
  cedula: z.string().min(4, "Cédula muy corta").max(20, "Cédula muy larga"),
  tipoDocumento: z.string().max(10).optional(),
  nombres: z.string().max(100).optional(),
  apellidos: z.string().max(100).optional(),
  email: z.string().max(200).optional(),
  programaFormacion: z.string().max(300).optional(),
  respuestasUsuario: z.record(z.string(), z.unknown()),
  fichaId: z.string().max(100).optional(),
  evaluacionId: z.string().max(100).optional(),
  tiempoUsado: z.number().int().min(0).max(18000).optional(),
  intentoNumero: z.number().int().min(0).max(100).optional(),
  esPrueba: z.boolean().optional(),
  incidenciasAntiplagio: z.number().int().min(0).max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = finalizarSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const {
      cedula,
      tipoDocumento,
      nombres,
      apellidos,
      email,
      respuestasUsuario,
      fichaId,
      evaluacionId,
      tiempoUsado,
      esPrueba,
      incidenciasAntiplagio,
    } = body;

    // C3 — Verificar JWT ANTES de cualquier acceso a BD
    if (esPrueba === true) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (!token?.instructorId) {
        return NextResponse.json(
          { error: "No autorizado para modo prueba" },
          { status: 401 },
        );
      }
    }

    // ═══ RAMA DB (feature flag) ═══════════════════════════════════════════════
    if (APP_CONFIG.useDatabaseBackend) {
      if (!evaluacionId) {
        return NextResponse.json(
          { error: "Faltan datos de la evaluación (evaluacionId)" },
          { status: 400 },
        );
      }

      const { prisma } = await import("@/lib/prisma");

      // 1. Cargar la evaluación desde DB (tiene preguntas con respuestas correctas)
      const evaluacion = await prisma.evaluacion.findUnique({
        where: { id: evaluacionId },
      });

      if (!evaluacion) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
      }

      const bancoCompleto = evaluacion.preguntas as any[];
      const passingScore =
        (evaluacion.config as any).passingScorePercentage ??
        APP_CONFIG.passingScorePercentage;

      // A5 — Calcular tiempo real desde la BD (no del cliente)
      // Se obtiene primero para reutilizar sesion.iniciadoEn en el filtro M3
      const sesion = fichaId
        ? await prisma.sesionEvaluacion.findUnique({
            where: {
              cedula_evaluacionId_fichaId: { cedula, evaluacionId, fichaId },
            },
          })
        : null;

      const tiempoUsadoFinal = sesion
        ? Math.min(
            Math.round((Date.now() - sesion.iniciadoEn.getTime()) / 1000),
            18000, // cap en 5h para evitar valores absurdos por bugs de reloj
          )
        : (tiempoUsado ?? 0);

      // S1 — Sin sesión no podemos filtrar incidencias por tiempo ni calcular tiempo real.
      // Rechazar en modo normal (no prueba) en lugar de aceptar datos del cliente sin validación.
      // El modo prueba del instructor no crea SesionEvaluacion, por eso se excluye.
      if (fichaId && !sesion && esPrueba !== true) {
        return NextResponse.json(
          { error: "Sesión de evaluación no encontrada. Recarga la página e intenta de nuevo." },
          { status: 400 },
        );
      }

      // M3 — Contar incidencias del intento actual filtradas por inicio de sesión.
      const incidenciasServidor = fichaId && sesion
        ? await prisma.incidenciaAntiplagio.count({
            where: { cedula, evaluacionId, fichaId, registradoEn: { gte: sesion.iniciadoEn } },
          })
        : (incidenciasAntiplagio ?? 0); // fallback solo en modo prueba (sin fichaId)

      const umbralAltoConfig = (evaluacion.config as any)?.umbralAntiplagio?.alto ?? 3;
      const anuladaComputada = incidenciasServidor >= umbralAltoConfig;

      // 2. Filtrar solo las preguntas que fueron respondidas y normalizar campos
      const idsRespondidos = Object.keys(respuestasUsuario);
      const preguntasEvaluadas = bancoCompleto
        .filter((q) => idsRespondidos.includes(q.id.toString()))
        .map((q: any) => ({
          ...q,
          id: String(q.id),
          enunciado: q.enunciado ?? q.texto ?? "",
        }));

      // Total de preguntas que se presentaron al aprendiz (según distribución configurada).
      // Usado como denominador del puntaje para que no responder = 0, no = ignorado.
      const distribucion = (evaluacion.config as any).distribucionPreguntas as Record<string, number> | undefined;
      const totalEsperado = distribucion
        ? Object.values(distribucion).reduce((a, b) => a + b, 0)
        : preguntasEvaluadas.length;

      // 2b. Si la evaluación fue anulada por antiplagio, forzar puntaje 0
      const resultado = anuladaComputada
        ? {
            puntajeTotal: 0,
            aprobado: false,
            preguntasCorrectas: 0,
            preguntasParciales: 0,
            totalPreguntas: totalEsperado,
            puntajePorTema: {},
          }
        : calcularPuntaje(preguntasEvaluadas, respuestasUsuario as any, passingScore, totalEsperado);

      // 3. Modo prueba del instructor: calcular pero NO guardar
      if (esPrueba === true) {
        // JWT ya fue verificado al inicio del handler (C3)
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

        // Fire-and-forget: vista previa del correo al aprendiz enviada al instructor
        void enviarCorreoPrevisualizacion({
          instructorId: token!.instructorId as string,
          evaluacionId,
          fichaId: fichaId ?? null,
          nombres: nombres ?? "Aprendiz",
          apellidos: apellidos ?? "Prueba",
          tipoDocumento: tipoDocumento ?? "CC",
          cedula,
          puntajeTotal: resultado.puntajeTotal,
          preguntasCorrectas: resultado.preguntasCorrectas,
          totalPreguntas: resultado.totalPreguntas,
          aprobado: resultado.aprobado,
          tiempoUsado: tiempoUsado ?? 0,
          incidenciasAntiplagio: incidenciasAntiplagio ?? 0,
        });

        return NextResponse.json({
          resultado,
          preguntasCompletas: preguntasEvaluadas.map(sanitizarResultado),
          esPrueba: true,
          anulada: anuladaComputada,
          incidenciasAntiplagio: incidenciasServidor,
        });
      }

      // 4. Guardar en DB — fichaId requerido solo en modo normal
      if (!fichaId) {
        return NextResponse.json(
          { error: "Faltan datos de la evaluación (fichaId)" },
          { status: 400 },
        );
      }

      // A3+B1 — Verificar límite de intentos y calcular intentoNumero server-side
      const intentosUsados = await prisma.resultado.count({
        where: { cedula, evaluacionId, esPrueba: false },
      });

      let intentosExtra = 0;
      if (fichaId) {
        const aprendizData = await prisma.aprendiz.findUnique({
          where: { cedula_fichaId: { cedula, fichaId } },
          select: { intentosExtra: true },
        });
        intentosExtra = aprendizData?.intentosExtra ?? 0;
      }

      const intentosPermitidos = (evaluacion.maxIntentos ?? 1) + intentosExtra;
      if (intentosUsados >= intentosPermitidos) {
        return NextResponse.json(
          { error: "Has agotado el número de intentos permitidos para esta evaluación." },
          { status: 403 },
        );
      }

      // B1 — intento calculado server-side (no confiar en el cliente)
      const intento = intentosUsados + 1;

      try {
        await prisma.resultado.create({
          data: {
            cedula,
            tipoDocumento: tipoDocumento ?? "CC",
            nombres: nombres ?? "",
            apellidos: apellidos ?? "",
            email: email ?? "",
            puntaje: resultado.puntajeTotal,
            aprobado: resultado.aprobado,
            preguntasCorrectas: resultado.preguntasCorrectas,
            totalPreguntas: resultado.totalPreguntas,
            tiempoUsado: tiempoUsadoFinal,
            respuestas: respuestasUsuario as Prisma.InputJsonValue,
            intento,
            esPrueba: false,
            incidenciasAntiplagio: incidenciasServidor,
            anulada: anuladaComputada,
            evaluacionId,
            fichaId,
          },
        });
      } catch (dbErr: any) {
        if (dbErr?.code === "P2002") {
          return NextResponse.json(
            { error: "Ya existe un resultado para este intento. Intenta de nuevo." },
            { status: 409 },
          );
        }
        throw dbErr;
      }

      // 5. Enviar correo al instructor y al aprendiz (fire-and-forget)
      // Buscar emailPersonal del aprendiz registrado en la ficha
      ;(async () => {
        try {
          const aprendizData = fichaId
            ? await prisma.aprendiz.findFirst({
                where: { cedula, fichaId },
                select: { emailPersonal: true },
              })
            : null;

          const evaluacionData = await prisma.evaluacion.findUnique({
            where: { id: evaluacionId },
            select: { maxIntentos: true, config: true },
          });

          const emailAprendiz = aprendizData?.emailPersonal ?? null;
          const maxIntentosEval = evaluacionData?.maxIntentos ?? 1;
          const umbralAntiplagio = {
            medio: (evaluacionData?.config as any)?.umbralAntiplagio?.medio ?? 3,
            alto:  (evaluacionData?.config as any)?.umbralAntiplagio?.alto  ?? 5,
          };

          await enviarCorreoResultado({
            evaluacionId,
            fichaId,
            cedula,
            tipoDocumento: tipoDocumento ?? "CC",
            nombres: nombres ?? "",
            apellidos: apellidos ?? "",
            email: email ?? "",
            emailAprendiz,
            tiempoUsado: tiempoUsadoFinal,
            intento,
            maxIntentos: maxIntentosEval,
            incidenciasAntiplagio: incidenciasServidor,
            resultado: {
              puntajeTotal: resultado.puntajeTotal,
              preguntasCorrectas: resultado.preguntasCorrectas,
              totalPreguntas: resultado.totalPreguntas,
              aprobado: resultado.aprobado,
            },
            umbralAntiplagio,
          });
        } catch (err) {
          console.error("Email dispatch error:", err);
        }
      })();

      return NextResponse.json({
        resultado,
        preguntasCompletas: preguntasEvaluadas.map(sanitizarResultado),
        anulada: anuladaComputada,
        incidenciasAntiplagio: incidenciasServidor,
      });
    }

    // ═══ RAMA LEGACY (archivos JSON) ══════════════════════════════════════════
    let completadas: {
      cedula: string;
      fecha: string;
      puntaje: number;
      aprobado: boolean;
    }[] = [];
    if (fs.existsSync(COMPLETED_EVALUATIONS_FILE)) {
      try {
        const data = fs.readFileSync(COMPLETED_EVALUATIONS_FILE, "utf8");
        if (data.trim() !== "") {
          completadas = JSON.parse(data);
        }
      } catch (e) {
        console.error("Error parseando JSON de completadas:", e);
        completadas = [];
      }
    }

    const registroExistente = completadas.find((r) => r.cedula === cedula);
    if (registroExistente && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "La evaluación ya fue presentada anteriormente." },
        { status: 403 },
      );
    }

    const idsRespondidos = Object.keys(respuestasUsuario);
    const preguntasEvaluadas = allQuestions.preguntas.filter((q) =>
      idsRespondidos.includes(q.id.toString()),
    );

    // Aplicar lógica de anulación también en rama legacy
    const umbralAltoLegacy = (allQuestions as any)?.config?.umbralAntiplagio?.alto ?? 3;
    const anuladaLegacy = (incidenciasAntiplagio ?? 0) >= umbralAltoLegacy;
    const totalEsperadoLegacy = Object.values(APP_CONFIG.distribucionPreguntas).reduce((a, b) => a + b, 0);
    const resultado = anuladaLegacy
      ? { puntajeTotal: 0, aprobado: false, preguntasCorrectas: 0, preguntasParciales: 0, totalPreguntas: totalEsperadoLegacy, puntajePorTema: {} }
      : calcularPuntaje(preguntasEvaluadas, respuestasUsuario as any, APP_CONFIG.passingScorePercentage, totalEsperadoLegacy);

    const nuevoRegistro = {
      cedula,
      nombre: `${nombres} ${apellidos}`,
      fecha: new Date().toISOString(),
      puntaje: resultado.puntajeTotal,
      aprobado: resultado.aprobado,
    };

    completadas.push(nuevoRegistro);

    try {
      const dir = path.dirname(COMPLETED_EVALUATIONS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        COMPLETED_EVALUATIONS_FILE,
        JSON.stringify(completadas, null, 2),
      );
    } catch (fsError) {
      console.warn(
        "No se pudo guardar la evaluación en disco (sistema de archivos de solo lectura). Retornando resultados en memoria.",
        fsError,
      );
    }

    return NextResponse.json({
      resultado,
      anulada: anuladaLegacy,
      preguntasCompletas: preguntasEvaluadas.map(sanitizarResultado),
    });
  } catch (error) {
    console.error("Error al finalizar evaluación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

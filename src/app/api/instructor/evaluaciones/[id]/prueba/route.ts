import { NextRequest, NextResponse } from "next/server";
import { requireInstructor } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { prepareQuestionsForClient } from "@/lib/question-preparation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await requireInstructor();
  const { id } = await params;

  const evaluacion = await prisma.evaluacion.findFirst({
    where: { id, instructorId: session.user.instructorId },
  });

  if (!evaluacion) {
    return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
  }

  const config = evaluacion.config as {
    timeLimitMinutes: number;
    passingScorePercentage: number;
    distribucionPreguntas: Record<string, number>;
    aleatorizarOpciones: boolean;
    umbralAntiplagio?: { medio: number; alto: number };
  };

  const banco = evaluacion.preguntas as any[];
  const preguntasCliente = prepareQuestionsForClient(
    banco,
    config.distribucionPreguntas,
    config.aleatorizarOpciones,
  );

  return NextResponse.json({
    yaPresento: false,
    preguntas: preguntasCliente,
    tiempoLimite: config.timeLimitMinutes * 60,
    fichaId: null,
    evaluacionId: id,
    intentoNumero: 0,
    testMode: true,
    umbralAntiplagio: config.umbralAntiplagio ?? { medio: 3, alto: 5 },
    aprendizInfo: {
      nombres: session.user.name ?? "Instructor",
      apellidos: "(Modo Prueba)",
      tipoDocumento: "CC",
      email: null,
      programa: evaluacion.nombre,
      competencia: evaluacion.competencia,
      resultadoAprendizaje: evaluacion.resultadoAprendizaje,
    },
  });
}

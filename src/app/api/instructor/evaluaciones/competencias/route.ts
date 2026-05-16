import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/auth-utils";

export async function GET() {
  const session = await requireInstructor();
  const instructorId = session.user.instructorId;

  const evaluaciones = await prisma.evaluacion.findMany({
    where: { instructorId },
    select: {
      codigoCompetencia: true,
      competencia: true,
      codigoRA: true,
      resultadoAprendizaje: true,
    },
  });

  // Deduplicar pares únicos (competencia + RA) preservando la asociación
  const paresMap = new Map<string, {
    codigoCompetencia: string;
    competencia: string;
    codigoRA: string;
    resultadoAprendizaje: string;
  }>();

  for (const ev of evaluaciones) {
    if (ev.codigoCompetencia && ev.competencia && ev.codigoRA && ev.resultadoAprendizaje) {
      const key = `${ev.codigoCompetencia}::${ev.codigoRA}`;
      paresMap.set(key, {
        codigoCompetencia: ev.codigoCompetencia,
        competencia: ev.competencia,
        codigoRA: ev.codigoRA,
        resultadoAprendizaje: ev.resultadoAprendizaje,
      });
    }
  }

  return NextResponse.json({
    pares: Array.from(paresMap.values()),
  });
}

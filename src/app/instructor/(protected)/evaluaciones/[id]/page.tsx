import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EvaluacionFormTemplate } from "@/components/templates/EvaluacionFormTemplate";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar Evaluación — EvalTIC Instructor",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarEvaluacionPage({ params }: Props) {
  const session = await requireInstructor();
  const { id } = await params;

  const evaluacion = await prisma.evaluacion.findFirst({
    where: { id, instructorId: session.user.instructorId },
  });

  if (!evaluacion) notFound();

  // Build defaultValues from DB record
  const config = evaluacion.config as {
    timeLimitMinutes: number;
    passingScorePercentage: number;
    distribucionPreguntas: Record<string, number>;
    umbralAntiplagio?: { medio: number; alto: number };
  };

  const dist = config.distribucionPreguntas ?? {};

  const defaultValues = {
    nombre: evaluacion.nombre,
    descripcion: evaluacion.descripcion ?? "",
    competencia: evaluacion.competencia,
    codigoCompetencia: evaluacion.codigoCompetencia,
    resultadoAprendizaje: evaluacion.resultadoAprendizaje,
    codigoRA: evaluacion.codigoRA,
    fechaInicio: evaluacion.fechaInicio
      ? evaluacion.fechaInicio.toISOString()
      : "",
    fechaFin: evaluacion.fechaFin
      ? evaluacion.fechaFin.toISOString()
      : "",
    timeLimitMinutes: config.timeLimitMinutes,
    passingScorePercentage: config.passingScorePercentage,
    maxIntentos: evaluacion.maxIntentos,
    seleccion_unica: dist.seleccion_unica ?? 0,
    seleccion_multiple: dist.seleccion_multiple ?? 0,
    emparejamiento: dist.emparejamiento ?? 0,
    verdadero_falso: dist.verdadero_falso ?? 0,
    completar: dist.completar ?? 0,
    ordenamiento: dist.ordenamiento ?? 0,
    hotspot: dist.hotspot ?? 0,
    clasificacion: dist.clasificacion ?? 0,
    numerica: dist.numerica ?? 0,
    umbralMedio: config.umbralAntiplagio?.medio ?? 2,
    umbralAlto: config.umbralAntiplagio?.alto ?? 3,
  };

  const preguntas = evaluacion.preguntas as unknown[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Pencil size={24} className="text-sena-green" />
        <div>
          <h1 className="text-2xl font-black text-sena-blue">Editar Evaluación</h1>
          <p className="text-sm text-sena-gray-dark/60 mt-0.5">{evaluacion.nombre}</p>
        </div>
      </div>

      <EvaluacionFormTemplate
        mode="edit"
        evaluacionId={evaluacion.id}
        defaultValues={defaultValues}
        defaultPreguntas={preguntas}
      />
    </div>
  );
}

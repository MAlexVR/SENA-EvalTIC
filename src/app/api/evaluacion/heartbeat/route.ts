import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const heartbeatSchema = z.object({
  cedula:       z.string().min(4).max(20),
  evaluacionId: z.string().min(1).max(100),
  fichaId:      z.string().min(1).max(100),
  evento:       z.enum(["blur", "visibilitychange", "fullscreen_exit", "copy", "print"]),
  clientTimestamp: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const raw = heartbeatSchema.safeParse(await req.json().catch(() => ({})));
  if (!raw.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { cedula, evaluacionId, fichaId, evento } = raw.data;

  const { prisma } = await import("@/lib/prisma");

  await prisma.incidenciaAntiplagio.create({
    data: {
      cedula,
      evaluacionId,
      fichaId,
      evento,
      // registradoEn se asigna por @default(now()) — no confiamos en el cliente
    },
  });

  return NextResponse.json({ ok: true });
}

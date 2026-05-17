import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/auth-utils";
import { encryptValue, safeDecrypt } from "@/lib/crypto";

const perfilPutSchema = z.object({
  emailNotificaciones: z.boolean().optional(),
  resendApiKey: z.string().max(200).optional(),
  cloudinaryCloudName: z.string().max(200).optional(),
  cloudinaryApiKey: z.string().max(200).optional(),
  cloudinaryApiSecret: z.string().max(200).optional(),
});

export async function GET() {
  try {
    const session = await requireInstructor();
    const id = session.user.instructorId;

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      select: {
        nombre: true,
        email: true,
        resendApiKey: true,
        emailNotificaciones: true,
        cloudinaryCloudName: true,
        cloudinaryApiKey: true,
        cloudinaryApiSecret: true,
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instructor no encontrado" }, { status: 404 });
    }

    // Descifrar para obtener el valor real, luego enmascarar los primeros chars
    let maskedKey: string | null = null;
    if (instructor.resendApiKey) {
      const plainKey = safeDecrypt(instructor.resendApiKey);
      maskedKey = `re_${"*".repeat(16)}${plainKey.slice(-4)}`;
    }

    return NextResponse.json({
      nombre: instructor.nombre,
      email: instructor.email,
      emailNotificaciones: instructor.emailNotificaciones,
      resendApiKey: maskedKey,
      tieneApiKey: !!instructor.resendApiKey,
      cloudinaryCloudName: instructor.cloudinaryCloudName ?? null,
      cloudinaryApiKey: instructor.cloudinaryApiKey ?? null,
      tieneCloudinary: !!instructor.cloudinaryApiSecret,
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener el perfil" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireInstructor();
    const id = session.user.instructorId;

    const rawBody = await req.json();
    const parsed = perfilPutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const { emailNotificaciones, resendApiKey, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = parsed.data;
    const data: Record<string, unknown> = {};

    if (typeof emailNotificaciones === "boolean") {
      data.emailNotificaciones = emailNotificaciones;
    }

    if (typeof resendApiKey === "string") {
      if (resendApiKey.trim() === "") {
        data.resendApiKey = null;
      } else if (!resendApiKey.includes("*")) {
        // No es la versión enmascarada — cifrar si hay ENCRYPTION_KEY, sino guardar plano
        const shouldEncrypt = !!process.env.ENCRYPTION_KEY;
        data.resendApiKey = shouldEncrypt
          ? encryptValue(resendApiKey.trim())
          : resendApiKey.trim();
      }
      // Si contiene asteriscos es la versión enmascarada — no sobreescribir
    }

    if (typeof cloudinaryCloudName === "string") {
      data.cloudinaryCloudName = cloudinaryCloudName.trim() || null;
    }

    if (typeof cloudinaryApiKey === "string") {
      data.cloudinaryApiKey = cloudinaryApiKey.trim() || null;
    }

    if (typeof cloudinaryApiSecret === "string") {
      if (cloudinaryApiSecret.trim() === "") {
        data.cloudinaryApiSecret = null;
      } else if (!cloudinaryApiSecret.includes("*")) {
        // No es versión enmascarada — cifrar el secret
        const shouldEncrypt = !!process.env.ENCRYPTION_KEY;
        data.cloudinaryApiSecret = shouldEncrypt
          ? encryptValue(cloudinaryApiSecret.trim())
          : cloudinaryApiSecret.trim();
      }
      // Si contiene asteriscos es la versión enmascarada — no sobreescribir
    }

    const updated = await prisma.instructor.update({
      where: { id },
      data,
      select: {
        emailNotificaciones: true,
        resendApiKey: true,
        cloudinaryCloudName: true,
        cloudinaryApiKey: true,
        cloudinaryApiSecret: true,
      },
    });

    let maskedKey: string | null = null;
    if (updated.resendApiKey) {
      const plainKey = safeDecrypt(updated.resendApiKey);
      maskedKey = `re_${"*".repeat(16)}${plainKey.slice(-4)}`;
    }

    return NextResponse.json({
      emailNotificaciones: updated.emailNotificaciones,
      resendApiKey: maskedKey,
      tieneApiKey: !!updated.resendApiKey,
      cloudinaryCloudName: updated.cloudinaryCloudName ?? null,
      cloudinaryApiKey: updated.cloudinaryApiKey ?? null,
      tieneCloudinary: !!updated.cloudinaryApiSecret,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 });
  }
}

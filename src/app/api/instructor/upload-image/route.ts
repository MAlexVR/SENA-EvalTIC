import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/auth-utils";
import { safeDecrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await requireInstructor();
    const id = session.user.instructorId;

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      select: {
        cloudinaryCloudName: true,
        cloudinaryApiKey: true,
        cloudinaryApiSecret: true,
      },
    });

    if (
      !instructor ||
      !instructor.cloudinaryCloudName ||
      !instructor.cloudinaryApiKey ||
      !instructor.cloudinaryApiSecret
    ) {
      return NextResponse.json(
        { error: "Cloudinary no configurado" },
        { status: 400 },
      );
    }

    const apiSecret = safeDecrypt(instructor.cloudinaryApiSecret);

    cloudinary.config({
      cloud_name: instructor.cloudinaryCloudName,
      api_key: instructor.cloudinaryApiKey,
      api_secret: apiSecret,
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "evaluaciones", resource_type: "image" },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult as { secure_url: string });
          },
        )
        .end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir la imagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

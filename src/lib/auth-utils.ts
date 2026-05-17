import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Verifica que el usuario tenga sesión activa como instructor.
 * Si no tiene sesión, redirige a /instructor/login.
 * Usar en Server Components y API Routes.
 */
export async function requireInstructor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.instructorId) {
    redirect("/instructor/login");
  }
  return session;
}

/**
 * Verifica sesión en API Routes (retorna null en lugar de redirigir).
 * Usar cuando se quiere manejar el error manualmente con Response 401.
 */
export async function getInstructorSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.instructorId) return null;
  return session;
}

/**
 * Verifica que el usuario tenga sesión activa Y sea administrador.
 * Usar en endpoints exclusivos de admin (CRUD de instructores, config global).
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.instructorId) {
    redirect("/instructor/login");
  }
  if (!session.user.isAdmin) {
    redirect("/instructor/dashboard");
  }
  return session;
}

/**
 * Versión API de requireAdmin — retorna null en vez de redirigir.
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.instructorId || !session.user.isAdmin) return null;
  return session;
}

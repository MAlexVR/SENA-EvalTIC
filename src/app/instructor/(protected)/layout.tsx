import { InstructorSidebar } from "@/components/organisms/InstructorSidebar";
import { InstructorMobileNav } from "@/components/organisms/InstructorMobileNav";
import { requireInstructor } from "@/lib/auth-utils";

export const metadata = {
  title: "Panel Instructor — SENA EvalTIC",
  description: "Panel de administración de evaluaciones SENA CEET",
};

export default async function InstructorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireInstructor(); // Defensa en profundidad — redirige si no hay sesión
  return (
    <div className="flex h-screen overflow-hidden bg-sena-gray-light">
      {/* Sidebar desktop */}
      <InstructorSidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top nav */}
        <InstructorMobileNav />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Image,
  Loader2,
  Mail,
  User,
} from "lucide-react";

interface PerfilData {
  nombre: string;
  email: string;
  emailNotificaciones: boolean;
  resendApiKey: string | null;
  tieneApiKey: boolean;
  cloudinaryCloudName: string | null;
  cloudinaryApiKey: string | null;
  tieneCloudinary: boolean;
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [emailNotificaciones, setEmailNotificaciones] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Cloudinary state
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");
  const [showCloudinarySecret, setShowCloudinarySecret] = useState(false);
  const [cloudinarySaving, setCloudinarySaving] = useState(false);
  const [cloudinarySaveStatus, setCloudinarySaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    fetch("/api/instructor/perfil")
      .then((r) => r.json())
      .then((data: PerfilData) => {
        setPerfil(data);
        setEmailNotificaciones(data.emailNotificaciones);
        setApiKey(data.resendApiKey ?? "");
        setCloudinaryCloudName(data.cloudinaryCloudName ?? "");
        setCloudinaryApiKey(data.cloudinaryApiKey ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");

    const res = await fetch("/api/instructor/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotificaciones, resendApiKey: apiKey }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPerfil((prev) =>
        prev ? { ...prev, ...updated } : prev
      );
      setApiKey(updated.resendApiKey ?? "");
      setSaveStatus("success");
    } else {
      setSaveStatus("error");
    }
    setSaving(false);
  };

  const handleCloudinarySave = async () => {
    setCloudinarySaving(true);
    setCloudinarySaveStatus("idle");

    const res = await fetch("/api/instructor/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPerfil((prev) => (prev ? { ...prev, ...updated } : prev));
      setCloudinaryCloudName(updated.cloudinaryCloudName ?? "");
      setCloudinaryApiKey(updated.cloudinaryApiKey ?? "");
      setCloudinaryApiSecret("");
      setCloudinarySaveStatus("success");
    } else {
      setCloudinarySaveStatus("error");
    }
    setCloudinarySaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-sena-blue" />
      </div>
    );
  }

  const showWarning = emailNotificaciones && !perfil?.tieneApiKey && !apiKey.trim();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-sena-blue">Mi Perfil</h1>
        <p className="text-sm text-sena-gray-dark/60 mt-0.5">
          Configuración de tu cuenta y notificaciones por correo.
        </p>
      </div>

      {/* Account info */}
      <Card className="shadow-sm border-sena-gray-dark/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sena-blue flex items-center gap-2 text-base">
            <User size={16} className="text-sena-green" />
            Datos de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-sena-gray-dark/60">Nombre</Label>
            <p className="text-sm font-semibold text-sena-blue mt-0.5">{perfil?.nombre}</p>
          </div>
          <div>
            <Label className="text-xs text-sena-gray-dark/60">Correo institucional</Label>
            <p className="text-sm font-semibold text-sena-blue mt-0.5">{perfil?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Email notifications */}
      <Card className="shadow-sm border-sena-gray-dark/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sena-blue flex items-center gap-2 text-base">
            <Mail size={16} className="text-sena-green" />
            Notificaciones de resultados
          </CardTitle>
          <CardDescription className="text-xs">
            Cuando un aprendiz complete una evaluación, recibirás una copia de sus resultados en tu
            correo institucional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-toggle" className="text-sm font-medium text-sena-blue">
                Recibir notificaciones por correo
              </Label>
              <p className="text-xs text-sena-gray-dark/60 mt-0.5">
                Requiere una API Key de Resend activa
              </p>
            </div>
            <Switch
              id="email-toggle"
              checked={emailNotificaciones}
              onCheckedChange={setEmailNotificaciones}
            />
          </div>

          {/* API Key field */}
          <div className="space-y-1.5">
            <Label htmlFor="api-key" className="text-sm font-medium text-sena-blue">
              API Key de Resend
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sena-gray-dark/40 hover:text-sena-blue transition-colors"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-sena-gray-dark/50">
              Crea una cuenta gratuita en{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sena-blue underline underline-offset-2"
              >
                resend.com
              </a>
              , ve a{" "}
              <span className="font-mono bg-sena-gray-light px-1 rounded">API Keys</span> y genera
              una nueva clave. El plan gratuito incluye 3 000 correos/mes.
            </p>
          </div>

          {/* Warning: toggle on but no key */}
          {showWarning && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Activaste las notificaciones pero no has ingresado una API Key. Los correos{" "}
                <strong>no se enviarán</strong> hasta que configures una clave válida.
              </AlertDescription>
            </Alert>
          )}

          {/* Save status */}
          {saveStatus === "success" && (
            <Alert className="py-2.5 border-sena-green/30 bg-sena-green/5">
              <CheckCircle2 className="h-4 w-4 text-sena-green" />
              <AlertDescription className="text-xs text-sena-green font-medium">
                Configuración guardada correctamente.
              </AlertDescription>
            </Alert>
          )}
          {saveStatus === "error" && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Error al guardar. Inténtalo de nuevo.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-sena-green hover:bg-sena-green-dark text-white font-bold gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>

      {/* Cloudinary integration */}
      <Card className="shadow-sm border-sena-gray-dark/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sena-blue flex items-center gap-2 text-base">
            <Image size={16} className="text-sena-green" />
            Integración Cloudinary
          </CardTitle>
          <CardDescription className="text-xs">
            Configura tu cuenta de Cloudinary para subir imágenes en preguntas tipo punto activo
            (hotspot).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cloud Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cloud-name" className="text-sm font-medium text-sena-blue">
              Cloud Name
            </Label>
            <Input
              id="cloud-name"
              type="text"
              value={cloudinaryCloudName}
              onChange={(e) => setCloudinaryCloudName(e.target.value)}
              placeholder="mi-cloud-name"
              className="font-mono text-sm"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="cloudinary-api-key" className="text-sm font-medium text-sena-blue">
              API Key
            </Label>
            <Input
              id="cloudinary-api-key"
              type="text"
              value={cloudinaryApiKey}
              onChange={(e) => setCloudinaryApiKey(e.target.value)}
              placeholder="123456789012345"
              className="font-mono text-sm"
            />
          </div>

          {/* API Secret (masked) */}
          <div className="space-y-1.5">
            <Label htmlFor="cloudinary-api-secret" className="text-sm font-medium text-sena-blue">
              API Secret
            </Label>
            <div className="relative">
              <Input
                id="cloudinary-api-secret"
                type={showCloudinarySecret ? "text" : "password"}
                value={cloudinaryApiSecret}
                onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                placeholder={perfil?.tieneCloudinary ? "••••••••••••••••" : "Tu API Secret"}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCloudinarySecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sena-gray-dark/40 hover:text-sena-blue transition-colors"
              >
                {showCloudinarySecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-sena-gray-dark/50">
              Encuentra estas credenciales en{" "}
              <a
                href="https://cloudinary.com/console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sena-blue underline underline-offset-2"
              >
                cloudinary.com/console
              </a>
              . El plan gratuito incluye 25 GB de almacenamiento y 25 créditos de transformación al
              mes.
            </p>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            {perfil?.tieneCloudinary ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sena-green">
                <CheckCircle2 size={13} />
                Cloudinary configurado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sena-gray-dark/50">
                <AlertCircle size={13} />
                Sin configurar
              </span>
            )}
          </div>

          {/* Save status */}
          {cloudinarySaveStatus === "success" && (
            <Alert className="py-2.5 border-sena-green/30 bg-sena-green/5">
              <CheckCircle2 className="h-4 w-4 text-sena-green" />
              <AlertDescription className="text-xs text-sena-green font-medium">
                Configuración de Cloudinary guardada correctamente.
              </AlertDescription>
            </Alert>
          )}
          {cloudinarySaveStatus === "error" && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Error al guardar. Inténtalo de nuevo.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCloudinarySave}
            disabled={cloudinarySaving}
            className="bg-sena-green hover:bg-sena-green-dark text-white font-bold gap-2"
          >
            {cloudinarySaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {cloudinarySaving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

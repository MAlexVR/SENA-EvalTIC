# Changelog

Todos los cambios notables del proyecto se documentan aquí.  
El formato sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el versionamiento [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-05-16

### Added
- (evaluaciones) Selector de competencia unificado: un único desplegable rellena automáticamente los 4 campos (código y nombre de competencia, código y resultado de aprendizaje)
- (banco) Soporte nativo del campo `texto` como alias de `enunciado` — permite cargar JSON externos sin adaptarlos

### Fixed
- (prueba) Enunciados de preguntas en blanco en modo prueba del instructor — `prueba/route.ts` no normalizaba el campo `texto` del banco externo
- (evaluaciones) Error "Invalid input: expected string, received null" al crear evaluación con descripción vacía

### Docs
- Lineamientos de formato JSON del banco de preguntas y formato Excel de aprendices agregados al README

---

## [1.2.0] - 2026-05-15

### Added
- (fichas) Fechas de vigencia independientes por ficha: `fechaInicio` y `fechaFin` propias de la ficha anulan las de la evaluación
- (email) Correo de resultado enviado al aprendiz en su correo personal al finalizar la evaluación
- (email) `emailInstitucional` como campo adicional en el modelo Aprendiz; plantilla Excel actualizada
- (email) Notificación masiva a aprendices de una ficha con mensaje personalizado; el instructor recibe copia del resumen
- (email) Botón de notificación por evaluación completa (convocatoria al instructor para verificar el correo)
- (email) Modo prueba envía vista previa del correo de resultado al instructor
- (dashboard) Cards de rendimiento por evaluación: presentaciones, tasa de aprobación y promedio propios
- (dashboard) Stat card muestra presentaciones sobre total de aprendices registrados
- (evaluaciones) Descarga del banco de preguntas en formato JSON desde la vista de edición
- (setup) Wizard de configuración inicial para Vercel (PowerShell interactivo)
- (evaluaciones) Selectores de competencia y resultado de aprendizaje desde historial (reemplazado en 1.3.0 por selector unificado)

### Fixed
- (fichas) Eliminación de ficha fallaba silenciosamente por FK sin cascade en `EvaluacionResultado`
- (fichas) Inputs `datetime-local` mostraban hora UTC en lugar de hora Bogotá (UTC-5)
- (email) Correo de modo prueba se enviaba siempre, ignorando el flag `emailNotificaciones`
- (email) Notificación por evaluación enviaba al correo personal del instructor en lugar del institucional
- (evaluaciones) Umbrales antiplagio por defecto corregidos: medio=2, alto=3

### Changed
- Versionamiento centralizado en `package.json` como única fuente de verdad; `AboutModal` y `Header` leen `APP_CONFIG.version`

---

## [1.1.0] - 2026-04-11

### Added
- (antiplagio) Anulación automática de la evaluación al superar el umbral alto de incidencias — calificación forzada a 0
- (instructores) Formularios con medidor de fortaleza de contraseña en tiempo real, toggle de visibilidad y validación de complejidad (mayúsculas, números, caracteres especiales)

### Fixed
- (antiplagio) Doble conteo de incidencias por combinación de eventos `blur` + `visibilitychange` + `fullscreenchange`
- (evaluacion) Restauración del fullscreen al volver a la evaluación tras el overlay de advertencia
- (instructores) Discrepancia entre validación client-side y server-side en el formulario de contraseña

---

## [1.0.0] - 2026-03-10

### Added
- Flujo completo del aprendiz: validar cédula + ficha → confirmar datos → evaluación → resultados
- Panel del instructor con CRUD de evaluaciones, fichas, aprendices y resultados
- Banco de preguntas con tres tipos: selección única, selección múltiple y emparejamiento
- Selección aleatoria de preguntas según distribución configurable por tipo
- Temporizador con cuenta regresiva y auto-envío al expirar
- Calificación automática con nota de corte configurable
- Crédito parcial en selección múltiple y emparejamiento (puntaje proporcional)
- Generación de informe PDF en el cliente con marca de agua, cifrado y metadatos del aprendiz
- Descarga PDF pública para aprendices con intentos agotados (sin autenticación, verificada por cédula)
- Sistema antiplagio: blur overlay, contador de incidencias, Fullscreen API, bloqueo de copy/cut/print/DevTools
- Tarjeta de integridad de sesión en resultados con severidad dinámica (verde/ámbar/rojo)
- Marca de agua en pantalla con nombre y documento del aprendiz
- Control de intentos múltiples por evaluación con registro en BD
- Intentos extra configurables por aprendiz
- Correo automático al instructor con resultado al finalizar cada evaluación
- Importación masiva de aprendices desde Excel SOFIA Plus (detección automática de columnas)
- Exportación de resultados en Excel (`.xlsx`) y CSV
- Modo prueba del instructor: presentar la evaluación sin guardar resultado
- Editor visual drag-and-drop para gestionar el banco de preguntas
- Autenticación NextAuth v4 con roles (admin / instructor)
- Seguridad: headers HTTP, JWT 8h, bcrypt cost 12, filtrado por `instructorId`
- Importación SOFIA Plus con detección automática de fila de encabezados

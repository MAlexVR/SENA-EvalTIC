# Changelog

Todos los cambios notables del proyecto se documentan aquí.  
El formato sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el versionamiento [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.1] - 2026-05-20

### Fixed
- (antiplagio) Incidencias de intentos anteriores ya no contaminan intentos nuevos — el conteo filtra por `registradoEn >= sesion.iniciadoEn`
- (evaluacion) Aprendiz que respondía solo 6 de 10 preguntas podía aprobar — puntaje ahora se calcula sobre el total esperado según `distribucionPreguntas`, no sobre las respondidas
- (evaluacion) Rama legacy corregida con el mismo denominador `totalEsperado` (afectaba instalaciones sin `USE_DB_BACKEND`)
- (evaluacion) Carga infinita al finalizar — fetch a `/api/evaluacion/finalizar` ahora aborta tras 30 s con mensaje claro
- (seguridad) `finalizar` rechaza con 400 cuando `fichaId` está presente pero no existe `SesionEvaluacion` (modo normal), previniendo evasión del antiplagio por conteo sin filtro de fecha

### Changed
- (antiplagio) Refactor de `anulandoRef` → dos refs con responsabilidades separadas: `anulacionEnProgresoRef` (previene envíos concurrentes) y `anulacionExitosaRef` (bloqueo permanente post-éxito); elimina race condition en reintento tras timeout

---

## [1.5.0] - 2026-05-20

### Added
- (antiplagio) Endpoint `POST /api/evaluacion/heartbeat` — registra cada evento de cambio de foco o visibilidad en BD (server-side) sin depender del contador del cliente
- (antiplagio) Modelo `IncidenciaAntiplagio` en Prisma: almacena `cedula`, `evaluacionId`, `fichaId`, `evento` y `registradoEn` por servidor
- (seguridad) CSP con nonces por petición (M4): middleware genera un nonce criptográfico aleatorio via Web Crypto API por cada request; elimina `unsafe-inline` de scripts en producción
- (seguridad) Validación server-side del tiempo de evaluación (A5): modelo `SesionEvaluacion` registra `iniciadoEn` en BD al iniciar; `finalizar` calcula `tiempoUsadoFinal` desde BD, ignorando el valor enviado por el cliente

### Fixed
- (aprendiz) Formulario de ingreso mostraba todos los campos del modo legacy (nombres, apellidos, documento…) cuando la BD estaba vacía pero `USE_DB_BACKEND=true`; ahora muestra solo ficha + cédula y un aviso de "sin evaluaciones activas"

### Changed
- (antiplagio) `finalizar` cuenta incidencias desde BD (`prisma.incidenciaAntiplagio.count`) en lugar de confiar en el entero enviado por el cliente
- (seguridad) CSP retirado de `next.config.ts` y delegado exclusivamente a `src/middleware.ts` con nonces dinámicos

---

## [1.4.0] - 2026-05-17

### Added
- (preguntas) Seis nuevos tipos de pregunta: `verdadero_falso`, `numerica`, `ordenamiento`, `completar`, `clasificacion` y `hotspot`
  - `ordenamiento`: arrastra elementos para definir el orden correcto (DnD)
  - `completar`: rellena espacios en blanco inline con texto libre o desplegable
  - `clasificacion`: asigna elementos a categorías mediante selector
  - `hotspot`: imagen con punto de respuesta y radio de tolerancia configurable; editor visual con drag & drop
  - `verdadero_falso`: dos botones Verdadero/Falso; sin opciones adicionales
  - `numerica`: campo numérico con valor correcto y tolerancia configurable
- (preguntas) Crédito parcial en `ordenamiento` (posición exacta), `completar` (por espacio) y `clasificacion` (por elemento)
- (perfil) Configuración Cloudinary por instructor: Cloud Name, API Key y API Secret (encriptado) para subir imágenes de preguntas
- (perfil) Endpoint `POST /api/instructor/upload-image` — upload de imágenes al Cloudinary del instructor desde el editor de preguntas
- (preguntas) Seguridad: sanitización profunda elimina `zonaCorrecta` (hotspot) y `segmentos[].respuestaCorrecta` (completar) antes de enviar al cliente
- (preguntas) `prepareQuestionsForClient` extraído a `src/lib/question-preparation.ts`; compartido entre `iniciar` y `prueba` sin duplicación
- (testing) vitest configurado como test runner; 43 pruebas unitarias para sanitización y scoring de los 9 tipos
- (evaluaciones) Banco de preguntas opcional al crear: el instructor puede crear la evaluación sin JSON y agregar preguntas manualmente desde el editor tras la creación

### Changed
- (preguntas) `distribucionPreguntas` en formulario de evaluación ahora expone los 9 tipos; los 6 nuevos quedan en 0 por defecto
- (preguntas) `distribucionPreguntas` generalizado a `Record<string, number>` — acepta cualquier tipo nuevo sin cambiar el schema
- (preguntas) Filtro de tipos en `iniciar` y `prueba` generalizado: usa las claves de `distribucionPreguntas` en vez de lista hardcodeada de 3 tipos
- (preguntas) `JsonUploader` muestra estadísticas para los 9 tipos al cargar un banco
- (hotspot) Modelo rediseñado: `zonaCorrecta {cx, cy, radio}` reemplaza array de zonas SVG; scoring por distancia euclidiana; el aprendiz hace un clic y ve solo su pin; el radio es invisible para el aprendiz pero configurable por el instructor en el editor
- (plantillas) Todos los tipos de pregunta usan ejemplos con temática OSI/redes (coherente con las preguntas base del banco)

### Docs
- Tabla "Tipos de preguntas disponibles" en README con Nivel Bloom, método de calificación y ejemplos JSON para los 6 tipos nuevos
- README actualizado con nuevo modelo hotspot (`zonaCorrecta`) y tabla de campos

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

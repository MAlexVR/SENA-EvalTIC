export const APP_CONFIG = {
  // Datos institucionales
  institution:
    "SENA - Centro de Electricidad, Electrónica y Telecomunicaciones (CEET)",
  sede: "Bogotá D.C.",
  title: "SENA EvalTIC - Evaluación en Línea",

  // Competencia
  competencia: {
    codigo: "38199",
    nombre: "ORIENTAR INVESTIGACIÓN FORMATIVA SEGÚN REFERENTES TÉCNICOS",
  },

  // Resultado de Aprendizaje
  resultadoAprendizaje: {
    codigo: "580873",
    nombre:
      "PROPONER SOLUCIONES A LAS NECESIDADES DEL CONTEXTO SEGÚN RESULTADOS DE LA INVESTIGACIÓN",
  },

  // ═══ PARÁMETROS ACTUALIZADOS ═══
  bancoPreguntasTotal: 50, // Total de preguntas en el banco
  totalQuestions: 10, // Preguntas aleatorias por evaluación
  distribucionPreguntas: {
    seleccion_unica: 5,
    seleccion_multiple: 3,
    emparejamiento: 2,
    verdadero_falso: 0,
    completar: 0,
    ordenamiento: 0,
    hotspot: 0,
    clasificacion: 0,
    numerica: 0,
  } as Record<string, number>,
  timeLimitMinutes: 15,
  passingScorePercentage: 65,
  aleatorizarOpciones: true, // Aleatorizar opciones de respuesta
  permitirRepeticion: false, // NO permitir repetir evaluación

  // Programas de formación
  programasFormacion: [
    "Tecnólogo en Implementación de Infraestructura de Tecnologías de la Información y las Comunicaciones (IITICS)",
    "Tecnólogo en Implementación de Redes y Servicios de Telecomunicaciones (TIRST)",
    "Tecnólogo en Gestión de Redes de Datos (GRD)",
    "Otro Programa",
  ],

  // Feature flag: cuando está en "true" el flujo del aprendiz usa la DB (Neon)
  // en lugar del sistema legacy de archivos JSON.
  useDatabaseBackend: process.env.NEXT_PUBLIC_USE_DB_BACKEND === "true",

  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",

};

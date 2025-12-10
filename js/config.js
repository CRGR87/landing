/**
 * config.js
 * Módulo encargado de cargar la configuración desde Google Sheets.
 */

// URL pública del CSV de Google Sheets.
// Transformamos la URL de edición a la de exportación CSV
const CONFIG_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Q52t4A__-X8d4q6Hd5LisjKpFD4SkxiilVhkU_pzWnc/export?format=csv&gid=0";

// Configuración por defecto (fallback) por si falla la carga o no hay URL
const DEFAULT_CONFIG = {
  webinar_titulo: "Webinar: Estrategias de WhatsApp Marketing",
  webinar_descripcion:
    "Aprende a automatizar tus ventas y mejorar la atención al cliente con WhatsApp y herramientas No-Code.",
  webinar_fecha: "15/01/2026",
  webinar_hora: "19:00",
  webinar_cta_texto: "Reservar mi plaza ahora",
  whatsapp_mensaje_bienvenida:
    "Hola {{nombre}}, te has apuntado al webinar \"{{webinar_titulo}}\" que se celebrará el {{webinar_fecha}} a las {{webinar_hora}}.\n\nEste es tu enlace de acceso: https://ejemplo.com/webinar-directo"
};

/**
 * Parsea un CSV simple con formato:
 * clave,valor
 * webinar_titulo,Mi webinar
 */
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const config = {};

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(",");
    if (!rawKey || !rest.length) continue;

    const key = rawKey.trim();
    const value = rest.join(",").trim(); // por si el valor contiene comas

    config[key] = value;
  }

  return config;
}

/**
 * Carga la configuración desde Google Sheets.
 * Si falla, devuelve DEFAULT_CONFIG.
 */
export async function loadConfig() {
  // Si la URL sigue en modo placeholder, devolvemos directamente la config por defecto
  if (CONFIG_SHEET_URL.includes("PLACEHOLDER_URL")) {
    console.warn(
      "[config] CONFIG_SHEET_URL sigue en placeholder, usando DEFAULT_CONFIG."
    );
    return DEFAULT_CONFIG;
  }

  try {
    console.log("[config] Cargando configuración desde Google Sheets…");
    const response = await fetch(CONFIG_SHEET_URL);

    if (!response.ok) {
      throw new Error(
        `Respuesta HTTP no OK: ${response.status} ${response.statusText}`
      );
    }

    const csvText = await response.text();
    const sheetConfig = parseCSV(csvText);

    // Mezclamos con los valores por defecto
    const finalConfig = { ...DEFAULT_CONFIG, ...sheetConfig };
    console.log("[config] Configuración cargada:", finalConfig);
    return finalConfig;
  } catch (error) {
    console.error(
      "[config] Error cargando configuración desde Google Sheets:",
      error
    );
    console.log("[config] Usando configuración por defecto.");
    return DEFAULT_CONFIG;
  }
}

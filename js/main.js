import { loadConfig } from "./config.js";

// URL del Webhook de n8n (Producción)
const N8N_WEBHOOK_URL = "https://cristofergr.app.n8n.cloud/webhook/simple-website";

// Variables globales para almacenar la configuración cargada
let currentConfig = {};

// Elementos del DOM
const elements = {
  title: document.getElementById("webinar-title"),
  description: document.getElementById("webinar-description"),
  date: document.getElementById("webinar-date"),
  time: document.getElementById("webinar-time"),
  ctaButton: document.getElementById("cta-button"),
  modal: document.getElementById("webinarModal"),
  closeModal: document.querySelector(".close"),
  form: document.getElementById("webinarForm")
};

/**
 * Inicializa la landing:
 * 1) Carga config (Google Sheets o fallback)
 * 2) Pinta los textos dinámicamente
 * 3) Configura modal y formulario
 */
async function initLanding() {
  try {
    document.body.classList.add("loading");
    currentConfig = await loadConfig();
  } finally {
    document.body.classList.remove("loading");
  }

  // 1. Rellenar contenido dinámico
  if (elements.title) {
    elements.title.textContent =
      currentConfig.webinar_titulo ||
      "Webinar sobre automatización con WhatsApp";
  }

  if (elements.description) {
    elements.description.textContent =
      currentConfig.webinar_descripcion ||
      "Descubre cómo aprovechar WhatsApp para mejorar tus resultados.";
  }

  if (elements.date) {
    elements.date.textContent =
      currentConfig.webinar_fecha || "Fecha por definir";
  }

  if (elements.time) {
    elements.time.textContent =
      currentConfig.webinar_hora || "Hora por definir";
  }

  if (elements.ctaButton) {
    elements.ctaButton.textContent =
      currentConfig.webinar_cta_texto || "Reservar mi plaza";
  }

  // 2. Configurar eventos del modal
  setupModalEvents();

  // 3. Configurar envío del formulario
  setupFormSubmit();
}

/**
 * Configura la apertura y cierre del modal
 */
function setupModalEvents() {
  if (!elements.modal || !elements.ctaButton || !elements.closeModal) return;

  elements.ctaButton.onclick = (e) => {
    e.preventDefault(); // Evitar salto de página si es un enlace
    elements.modal.style.display = "block";
  };

  elements.closeModal.onclick = () => {
    elements.modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === elements.modal) {
      elements.modal.style.display = "none";
    }
  };
}

/**
 * Configura el envío del formulario:
 * - Valida campos básicos
 * - Envía los datos al webhook de n8n (POST JSON)
 * - Muestra feedback al usuario sin salir de la página
 */
function setupFormSubmit() {
  if (!elements.form) return;

  elements.form.onsubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(elements.form);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const channel = formData.get("channel"); // "whatsapp"

    // --- Validación básica ---
    if (!name || !email || !phone) {
      alert("Por favor, rellena todos los campos obligatorios.");
      return;
    }

    // Validación simple de teléfono (mínimo 8 dígitos)
    const phoneClean = phone.replace(/\D/g, ""); // Quitar no-dígitos
    if (phoneClean.length < 8) {
      alert("Por favor, introduce un número de teléfono válido (mínimo 8 dígitos).");
      return;
    }

    // --- Construcción del Payload ---
    const payload = {
      name: name,
      email: email,
      phone: phone,
      contactPreference: channel || "whatsapp",
      webinar: {
        title: currentConfig.webinar_titulo || "Webinar Default",
        date: currentConfig.webinar_fecha || "",
        time: currentConfig.webinar_hora || ""
      },
      // Metadatos adicionales
      registrationDate: new Date().toISOString(),
      source: "landing-page"
    };

    console.log("Enviando datos a n8n:", payload);

    // --- Envío a n8n ---
    const submitButton = elements.form.querySelector("button[type='submit']");
    const originalButtonText = submitButton.textContent;
    
    try {
      // Estado de carga visual
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error en el webhook: ${response.status} ${response.statusText}`);
      }

      // Éxito
      console.log("Registro exitoso en n8n");
      
      // Feedback al usuario
      alert("¡Gracias por registrarte! En breve recibirás un mensaje por WhatsApp con la información del webinar.");
      
      // Cerrar modal y limpiar formulario
      elements.modal.style.display = "none";
      elements.form.reset();

    } catch (error) {
      console.error("Error al enviar los datos al webhook de n8n:", error);
      alert("Ha ocurrido un problema al registrar tu asistencia. Por favor, inténtalo de nuevo en unos minutos.");
    } finally {
      // Restaurar botón
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  };
}

// Iniciar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initLanding);

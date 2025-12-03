import { loadConfig } from "./config.js";

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
 * 2) Pinta los textos dinámicos
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

  elements.ctaButton.onclick = () => {
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
 * - (Fase actual) abre WhatsApp con un mensaje preconstruido
 * - (Fase futura) enviará los datos a n8n / GoHighLevel / MySQL
 */
function setupFormSubmit() {
  if (!elements.form) return;

  elements.form.onsubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(elements.form);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const channel = (formData.get("channel") || "").toString().trim();

    if (!name || !email || !phone) {
      alert("Por favor, rellena nombre, email y teléfono.");
      return;
    }

    if (channel !== "whatsapp") {
      alert("Por ahora solo está disponible el canal WhatsApp.");
      return;
    }

    console.log("[form] Datos del formulario:", {
      name,
      email,
      phone,
      channel
    });
    console.log("[form] Config actual:", currentConfig);

    // Construir mensaje de bienvenida usando la plantilla de configuración
    let template =
      currentConfig.whatsapp_mensaje_bienvenida ||
      "Hola {{nombre}}, te has apuntado al webinar \"{{webinar_titulo}}\" que se celebrará el {{webinar_fecha}} a las {{webinar_hora}}.";

    const finalMessage = template
      .replace(/{{nombre}}/g, name)
      .replace(/{{webinar_titulo}}/g, currentConfig.webinar_titulo || "")
      .replace(/{{webinar_fecha}}/g, currentConfig.webinar_fecha || "")
      .replace(/{{webinar_hora}}/g, currentConfig.webinar_hora || "");

    // 📌 FASE ACTUAL (SIN N8N):
    //   - Abrir WhatsApp del alumno para que te envíe el mensaje a TI.
    // ⚠️ IMPORTANTE: Poner tu número de empresa aquí en formato internacional sin "+"
    const MY_PHONE_NUMBER = "34600000000"; // TODO: sustituir por tu número real
    const whatsappUrl = `https://wa.me/${MY_PHONE_NUMBER}?text=${encodeURIComponent(
      finalMessage
    )}`;

    window.open(whatsappUrl, "_blank");

    // Opcional: Cerrar modal y mostrar mensaje
    elements.modal.style.display = "none";
    alert(
      "¡Gracias por registrarte! Se ha abierto WhatsApp para que confirmes tu asistencia."
    );

    // 🧩 FASE FUTURA – INTEGRACIÓN CON N8N (WEBHOOK) / GHL / MySQL
    //
    // TODO: cuando tengas n8n Plus,
    // sustituir o complementar la lógica anterior por algo así:
    //
    // const N8N_WEBHOOK_URL = "https://tu-instancia.n8n.cloud/webhook/registro-webinar";
    // fetch(N8N_WEBHOOK_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     name,
    //     email,
    //     phone,
    //     channel,
    //     config: currentConfig
    //   })
    // })
    // .then(res => res.json())
    // .then(data => {
    //   console.log("[n8n] Respuesta:", data);
    // })
    // .catch(err => {
    //   console.error("[n8n] Error enviando datos:", err);
    // });
  };
}

// Iniciar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initLanding);

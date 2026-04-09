/**
 * Configuración: reemplazá el número por el WhatsApp real.
 * Formato recomendado (wa.me): país + código de área + número, sin + ni 0 ni 15.
 * Ejemplo (AR): 54911XXXXXXXX
 */
const WHATSAPP_NUMBER = "5491124067624";

const state = {
  pendingMessage: "",
  pendingProduct: "",
  lastFocusedEl: null,
};

function sanitizeDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function buildWhatsAppUrl(message) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  const text = encodeURIComponent(message);
  return `${base}?text=${text}`;
}

function openWhatsApp(message) {
  window.location.href = buildWhatsAppUrl(message);
}

function getModalEls() {
  const modal = document.querySelector(".modal");
  const form = document.querySelector("[data-modal-form]");
  const phoneInput = document.querySelector("[data-phone-input]");
  const errorEl = document.querySelector("[data-form-error]");
  const titleEl = document.getElementById("modalTitle");
  return { modal, form, phoneInput, errorEl, titleEl };
}

function openModal({ product, messageTemplate }) {
  const { modal, phoneInput, errorEl, titleEl } = getModalEls();
  if (!modal || !phoneInput) return;

  state.pendingProduct = product || "";
  state.pendingMessage = messageTemplate || "";
  state.lastFocusedEl = document.activeElement;

  if (titleEl) {
    titleEl.textContent = product ? `Confirmá tu número (${product})` : "Confirmá tu número";
  }
  if (errorEl) errorEl.textContent = "";

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  phoneInput.value = "";
  phoneInput.focus({ preventScroll: true });
}

function closeModal() {
  const { modal, errorEl } = getModalEls();
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = "";
  if (errorEl) errorEl.textContent = "";

  const el = state.lastFocusedEl;
  state.lastFocusedEl = null;
  if (el && typeof el.focus === "function") el.focus();
}

function validatePhone(raw) {
  const digits = sanitizeDigits(raw);
  if (!digits) return { ok: false, digits: "", message: "Ingresá tu número para continuar." };
  if (!/^\d+$/.test(digits)) return { ok: false, digits: "", message: "Usá solo números." };
  if (digits.length < 8) return { ok: false, digits: "", message: "El número parece demasiado corto." };
  if (digits.length > 15) return { ok: false, digits: "", message: "El número parece demasiado largo." };
  return { ok: true, digits, message: "" };
}

function attachBuyHandlers() {
  const buyTriggers = Array.from(document.querySelectorAll("[data-buy]"));
  buyTriggers.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const product = el.getAttribute("data-product") || "";
      const messageTemplate = el.getAttribute("data-message") || "";
      openModal({ product, messageTemplate });
    });
  });
}

function attachModalHandlers() {
  const { modal, form, phoneInput, errorEl } = getModalEls();
  if (!modal || !form || !phoneInput) return;

  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.matches("[data-modal-close]")) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  phoneInput.addEventListener("input", () => {
    const before = phoneInput.value;
    const cleaned = sanitizeDigits(before);
    if (before !== cleaned) phoneInput.value = cleaned;
    if (errorEl) errorEl.textContent = "";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const res = validatePhone(phoneInput.value);
    if (!res.ok) {
      if (errorEl) errorEl.textContent = res.message;
      phoneInput.focus();
      return;
    }

    const msg = (state.pendingMessage || "").replace("[PHONE]", res.digits);
    closeModal();
    openWhatsApp(msg);
  });
}

function attachFabWhatsApp() {
  const fab = document.querySelector("[data-fab-whatsapp]");
  if (!fab) return;
  fab.addEventListener("click", () => {
    const msg = "Hola, quiero hacer una consulta. Mi número es:";
    openWhatsApp(msg);
  });
}

function attachSocialLinks() {
  // Placeholder: reemplazá con links reales cuando los tengas.
  // Mantengo href="#" en HTML para no romper mientras no haya URLs definidas.
  const social = Array.from(document.querySelectorAll(".social-card"));
  social.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href") || "#";
      if (href === "#") {
        e.preventDefault();
        if (a.getAttribute("data-social") === "whatsapp") {
          openModal({
            product: "Consulta por WhatsApp",
            messageTemplate: "Hola, tengo una consulta. Mi número es: [PHONE]",
          });
          return;
        }
        alert("Pegá aquí el link real de esta red social (Instagram/Facebook/TikTok).");
      }
    });
  });
}

function attachRevealAnimations() {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

function init() {
  attachBuyHandlers();
  attachModalHandlers();
  attachFabWhatsApp();
  attachSocialLinks();
  attachRevealAnimations();
}

document.addEventListener("DOMContentLoaded", init);


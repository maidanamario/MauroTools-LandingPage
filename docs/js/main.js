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

const ARTICLES_STORAGE_KEY = "maurotools_articles_v1";
const ARTICLES_URL = "./articles.json";

function sanitizeDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function attachWhatsAppHandlers() {
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('.cta-whatsapp');
    if (!cta) return;
    e.preventDefault();
    const producto = cta.getAttribute('data-producto');
    const precio = cta.getAttribute('data-precio');
    let message = "Hola, vi tus productos en la web y quiero más información";
    if (producto && precio) {
      message = `Hola, vi el ${producto} a ${precio} en tu página. ¿Sigue disponible?`;
    }
    if (!producto || !precio) {
      console.warn('Faltan datos del producto para CTA:', { producto, precio, element: cta });
    }
    const url = buildWhatsAppUrl(message);
    window.open(url, '_blank');
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
      if (a.classList.contains('cta-whatsapp')) return;
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

function loadArticlesFromStorage() {
  try {
    const raw = localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveArticlesToStorage(articles) {
  try {
    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  } catch {
    // Si localStorage está bloqueado, seguimos sin persistencia.
  }
}

async function fetchDefaultArticles() {
  const res = await fetch(ARTICLES_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error("No se pudieron cargar los artículos.");
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data;
}

function normalizeArticles(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => ({
      id: typeof a?.id === "number" ? a.id : Number(a?.id),
      title: typeof a?.title === "string" ? a.title : "",
      content: typeof a?.content === "string" ? a.content : "",
      visible: Boolean(a?.visible),
    }))
    .filter((a) => Number.isFinite(a.id));
}

function renderArticles(articles) {
  const host = document.querySelector("[data-articles-list]");
  if (!host) return;

  const visible = normalizeArticles(articles).filter((a) => a.visible);
  if (visible.length === 0) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML = visible
    .map((a) => {
      const title = escapeHtml(a.title);
      const content = escapeHtml(a.content);
      return `
        <article class="card reveal">
          <div class="card-body">
            <h3 class="card-title">${title}</h3>
            <p class="card-desc">${content}</p>
          </div>
        </article>
      `.trim();
    })
    .join("");
}

async function initArticles() {
  const host = document.querySelector("[data-articles-list]");
  if (!host) return;

  const fromStorage = loadArticlesFromStorage();
  if (fromStorage) {
    renderArticles(fromStorage);
    attachRevealAnimations();
    return;
  }

  try {
    const defaults = await fetchDefaultArticles();
    const normalized = normalizeArticles(defaults);
    saveArticlesToStorage(normalized);
    renderArticles(normalized);
    attachRevealAnimations();
  } catch {
    // Si falla el fetch, no rompemos la landing.
  }
}

function init() {
  attachWhatsAppHandlers();
  attachModalHandlers();
  attachFabWhatsApp();
  attachSocialLinks();
  attachRevealAnimations();
  initArticles();
}

document.addEventListener("DOMContentLoaded", init);


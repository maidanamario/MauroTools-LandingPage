/**
 * Configuración: reemplazá el número por el WhatsApp real.
 * Formato recomendado (wa.me): país + código de área + número, sin + ni 0 ni 15.
 * Ejemplo (AR): 54911XXXXXXXX
 */
const WHATSAPP_NUMBER = "5491124067624";

const ARTICLES_STORAGE_KEY = "maurotools_articles_v1";
const ARTICLES_URL = "./articles.json";

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
          openWhatsApp("Hola, tengo una consulta.");
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
async function fetchProductos() {
  const res = await fetch("./productos.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("Error cargando productos");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Formato de productos inválido");
  return data;
}

function renderProductos(productos) {
  const contenedor = document.getElementById("productos-lista");
  if (!contenedor) return;

  contenedor.innerHTML = productos
    .map((p) => {
      const imagen = escapeHtml(p.imagen);
      const titulo = escapeHtml(p.titulo);
      const precio = escapeHtml(p.precio);
      const descripcion = escapeHtml(p.descripcion);
      return `
        <article class="card reveal">
          <div class="card-media">
            <img
              class="card-product-image"
              src="${imagen}"
              alt="${titulo}"
              loading="lazy"
            />
          </div>
          <div class="card-body">
            <h3 class="card-title">${titulo}</h3>
            <div class="card-price">${precio}</div>
            <p class="card-desc">${descripcion}</p>
            <button
              class="btn btn-secondary btn-full cta-whatsapp"
              type="button"
              data-producto="${titulo}"
              data-precio="${precio}"
            >
              Comprar ahora
            </button>
          </div>
        </article>
      `.trim();
    })
    .join("");
}

async function initProductos() {
  try {
    const productos = await fetchProductos();
    renderProductos(productos);
    attachRevealAnimations();
  } catch (e) {
    console.error(e);
  }
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
  attachFabWhatsApp();
  attachSocialLinks();
  attachRevealAnimations();
  initArticles();
  initProductos();
}

document.addEventListener("DOMContentLoaded", init);


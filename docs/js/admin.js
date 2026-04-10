const ARTICLES_STORAGE_KEY = "maurotools_articles_v1";
const ARTICLES_URL = "./articles.json";

const ADMIN_SESSION_KEY = "maurotools_admin_ok_v1";
// Protección básica. Cambiala por una propia si querés.
const ADMIN_PASSWORD = "maurotools";

function sanitizeText(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadFromStorage() {
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

function saveToStorage(articles) {
  localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
}

async function fetchDefaults() {
  const res = await fetch(ARTICLES_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error("No se pudieron cargar los defaults.");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

function nextId(articles) {
  const max = articles.reduce((acc, a) => (a.id > acc ? a.id : acc), 0);
  return max + 1;
}

function requireAuth() {
  try {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") return true;
  } catch {
    // ignore
  }
  const res = prompt("Contraseña de admin:");
  if (res !== ADMIN_PASSWORD) {
    alert("Contraseña incorrecta.");
    return false;
  }
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  } catch {
    // ignore
  }
  return true;
}

function getEls() {
  const form = document.querySelector("[data-article-form]");
  const list = document.querySelector("[data-list]");
  const title = document.querySelector("[data-form-title]");
  const cancelBtn = document.querySelector("[data-cancel]");
  const deleteBtn = document.querySelector("[data-delete]");
  const errorEl = document.querySelector("[data-error]");
  const okEl = document.querySelector("[data-ok]");
  const resetBtn = document.querySelector('[data-action="reset"]');
  return { form, list, title, cancelBtn, deleteBtn, errorEl, okEl, resetBtn };
}

function setMsg({ error, ok } = {}) {
  const { errorEl, okEl } = getEls();
  if (errorEl) {
    errorEl.hidden = !error;
    errorEl.textContent = error || "";
  }
  if (okEl) {
    okEl.hidden = !ok;
    okEl.textContent = ok || "";
  }
}

function renderList(articles) {
  const { list } = getEls();
  if (!list) return;

  const rows = [...articles].sort((a, b) => b.id - a.id);
  if (rows.length === 0) {
    list.innerHTML = `<div class="small">No hay artículos todavía.</div>`;
    return;
  }

  list.innerHTML = rows
    .map((a) => {
      const badge = a.visible
        ? `<span class="badge badge-on">visible</span>`
        : `<span class="badge badge-off">oculto</span>`;
      return `
        <div class="item" data-item="${a.id}">
          <div class="item-title">
            <strong>${escapeHtml(a.title || "(sin título)")}</strong>
            ${badge}
          </div>
          <p>${escapeHtml(a.content || "")}</p>
          <div class="row">
            <button class="btn" type="button" data-edit="${a.id}">Editar</button>
            <button class="btn" type="button" data-toggle="${a.id}">
              ${a.visible ? "Ocultar" : "Mostrar"}
            </button>
            <button class="btn btn-danger" type="button" data-remove="${a.id}">Eliminar</button>
            <span class="small">ID: ${a.id}</span>
          </div>
        </div>
      `.trim();
    })
    .join("");
}

function resetForm() {
  const { form, title, cancelBtn, deleteBtn } = getEls();
  if (!form) return;
  form.reset();
  form.dataset.editingId = "";
  const visibleEl = form.elements.namedItem("visible");
  if (visibleEl && "checked" in visibleEl) visibleEl.checked = true;
  if (title) title.textContent = "Nuevo artículo";
  if (cancelBtn) cancelBtn.hidden = true;
  if (deleteBtn) deleteBtn.hidden = true;
  setMsg();
}

function fillForm(article) {
  const { form, title, cancelBtn, deleteBtn } = getEls();
  if (!form) return;
  form.dataset.editingId = String(article.id);
  form.elements.namedItem("title").value = article.title;
  form.elements.namedItem("content").value = article.content;
  const visibleEl = form.elements.namedItem("visible");
  if (visibleEl && "checked" in visibleEl) visibleEl.checked = Boolean(article.visible);
  if (title) title.textContent = `Editando artículo #${article.id}`;
  if (cancelBtn) cancelBtn.hidden = false;
  if (deleteBtn) deleteBtn.hidden = false;
  setMsg();
}

async function loadArticles() {
  const fromStorage = loadFromStorage();
  if (fromStorage) return normalizeArticles(fromStorage);
  const defaults = await fetchDefaults();
  const normalized = normalizeArticles(defaults);
  saveToStorage(normalized);
  return normalized;
}

async function init() {
  if (!requireAuth()) {
    document.body.innerHTML = "";
    return;
  }

  const { form, list, cancelBtn, deleteBtn, resetBtn } = getEls();
  if (!form || !list) return;

  let articles = [];
  try {
    articles = await loadArticles();
  } catch {
    articles = [];
  }

  const persist = () => {
    saveToStorage(articles);
    renderList(articles);
  };

  persist();
  resetForm();

  resetBtn?.addEventListener("click", async () => {
    if (!confirm("¿Restaurar artículos default? Esto pisa lo guardado en este navegador.")) return;
    try {
      const defaults = await fetchDefaults();
      articles = normalizeArticles(defaults);
      persist();
      resetForm();
      setMsg({ ok: "Defaults restaurados." });
    } catch {
      setMsg({ error: "No se pudieron cargar los defaults." });
    }
  });

  cancelBtn?.addEventListener("click", () => resetForm());

  deleteBtn?.addEventListener("click", () => {
    const editingId = Number(form.dataset.editingId || "");
    if (!Number.isFinite(editingId)) return;
    if (!confirm("¿Eliminar este artículo?")) return;
    articles = articles.filter((a) => a.id !== editingId);
    persist();
    resetForm();
    setMsg({ ok: "Artículo eliminado." });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setMsg();

    const editingId = Number(form.dataset.editingId || "");
    const title = sanitizeText(form.elements.namedItem("title").value);
    const content = sanitizeText(form.elements.namedItem("content").value);
    const visible = Boolean(form.elements.namedItem("visible").checked);

    if (!title) return setMsg({ error: "El título es obligatorio." });
    if (!content) return setMsg({ error: "El contenido es obligatorio." });

    if (Number.isFinite(editingId)) {
      const idx = articles.findIndex((a) => a.id === editingId);
      if (idx === -1) return setMsg({ error: "No se encontró el artículo a editar." });
      articles[idx] = { ...articles[idx], title, content, visible };
      persist();
      setMsg({ ok: "Cambios guardados." });
      return;
    }

    const id = nextId(articles);
    articles.unshift({ id, title, content, visible });
    persist();
    resetForm();
    setMsg({ ok: "Artículo creado." });
  });

  list.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const editId = target.getAttribute("data-edit");
    if (editId) {
      const id = Number(editId);
      const found = articles.find((a) => a.id === id);
      if (found) fillForm(found);
      return;
    }

    const toggleId = target.getAttribute("data-toggle");
    if (toggleId) {
      const id = Number(toggleId);
      const idx = articles.findIndex((a) => a.id === id);
      if (idx === -1) return;
      articles[idx] = { ...articles[idx], visible: !articles[idx].visible };
      persist();
      setMsg({ ok: "Visibilidad actualizada." });
      return;
    }

    const removeId = target.getAttribute("data-remove");
    if (removeId) {
      const id = Number(removeId);
      if (!confirm("¿Eliminar este artículo?")) return;
      articles = articles.filter((a) => a.id !== id);
      persist();
      resetForm();
      setMsg({ ok: "Artículo eliminado." });
    }
  });
}

document.addEventListener("DOMContentLoaded", init);


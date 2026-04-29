function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

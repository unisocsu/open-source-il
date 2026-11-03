(() => {
  const config = window.OPEN_SOURCE_IL_CONFIG || {};
  const apiBase = (config.API_BASE || "/api/v1").replace(/\/$/, "");
  const grid = document.getElementById("project-grid");
  const categoriesEl = document.getElementById("categories");
  const countEl = document.getElementById("result-count");
  const emptyEl = document.getElementById("empty-state");
  let activeCategory = "";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
  async function api(path) {
    const response = await fetch(apiBase + path, { headers: { "Accept": "application/json" } });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error?.message || "שגיאה בטעינת הנתונים");
    return body;
  }
  function renderProjects(items) {
    countEl.textContent = items.length ? `${items.length} פרויקטים` : "";
    grid.innerHTML = items.map(p => `<article class="project-card"><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p><div class="project-meta"><span>★ ${Number(p.github_stars || 0).toLocaleString("he-IL")} ב-GitHub</span><a href="${esc(p.repository_url)}" target="_blank" rel="noopener">למאגר ↗</a></div></article>`).join("");
    emptyEl.hidden = items.length !== 0;
    if (!items.length) grid.innerHTML = "";
  }
  async function loadProjects() {
    grid.innerHTML = '<div class="loading">טוענים פרויקטים…</div>';
    try {
      const result = await api("/projects?limit=30" + (activeCategory ? "&category=" + encodeURIComponent(activeCategory) : ""));
      renderProjects(result.data);
    } catch {
      grid.innerHTML = '<div class="loading">לא הצלחנו להתחבר לשרת. אפשר לנסות שוב מאוחר יותר.</div>';
      countEl.textContent = "";
    }
  }
  async function loadCategories() {
    try {
      const result = await api("/categories");
      categoriesEl.innerHTML = '<button class="chip active" data-category="">הכול</button>' + result.data.map(c => `<button class="chip" data-category="${esc(c.slug)}">${esc(c.name)}</button>`).join("");
    } catch { /* Categories are optional while the API is being configured. */ }
  }
  categoriesEl.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    categoriesEl.querySelectorAll(".chip").forEach(el => el.classList.toggle("active", el === button));
    loadProjects();
  });
  document.getElementById("search-form").addEventListener("submit", async event => {
    event.preventDefault();
    const q = document.getElementById("search-input").value.trim();
    if (q.length < 2) return loadProjects();
    grid.innerHTML = '<div class="loading">מחפשים…</div>';
    try { const result = await api("/search?q=" + encodeURIComponent(q)); renderProjects(result.data); }
    catch { grid.innerHTML = '<div class="loading">החיפוש אינו זמין כרגע.</div>'; }
  });
  loadCategories().then(loadProjects);
})();

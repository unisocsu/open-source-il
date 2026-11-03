const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}
function fail(message, status = 400, code = "BAD_REQUEST") {
  return json({ success: false, error: { code, message } }, status);
}
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
  const headers = { "Vary": "Origin", "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
  if (origin && allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function slugify(value) {
  return String(value || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  if (path === "/api/v1/health" && request.method === "GET") {
    return json({ success: true, data: { status: "ok", service: "open-source-il-api", version: "v1" } });
  }
  if (!env.DB) return fail("Database is not configured", 503, "DATABASE_UNAVAILABLE");

  if (path === "/api/v1/categories" && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, name, slug, description FROM categories ORDER BY sort_order, name").all();
    return json({ success: true, data: results });
  }

  if (path === "/api/v1/projects" && request.method === "GET") {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 50);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
    const category = url.searchParams.get("category");
    let sql = `SELECT p.id, p.slug, p.name, p.summary, p.repository_url, p.repository_owner, p.repository_name, p.github_stars, p.website_url, p.license, p.published_at,
      (SELECT COUNT(*) FROM votes v WHERE v.project_id=p.id AND v.value=1) AS community_votes
      FROM projects p WHERE p.status='published'`;
    const bindings = [];
    if (category) { sql += " AND EXISTS (SELECT 1 FROM project_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.project_id=p.id AND c.slug=?)"; bindings.push(category); }
    sql += " ORDER BY p.published_at DESC LIMIT ? OFFSET ?";
    bindings.push(limit, offset);
    const { results } = await env.DB.prepare(sql).bind(...bindings).all();
    const countSql = category
      ? "SELECT COUNT(*) AS total FROM projects p WHERE p.status='published' AND EXISTS (SELECT 1 FROM project_categories pc JOIN categories c ON c.id=pc.category_id WHERE pc.project_id=p.id AND c.slug=?)"
      : "SELECT COUNT(*) AS total FROM projects WHERE status='published'";
    const count = await env.DB.prepare(countSql).bind(...(category ? [category] : [])).first();
    return json({ success: true, data: results, pagination: { limit, offset, total: count?.total || 0 } });
  }

  if (path === "/api/v1/search" && request.method === "GET") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
    if (q.length < 2) return fail("Search query must contain at least 2 characters");
    const term = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    const { results } = await env.DB.prepare("SELECT id, slug, name, summary, repository_url, github_stars FROM projects WHERE status='published' AND (name LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\') ORDER BY github_stars DESC LIMIT 30").bind(term, term).all();
    return json({ success: true, data: results });
  }

  const projectMatch = path.match(/^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)$/);
  if (projectMatch && request.method === "GET") {
    const project = await env.DB.prepare("SELECT * FROM projects WHERE (id=? OR slug=?) AND status='published'").bind(projectMatch[1], projectMatch[1]).first();
    if (!project) return fail("Project not found", 404, "NOT_FOUND");
    const categories = await env.DB.prepare("SELECT c.id, c.name, c.slug FROM categories c JOIN project_categories pc ON pc.category_id=c.id WHERE pc.project_id=?").bind(project.id).all();
    const releases = await env.DB.prepare("SELECT r.id, r.tag_name, r.title, r.release_url, r.published_at, r.is_prerelease FROM releases r WHERE r.project_id=? ORDER BY r.published_at DESC").bind(project.id).all();
    return json({ success: true, data: { ...project, categories: categories.results, releases: releases.results } });
  }

  const userMatch = path.match(/^\/api\/v1\/users\/([a-zA-Z0-9_-]+)$/);
  if (userMatch && request.method === "GET") {
    const user = await env.DB.prepare("SELECT id, username, display_name, avatar_url, bio, reputation, created_at FROM users WHERE id=? OR username=?").bind(userMatch[1], userMatch[1]).first();
    if (!user) return fail("User not found", 404, "NOT_FOUND");
    return json({ success: true, data: user });
  }

  const releaseMatch = path.match(/^\/api\/v1\/releases\/([a-zA-Z0-9_-]+)$/);
  if (releaseMatch && request.method === "GET") {
    const release = await env.DB.prepare("SELECT r.*, p.name AS project_name FROM releases r JOIN projects p ON p.id=r.project_id WHERE r.id=? AND p.status='published'").bind(releaseMatch[1]).first();
    if (!release) return fail("Release not found", 404, "NOT_FOUND");
    const assets = await env.DB.prepare("SELECT id, name, download_url, content_type, size_bytes, platform FROM release_assets WHERE release_id=?").bind(release.id).all();
    return json({ success: true, data: { ...release, assets: assets.results } });
  }

  if (path === "/api/v1/projects" && request.method === "POST") {
    return fail("Project submissions require OAuth authentication; submission endpoint is not enabled yet.", 501, "AUTH_NOT_CONFIGURED");
  }
  return fail("Endpoint not found", 404, "NOT_FOUND");
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    try {
      const response = await route(request, env);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(cors)) headers.set(key, value);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      return json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } }, 500, cors);
    }
  }
};

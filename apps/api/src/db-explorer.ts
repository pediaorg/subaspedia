import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";

import type { Env } from "@/api/index";

const PAGE = /* html */ `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DB Explorer · Subaspedia</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: #0d1117; color: #e6edf3; }
  header { padding: 10px 16px; border-bottom: 1px solid #21262d; display: flex; gap: 12px; align-items: center; }
  header b { color: #58a6ff; }
  .wrap { display: flex; height: calc(100vh - 43px); }
  aside { width: 220px; border-right: 1px solid #21262d; overflow: auto; padding: 8px; }
  aside button { display: block; width: 100%; text-align: left; background: none; border: none; color: #e6edf3; padding: 6px 8px; cursor: pointer; border-radius: 6px; font: inherit; }
  aside button:hover { background: #161b22; }
  aside button.active { background: #1f6feb33; color: #58a6ff; }
  main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .sql { padding: 8px; border-bottom: 1px solid #21262d; display: flex; gap: 8px; }
  textarea { flex: 1; background: #161b22; color: #e6edf3; border: 1px solid #21262d; border-radius: 6px; padding: 8px; font: inherit; resize: vertical; min-height: 48px; }
  .run { background: #238636; color: #fff; border: none; border-radius: 6px; padding: 0 16px; cursor: pointer; font: inherit; }
  .run:hover { background: #2ea043; }
  .out { flex: 1; overflow: auto; padding: 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #21262d; padding: 4px 8px; text-align: left; white-space: pre-wrap; max-width: 360px; overflow: hidden; vertical-align: top; }
  th { position: sticky; top: 0; background: #161b22; }
  tr:nth-child(even) td { background: #0f141a; }
  .err { color: #f85149; padding: 8px; }
  .meta { color: #8b949e; padding: 0 8px 8px; }
</style>
</head>
<body>
<header><b>DB Explorer</b> <span class="meta" id="status">Subaspedia · D1</span></header>
<div class="wrap">
  <aside id="tables"></aside>
  <main>
    <div class="sql">
      <textarea id="q" placeholder="SELECT * FROM ...">SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;</textarea>
      <button class="run" onclick="run()">Run ▶</button>
    </div>
    <div class="out" id="out"></div>
  </main>
</div>
<script>
async function api(sql) {
  const r = await fetch('/db/query', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  return r.json();
}
function esc(v) {
  if (v === null) return '<i style="color:#8b949e">null</i>';
  if (typeof v === 'object') v = JSON.stringify(v);
  return String(v).replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));
}
function render(res) {
  const out = document.getElementById('out');
  if (res.error) { out.innerHTML = '<div class="err">' + esc(res.error) + '</div>'; return; }
  const rows = res.results || [];
  if (!rows.length) { out.innerHTML = '<div class="meta">Sin filas.</div>'; return; }
  const cols = Object.keys(rows[0]);
  let h = '<table><thead><tr>' + cols.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
  for (const row of rows) h += '<tr>' + cols.map(c => '<td>' + esc(row[c]) + '</td>').join('') + '</tr>';
  h += '</tbody></table>';
  out.innerHTML = '<div class="meta">' + rows.length + ' fila(s)</div>' + h;
}
async function run() {
  document.getElementById('out').innerHTML = '<div class="meta">Ejecutando…</div>';
  render(await api(document.getElementById('q').value));
}
async function loadTable(name) {
  document.querySelectorAll('#tables button').forEach(b => b.classList.toggle('active', b.textContent === name));
  document.getElementById('q').value = 'SELECT * FROM "' + name + '" LIMIT 100;';
  run();
}
async function init() {
  const res = await api("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;");
  const aside = document.getElementById('tables');
  if (res.error) { aside.innerHTML = '<div class="err">' + esc(res.error) + '</div>'; return; }
  for (const r of res.results) {
    const b = document.createElement('button');
    b.textContent = r.name;
    b.onclick = () => loadTable(r.name);
    aside.appendChild(b);
  }
}
init();
</script>
</body>
</html>`;

export function dbExplorer() {
  const app = new Hono<{ Bindings: Env }>();

  app.use(
    "*",
    basicAuth({
      username: "admin",
      password: "brasil71",
      realm: "DB Explorer",
    }),
  );

  app.get("/", c => c.html(PAGE));

  app.post("/query", async c => {
    const { sql } = await c.req.json<{ sql?: string }>();
    if (!sql || typeof sql !== "string") {
      return c.json({ error: "Falta 'sql'." }, 400);
    }
    try {
      const { results } = await c.env.DB.prepare(sql).all();
      return c.json({ results });
    } catch (err) {
      return c.json({ error: (err as Error).message }, 200);
    }
  });

  return app;
}

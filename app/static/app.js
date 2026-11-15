const grid = document.getElementById("projects-grid");
const projectDialog = document.getElementById("project-dialog");
const detailDialog = document.getElementById("detail-dialog");
const toastEl = document.getElementById("toast");
let activeProjectId = null;
let toastTimer;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function shortDate(value) {
  try { return new Intl.DateTimeFormat("he-IL", {day:"numeric",month:"short"}).format(new Date(value)); }
  catch { return ""; }
}
function typeLabel(type) {
  return ({"brand-film":"סרט תדמית","product-video":"סרטון מוצר","social-video":"תוכן לרשתות","ad":"פרסומת","other":"אחר","marketing-video":"סרטון שיווקי"}[type] || "פרויקט וידאו");
}
async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "הפעולה לא הצליחה");
  return data;
}
async function loadProjects() {
  try {
    const projects = await api("/api/projects");
    document.getElementById("project-count").textContent = projects.length + " פרויקטים";
    grid.innerHTML = projects.length ? projects.map(project => `
      <article class="project-card" data-project="${escapeHtml(project.id)}" tabindex="0" role="button">
        <div class="project-top"><span class="project-type">${escapeHtml(typeLabel(project.project_type))}</span><span class="project-symbol">↗</span></div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.brief || "עדיין לא הוגדר בריף לפרויקט הזה.")}</p>
        <div class="project-foot"><span>נוצר ב-${shortDate(project.created_at)}</span><span>פתיחת הפרויקט ←</span></div>
      </article>`).join("") : '<div class="loading-card">עדיין אין פרויקטים. אפשר ליצור את הראשון שלך.</div>';
    grid.querySelectorAll("[data-project]").forEach(card => {
      card.addEventListener("click", () => openProject(card.dataset.project));
      card.addEventListener("keydown", event => { if (event.key === "Enter") openProject(card.dataset.project); });
    });
  } catch (error) { grid.innerHTML = '<div class="loading-card">לא ניתן לטעון פרויקטים: ' + escapeHtml(error.message) + '</div>'; }
}
async function loadHealth() {
  try {
    const health = await api("/api/health");
    const connected = health.comfyui.connected;
    document.getElementById("engine-dot").classList.toggle("ok", connected);
    document.getElementById("engine-status").textContent = connected ? "מחובר ומוכן" : (health.comfyui.configured ? "השרת לא זמין" : "טרם הוגדר שרת");
    document.getElementById("engine-detail").textContent = connected ? "ComfyUI מחובר. ניתן לבדוק workflows ולהתחיל הפקה." : "הממשק מוכן. כדי להפיק וידאו יש לחבר כתובת של שרת ComfyUI עם GPU.";
    const pill = document.getElementById("connection-pill");
    pill.textContent = connected ? "מחובר" : "לא מחובר";
    pill.classList.toggle("ok", connected);
    document.getElementById("workflow-count").textContent = health.workflow_count + " workflows";
  } catch {
    document.getElementById("engine-status").textContent = "לא זמין";
    document.getElementById("engine-detail").textContent = "שרת האפליקציה לא החזיר סטטוס.";
  }
}
function openNewProject() { projectDialog.showModal(); }
["new-project-nav","new-project-top","hero-new"].forEach(id => document.getElementById(id).addEventListener("click", openNewProject));
["close-dialog","cancel-dialog"].forEach(id => document.getElementById(id).addEventListener("click", () => projectDialog.close()));
document.getElementById("project-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  try {
    const project = await api("/api/projects", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    projectDialog.close();
    event.currentTarget.reset();
    await loadProjects();
    await openProject(project.id);
    toast("הפרויקט נוצר בהצלחה");
  } catch (error) { toast(error.message); }
});
async function openProject(projectId) {
  try {
    const project = await api("/api/projects/" + encodeURIComponent(projectId));
    activeProjectId = project.id;
    document.getElementById("detail-title").textContent = project.title;
    document.getElementById("detail-brief").textContent = project.brief || "לא הוגדר בריף.";
    renderAssets(project.assets || []);
    detailDialog.showModal();
  } catch (error) { toast(error.message); }
}
function renderAssets(assets) {
  const list = document.getElementById("asset-list");
  list.innerHTML = assets.length ? assets.map(asset => {
    const isVideo = /\.(mp4|mov|m4v|webm|avi)$/i.test(asset.filename);
    const selector = isVideo ? '<input class="assembly-select" type="checkbox" value="' + escapeHtml(asset.id) + '">' : '';
    return '<div class="asset-row"><label>' + selector + '<span>▧ ' + escapeHtml(asset.filename) + '</span></label><small>' + (asset.size_bytes / 1024 / 1024).toFixed(1) + ' MB</small></div>';
  }).join("") : '<div class="asset-row"><span>עדיין לא הועלו חומרי גלם</span><small>0 קבצים</small></div>';
  list.querySelectorAll(".assembly-select").forEach(input => input.addEventListener("change", updateAssembleButton));
  updateAssembleButton();
}
function updateAssembleButton() {
  const selected = document.querySelectorAll(".assembly-select:checked").length;
  document.getElementById("assemble-btn").disabled = selected < 2;
}
document.getElementById("assemble-btn").addEventListener("click", async () => {
  const asset_ids = [...document.querySelectorAll(".assembly-select:checked")].map(input => input.value);
  if (!activeProjectId || asset_ids.length < 2) return;
  const button = document.getElementById("assemble-btn");
  const result = document.getElementById("render-result");
  button.disabled = true;
  button.textContent = "מרכיב את הסרט…";
  result.textContent = "השרת מעבד את קטעי הווידאו. זה עשוי לקחת כמה דקות.";
  try {
    const render = await api("/api/projects/" + encodeURIComponent(activeProjectId) + "/assemble", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({asset_ids})});
    result.innerHTML = '<a class="render-download" href="' + escapeHtml(render.download_url) + '" download>הורדת הסרט המורכב ←</a>';
    toast("הסרט הורכב בהצלחה");
  } catch (error) { result.textContent = error.message; toast(error.message); }
  finally { button.textContent = "הרכבת הסרט"; updateAssembleButton(); }
});
document.getElementById("youtube-import-btn").addEventListener("click", async () => {
  const input = document.getElementById("youtube-url");
  const button = document.getElementById("youtube-import-btn");
  const status = document.getElementById("youtube-import-status");
  const url = input.value.trim();
  if (!activeProjectId || !url) { toast("יש להדביק קישור YouTube"); return; }
  button.disabled = true;
  button.textContent = "מוריד…";
  status.textContent = "מוריד את הסרטון ושומר אותו בפרויקט. זה עשוי לקחת כמה דקות.";
  try {
    await api("/api/projects/" + encodeURIComponent(activeProjectId) + "/import-youtube", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({url})
    });
    const updated = await api("/api/projects/" + encodeURIComponent(activeProjectId));
    renderAssets(updated.assets || []);
    input.value = "";
    status.textContent = "הסרטון נוסף לספריית חומרי הגלם.";
    toast("הסרטון נשמר בפרויקט");
  } catch (error) {
    status.textContent = error.message;
    toast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "ייבוא לפרויקט";
  }
});
document.getElementById("close-detail").addEventListener("click", () => detailDialog.close());
document.getElementById("asset-input").addEventListener("change", async event => {
  const files = [...event.target.files];
  if (!activeProjectId || !files.length) return;
  for (const file of files) {
    const body = new FormData();
    body.append("file", file);
    try {
      await api("/api/projects/" + encodeURIComponent(activeProjectId) + "/assets", {method:"POST",body});
      toast("הקובץ הועלה: " + file.name);
    } catch (error) { toast(file.name + ": " + error.message); }
  }
  const updated = await api("/api/projects/" + encodeURIComponent(activeProjectId));
  renderAssets(updated.assets || []);
  event.target.value = "";
});
loadProjects();
loadHealth();

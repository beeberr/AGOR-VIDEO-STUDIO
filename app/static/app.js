const grid = document.getElementById("projects-grid");
const projectDialog = document.getElementById("project-dialog");
const detailDialog = document.getElementById("detail-dialog");
const toastEl = document.getElementById("toast");
let activeProjectId = null;
let projectAssets = [];
let timelineClips = [];
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
    timelineClips = [];
    renderAssets(project.assets || []);
    detailDialog.showModal();
  } catch (error) { toast(error.message); }
}
function renderAssets(assets) {
  projectAssets = assets;
  const list = document.getElementById("asset-list");
  list.innerHTML = assets.length ? assets.map(asset => {
    const isVideo = /\.(mp4|mov|m4v|webm|avi)$/i.test(asset.filename);
    const isAudio = /\.(wav|mp3|m4a|aac)$/i.test(asset.filename);
    const action = isVideo
      ? '<button class="asset-add-btn" type="button" data-add-clip="' + escapeHtml(asset.id) + '">＋ לציר העריכה</button>'
      : '';
    return '<div class="asset-row"><span>▧ ' + escapeHtml(asset.filename) + '</span><div class="asset-actions"><small>' + (asset.size_bytes / 1024 / 1024).toFixed(1) + ' MB</small>' + action + '</div></div>';
  }).join("") : '<div class="asset-row"><span>עדיין לא הועלו חומרי גלם</span><small>0 קבצים</small></div>';
  list.querySelectorAll("[data-add-clip]").forEach(button => button.addEventListener("click", () => addClip(button.dataset.addClip)));
  populateAudioTracks();
  renderTimeline();
}
function addClip(assetId) {
  if (timelineClips.some(clip => clip.asset_id === assetId)) { toast("הקטע כבר נמצא בציר העריכה"); return; }
  timelineClips.push({asset_id:assetId,start_seconds:0,end_seconds:null});
  renderTimeline();
}
function renderTimeline() {
  const host = document.getElementById("timeline-list");
  host.innerHTML = timelineClips.length ? timelineClips.map((clip,index) => {
    const asset = projectAssets.find(item => item.id === clip.asset_id);
    if (!asset) return "";
    return '<article class="timeline-clip" data-clip-index="' + index + '"><div class="timeline-clip-head"><strong>' + (index+1) + '. ' + escapeHtml(asset.filename) + '</strong><div class="timeline-controls"><button type="button" data-up="' + index + '" aria-label="הזז למעלה" ' + (index===0?'disabled':'') + '>↑</button><button type="button" data-down="' + index + '" aria-label="הזז למטה" ' + (index===timelineClips.length-1?'disabled':'') + '>↓</button><button type="button" data-remove="' + index + '" aria-label="הסר">×</button></div></div><div class="trim-fields"><label>התחלה (שניות)<input type="number" min="0" step="0.1" value="' + clip.start_seconds + '" data-start="' + index + '"></label><label>סיום (ריק = סוף הקובץ)<input type="number" min="0.1" step="0.1" value="' + (clip.end_seconds ?? "") + '" data-end="' + index + '"></label></div></article>';
  }).join("") : '<div class="timeline-empty">עדיין לא נוספו קטעים לציר העריכה. לחץ על „לציר העריכה” ליד סרטון בספריית חומרי הגלם.</div>';
  host.querySelectorAll("[data-up]").forEach(button => button.addEventListener("click", () => moveClip(Number(button.dataset.up),-1)));
  host.querySelectorAll("[data-down]").forEach(button => button.addEventListener("click", () => moveClip(Number(button.dataset.down),1)));
  host.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => { timelineClips.splice(Number(button.dataset.remove),1); renderTimeline(); }));
  host.querySelectorAll("[data-start]").forEach(input => input.addEventListener("change", () => { timelineClips[Number(input.dataset.start)].start_seconds = Math.max(0,Number(input.value)||0); }));
  host.querySelectorAll("[data-end]").forEach(input => input.addEventListener("change", () => { const value=input.value.trim(); timelineClips[Number(input.dataset.end)].end_seconds=value===""?null:Math.max(0,Number(value)||0); }));
  document.getElementById("render-timeline-btn").disabled = timelineClips.length === 0;
}
function moveClip(index,delta) {
  const next=index+delta;
  if (next<0 || next>=timelineClips.length) return;
  [timelineClips[index],timelineClips[next]]=[timelineClips[next],timelineClips[index]];
  renderTimeline();
}
function populateAudioTracks() {
  const audio = projectAssets.filter(asset => /\.(wav|mp3|m4a|aac)$/i.test(asset.filename));
  for (const [id,label] of [["voiceover-track","ללא קריינות"],["music-track","ללא מוזיקה"]]) {
    const select=document.getElementById(id), previous=select.value;
    select.innerHTML='<option value="">' + label + '</option>' + audio.map(asset=>'<option value="' + escapeHtml(asset.id) + '">' + escapeHtml(asset.filename) + '</option>').join("");
    if (audio.some(asset=>asset.id===previous)) select.value=previous;
  }
}
document.getElementById("render-timeline-btn").addEventListener("click", async () => {
  if (!activeProjectId || !timelineClips.length) return;
  const button=document.getElementById("render-timeline-btn"), result=document.getElementById("render-result");
  button.disabled=true; button.textContent="מייצא…";
  result.textContent="מייצר את הסרט לפי ציר העריכה. זה עשוי לקחת כמה דקות.";
  const payload={
    clips:timelineClips,
    voiceover_asset_id:document.getElementById("voiceover-track").value || null,
    music_asset_id:document.getElementById("music-track").value || null,
    music_volume:Number(document.getElementById("music-volume").value)
  };
  try {
    const render=await api("/api/projects/"+encodeURIComponent(activeProjectId)+"/render",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    result.innerHTML='<a class="render-download" href="' + escapeHtml(render.download_url) + '" download>הורדת הסרט המיוצא ←</a><span class="render-meta"> · ' + Math.round(render.duration_seconds) + ' שניות</span>';
    toast("הייצוא הושלם");
  } catch(error) { result.textContent=error.message; toast(error.message); }
  finally { button.textContent="ייצוא הסרט"; button.disabled=timelineClips.length===0; }
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

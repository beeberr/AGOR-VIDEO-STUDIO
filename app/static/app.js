const grid = document.getElementById("projects-grid");
const projectDialog = document.getElementById("project-dialog");
const detailDialog = document.getElementById("detail-dialog");
const toastEl = document.getElementById("toast");
let activeProjectId = null;
let projectAssets = [];
let timelineClips = [];
let toastTimer;
let editSaveTimer;

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
    const renderReady = health.ffmpeg?.available && health.ffmpeg?.ffprobe_available;
    const renderStatus = renderReady ? "מנוע העריכה FFmpeg מוכן (" + escapeHtml(health.ffmpeg.version) + ")." : "FFmpeg או FFprobe לא זמינים — לא ניתן לייצא עד להתקנת מנוע העריכה.";
    document.getElementById("engine-detail").textContent = (connected ? "ComfyUI מחובר." : "ComfyUI עדיין לא מחובר.") + " " + renderStatus;
    document.getElementById("ffmpeg-status").textContent = renderReady ? "מוכן · " + health.ffmpeg.version : "לא זמין";
    document.getElementById("ffmpeg-dot").classList.toggle("ok", Boolean(renderReady));
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
    if (activeProjectId && activeProjectId !== projectId) {
      clearTimeout(editSaveTimer);
      await saveProjectEdit();
    }
    const project = await api("/api/projects/" + encodeURIComponent(projectId));
    const edit = await api("/api/projects/" + encodeURIComponent(projectId) + "/edit");
    activeProjectId = project.id;
    document.getElementById("detail-title").textContent = project.title;
    document.getElementById("detail-brief").textContent = project.brief || "לא הוגדר בריף.";
    timelineClips = edit.clips || [];
    renderAssets(project.assets || []);
    document.getElementById("voiceover-track").value = edit.voiceover_asset_id || "";
    document.getElementById("music-track").value = edit.music_asset_id || "";
    document.getElementById("music-volume").value = edit.music_volume ?? 0.18;
    document.getElementById("edit-save-status").textContent = edit.updated_at ? "העריכה נשמרה " + shortDate(edit.updated_at) : "העריכה נשמרת אוטומטית לכל פרויקט.";
    detailDialog.showModal();
  } catch (error) { toast(error.message); }
}
function renderAssets(assets) {
  projectAssets = assets;
  const list = document.getElementById("asset-list");
  list.innerHTML = assets.length ? assets.map(asset => {
    const isVideo = /\.(mp4|mov|m4v|webm|avi)$/i.test(asset.filename);
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(asset.filename);
    const isAudio = /\.(wav|mp3|m4a|aac)$/i.test(asset.filename);
    const action = isVideo
      ? '<button class="asset-add-btn" type="button" data-add-clip="' + escapeHtml(asset.id) + '">＋ לציר העריכה</button><button class="asset-add-btn storyboard-trigger" type="button" data-storyboard="' + escapeHtml(asset.id) + '">▦ לוח תמונות</button>'
      : isImage ? '<button class="asset-add-btn" type="button" data-add-clip="' + escapeHtml(asset.id) + '">＋ לציר העריכה</button>' : '';
    return '<div class="asset-row"><span>▧ ' + escapeHtml(asset.filename) + '</span><div class="asset-actions"><small>' + (asset.size_bytes / 1024 / 1024).toFixed(1) + ' MB</small>' + action + '</div></div>';
  }).join("") : '<div class="asset-row"><span>עדיין לא הועלו חומרי גלם</span><small>0 קבצים</small></div>';
  list.querySelectorAll("[data-add-clip]").forEach(button => button.addEventListener("click", () => addClip(button.dataset.addClip)));
  list.querySelectorAll("[data-storyboard]").forEach(button => button.addEventListener("click", () => generateStoryboard(button.dataset.storyboard, button)));
  populateAudioTracks();
  renderTimeline();
}
async function generateStoryboard(assetId, triggerButton) {
  const panel = document.getElementById("storyboard-panel");
  const status = document.getElementById("storyboard-status");
  const grid = document.getElementById("storyboard-grid");
  const meta = document.getElementById("storyboard-meta");
  const interval = Number(document.getElementById("storyboard-interval")?.value || 10);
  panel.hidden = false;
  grid.innerHTML = "";
  status.textContent = "מנתח את הסרטון ומחלץ תמונות מייצגות…";
  meta.textContent = "הפעולה עשויה לקחת מעט זמן בהתאם לאורך הסרטון.";
  if (triggerButton) { triggerButton.disabled = true; triggerButton.textContent = "מכין לוח…"; }
  try {
    const result = await api("/api/projects/" + encodeURIComponent(activeProjectId) + "/assets/" + encodeURIComponent(assetId) + "/storyboard?interval_seconds=" + interval);
    const formatTime = seconds => {
      const total = Math.floor(seconds);
      return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
    };
    grid.innerHTML = result.frames.map((frame, index) =>
      '<figure class="storyboard-frame"><img loading="lazy" src="' + escapeHtml(frame.url) + '" alt="פריים ' + (index + 1) + ' מתוך הסרטון בזמן ' + formatTime(frame.time_seconds) + '"><figcaption><strong>' + formatTime(frame.time_seconds) + '</strong><span>פריים ' + (index + 1) + '</span></figcaption></figure>'
    ).join("");
    const duration = formatTime(result.duration_seconds);
    meta.textContent = result.frame_count + " תמונות · אורך הסרטון " + duration + " · מרווח " + result.interval_seconds + " שניות";
    status.textContent = "הושלם. אפשר לעבור על כל התמונות ולזהות את הרגעים החשובים.";
    panel.scrollIntoView({behavior:"smooth", block:"start"});
  } catch (error) {
    status.textContent = error.message;
    toast(error.message);
  } finally {
    if (triggerButton) { triggerButton.disabled = false; triggerButton.textContent = "▦ לוח תמונות"; }
  }
}
function addClip(assetId) {
  timelineClips.push({asset_id:assetId,start_seconds:0,end_seconds:null,image_duration_seconds:5});
  renderTimeline();
  scheduleEditSave();
}
function renderTimeline() {
  const host = document.getElementById("timeline-list");
  host.innerHTML = timelineClips.length ? timelineClips.map((clip,index) => {
    const asset = projectAssets.find(item => item.id === clip.asset_id);
    if (!asset) return "";
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(asset.filename);
    const timing = isImage
      ? '<div class="trim-fields"><label>משך התמונה (שניות)<input type="number" min="0.5" max="60" step="0.5" value="' + (clip.image_duration_seconds ?? 5) + '" data-image-duration="' + index + '"></label></div>'
      : '<div class="trim-fields"><label>התחלה (שניות)<input type="number" min="0" step="0.1" value="' + clip.start_seconds + '" data-start="' + index + '"></label><label>סיום (ריק = סוף הקובץ)<input type="number" min="0.1" step="0.1" value="' + (clip.end_seconds ?? "") + '" data-end="' + index + '"></label></div>';
    return '<article class="timeline-clip" data-clip-index="' + index + '"><div class="timeline-clip-head"><strong>' + (index+1) + '. ' + (isImage?'תמונה · ':'') + escapeHtml(asset.filename) + '</strong><div class="timeline-controls"><button type="button" data-up="' + index + '" aria-label="הזז למעלה" ' + (index===0?'disabled':'') + '>↑</button><button type="button" data-down="' + index + '" aria-label="הזז למטה" ' + (index===timelineClips.length-1?'disabled':'') + '>↓</button><button type="button" data-remove="' + index + '" aria-label="הסר">×</button></div></div>' + timing + '</article>';
  }).join("") : '<div class="timeline-empty">עדיין לא נוספו קטעים לציר העריכה. לחץ על „לציר העריכה” ליד סרטון בספריית חומרי הגלם.</div>';
  host.querySelectorAll("[data-up]").forEach(button => button.addEventListener("click", () => moveClip(Number(button.dataset.up),-1)));
  host.querySelectorAll("[data-down]").forEach(button => button.addEventListener("click", () => moveClip(Number(button.dataset.down),1)));
  host.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => { timelineClips.splice(Number(button.dataset.remove),1); renderTimeline(); scheduleEditSave(); }));
  host.querySelectorAll("[data-start]").forEach(input => input.addEventListener("change", () => { timelineClips[Number(input.dataset.start)].start_seconds = Math.max(0,Number(input.value)||0); scheduleEditSave(); }));
  host.querySelectorAll("[data-end]").forEach(input => input.addEventListener("change", () => { const value=input.value.trim(); timelineClips[Number(input.dataset.end)].end_seconds=value===""?null:Math.max(0,Number(value)||0); scheduleEditSave(); }));
  host.querySelectorAll("[data-image-duration]").forEach(input => input.addEventListener("change", () => { timelineClips[Number(input.dataset.imageDuration)].image_duration_seconds = Math.min(60,Math.max(0.5,Number(input.value)||5)); input.value=timelineClips[Number(input.dataset.imageDuration)].image_duration_seconds; scheduleEditSave(); }));
  document.getElementById("render-timeline-btn").disabled = timelineClips.length === 0;
}
function moveClip(index,delta) {
  const next=index+delta;
  if (next<0 || next>=timelineClips.length) return;
  [timelineClips[index],timelineClips[next]]=[timelineClips[next],timelineClips[index]];
  renderTimeline();
  scheduleEditSave();
}
function currentEdit() {
  return {
    clips:timelineClips,
    voiceover_asset_id:document.getElementById("voiceover-track").value || null,
    music_asset_id:document.getElementById("music-track").value || null,
    music_volume:Number(document.getElementById("music-volume").value)
  };
}
async function saveProjectEdit() {
  if (!activeProjectId) return;
  const saved = await api("/api/projects/" + encodeURIComponent(activeProjectId) + "/edit", {
    method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(currentEdit())
  });
  document.getElementById("edit-save-status").textContent = "העריכה נשמרה " + shortDate(saved.updated_at);
}
function scheduleEditSave() {
  if (!activeProjectId) return;
  document.getElementById("edit-save-status").textContent = "שומר שינויים…";
  clearTimeout(editSaveTimer);
  editSaveTimer = setTimeout(() => saveProjectEdit().catch(error => {
    document.getElementById("edit-save-status").textContent = "השמירה נכשלה: " + error.message;
  }), 450);
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
    clearTimeout(editSaveTimer);
    await saveProjectEdit();
    const render=await api("/api/projects/"+encodeURIComponent(activeProjectId)+"/render",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    result.innerHTML='<a class="render-download" href="' + escapeHtml(render.download_url) + '" download>הורדת הסרט המיוצא ←</a><span class="render-meta"> · ' + Math.round(render.duration_seconds) + ' שניות</span>';
    toast("הייצוא הושלם");
  } catch(error) { result.textContent=error.message; toast(error.message); }
  finally { button.textContent="ייצוא הסרט"; button.disabled=timelineClips.length===0; }
});
document.getElementById("voiceover-track").addEventListener("change", scheduleEditSave);
document.getElementById("music-track").addEventListener("change", scheduleEditSave);
document.getElementById("music-volume").addEventListener("input", scheduleEditSave);
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
document.getElementById("close-detail").addEventListener("click", () => {
  clearTimeout(editSaveTimer);
  saveProjectEdit().catch(error => { document.getElementById("edit-save-status").textContent = "השמירה נכשלה: " + error.message; });
  detailDialog.close();
});
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

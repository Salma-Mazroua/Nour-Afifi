// ---------- CONFIG ----------
// SHA-256 hash of the admin password. Default password is: admin123  (CHANGE IT, see README below)
const ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
const KEY = "portfolio-nour-v1";

const SKILLS = ["SolidWorks","MS Word","Excel","PowerPoint","Programming (basics)","Front-End Web","Back-End Web","English (fluent)","Arabic (native)"];

// Default content everyone sees. Paste the output of "Copy data" here to make your edits permanent for all visitors.
const DEFAULT = {
  exp: [
    {id:1,title:"Owner / Manager",org:"Coffee Shop",date:"Winter 2026",desc:"Ran daily operations: inventory, customer service, suppliers, budgeting, cash flow, and staff coordination."},
    {id:2,title:"Intern",org:"Ezz Steel, Sadat",date:"Summer 2025",desc:"Helped monitor and improve production processes, joined maintenance planning, quality control and safety activities, and worked with engineers to reduce downtime."},
    {id:3,title:"Real Estate Sales Agent (Remote, U.S. Market)",org:"Skyline BPO",date:"Summer 2025",desc:"Communicated with U.S. clients, matched them with suitable properties, and supported deal negotiations with organized follow-ups."}
  ],
  certs: [
    {id:1,title:"Six Sigma Green Belt",org:"Certification",date:""},
    {id:2,title:"YAT Professional Diploma, Web Development",org:"YAT",date:"2021"},
    {id:3,title:"YAT Professional Diploma, Web Design",org:"YAT",date:"2020"},
    {id:4,title:"1st Place, Software Division",org:"African Forum for Innovation and Technology, UAE",date:"Fall 2022"},
    {id:5,title:"Software Ownership",org:"ITIDA, Egypt",date:"Fall 2022"},
    {id:6,title:"Science and Engineering Fair (ISEF)",org:"ISEF",date:"Summer 2022"}
  ]
};

// ---------- DATA ----------
let data;
try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
if (!data || !data.exp || !data.certs) data = JSON.parse(JSON.stringify(DEFAULT));
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

const esc = s => String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const FIELDS = {
  exp:   [["title","Title"],["org","Company"],["date","When (e.g. Summer 2025)"],["desc","What you did","area"]],
  certs: [["title","Title"],["org","Issuer"],["date","Year / date"]]
};

// ---------- RENDER ----------
function render() {
  document.getElementById("skillList").innerHTML = SKILLS.map(s => '<span class="tag">' + esc(s) + '</span>').join("");
  for (const k of ["exp","certs"]) {
    document.getElementById(k + "List").innerHTML = data[k].map(i =>
      '<div class="card"><h3>' + esc(i.title) + '</h3>' +
      '<div class="meta">' + esc(i.org) + (i.org && i.date ? " · " : "") + esc(i.date) + '</div>' +
      (i.desc ? '<p style="margin:6px 0 0">' + esc(i.desc) + '</p>' : '') +
      '<div class="tools"><button class="btn" data-edit="' + k + ':' + i.id + '">Edit</button>' +
      '<button class="btn" data-del="' + k + ':' + i.id + '">🗑</button></div></div>'
    ).join("") || '<p class="meta">Nothing here yet.</p>';
  }
}

// ---------- ADMIN LOGIN ----------
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
const setAdmin = on => {
  document.body.classList.toggle("editing", on);
  try { on ? sessionStorage.setItem("admin", "1") : sessionStorage.removeItem("admin"); } catch (e) {}
};
const loginDlg = document.getElementById("login");
document.getElementById("lock").onclick = () => { document.getElementById("pw").value = ""; document.getElementById("err").textContent = ""; loginDlg.showModal(); };
document.getElementById("loginCancel").onclick = () => loginDlg.close();
async function tryLogin() {
  const h = await sha256(document.getElementById("pw").value);
  if (h === ADMIN_HASH) { setAdmin(true); loginDlg.close(); }
  else document.getElementById("err").textContent = "Wrong password";
}
document.getElementById("loginOk").onclick = tryLogin;
document.getElementById("pw").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
document.getElementById("logout").onclick = () => setAdmin(false);
document.getElementById("copy").onclick = async function () {
  try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); this.textContent = "✅ Copied"; }
  catch (e) { prompt("Copy this:", JSON.stringify(data)); }
  setTimeout(() => this.textContent = "📋 Copy data", 1500);
};
try { if (sessionStorage.getItem("admin")) setAdmin(true); } catch (e) {}

// ---------- ADD / EDIT / DELETE ----------
const dlg = document.getElementById("dlg");
let cur = null;
function openDlg(k, item) {
  if (!document.body.classList.contains("editing")) return;
  cur = { k, id: item ? item.id : null };
  document.getElementById("dTitle").textContent = (item ? "Edit " : "Add ") + (k === "exp" ? "experience" : "certification");
  document.getElementById("fields").innerHTML = FIELDS[k].map(([f, l, t]) =>
    '<label>' + l + (t ? '<textarea rows="4" data-f="' + f + '">' + esc(item ? item[f] : "") + '</textarea>'
                       : '<input data-f="' + f + '" value="' + esc(item ? item[f] : "") + '">') + '</label>'
  ).join("");
  dlg.showModal();
}
document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (!document.body.classList.contains("editing")) return;
  if (t.dataset.add) openDlg(t.dataset.add, null);
  if (t.dataset.edit) { const [k, id] = t.dataset.edit.split(":"); openDlg(k, data[k].find(i => i.id == id)); }
  if (t.dataset.del) {
    const [k, id] = t.dataset.del.split(":");
    if (confirm("Delete this item?")) { data[k] = data[k].filter(i => i.id != id); persist(); render(); }
  }
});
document.getElementById("cancel").onclick = () => dlg.close();
document.getElementById("save").onclick = () => {
  const obj = {};
  document.querySelectorAll("#fields [data-f]").forEach(el => obj[el.dataset.f] = el.value.trim());
  if (!obj.title) return;
  if (cur.id) Object.assign(data[cur.k].find(x => x.id == cur.id), obj);
  else { obj.id = Date.now(); data[cur.k].push(obj); }
  persist(); render(); dlg.close();
};

render();

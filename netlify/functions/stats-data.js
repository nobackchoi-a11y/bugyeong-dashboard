const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

function json(obj, statusCode = 200) {
  return { statusCode, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify(obj) };
}

async function sf(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("SUPABASE_URL 또는 SUPABASE_ANON_KEY가 없습니다.");
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

function dateOnly(s) { return String(s || "").slice(0,10); }
function startIso(d) { return `${dateOnly(d)}T00:00:00.000+09:00`; }
function endIso(d) { return `${dateOnly(d)}T23:59:59.999+09:00`; }
function today() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,"0");
  const d = String(now.getDate()).padStart(2,"0");
  return { start:`${y}-${m}-01`, end:`${y}-${m}-${d}` };
}
async function fetchEvents(start, end) {
  const cols = "id,emp_no,user_name,branch,role,event_type,page,activity_menu,target_type,target_code,target_name,action_detail,created_at";
  const all = [];
  const size = 1000;
  const fromDate = encodeURIComponent(startIso(start));
  const toDate = encodeURIComponent(endIso(end));
  for (let from = 0; ; from += size) {
    const to = from + size - 1;
    const rows = await sf(`/rest/v1/app_events?select=${cols}&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`, {
      method:"GET",
      headers:{ Range:`${from}-${to}` }
    });
    const arr = Array.isArray(rows) ? rows : [];
    all.push(...arr);
    if (arr.length < size) break;
    if (all.length > 100000) break;
  }
  return all;
}
function ymd(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}
function groupCount(rows, fn) {
  const m = new Map();
  rows.forEach(r => {
    const k = fn(r) || "미지정";
    m.set(k, (m.get(k) || 0) + 1);
  });
  return [...m.entries()].map(([name,count]) => ({name,count})).sort((a,b)=>b.count-a.count || String(a.name).localeCompare(String(b.name),"ko"));
}
function filterDetail(rows, mode, value) {
  if (!mode || !value) return rows.slice(0,300);
  if (mode === "login") return rows.filter(r => r.event_type === "login");
  if (mode === "view") return rows.filter(r => ["page_view","detail_view","fc_view","agency_view","manager_view"].includes(r.event_type));
  if (mode === "image") return rows.filter(r => ["image_copy","image_save","pdf_save"].includes(r.event_type));
  if (mode === "event_type") return rows.filter(r => (r.event_type || "미지정") === value);
  if (mode === "page") return rows.filter(r => (r.page || "미지정") === value);
  if (mode === "activity_menu") return rows.filter(r => (r.activity_menu || "미지정") === value);
  if (mode === "user") return rows.filter(r => `${r.user_name || ""} ${r.emp_no || ""}`.trim() === value);
  if (mode === "branch") return rows.filter(r => (r.branch || "미지정") === value);
  if (mode === "role") return rows.filter(r => (r.role || "미지정") === value);
  if (mode === "target") return rows.filter(r => `${r.target_name || ""} ${r.target_code || ""}`.trim() === value);
  return rows.slice(0,300);
}

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "GET") return json({ error:"Method not allowed" }, 405);
    const qs = event.queryStringParameters || {};
    const def = today();
    const start = qs.start || def.start;
    const end = qs.end || def.end;
    const rows = await fetchEvents(start, end);

    const viewRows = rows.filter(r => ["page_view","detail_view","fc_view","agency_view","manager_view"].includes(r.event_type));
    const imageRows = rows.filter(r => ["image_copy","image_save","pdf_save"].includes(r.event_type));
    const cards = [
      {key:"login", label:"로그인", value:rows.filter(r=>r.event_type==="login").length, detailMode:"login", detailValue:"login"},
      {key:"users", label:"접속자", value:new Set(rows.filter(r=>r.emp_no).map(r=>r.emp_no)).size, detailMode:"event_type", detailValue:"login"},
      {key:"view", label:"화면/상세 조회", value:viewRows.length, detailMode:"view", detailValue:"view"},
      {key:"fc_view", label:"FC 조회", value:rows.filter(r=>r.event_type==="fc_view").length, detailMode:"event_type", detailValue:"fc_view"},
      {key:"agency_view", label:"대리점 조회", value:rows.filter(r=>r.event_type==="agency_view").length, detailMode:"event_type", detailValue:"agency_view"},
      {key:"manager_view", label:"매니저 조회", value:rows.filter(r=>r.event_type==="manager_view").length, detailMode:"event_type", detailValue:"manager_view"},
      {key:"image", label:"이미지/PDF 활용", value:imageRows.length, detailMode:"image", detailValue:"image"},
      {key:"kakao", label:"카톡 공유", value:rows.filter(r=>r.event_type==="kakao_share").length, detailMode:"event_type", detailValue:"kakao_share"},
      {key:"campaign", label:"활동메뉴 기록", value:rows.filter(r=>r.activity_menu).length, detailMode:"activity_menu", detailValue:"가전페스타"}
    ];
    return json({
      start,end,total:rows.length,cards,
      byDate: groupCount(rows, r=>ymd(r.created_at)).sort((a,b)=>a.name.localeCompare(b.name)),
      byUser: groupCount(rows, r=>`${r.user_name || ""} ${r.emp_no || ""}`.trim()).slice(0,100),
      byBranch: groupCount(rows, r=>r.branch || "미지정").slice(0,100),
      byRole: groupCount(rows, r=>r.role || "미지정").slice(0,100),
      byPage: groupCount(rows, r=>r.page || "미지정").slice(0,100),
      byEvent: groupCount(rows, r=>r.event_type || "미지정").slice(0,100),
      byActivityMenu: groupCount(rows, r=>r.activity_menu || "미지정").slice(0,100),
      byTarget: groupCount(rows.filter(r=>r.target_name || r.target_code), r=>`${r.target_name || ""} ${r.target_code || ""}`.trim()).slice(0,100),
      recent: rows.slice(0,200),
      detail: filterDetail(rows, qs.mode, qs.value).slice(0,1000)
    });
  } catch(e) {
    console.error("stats-data error:", e.message);
    return json({ error:e.message }, 500);
  }
};

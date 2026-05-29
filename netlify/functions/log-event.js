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

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") return json({ ok:false, error:"Method not allowed" }, 405);
    const body = JSON.parse(event.body || "{}");
    const row = {
      emp_no: String(body.emp_no || body.empNo || "").trim(),
      user_name: body.user_name || body.userName || "",
      branch: body.branch || "",
      role: body.role || "",
      event_type: body.event_type || body.eventType || "unknown",
      page: body.page || "unknown",
      activity_menu: body.activity_menu || body.activityMenu || "",
      target_type: body.target_type || body.targetType || "",
      target_code: body.target_code || body.targetCode || "",
      target_name: body.target_name || body.targetName || "",
      action_detail: typeof body.action_detail === "string" ? body.action_detail : JSON.stringify(body.action_detail || body.actionDetail || {}),
      user_agent: event.headers["user-agent"] || event.headers["User-Agent"] || ""
    };

    await sf("/rest/v1/app_events", {
      method: "POST",
      body: JSON.stringify(row),
      headers: { Prefer: "return=minimal" }
    });

    return json({ ok:true });
  } catch(e) {
    console.error("log-event error:", e.message);
    return json({ ok:false, error:e.message }, 500);
  }
};

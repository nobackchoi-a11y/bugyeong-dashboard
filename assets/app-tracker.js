// 부경사업단 업무앱 활동로그 수집기 V1
// 각 화면 하단 </body> 직전에 아래 한 줄 추가:
// <script src="/assets/app-tracker.js"></script>

(function(){
  const LOGIN_KEY = "bugyeong_app_emp_no";

  const PAGE_NAME = (() => {
    const p = location.pathname;
    if (p.includes("fc")) return "fc_dashboard";
    if (p.includes("manager")) return "branch_manager_dashboard";
    if (p.includes("agency")) return "agency_dashboard";
    if (p.includes("stats")) return "stats_dashboard";
    if (p.includes("admin")) return "admin";
    return "home";
  })();

  function empNo(){
    return localStorage.getItem(LOGIN_KEY) || "";
  }

  function safeText(el){
    if(!el) return "";
    return (el.innerText || el.textContent || "").replace(/\s+/g," ").trim().slice(0,200);
  }

  function pageTitle(){
    const h1 = document.querySelector("h1");
    return safeText(h1) || document.title || PAGE_NAME;
  }

  function inferActivityMenu(text){
    const menus = [
      "가전페스타","브릿지","브릿지 전반","브릿지 후반","첫가동",
      "그린플래티넘","플래티넘","20만가동","20만가동근접",
      "5만가동","10만가동","50만지사","드림빅"
    ];
    for(const m of menus){
      if(String(text||"").includes(m)) return m;
    }
    return "";
  }

  function closestTarget(el){
    const row = el.closest("tr");
    const card = el.closest(".card,.fc-card,.agency-card,.detail-card,[data-target-name],[data-fc-name],[data-agency-name]");
    const targetEl = row || card || el;

    const ds = targetEl.dataset || {};
    const text = safeText(targetEl);
    const targetName = ds.targetName || ds.fcName || ds.agencyName || ds.managerName || text.split(" ").slice(0,4).join(" ");
    const targetCode = ds.targetCode || ds.fcCode || ds.agencyCode || ds.managerCode || "";
    let targetType = ds.targetType || "";

    if(!targetType){
      if(PAGE_NAME.includes("fc")) targetType = "FC";
      else if(PAGE_NAME.includes("agency")) targetType = "agency";
      else if(PAGE_NAME.includes("manager")) targetType = "manager";
      else targetType = "";
    }

    return {
      target_type: targetType,
      target_code: targetCode,
      target_name: targetName,
      activity_menu: inferActivityMenu(text)
    };
  }

  function logEvent(payload){
    try{
      const body = Object.assign({
        emp_no: empNo(),
        page: PAGE_NAME,
        action_detail: {
          path: location.pathname,
          title: pageTitle()
        }
      }, payload || {});

      const json = JSON.stringify(body);
      if(navigator.sendBeacon){
        navigator.sendBeacon("/.netlify/functions/log-event", new Blob([json],{type:"application/json"}));
      }else{
        fetch("/.netlify/functions/log-event",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:json,
          keepalive:true
        }).catch(()=>{});
      }
    }catch(e){}
  }

  window.BUGYEONG_LOG_EVENT = logEvent;

  // 1. 화면 조회
  document.addEventListener("DOMContentLoaded", () => {
    logEvent({
      event_type:"page_view",
      target_type:"page",
      target_name:pageTitle()
    });
  });

  // 2. 버튼 클릭 로그
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button,a,[role='button']");
    if(!el) return;

    const text = safeText(el);
    const target = closestTarget(el);
    let eventType = "";

    if(text.includes("이미지로 복사") || text.includes("이미지 복사") || text.includes("복사")){
      eventType = "image_copy";
    }else if(text.includes("이미지 저장")){
      eventType = "image_save";
    }else if(text.includes("PDF") || text.includes("pdf")){
      eventType = "pdf_save";
    }else if(text.includes("카톡") || text.includes("카카오")){
      eventType = "kakao_share";
    }else if(text.includes("상세") || text.includes("조회")){
      eventType = PAGE_NAME.includes("fc") ? "fc_view" : PAGE_NAME.includes("agency") ? "agency_view" : "detail_view";
    }

    if(eventType){
      logEvent(Object.assign({
        event_type:eventType,
        action_detail:{button:text, path:location.pathname}
      }, target));
    }
  }, true);

  // 3. 필터 변경 로그
  let filterTimer = null;
  document.addEventListener("change", (e) => {
    const el = e.target;
    if(!el || !["SELECT","INPUT"].includes(el.tagName)) return;
    const name = el.name || el.id || el.getAttribute("aria-label") || "filter";
    const value = el.value || "";
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
      logEvent({
        event_type:"filter_use",
        target_type:"filter",
        target_name:name,
        action_detail:{name,value,path:location.pathname}
      });
    }, 250);
  }, true);

  // 4. 검색 입력 로그
  let searchTimer = null;
  document.addEventListener("input", (e) => {
    const el = e.target;
    if(!el || el.tagName !== "INPUT") return;
    const ph = el.placeholder || "";
    const id = el.id || "";
    const isSearch = ph.includes("검색") || id.toLowerCase().includes("search");
    if(!isSearch) return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if((el.value || "").trim().length >= 2){
        logEvent({
          event_type:"search",
          target_type:"search",
          target_name:ph || id || "검색",
          action_detail:{keyword:el.value,path:location.pathname}
        });
      }
    }, 700);
  }, true);

  // 5. 수동 로그용 헬퍼
  window.logFcView = function(fcCode, fcName, activityMenu){
    logEvent({event_type:"fc_view",target_type:"FC",target_code:fcCode||"",target_name:fcName||"",activity_menu:activityMenu||""});
  };
  window.logAgencyView = function(agencyCode, agencyName){
    logEvent({event_type:"agency_view",target_type:"agency",target_code:agencyCode||"",target_name:agencyName||""});
  };
  window.logImageCopy = function(targetType, targetCode, targetName, activityMenu){
    logEvent({event_type:"image_copy",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  };
  window.logKakaoShare = function(targetType, targetCode, targetName, activityMenu){
    logEvent({event_type:"kakao_share",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  };
})();

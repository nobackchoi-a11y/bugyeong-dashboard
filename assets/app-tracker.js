// 부경사업단 업무앱 활동로그 수집기 V2
(function(){
  const LOGIN_KEY="bugyeong_app_emp_no";
  const USER_MASTER=[
    {empNo:"11501159",name:"최현수",branch:"사업단",role:"admin",title:"지원팀장"},
    {empNo:"10304560",name:"김경모",branch:"사업단",role:"director",title:"사업단장"},
    {empNo:"12000284",name:"서영진",branch:"부경부경지점",role:"branch",title:"지점장"},
    {empNo:"12500001",name:"이정민",branch:"부경연산지점",role:"branch",title:"지점장"},
    {empNo:"11500436",name:"양용호",branch:"부경영남지점",role:"branch",title:"지점장"},
    {empNo:"12400086",name:"강문수",branch:"부경중앙지점",role:"branch",title:"지점장"},
    {empNo:"12500050",name:"전정식",branch:"부경신부산지점",role:"branch",title:"지점장"},
    {empNo:"10621120",name:"김동훈",branch:"부경부일지점",role:"branch",title:"지점장"},
    {empNo:"19359590",name:"신미영",branch:"부경서부산지점",role:"branch",title:"지점장"},
    {empNo:"12300273",name:"이중무",branch:"부경부울지점",role:"branch",title:"지점장"},
    {empNo:"16084059",name:"김호진",branch:"부경울산제일지점",role:"branch",title:"지점장"},
    {empNo:"23063514",name:"성경희",branch:"부경서부산지점",role:"senior",title:"수석매니저"},
    {empNo:"23038568",name:"서민수",branch:"부경울산제일지점",role:"senior",title:"수석매니저"},
    {empNo:"22174999",name:"이금숙",branch:"부경부일지점",role:"senior",title:"수석매니저"},
    {empNo:"23068694",name:"강민아",branch:"부경연산지점",role:"senior",title:"수석매니저"},
    {empNo:"22158425",name:"김정희",branch:"부경부경지점",role:"senior",title:"수석매니저"},
    {empNo:"23039272",name:"이선화",branch:"부경부울지점",role:"senior",title:"수석매니저"},
    {empNo:"23070176",name:"김서원",branch:"부경신부산지점",role:"senior",title:"수석매니저"},
    {empNo:"23074724",name:"김우영",branch:"부경중앙지점",role:"senior",title:"수석매니저"},
    {empNo:"22194688",name:"박현주",branch:"부경영남지점",role:"senior",title:"수석매니저"},
    {empNo:"23033759",name:"설혜린",branch:"부경영남지점",role:"senior",title:"수석매니저"}
  ];

  function getEmpNo(){return localStorage.getItem(LOGIN_KEY)||""}
  function getUser(){
    const empNo=getEmpNo();
    const found=USER_MASTER.find(u=>u.empNo===empNo);
    if(found) return found;
    if(empNo.startsWith("2")) return {empNo,name:"",branch:"",role:"manager",title:"전문매니저"};
    if(empNo.startsWith("1")) return {empNo,name:"",branch:"",role:"branch",title:"지점장"};
    return {empNo,name:"",branch:"",role:"user",title:"사용자"};
  }
  const PAGE_NAME=(()=>{
    const p=location.pathname.toLowerCase();
    if(p.includes("fc")) return "fc_dashboard";
    if(p.includes("manager")) return "branch_manager_dashboard";
    if(p.includes("agency")) return "agency_dashboard";
    if(p.includes("stats")) return "stats_dashboard";
    if(p.includes("admin")) return "admin";
    return "home";
  })();

  function safeText(el){
    if(!el) return "";
    return (el.innerText||el.textContent||"").replace(/\s+/g," ").replace(/[\u200B-\u200D\uFEFF]/g,"").trim().slice(0,300);
  }
  function escMeta(v){return String(v||"").trim().slice(0,200)}
  function pageTitle(){return safeText(document.querySelector("h1"))||safeText(document.querySelector(".brand"))||document.title||PAGE_NAME}
  function inferActivityMenu(text){
    const t=String(text||"");
    const menus=["가전페스타","가전 페스타","브릿지(전반)","브릿지 전반","브릿지(후반)","브릿지 후반","첫가동","그린플래티넘","플래티넘","드림빅","20만가동근접","20만가동","10만가동","5만가동","50만지사","연속가동대상","미가동"];
    for(const m of menus){if(t.includes(m)) return m.replace("가전 페스타","가전페스타")}
    return "";
  }
  function parseLikelyCode(text){
    const m=String(text||"").match(/\b(4\d{6,9}|\d{6,10})\b/);
    return m?m[1]:"";
  }
  function parseLikelyNameFromRow(row){
    if(!row) return "";
    const cells=Array.from(row.querySelectorAll("td,th")).map(safeText).filter(Boolean);
    const c=cells.filter(x=>!/^\d+$/.test(x)&&!/^-?[\d,]+(\.\d+)?$/.test(x)&&!x.includes("원")&&x.length<=40);
    return c[0]||cells[0]||safeText(row).split(" ").slice(0,4).join(" ");
  }
  function inferTargetType(){
    if(PAGE_NAME.includes("fc")) return "FC";
    if(PAGE_NAME.includes("agency")) return "agency";
    if(PAGE_NAME.includes("manager")) return "manager";
    return "";
  }
  function closestTarget(el){
    const explicit=el.closest("[data-target-name],[data-fc-name],[data-agency-name],[data-manager-name],[data-fc-code],[data-agency-code],[data-manager-code]");
    const row=el.closest("tr");
    const card=el.closest(".card,.fc-card,.agency-card,.detail-card,.panel,.modal,.detail,[data-card]");
    const targetEl=explicit||row||card||el;
    const ds=targetEl.dataset||{};
    const text=safeText(targetEl);
    let targetType=ds.targetType||ds.type||"";
    let targetCode=ds.targetCode||ds.fcCode||ds.agencyCode||ds.managerCode||"";
    let targetName=ds.targetName||ds.fcName||ds.agencyName||ds.managerName||"";
    if(!targetType) targetType=inferTargetType();
    if(!targetCode) targetCode=parseLikelyCode(text);
    if(!targetName) targetName=row?parseLikelyNameFromRow(row):text.split(" ").slice(0,5).join(" ");
    return {target_type:escMeta(targetType),target_code:escMeta(targetCode),target_name:escMeta(targetName),activity_menu:escMeta(ds.activityMenu||inferActivityMenu(text))};
  }
  function logEvent(payload){
    try{
      const user=getUser();
      const body=Object.assign({
        emp_no:user.empNo||"",user_name:user.name||"",branch:user.branch||"",role:user.role||"",
        page:PAGE_NAME,action_detail:{path:location.pathname,title:pageTitle()}
      },payload||{});
      const json=JSON.stringify(body);
      if(navigator.sendBeacon) navigator.sendBeacon("/.netlify/functions/log-event",new Blob([json],{type:"application/json"}));
      else fetch("/.netlify/functions/log-event",{method:"POST",headers:{"Content-Type":"application/json"},body:json,keepalive:true}).catch(()=>{});
    }catch(e){}
  }
  window.BUGYEONG_LOG_EVENT=logEvent;

  function trackPageView(){logEvent({event_type:"page_view",target_type:"page",target_name:pageTitle()})}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",trackPageView,{once:true});
  else setTimeout(trackPageView,0);

  const observed=new WeakSet();
  const mo=new MutationObserver(ms=>{
    for(const m of ms){
      const el=m.target;
      if(!(el instanceof Element)||observed.has(el)) continue;
      const isOpen=String(el.className||"").includes("open")||el.style.display==="flex"||el.style.display==="block";
      const isDetail=el.matches(".detail,.panel,.modal,[id*=detail],[class*=detail]");
      if(isOpen&&isDetail){
        observed.add(el);
        const t=closestTarget(el);
        logEvent(Object.assign({event_type:PAGE_NAME.includes("fc")?"fc_view":PAGE_NAME.includes("agency")?"agency_view":PAGE_NAME.includes("manager")?"manager_view":"detail_view",action_detail:{trigger:"modal_open",path:location.pathname}},t));
      }
    }
  });
  mo.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["class","style"]});

  document.addEventListener("click",e=>{
    const clickable=e.target.closest("button,a,[role='button'],td.name,.name,.manager-click,[data-action]");
    if(!clickable) return;
    const text=safeText(clickable), lower=text.toLowerCase();
    const target=closestTarget(clickable);
    let eventType=(clickable.dataset||{}).action||"";
    if(!eventType){
      if(text.includes("이미지로 복사")||text.includes("이미지 복사")||text.includes("복사")) eventType="image_copy";
      else if(text.includes("이미지 저장")||text.includes("저장")) eventType="image_save";
      else if(text.includes("PDF")||lower.includes("pdf")) eventType="pdf_save";
      else if(text.includes("카톡")||text.includes("카카오")) eventType="kakao_share";
      else if(text.includes("상세")||text.includes("조회")||clickable.matches("td.name,.name,.manager-click")) eventType=PAGE_NAME.includes("fc")?"fc_view":PAGE_NAME.includes("agency")?"agency_view":PAGE_NAME.includes("manager")?"manager_view":"detail_view";
    }
    if(eventType) logEvent(Object.assign({event_type:eventType,action_detail:{button:text,href:clickable.href||"",path:location.pathname}},target));
  },true);

  let filterTimer=null;
  document.addEventListener("change",e=>{
    const el=e.target;
    if(!el||!["SELECT","INPUT"].includes(el.tagName)||el.type==="file") return;
    const name=el.name||el.id||el.getAttribute("aria-label")||"filter";
    const value=el.value||"";
    clearTimeout(filterTimer);
    filterTimer=setTimeout(()=>logEvent({event_type:"filter_use",target_type:"filter",target_name:name,activity_menu:inferActivityMenu(value),action_detail:{name,value,path:location.pathname}}),250);
  },true);

  let searchTimer=null;
  document.addEventListener("input",e=>{
    const el=e.target;
    if(!el||el.tagName!=="INPUT"||el.type==="file") return;
    const ph=el.placeholder||"", id=el.id||"";
    if(!(ph.includes("검색")||id.toLowerCase().includes("search"))) return;
    clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>{
      const keyword=(el.value||"").trim();
      if(keyword.length>=2) logEvent({event_type:"search",target_type:"search",target_name:ph||id||"검색",activity_menu:inferActivityMenu(keyword),action_detail:{keyword,path:location.pathname}});
    },700);
  },true);

  window.bugyeongShareText=async function(text,meta){
    const payload=Object.assign({event_type:"kakao_share",target_type:"",target_code:"",target_name:"",activity_menu:"",action_detail:{text:String(text||"").slice(0,500),method:"web_share"}},meta||{});
    logEvent(payload);
    if(navigator.share){try{await navigator.share({text:String(text||"")});return true}catch(e){return false}}
    try{await navigator.clipboard.writeText(String(text||""));alert("공유 문구를 복사했습니다. 카카오톡에 붙여넣어 주세요.");return true}catch(e){alert("공유 기능을 사용할 수 없습니다.");return false}
  };

  window.logFcView=(fcCode,fcName,activityMenu)=>logEvent({event_type:"fc_view",target_type:"FC",target_code:fcCode||"",target_name:fcName||"",activity_menu:activityMenu||""});
  window.logAgencyView=(agencyCode,agencyName,activityMenu)=>logEvent({event_type:"agency_view",target_type:"agency",target_code:agencyCode||"",target_name:agencyName||"",activity_menu:activityMenu||""});
  window.logManagerView=(managerCode,managerName,activityMenu)=>logEvent({event_type:"manager_view",target_type:"manager",target_code:managerCode||"",target_name:managerName||"",activity_menu:activityMenu||""});
  window.logImageCopy=(targetType,targetCode,targetName,activityMenu)=>logEvent({event_type:"image_copy",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  window.logImageSave=(targetType,targetCode,targetName,activityMenu)=>logEvent({event_type:"image_save",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  window.logKakaoShare=(targetType,targetCode,targetName,activityMenu)=>logEvent({event_type:"kakao_share",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
})();

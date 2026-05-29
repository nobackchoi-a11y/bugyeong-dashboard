// 부경사업단 업무앱 활동로그 수집기 - 운영 V1
(function(){
  const LOGIN_KEY="bugyeong_app_emp_no";
  const USERS=[
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
  function empNo(){return localStorage.getItem(LOGIN_KEY)||""}
  function user(){
    const e=empNo();
    const f=USERS.find(u=>u.empNo===e);
    if(f) return f;
    if(e.startsWith("2")) return {empNo:e,name:"",branch:"",role:"manager",title:"전문매니저"};
    if(e.startsWith("1")) return {empNo:e,name:"",branch:"",role:"branch",title:"지점장"};
    return {empNo:e,name:"",branch:"",role:"user",title:"사용자"};
  }
  const PAGE=(()=>{
    const p=location.pathname.toLowerCase();
    if(p.includes("fc")) return "fc_dashboard";
    if(p.includes("manager")) return "branch_manager_dashboard";
    if(p.includes("agency")) return "agency_dashboard";
    if(p.includes("stats")) return "stats_dashboard";
    if(p.includes("admin")) return "admin";
    return "home";
  })();
  function txt(el){return (el?.innerText||el?.textContent||"").replace(/\s+/g," ").trim().slice(0,300)}
  function title(){return txt(document.querySelector("h1"))||document.title||PAGE}
  function menu(t){
    const list=["가전페스타","브릿지(전반)","브릿지 전반","브릿지(후반)","브릿지 후반","첫가동","그린플래티넘","플래티넘","드림빅","20만가동근접","20만가동","10만가동","5만가동","50만지사","연속가동대상","미가동"];
    for(const x of list){if(String(t||"").includes(x)) return x.replace("브릿지 전반","브릿지(전반)").replace("브릿지 후반","브릿지(후반)")}
    return "";
  }
  function code(t){const m=String(t||"").match(/\b(4\d{6,9}|\d{6,10})\b/);return m?m[1]:""}
  function target(el){
    const ex=el.closest("[data-target-name],[data-fc-name],[data-agency-name],[data-manager-name],[data-fc-code],[data-agency-code],[data-manager-code]");
    const row=el.closest("tr");
    const card=el.closest(".card,.fc-card,.agency-card,.detail-card,.panel,.modal,.detail,[data-card]");
    const box=ex||row||card||el;
    const ds=box.dataset||{};
    const t=txt(box);
    let target_type=ds.targetType||ds.type||"";
    if(!target_type) target_type=PAGE.includes("fc")?"FC":PAGE.includes("agency")?"agency":PAGE.includes("manager")?"manager":"";
    let target_code=ds.targetCode||ds.fcCode||ds.agencyCode||ds.managerCode||code(t);
    let target_name=ds.targetName||ds.fcName||ds.agencyName||ds.managerName||"";
    if(!target_name){
      if(row){
        const cells=[...row.querySelectorAll("td,th")].map(txt).filter(Boolean);
        target_name=(cells.find(c=>!/^\d+$/.test(c)&&!c.includes("원")&&c.length<40)||cells[0]||"");
      }else target_name=t.split(" ").slice(0,5).join(" ");
    }
    return {target_type,target_code,target_name,activity_menu:ds.activityMenu||menu(t)};
  }
  function send(payload){
    try{
      const u=user();
      const body=Object.assign({emp_no:u.empNo,user_name:u.name,branch:u.branch,role:u.role,page:PAGE,action_detail:{path:location.pathname,title:title()}},payload||{});
      const j=JSON.stringify(body);
      if(navigator.sendBeacon) navigator.sendBeacon("/.netlify/functions/log-event",new Blob([j],{type:"application/json"}));
      else fetch("/.netlify/functions/log-event",{method:"POST",headers:{"Content-Type":"application/json"},body:j,keepalive:true}).catch(()=>{});
    }catch(e){}
  }
  window.BUGYEONG_LOG_EVENT=send;
  function pageView(){send({event_type:"page_view",target_type:"page",target_name:title()})}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",pageView,{once:true}); else setTimeout(pageView,0);

  document.addEventListener("click",e=>{
    const el=e.target.closest("button,a,[role='button'],td.name,.name,.manager-click,[data-action]");
    if(!el) return;
    const s=txt(el), low=s.toLowerCase();
    let et=el.dataset?.action||"";
    if(!et){
      if(s.includes("이미지로 복사")||s.includes("이미지 복사")||s.includes("복사")) et="image_copy";
      else if(s.includes("이미지 저장")) et="image_save";
      else if(s.includes("PDF")||low.includes("pdf")) et="pdf_save";
      else if(s.includes("카톡")||s.includes("카카오")) et="kakao_share";
      else if(s.includes("상세")||s.includes("조회")||el.matches("td.name,.name,.manager-click")) et=PAGE.includes("fc")?"fc_view":PAGE.includes("agency")?"agency_view":PAGE.includes("manager")?"manager_view":"detail_view";
    }
    if(et) send(Object.assign({event_type:et,action_detail:{button:s,href:el.href||"",path:location.pathname}},target(el)));
  },true);

  let ft=null;
  document.addEventListener("change",e=>{
    const el=e.target;
    if(!el||!["SELECT","INPUT"].includes(el.tagName)||el.type==="file") return;
    clearTimeout(ft);
    ft=setTimeout(()=>send({event_type:"filter_use",target_type:"filter",target_name:el.name||el.id||"filter",activity_menu:menu(el.value),action_detail:{name:el.name||el.id,value:el.value,path:location.pathname}}),250);
  },true);

  let st=null;
  document.addEventListener("input",e=>{
    const el=e.target;
    if(!el||el.tagName!=="INPUT"||el.type==="file") return;
    const ph=el.placeholder||"", id=el.id||"";
    if(!(ph.includes("검색")||id.toLowerCase().includes("search"))) return;
    clearTimeout(st);
    st=setTimeout(()=>{const kw=(el.value||"").trim(); if(kw.length>=2) send({event_type:"search",target_type:"search",target_name:ph||id||"검색",activity_menu:menu(kw),action_detail:{keyword:kw,path:location.pathname}})},700);
  },true);

  window.logImageCopy=(targetType,targetCode,targetName,activityMenu)=>send({event_type:"image_copy",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  window.logImageSave=(targetType,targetCode,targetName,activityMenu)=>send({event_type:"image_save",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  window.logKakaoShare=(targetType,targetCode,targetName,activityMenu)=>send({event_type:"kakao_share",target_type:targetType||"",target_code:targetCode||"",target_name:targetName||"",activity_menu:activityMenu||""});
  window.bugyeongShareText=async function(text,meta){
    send(Object.assign({event_type:"kakao_share",action_detail:{text:String(text||"").slice(0,500),method:"web_share"}},meta||{}));
    if(navigator.share){try{await navigator.share({text:String(text||"")});return true}catch(e){return false}}
    try{await navigator.clipboard.writeText(String(text||""));alert("공유 문구를 복사했습니다. 카카오톡에 붙여넣어 주세요.");return true}catch(e){alert("공유 기능을 사용할 수 없습니다.");return false}
  };
})();

/* Mobile bottom navigation: presentation only, existing business logic unchanged. */
(()=>{
"use strict";
const items=[
  {key:"home",icon:"⌂",labels:["Главная","Bosh sahifa","Асосӣ"],target:null},
  {key:"search",icon:"⌕",labels:["Поиск","Qidiruv","Ҷустуҷӯ"],target:"proDirectory"},
  {key:"orders",icon:"▤",labels:["Заказы","Buyurtmalar","Фармоишҳо"],target:"liveApp"},
  {key:"chat",icon:"▣",labels:["Чаты","Chatlar","Чатҳо"],target:"chatQuickAccess"},
  {key:"profile",icon:"♙",labels:["Профиль","Profil","Профил"],target:"liveApp"}
];
const css=document.createElement("style");css.textContent=`
#profiBottomNav{display:none}
@media(max-width:760px){
body{padding-bottom:calc(74px + env(safe-area-inset-bottom,0px))}
#profiBottomNav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));position:fixed;bottom:0;left:0;right:0;z-index:900;background:#fff;border-top:1px solid #e5e7eb;padding:7px 6px calc(7px + env(safe-area-inset-bottom,0px));box-shadow:0 -6px 20px #10182812}
#profiBottomNav button{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;min-height:48px;background:transparent;border-radius:10px;color:#606779;font-size:10px;font-weight:650;min-width:0;padding:3px 1px}
#profiBottomNav button .profi-nav-icon{font-size:23px;line-height:1}
#profiBottomNav button[aria-current="page"]{color:#ed3155;background:#fff1f4}
#profiBottomNav button:focus-visible{outline:2px solid #ed3155}
body:has(#chatApp:not([hidden])) #profiBottomNav{display:none}
}`;document.head.append(css);
const nav=document.createElement("nav");nav.id="profiBottomNav";nav.setAttribute("aria-label","Основная навигация");
const langIndex=()=>({ru:0,uz:1,tj:2})[localStorage.getItem("profi_lang")||"ru"]||0;
let selected="home";
function paint(){nav.querySelectorAll("button").forEach((b,j)=>{b.lastChild.textContent=items[j].labels[langIndex()];if(items[j].key===selected)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
items.forEach(item=>{const b=document.createElement("button");b.type="button";b.dataset.section=item.key;const icon=document.createElement("span");icon.className="profi-nav-icon";icon.setAttribute("aria-hidden","true");icon.textContent=item.icon;const label=document.createElement("span");b.append(icon,label);b.addEventListener("click",()=>{if(item.key==="chat"){const existing=document.getElementById("chatQuickAccess");if(existing){existing.click();selected=item.key;paint()}return}if(item.key==="home"){window.scrollTo({top:0,behavior:"smooth"})}else{const section=document.getElementById(item.target);if(!section)return;section.scrollIntoView({behavior:"smooth",block:"start"});if(item.key==="profile"){const signed=document.getElementById("liveSigned");if(signed&&!signed.hidden)setTimeout(()=>signed.scrollIntoView({behavior:"smooth",block:"center"}),200)}}selected=item.key;paint()});nav.append(b)});
document.body.append(nav);document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(paint,0)));paint();
})();
/* Header account burger: reuses live account sections without duplicating data or handlers. */
(()=>{"use strict";
const app=document.getElementById("liveApp"),header=document.querySelector("header .header-actions"),db=window.PROFI_DB;
if(!app||!header||!db)return;
const style=document.createElement("style");style.textContent=`
#profiAccountMenuButton{min-width:44px;min-height:44px;font-size:23px;cursor:pointer}
#profiAccountDrawer{position:fixed;inset:0;z-index:99999;background:rgba(10,15,28,.55);display:flex;justify-content:flex-end}
#profiAccountDrawer[hidden]{display:none!important}
#profiAccountDrawerInner{background:#fff;color:#242936;height:100%;width:min(100%,440px);overflow-y:auto;padding:24px 20px;box-shadow:-12px 0 40px #0002}
#profiAccountDrawerTop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0 20px;border-bottom:1px solid #eef0f4}
#profiAccountDrawerTitle{font-size:23px!important;line-height:1.2;margin:0!important;font-weight:750}
#profiAccountDrawerClose{border:1px solid #e9ebf0;border-radius:12px;width:42px;height:42px;flex-shrink:0;font-size:22px}
#profiAccountTabs{display:flex;flex-direction:column;flex-wrap:nowrap;gap:5px;margin:16px 0 0}
#profiAccountTabs button{display:flex;align-items:center;gap:13px;width:100%;min-height:53px;padding:12px 15px;border:0!important;border-radius:12px!important;background:transparent!important;color:#2a3040!important;text-align:left;font-size:15px;font-weight:600;box-shadow:none!important;cursor:pointer}
#profiAccountTabs button::after{content:"›";margin-left:auto;font-size:25px;font-weight:400;color:#a2a8b4}
#profiAccountTabs button[aria-pressed="true"]{background:#fff0f3!important;color:#e92b55!important}
#profiAccountTabs button[aria-pressed="true"]::after{color:#e92b55}
#profiAccountTabs .account-icon{width:39px;height:39px;flex:0 0 39px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;background:var(--icon-bg,#f2f4f8);color:var(--icon-color,#536079)}
#profiAccountTabs .account-icon svg{width:21px;height:21px;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;fill:none}
#profiAccountTabs button{min-height:60px}
#profiAccountTabs button:hover{background:#f7f8fb!important}
#profiAccountTabs button[aria-pressed="true"]{background:#fff1f4!important}
#profiAccountTabs button[aria-pressed="true"] .account-icon{filter:saturate(1.15)}
#profiAccountBody{margin-top:12px}
#profiAccountBack{display:flex;align-items:center;gap:9px;border:0;background:#f5f6f9;color:#303747;border-radius:12px;padding:12px 14px;margin:12px 0;font-size:14px;font-weight:650;cursor:pointer}
#profiAccountBack[hidden]{display:none!important}
#profiAccountTabs[hidden]{display:none!important}
#profiAccountTabs .account-inline-content{width:100%;margin:4px 0 12px;padding:4px 0 10px;min-width:0}
#profiAccountTabs .account-inline-content[hidden]{display:none!important}
#profiAccountTabs .account-inline-content>.dashpanel{margin:0!important;max-width:100%}
#profiAccountTabs .account-inline-content>#liveSigned{padding:12px!important}
#profiAccountTabs .account-inline-content [hidden]{display:none!important}
#profiAccountBody[hidden]{display:none!important}
#profiAccountDrawer .account-active{visibility:visible!important;opacity:1!important}
#profiAccountBody>[data-account-section]{display:none!important}
#profiAccountBody>[data-account-section].account-active:not([hidden]){display:block!important}
#profiAccountBody>[data-account-section].account-active[hidden]{display:none!important}
#profiAccountDrawer .dashpanel{max-width:100%;margin:0!important;padding:14px!important;border-radius:14px}
#profiAccountDrawer #liveSigned{padding:14px}
#profiAccountDrawer #liveSigned>[hidden]{display:none!important}
#profiAccountDrawer #liveSigned #roleTools{margin:14px 0!important}
#profiAccountDrawer #liveSigned #proPanel{margin-top:14px}
#profiAccountDrawer #liveSigned .dashpanel{margin:12px 0!important}
body.profi-account-open{overflow:hidden}
@media(max-width:520px){#profiAccountDrawerInner{width:100%;padding:18px 16px}#profiAccountDrawerTitle{font-size:21px!important}}
`;document.head.append(style);
const btn=document.createElement("button");btn.id="profiAccountMenuButton";btn.className="outline";btn.type="button";btn.textContent="☰";btn.title="Мой профиль";btn.setAttribute("aria-label","Мой профиль");btn.setAttribute("aria-expanded","false");btn.hidden=true;header.append(btn);
const drawer=document.createElement("div");drawer.id="profiAccountDrawer";drawer.hidden=true;drawer.innerHTML='<div id="profiAccountDrawerInner" role="dialog" aria-modal="true" aria-labelledby="profiAccountDrawerTitle"><div id="profiAccountDrawerTop"><h2 id="profiAccountDrawerTitle"></h2><button type="button" id="profiAccountDrawerClose" class="outline" aria-label="Закрыть">✕</button></div><div id="profiAccountTabs"></div><div id="profiAccountBody"></div></div>';document.body.append(drawer);
const tabs=drawer.querySelector("#profiAccountTabs"),body=drawer.querySelector("#profiAccountBody"),title=drawer.querySelector("#profiAccountDrawerTitle");
const back=document.createElement("button");back.id="profiAccountBack";back.type="button";back.textContent="← Назад к меню";back.hidden=true;tabs.insertAdjacentElement("afterend",back);back.onclick=()=>choose("");
const lang=()=>localStorage.getItem("profi_lang")||"ru";const t=(ru,uz,tj)=>({ru,uz,tj})[lang()]||ru;
const categories=[["overview","profiAccountOverview",["Обзор","Umumiy","Шарҳ"]],["orders","liveOrderList",["Мои заказы","Buyurtmalarim","Фармоишҳои ман"]],["work","proMyWorks",["Мои работы","Mening ishlarim","Корҳои ман"]],["feed","proFeed",["Открытые заказы","Ochiq buyurtmalar","Фармоишҳои кушода"]],["favorites","accountFavorites",["Избранные","Sevimlilar","Дӯстдоштаҳо"]],["notifications","accountNotifications",["Уведомления","Bildirishnomalar","Огоҳиҳо"]],["settings","liveSigned",["Настройки","Sozlamalar","Танзимот"]]];
let selected="",mounted=new Set(),lastFocus=null;const icons={
overview:{color:"#f04a68",bg:"#fff0f3",paths:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'},
orders:{color:"#3478f6",bg:"#eaf2ff",paths:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3.5h6M9 9h6M9 13h6M9 17h4"/>'},
work:{color:"#16a47d",bg:"#e6f8f0",paths:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0M10 12v3h4v-3"/>'},
feed:{color:"#8c57e8",bg:"#f1eaff",paths:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>'},
favorites:{color:"#f04477",bg:"#ffedf3",paths:'<path d="M20.8 8.6c0 4.3-8.8 10.2-8.8 10.2S3.2 12.9 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z"/>'},
notifications:{color:"#e99a22",bg:"#fff5df",paths:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>'},
messages:{color:"#1d9ab7",bg:"#e5f8fc",paths:'<path d="M20 11.5a8 8 0 0 1-8 8 9 9 0 0 1-4-.9L3 20l1.5-4.7A8 8 0 1 1 20 11.5Z"/><path d="M8 10h8M8 14h5"/>'},
settings:{color:"#6e7788",bg:"#eef1f5",paths:'<path d="M10 2h4l.7 2.3 2 .9 2.1-1.1 2.7 2.8-1.1 2.1.9 2L23 12l-1.7 1-.9 2 1.1 2.1-2.7 2.8-2.1-1.1-2 .9L14 22h-4l-.7-2.3-2-.9-2.1 1.1-2.7-2.8 1.1-2.1-.9-2L1 12l1.7-1 .9-2-1.1-2.1 2.7-2.8 2.1 1.1 2-.9L10 2Z"/><circle cx="12" cy="12" r="3"/>'}
};
function mount(){for(const [key,id] of categories){const el=id?document.getElementById(id):null;if(el&&!mounted.has(key)){el.dataset.accountSection=key;body.append(el);mounted.add(key)}}const settings=document.getElementById("liveSigned");if(settings&&settings.parentElement===body){for(const id of ["roleTools","profiSpecialistAccountControls","proEditTools","proPanel","proRegistration","publicProfileEditor"]){const node=document.getElementById(id);if(node&&node.parentElement!==settings)settings.append(node)}const verify=[...document.querySelectorAll("section,div")].find(x=>x.id&&/verif|check.*specialist/i.test(x.id)&&x.id!=="profiAccountDrawer");if(verify&&verify.parentElement!==settings&&!settings.contains(verify)&&!verify.contains(settings))settings.append(verify)}}
function isSigned(){return !!document.getElementById("liveUser")?.textContent?.trim()&&!document.getElementById("liveSigned")?.hidden}
function isSpecialist(){const b=document.getElementById("proMode");return !!b&&!b.hidden&&b.classList.contains("primary")}
function visibleCategory(key){return key!=="work"&&key!=="feed"||isSpecialist()}
function choose(key){
 mount();selected=key;tabs.hidden=false;back.hidden=true;body.hidden=true;for(const old of [...tabs.querySelectorAll(".account-inline-content>[data-account-section]")]){old.classList.remove("account-active");body.append(old)}tabs.replaceChildren();
 for(const [k,,labels] of categories){
  if(!visibleCategory(k))continue;
  const b=document.createElement("button");b.type="button";b.className=k===selected?"primary":"outline";
  const icon=document.createElement("span");icon.className="account-icon";const iconSpec=icons[k]||icons.overview;
  icon.style.setProperty("--icon-color",iconSpec.color);icon.style.setProperty("--icon-bg",iconSpec.bg);
  icon.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${iconSpec.paths}</svg>`;
  b.append(icon,document.createTextNode(labels[["ru","uz","tj"].indexOf(lang())]||labels[0]));
  b.setAttribute("aria-pressed",String(k===selected));b.setAttribute("aria-expanded",String(k===selected));
  b.onclick=()=>{if(k==="messages"){close();document.getElementById("chatQuickAccess")?.click();return}choose(k===selected?"":k)};
  tabs.append(b);
  if(k===selected){
   const content=document.createElement("div");content.className="account-inline-content";content.dataset.accountContent=k;
   const section=document.querySelector(`[data-account-section="${k}"]`);
   if(section){
    section.classList.add("account-active");
    if(["profiAccountOverview","accountFavorites","accountNotifications","liveSigned"].includes(section.id))section.hidden=false;
    content.append(section);
   }else content.textContent=t("Раздел загружается...","Bo‘lim yuklanmoqda...","Қисм бор мешавад...");
   tabs.append(content);
  }
 }
 for(const section of [...tabs.querySelectorAll(".account-inline-content>[data-account-section]")]){
  if(section.dataset.accountSection!==selected){section.classList.remove("account-active");body.append(section)}
 }
 for(const section of [...body.children])section.classList.remove("account-active");
 title.textContent=t("Мой профиль","Mening profilim","Профили ман");
 const active=tabs.querySelector('[aria-expanded="true"]');if(active)active.scrollIntoView({block:"nearest"});
}
function open(key=""){if(!isSigned())return;lastFocus=document.activeElement;drawer.hidden=false;document.body.classList.add("profi-account-open");btn.setAttribute("aria-expanded","true");choose(key);drawer.querySelector("#profiAccountDrawerClose").focus()}
function close(){drawer.hidden=true;document.body.classList.remove("profi-account-open");btn.setAttribute("aria-expanded","false");lastFocus?.focus?.()}
btn.onclick=()=>drawer.hidden?open():close();drawer.querySelector("#profiAccountDrawerClose").onclick=close;drawer.addEventListener("click",e=>{if(e.target===drawer)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!drawer.hidden)close()});
function sync(){mount();btn.hidden=!isSigned();const heading=app.querySelector('[data-live="title"]'),subtitle=app.querySelector('[data-live="sub"]');if(heading)heading.hidden=isSigned();if(subtitle)subtitle.hidden=isSigned();const chat=document.getElementById("chatQuickAccess");if(chat)chat.style.removeProperty("display");if(!isSigned()&&!drawer.hidden)close();if(!drawer.hidden&&selected&&!visibleCategory(selected))choose("")}
new MutationObserver(()=>{clearTimeout(sync._timer);sync._timer=setTimeout(sync,100)}).observe(document.getElementById("liveUser"),{childList:true,subtree:true,characterData:true});
db.auth.onAuthStateChange(()=>setTimeout(sync,200));window.addEventListener("profi:role-selected",()=>setTimeout(sync,100));document.querySelectorAll("[data-lang]").forEach(x=>x.addEventListener("click",()=>{if(!drawer.hidden)choose(selected)}));
window.PROFI_ACCOUNT_MENU={open,close};
setTimeout(sync,850);
})();

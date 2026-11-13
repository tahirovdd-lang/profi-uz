/* Header account burger: reuses live account sections without duplicating data or handlers. */
(()=>{"use strict";
const app=document.getElementById("liveApp"),header=document.querySelector("header .header-actions"),db=window.PROFI_DB;
if(!app||!header||!db)return;
const style=document.createElement("style");style.textContent=`
#profiAccountMenuButton{min-width:44px;min-height:44px;font-size:24px;cursor:pointer}
#profiAccountDrawer{position:fixed;inset:0;z-index:99999;background:#0008;display:flex;justify-content:flex-end}
#profiAccountDrawer[hidden]{display:none!important}
#profiAccountDrawerInner{background:var(--surface,#fff);color:var(--text,#202531);height:100%;width:min(100%,650px);overflow:auto;padding:18px;box-shadow:-8px 0 28px #0003}
#profiAccountDrawerTop{display:flex;align-items:center;justify-content:space-between;gap:12px}
#profiAccountTabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
#profiAccountTabs button{padding:10px 13px;min-height:44px}
#profiAccountBody>[data-account-section]{display:none}
#profiAccountBody>[data-account-section].account-active{display:block}
#profiAccountDrawer .dashpanel{max-width:100%}
body.profi-account-open{overflow:hidden}
`;document.head.append(style);
const btn=document.createElement("button");btn.id="profiAccountMenuButton";btn.className="outline";btn.type="button";btn.textContent="☰";btn.title="Мой профиль";btn.setAttribute("aria-label","Мой профиль");btn.setAttribute("aria-expanded","false");btn.hidden=true;header.append(btn);
const drawer=document.createElement("div");drawer.id="profiAccountDrawer";drawer.hidden=true;drawer.innerHTML='<div id="profiAccountDrawerInner" role="dialog" aria-modal="true" aria-labelledby="profiAccountDrawerTitle"><div id="profiAccountDrawerTop"><h2 id="profiAccountDrawerTitle"></h2><button type="button" id="profiAccountDrawerClose" class="outline" aria-label="Закрыть">✕</button></div><div id="profiAccountTabs"></div><div id="profiAccountBody"></div></div>';document.body.append(drawer);
const tabs=drawer.querySelector("#profiAccountTabs"),body=drawer.querySelector("#profiAccountBody"),title=drawer.querySelector("#profiAccountDrawerTitle");
const lang=()=>localStorage.getItem("profi_lang")||"ru";const t=(ru,uz,tj)=>({ru,uz,tj})[lang()]||ru;
const categories=[["overview","profiAccountOverview",["Обзор","Umumiy","Шарҳ"]],["orders","liveOrderList",["Мои заказы","Buyurtmalarim","Фармоишҳои ман"]],["work","proMyWorks",["Мои работы","Mening ishlarim","Корҳои ман"]],["feed","proFeed",["Открытые заказы","Ochiq buyurtmalar","Фармоишҳои кушода"]],["favorites","accountFavorites",["Избранные","Sevimlilar","Дӯстдоштаҳо"]],["notifications","accountNotifications",["Уведомления","Bildirishnomalar","Огоҳиҳо"]],["settings","liveSigned",["Настройки","Sozlamalar","Танзимот"]]];
let selected="overview",mounted=new Set(),lastFocus=null;
function mount(){for(const [key,id] of categories){const el=document.getElementById(id);if(el&&!mounted.has(key)){el.dataset.accountSection=key;body.append(el);mounted.add(key)}}}
function isSigned(){return !!document.getElementById("liveUser")?.textContent?.trim()&&!document.getElementById("liveSigned")?.hidden}
function isSpecialist(){const b=document.getElementById("proMode");return !!b&&!b.hidden&&b.classList.contains("primary")}
function visibleCategory(key){return key!=="work"&&key!=="feed"||isSpecialist()}
function choose(key){mount();selected=key;tabs.replaceChildren();for(const [k,,labels] of categories){if(!visibleCategory(k))continue;const b=document.createElement("button");b.type="button";b.className=k===selected?"primary":"outline";b.textContent=labels[["ru","uz","tj"].indexOf(lang())]||labels[0];b.setAttribute("aria-pressed",String(k===selected));b.onclick=()=>choose(k);tabs.append(b)}for(const node of body.children)node.classList.toggle("account-active",node.dataset.accountSection===selected);title.textContent=t("Мой профиль","Mening profilim","Профили ман");drawer.querySelector("#profiAccountDrawerInner").scrollTop=0}
function open(key="overview"){if(!isSigned())return;lastFocus=document.activeElement;drawer.hidden=false;document.body.classList.add("profi-account-open");btn.setAttribute("aria-expanded","true");choose(key);drawer.querySelector("#profiAccountDrawerClose").focus()}
function close(){drawer.hidden=true;document.body.classList.remove("profi-account-open");btn.setAttribute("aria-expanded","false");lastFocus?.focus?.()}
btn.onclick=()=>drawer.hidden?open():close();drawer.querySelector("#profiAccountDrawerClose").onclick=close;drawer.addEventListener("click",e=>{if(e.target===drawer)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!drawer.hidden)close()});
function sync(){mount();btn.hidden=!isSigned();const heading=app.querySelector('[data-live="title"]'),subtitle=app.querySelector('[data-live="sub"]');if(heading)heading.hidden=isSigned();if(subtitle)subtitle.hidden=isSigned();const chat=document.getElementById("chatQuickAccess");if(chat)chat.style.display=isSigned()?"none":"";if(!isSigned()&&!drawer.hidden)close();if(!drawer.hidden)choose(visibleCategory(selected)?selected:"overview")}
new MutationObserver(()=>{clearTimeout(sync._timer);sync._timer=setTimeout(sync,100)}).observe(document.getElementById("liveUser"),{childList:true,subtree:true,characterData:true});
db.auth.onAuthStateChange(()=>setTimeout(sync,200));window.addEventListener("profi:role-selected",()=>setTimeout(sync,100));document.querySelectorAll("[data-lang]").forEach(x=>x.addEventListener("click",()=>{if(!drawer.hidden)choose(selected)}));
window.PROFI_ACCOUNT_MENU={open,close};
setTimeout(sync,850);
})();

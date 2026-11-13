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
#profiAccountTabs .account-icon{width:24px;text-align:center;font-size:19px;font-weight:400}
#profiAccountBody{margin-top:12px}
#profiAccountBody>[data-account-section]{display:none!important}
#profiAccountBody>[data-account-section].account-active:not([hidden]){display:block!important}
#profiAccountBody>[data-account-section].account-active[hidden]{display:none!important}
#profiAccountDrawer .dashpanel{max-width:100%;margin:0!important;padding:14px!important;border-radius:14px}
#profiAccountDrawer #liveSigned{padding:14px}
body.profi-account-open{overflow:hidden}
@media(max-width:520px){#profiAccountDrawerInner{width:100%;padding:18px 16px}#profiAccountDrawerTitle{font-size:21px!important}}
`;document.head.append(style);
const btn=document.createElement("button");btn.id="profiAccountMenuButton";btn.className="outline";btn.type="button";btn.textContent="☰";btn.title="Мой профиль";btn.setAttribute("aria-label","Мой профиль");btn.setAttribute("aria-expanded","false");btn.hidden=true;header.append(btn);
const drawer=document.createElement("div");drawer.id="profiAccountDrawer";drawer.hidden=true;drawer.innerHTML='<div id="profiAccountDrawerInner" role="dialog" aria-modal="true" aria-labelledby="profiAccountDrawerTitle"><div id="profiAccountDrawerTop"><h2 id="profiAccountDrawerTitle"></h2><button type="button" id="profiAccountDrawerClose" class="outline" aria-label="Закрыть">✕</button></div><div id="profiAccountTabs"></div><div id="profiAccountBody"></div></div>';document.body.append(drawer);
const tabs=drawer.querySelector("#profiAccountTabs"),body=drawer.querySelector("#profiAccountBody"),title=drawer.querySelector("#profiAccountDrawerTitle");
const lang=()=>localStorage.getItem("profi_lang")||"ru";const t=(ru,uz,tj)=>({ru,uz,tj})[lang()]||ru;
const categories=[["overview","profiAccountOverview",["Обзор","Umumiy","Шарҳ"]],["orders","liveOrderList",["Мои заказы","Buyurtmalarim","Фармоишҳои ман"]],["work","proMyWorks",["Мои работы","Mening ishlarim","Корҳои ман"]],["feed","proFeed",["Открытые заказы","Ochiq buyurtmalar","Фармоишҳои кушода"]],["favorites","accountFavorites",["Избранные","Sevimlilar","Дӯстдоштаҳо"]],["notifications","accountNotifications",["Уведомления","Bildirishnomalar","Огоҳиҳо"]],["messages",null,["Сообщения","Xabarlar","Паёмҳо"]],["settings","liveSigned",["Настройки","Sozlamalar","Танзимот"]]];
let selected="",mounted=new Set(),lastFocus=null;const icons={overview:"◫",orders:"▤",work:"✓",feed:"▦",favorites:"♡",notifications:"♧",messages:"✉",settings:"⚙"};
function mount(){for(const [key,id] of categories){const el=id?document.getElementById(id):null;if(el&&!mounted.has(key)){el.dataset.accountSection=key;body.append(el);mounted.add(key)}}}
function isSigned(){return !!document.getElementById("liveUser")?.textContent?.trim()&&!document.getElementById("liveSigned")?.hidden}
function isSpecialist(){const b=document.getElementById("proMode");return !!b&&!b.hidden&&b.classList.contains("primary")}
function visibleCategory(key){return key!=="work"&&key!=="feed"||isSpecialist()}
function choose(key){mount();selected=key;tabs.replaceChildren();for(const [k,,labels] of categories){if(!visibleCategory(k))continue;const b=document.createElement("button");b.type="button";b.className=k===selected?"primary":"outline";const icon=document.createElement("span");icon.className="account-icon";icon.textContent=icons[k]||"•";b.append(icon,document.createTextNode(labels[["ru","uz","tj"].indexOf(lang())]||labels[0]));b.setAttribute("aria-pressed",String(k===selected));b.onclick=()=>{if(k==="messages"){close();document.getElementById("chatQuickAccess")?.click();return}choose(k)};tabs.append(b)}for(const node of body.children)node.classList.toggle("account-active",node.dataset.accountSection===selected);title.textContent=t("Мой профиль","Mening profilim","Профили ман");drawer.querySelector("#profiAccountDrawerInner").scrollTop=0}
function open(key=""){if(!isSigned())return;lastFocus=document.activeElement;drawer.hidden=false;document.body.classList.add("profi-account-open");btn.setAttribute("aria-expanded","true");choose(key);drawer.querySelector("#profiAccountDrawerClose").focus()}
function close(){drawer.hidden=true;document.body.classList.remove("profi-account-open");btn.setAttribute("aria-expanded","false");lastFocus?.focus?.()}
btn.onclick=()=>drawer.hidden?open():close();drawer.querySelector("#profiAccountDrawerClose").onclick=close;drawer.addEventListener("click",e=>{if(e.target===drawer)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!drawer.hidden)close()});
function sync(){mount();btn.hidden=!isSigned();const heading=app.querySelector('[data-live="title"]'),subtitle=app.querySelector('[data-live="sub"]');if(heading)heading.hidden=isSigned();if(subtitle)subtitle.hidden=isSigned();const chat=document.getElementById("chatQuickAccess");if(chat)chat.style.display=isSigned()?"none":"";if(!isSigned()&&!drawer.hidden)close();if(!drawer.hidden)choose(visibleCategory(selected)?selected:"")}
new MutationObserver(()=>{clearTimeout(sync._timer);sync._timer=setTimeout(sync,100)}).observe(document.getElementById("liveUser"),{childList:true,subtree:true,characterData:true});
db.auth.onAuthStateChange(()=>setTimeout(sync,200));window.addEventListener("profi:role-selected",()=>setTimeout(sync,100));document.querySelectorAll("[data-lang]").forEach(x=>x.addEventListener("click",()=>{if(!drawer.hidden)choose(selected)}));
window.PROFI_ACCOUNT_MENU={open,close};
setTimeout(sync,850);
})();

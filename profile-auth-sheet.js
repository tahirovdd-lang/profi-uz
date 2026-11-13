/* Mobile sign-in from Profile: reuse existing Supabase OAuth buttons and forms. */
(()=>{"use strict";
const app=document.getElementById("liveApp"),login=document.getElementById("liveLogin"),social=document.getElementById("socialAuth");
if(!app||!login||!social)return;
const css=document.createElement("style");css.textContent=`
#profiAuthSheet[hidden]{display:none!important}
#profiAuthSheet{position:fixed;inset:0;z-index:100050;background:rgba(12,19,35,.56);display:flex;align-items:center;justify-content:center;padding:16px}
#profiAuthSheetPanel{position:relative;background:#fff;color:#20283b;border-radius:22px;width:min(100%,470px);max-height:calc(100dvh - 32px);overflow:auto;padding:26px 22px;box-shadow:0 22px 70px #10182a3d}
#profiAuthSheetTitle{font-size:23px;line-height:1.25;margin:0 52px 8px 0}
#profiAuthSheetDescription{color:#6b7280;font-size:14px;line-height:1.5;margin:0 0 16px}
#profiAuthSheetClose{position:absolute;top:16px;right:16px;width:42px;height:42px;border:1px solid #e7e9f0;background:#fff;border-radius:12px;font-size:23px}
#profiAuthSheet #socialAuth{display:block!important;max-width:none!important;margin:0!important}
#profiAuthSheet #socialAuth .social-auth-divider{margin-bottom:12px}
#profiAuthSheet .social-auth-button{width:100%;min-height:52px;display:flex;align-items:center;justify-content:center;gap:12px;margin:9px 0;border-radius:13px}
#profiAuthSheet #liveLogin{max-width:none!important;margin-top:18px}
body.profi-auth-open{overflow:hidden}
@media(max-width:600px){#profiAuthSheet{align-items:flex-end;padding:0}#profiAuthSheetPanel{width:100%;max-height:94dvh;border-radius:24px 24px 0 0;padding:24px 20px max(22px,env(safe-area-inset-bottom))}}
`;document.head.append(css);
const sheet=document.createElement("div");sheet.id="profiAuthSheet";sheet.hidden=true;sheet.innerHTML='<section id="profiAuthSheetPanel" role="dialog" aria-modal="true" aria-labelledby="profiAuthSheetTitle"><button type="button" id="profiAuthSheetClose" aria-label="Закрыть">×</button><h2 id="profiAuthSheetTitle"></h2><p id="profiAuthSheetDescription"></p><div id="profiAuthSheetContent"></div></section>';document.body.append(sheet);
const container=sheet.querySelector("#profiAuthSheetContent"),original=new Map([[login,{parent:login.parentNode,next:login.nextSibling}],[social,{parent:social.parentNode,next:social.nextSibling}]]);let previousFocus=null;
const t=(ru,uz,tj)=>({ru,uz,tj})[localStorage.getItem("profi_lang")||"ru"]||ru;
function restore(){for(const node of [login,social]){const p=original.get(node);if(p.next?.parentNode===p.parent)p.parent.insertBefore(node,p.next);else p.parent.append(node)}}
function close(){if(sheet.hidden)return;restore();sheet.hidden=true;document.body.classList.remove("profi-auth-open");previousFocus?.focus?.()}
function open(){if(!document.getElementById("liveSigned")?.hidden){window.PROFI_ACCOUNT_MENU?.open();return}previousFocus=document.activeElement;sheet.querySelector("#profiAuthSheetTitle").textContent=t("Вход в Profi.UZ","Profi.UZ ga kirish","Воридшавӣ ба Profi.UZ");sheet.querySelector("#profiAuthSheetDescription").textContent=t("Войдите или создайте аккаунт с Google, Apple или электронной почтой.","Google, Apple yoki elektron pochta orqali kiring yoki ro‘yxatdan o‘ting.","Бо Google, Apple ё почтаи электронӣ ворид шавед ё сабти ном кунед.");container.append(social,login);social.hidden=false;login.hidden=window.Capacitor?.isNativePlatform?.()===true;sheet.hidden=false;document.body.classList.add("profi-auth-open");sheet.querySelector("#profiAuthSheetClose").focus()}
sheet.querySelector("#profiAuthSheetClose").onclick=close;sheet.addEventListener("click",e=>{if(e.target===sheet)close()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!sheet.hidden)close()});
window.PROFI_AUTH_SHEET={open,close};
const db=window.PROFI_DB;if(db?.auth?.onAuthStateChange)db.auth.onAuthStateChange((event,session)=>{if(session?.user&&!sheet.hidden)setTimeout(close,100)});
})();

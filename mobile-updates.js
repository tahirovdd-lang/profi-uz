/* Profi.UZ server-controlled announcements and store update notices; never downloads executable code. */
(function(){
"use strict";
const endpoint="https://profiuz.uz/mobile-config.json";
const cap=()=>window.Capacitor;
const platform=()=>cap()?.getPlatform?.()||"web";
const native=()=>cap()?.isNativePlatform?.()===true;
let latest=null,installed=null;
const lang=()=>localStorage.getItem("profi_lang")||"ru";
const translate=(ru,uz,tj)=>({ru,uz,tj})[lang()]||ru;
async function installedBuild(){
 if(installed!==null)return installed;
 try{const info=await cap()?.Plugins?.App?.getInfo?.();installed=Number(info?.build)||0}
 catch(e){console.warn("Profi.UZ version check:",e);installed=0}
 return installed;
}
function message(id,css){
 let node=document.getElementById(id);
 if(!node){node=document.createElement("div");node.id=id;node.style.cssText=css;document.body.prepend(node)}
 return node;
}
async function render(config){
 if(!native()||!config||config.schema!==1)return;
 latest=config;
 const a=config.announcement||{};
 const banner=message("profiMobileAnnouncement","padding:12px 16px;margin:10px auto;max-width:1080px;border-radius:12px;background:#edf4ff;color:#183d78;font-weight:600");
 banner.hidden=!a.enabled;
 banner.textContent=a.enabled?(a[lang()]||a.ru||""):"";
 // Never override the active navigation state: a disabled feature is checked by its entry point.
 const os=platform();
 const policy=config[os]||{};
 const current=await installedBuild();
 const newest=Number(policy.latestVersionCode)||0;
 const minimum=Number(policy.minimumVersionCode)||0;
 const url=typeof policy.downloadUrl==="string"&&/^https:\/\//.test(policy.downloadUrl)?policy.downloadUrl:"";
 const update=message("profiMobileUpdate","padding:12px 16px;text-align:center;background:#fff4dc;color:#704700");
 update.hidden=!(current>0&&newest>current&&url);
 update.replaceChildren();
 if(!update.hidden){
  const required=minimum>current;
  update.append(document.createTextNode(required?translate("Для продолжения работы обновите Profi.UZ. ","Profi.UZ ilovasini yangilang. ","Profi.UZ-ро навсозӣ кунед. "):translate("Доступна новая версия Profi.UZ. ","Profi.UZ yangilanishi mavjud. ","Навсозии Profi.UZ дастрас аст. ")));
  const link=document.createElement("a");
  link.href=url;link.target="_blank";link.rel="noopener noreferrer";
  link.textContent=translate("Открыть обновление","Yangilash","Навсозӣ");
  update.append(link);
 }
}
async function refresh(){
 if(!native())return;
 try{
  const response=await fetch(endpoint+"?t="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  await render(await response.json());
 }catch(e){console.warn("Profi.UZ remote config unavailable",e)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",refresh,{once:true});else refresh();
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
document.addEventListener("click",e=>{if(e.target.closest?.("[data-lang]")&&latest)setTimeout(()=>render(latest),0)});
})();

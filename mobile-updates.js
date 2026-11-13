/* Profi.UZ server-controlled announcements and store update notices; never downloads executable code. */
(function(){
"use strict";
const endpoint="https://profiuz.uz/mobile-config.json";
const releasesEndpoint="https://api.github.com/repos/tahirovdd-lang/profi-uz/releases/latest";
const cap=()=>window.Capacitor;
const platform=()=>cap()?.getPlatform?.()||"web";
const native=()=>cap()?.isNativePlatform?.()===true;
let latest=null,installed=null,dismissedVersion=0;
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
async function findAndroidRelease(){
 try{
  const response=await fetch(releasesEndpoint,{headers:{"Accept":"application/vnd.github+json"},cache:"no-store"});
  if(!response.ok)return null;
  const release=await response.json();
  const match=/^android-(\d+)$/.exec(release.tag_name||"");
  const apk=(release.assets||[]).find(asset=>/^Profi\.UZ-\d+\.apk$/.test(asset.name||""));
  if(!match||!apk?.browser_download_url)return null;
  return {latestVersionCode:Number(match[1]),downloadUrl:apk.browser_download_url};
 }catch(e){console.warn("Profi.UZ Android release check:",e);return null}
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
 const policy={...(config[os]||{})};
 if(os==="android"){
  const published=await findAndroidRelease();
  if(published){policy.latestVersionCode=published.latestVersionCode;policy.downloadUrl=published.downloadUrl}
  else {policy.latestVersionCode=0;policy.downloadUrl=""}
 }
 const current=await installedBuild();
 const newest=Number(policy.latestVersionCode)||0;
 const minimum=Number(policy.minimumVersionCode)||0;
 const url=typeof policy.downloadUrl==="string"&&/^https:\/\//.test(policy.downloadUrl)?policy.downloadUrl:"";
 let update=document.getElementById("profiMobileUpdate");
 if(!(current>0&&newest>current&&url)){
  if(update)update.remove();
  return;
 }
 if(dismissedVersion===newest)return;
 if(!update){
  update=document.createElement("div");
  update.id="profiMobileUpdate";
  update.setAttribute("role","dialog");
  update.setAttribute("aria-modal","false");
  update.setAttribute("aria-labelledby","profiUpdateTitle");
  update.style.cssText="position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(12,23,48,.48);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);box-sizing:border-box";
  document.body.append(update);
 }
 update.replaceChildren();
 const required=minimum>current;
 const panel=document.createElement("div");
 panel.style.cssText="position:relative;box-sizing:border-box;width:100%;max-width:360px;padding:30px 24px 24px;border-radius:24px;background:#fff;color:#172443;text-align:center;box-shadow:0 22px 70px rgba(8,22,53,.26);font-family:inherit";
 const symbol=document.createElement("div");
 symbol.textContent="↑";
 symbol.setAttribute("aria-hidden","true");
 symbol.style.cssText="width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#1263ef,#23b5ff);color:white;display:grid;place-items:center;font-size:34px;font-weight:700;margin:0 auto 16px";
 const heading=document.createElement("h2");
 heading.id="profiUpdateTitle";
 heading.textContent=translate("Обновление Profi.UZ","Profi.UZ yangilanishi","Навсозии Profi.UZ");
 heading.style.cssText="font-size:22px;line-height:1.3;font-weight:800;margin:0 0 10px;color:#14254a";
 const description=document.createElement("p");
 description.textContent=required?translate("Для продолжения работы установите новую версию приложения.","Ilovadan foydalanishni davom ettirish uchun yangi versiyani o‘rnating.","Барои идомаи кор версияи навро насб кунед."):translate("Доступна новая версия приложения. Обновите Profi.UZ, чтобы пользоваться улучшениями.","Ilovaning yangi versiyasi tayyor. Yangilanishlarni olish uchun Profi.UZ ni yangilang.","Версияи нави барнома дастрас аст. Барои истифодаи беҳбудиҳо навсозӣ кунед.");
 description.style.cssText="font-size:14px;line-height:1.55;color:#64718b;margin:0 0 22px";
 const action=document.createElement("a");
 action.href=url;action.target="_blank";action.rel="noopener noreferrer";
 action.textContent=translate("Обновить приложение","Ilovani yangilash","Навсозии барнома");
 action.style.cssText="display:block;padding:15px 18px;border-radius:14px;background:#145bea;color:#fff;text-decoration:none;font-size:16px;font-weight:750;text-align:center";
 panel.append(symbol,heading,description,action);
 if(!required){
  const later=document.createElement("button");
  later.type="button";
  later.textContent=translate("Позже","Keyinroq","Баъдтар");
  later.style.cssText="margin-top:14px;border:0;background:transparent;color:#71809b;font:600 14px inherit;padding:8px 18px;cursor:pointer";
  later.addEventListener("click",()=>{update.remove();dismissedVersion=newest});
  panel.append(later);
 }
 update.append(panel);
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

/* Server-managed mobile content and feature switches. No remote JavaScript execution. */
(function(){
 "use strict";
 const endpoint="https://profiuz.uz/mobile-config.json";
 const native=()=>window.Capacitor?.isNativePlatform?.()===true;
 let latest=null;
 function lang(){return document.documentElement.lang?.slice(0,2)||"ru"}
 function render(config){
  if(!native()||!config||config.schema!==1)return;
  latest=config;
  const bannerId="profiMobileAnnouncement";
  let banner=document.getElementById(bannerId);
  if(!banner){banner=document.createElement("div");banner.id=bannerId;banner.setAttribute("role","status");banner.style.cssText="padding:12px 16px;margin:10px auto;max-width:1080px;border-radius:12px;background:#edf4ff;color:#183d78;font-weight:600";document.body.prepend(banner)}
  const announcement=config.announcement||{};
  banner.hidden=!announcement.enabled;
  if(announcement.enabled)banner.textContent=announcement[lang()]||announcement.ru||"";
  const features=config.features||{};
  // Feature switches affect only explicitly supported UI sections.
  for(const [key,id] of Object.entries({transport:"transportApp"})){
   const element=document.getElementById(id);
   if(element&&typeof features[key]==="boolean")element.hidden=!features[key];
  }
  const latestCode=Number(config.android?.latestVersionCode);
  const currentCode=Number(window.PROFI_ANDROID_VERSION_CODE||1);
  let update=document.getElementById("profiMobileUpdate");
  if(!update){update=document.createElement("div");update.id="profiMobileUpdate";update.style.cssText="padding:10px 16px;text-align:center;background:#fff4dc;color:#704700";document.body.prepend(update)}
  update.hidden=!(latestCode>currentCode);
  if(!update.hidden){
   update.replaceChildren(document.createTextNode(lang()==="uz"?"Profi.UZ yangilanishi mavjud. ":lang()==="tj"?"Навсозии Profi.UZ дастрас аст. ":"Доступно обновление Profi.UZ. "));
   const a=document.createElement("a");
   a.href=config.android.downloadUrl||"https://github.com/tahirovdd-lang/profi-uz/actions/workflows/android-apk.yml";
   a.textContent=lang()==="uz"?"Yangilash":lang()==="tj"?"Навсозӣ":"Обновить";
   a.target="_blank";a.rel="noopener noreferrer";
   update.append(a);
  }
 }
 async function refresh(){
  if(!native())return;
  try{
   const response=await fetch(endpoint+"?t="+Date.now(),{cache:"no-store"});
   if(!response.ok)throw Error("HTTP "+response.status);
   const config=await response.json();
   render(config);
  }catch(error){console.warn("Profi.UZ mobile config unavailable; keeping built-in defaults",error)}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",refresh,{once:true});else refresh();
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
 document.querySelectorAll("[data-lang]").forEach(el=>el.addEventListener("click",()=>{if(latest)setTimeout(()=>render(latest),0)}));
})();

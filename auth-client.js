/* Profi.UZ auth: persistent Supabase session with verified native writes. */
(function(){
 "use strict";
 const cfg=window.PROFI_SUPABASE;
 if(!window.supabase?.createClient||!cfg?.url||!cfg?.publishableKey)return;
 const key="sb-"+new URL(cfg.url).hostname.split(".")[0]+"-auth-token";
 const native=window.Capacitor?.isNativePlatform?.()===true;
 const preferences=native?window.Capacitor?.Plugins?.Preferences:null;
 const report=(stage,error)=>{
  const message=String(error?.message||error||"unknown");
  console.error("Profi.UZ auth storage:",stage,message);
  window.PROFI_AUTH_STORAGE_ERROR=stage+": "+message;
 };
 const storage={
  async getItem(k){
   let saved=null;
   if(preferences){
    try{saved=(await preferences.get({key:k})).value}catch(e){report("native-read",e)}
   }
   if(saved!==null&&saved!==undefined)return saved;
   try{
    const old=window.localStorage.getItem(k);
    if(old!==null){
     if(preferences)try{await preferences.set({key:k,value:old})}catch(e){report("native-migrate",e)}
     return old;
    }
   }catch(e){report("browser-read",e)}
   return null;
  },
  async setItem(k,value){
   // Keep two independent durable copies so failure of one store cannot silently log out the user.
   let ok=false;
   if(preferences)try{await preferences.set({key:k,value});ok=true}catch(e){report("native-write",e)}
   try{window.localStorage.setItem(k,value);ok=true}catch(e){report("browser-write",e)}
   if(!ok)throw Error("Unable to persist authentication. Enable app storage.");
  },
  async removeItem(k){
   if(preferences)try{await preferences.remove({key:k})}catch(e){report("native-remove",e)}
   try{window.localStorage.removeItem(k)}catch(e){report("browser-remove",e)}
  }
 };
 window.PROFI_AUTH_STORAGE=storage;
 window.PROFI_AUTH_STORAGE_KEY=key;
 window.PROFI_DB=window.supabase.createClient(cfg.url,cfg.publishableKey,{
  auth:{storageKey:key,storage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:!native,flowType:"pkce"}
 });
})();

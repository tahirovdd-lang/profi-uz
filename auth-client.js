/* Shared Supabase client. Persist mobile sessions in Android native Preferences. */
(function(){
 "use strict";
 const cfg=window.PROFI_SUPABASE;
 if(!window.supabase?.createClient||!cfg?.url||!cfg?.publishableKey)return;
 const key="sb-"+new URL(cfg.url).hostname.split(".")[0]+"-auth-token";
 const isNative=window.Capacitor?.isNativePlatform?.()===true;
 const preferences=isNative?window.Capacitor?.Plugins?.Preferences:null;
 const storage=preferences?{
   async getItem(k){
     const {value}=await preferences.get({key:k});
     if(value!==null&&value!==undefined)return value;
     // Upgrade existing installs without logging users out.
     let legacy=null;
     try{legacy=window.localStorage.getItem(k)}catch(_){}
     if(legacy!==null){
       await preferences.set({key:k,value:legacy});
       return legacy;
     }
     return null;
   },
   async setItem(k,value){
     await preferences.set({key:k,value});
     try{window.localStorage.removeItem(k)}catch(_){}
   },
   async removeItem(k){
     await preferences.remove({key:k});
     try{window.localStorage.removeItem(k)}catch(_){}
   }
 }:window.localStorage;
 window.PROFI_DB=window.supabase.createClient(cfg.url,cfg.publishableKey,{
  auth:{storageKey:key,storage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:!isNative,flowType:"pkce"}
 });
})();

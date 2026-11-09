/* Shared Supabase auth client: a single session listener and token refresh owner. */
(function(){
 "use strict";
 const cfg=window.PROFI_SUPABASE;
 if(!window.supabase?.createClient||!cfg?.url||!cfg?.publishableKey)return;
 window.PROFI_DB=window.supabase.createClient(cfg.url,cfg.publishableKey,{
  auth:{storageKey:"sb-"+new URL(cfg.url).hostname.split(".")[0]+"-auth-token",storage:window.localStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}
 });
})();

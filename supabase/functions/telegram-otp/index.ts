// Supabase Edge Function: telegram-otp (deploy with --no-verify-jwt).
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_OTP_PEPPER, SUPABASE_SERVICE_ROLE_KEY.
// Set TELEGRAM_BOT_USERNAME=Profiuzbekistan_bot and PUBLIC_SITE_ORIGIN=https://tahirovdd-lang.github.io
import { createClient } from "npm:@supabase/supabase-js@2";
const env=(key:string)=>Deno.env.get(key)||"";
const db=createClient(env("SUPABASE_URL"),env("SUPABASE_SERVICE_ROLE_KEY"),{auth:{autoRefreshToken:false,persistSession:false}});
const allowed=env("PUBLIC_SITE_ORIGIN")||"https://tahirovdd-lang.github.io";
const headers={"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const sha=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,"0")).join("");
const telegram=async(method:string,payload:Record<string,unknown>)=>{const r=await fetch("https://api.telegram.org/bot"+env("TELEGRAM_BOT_TOKEN")+"/"+method,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw Error("Telegram request failed");return r.json()};
const goodUuid=(v:unknown)=>typeof v==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 if(!env("TELEGRAM_BOT_TOKEN")||!env("TELEGRAM_OTP_PEPPER")||!env("SUPABASE_SERVICE_ROLE_KEY")||!env("TELEGRAM_WEBHOOK_SECRET"))return json({error:"Server configuration incomplete"},503);
 const url=new URL(req.url);
 if(url.pathname.endsWith("/webhook")){
  if(req.headers.get("X-Telegram-Bot-Api-Secret-Token")!==env("TELEGRAM_WEBHOOK_SECRET"))return json({error:"Unauthorized"},401);
  const update=await req.json().catch(()=>null);
  const message=update?.message;
  const match=typeof message?.text==="string"?message.text.match(/^\/start\s+([a-f0-9-]{36})$/i):null;
  if(!match||!goodUuid(match[1])||!Number.isSafeInteger(message?.from?.id))return json({ok:true});
  const id=match[1],tgId=message.from.id;
  const {data:challenge,error}=await db.from("telegram_login_challenges").select("id,expires_at,consumed,telegram_id,attempts").eq("id",id).maybeSingle();
  if(error||!challenge||challenge.consumed||Date.parse(challenge.expires_at)<=Date.now()||challenge.attempts>=5||challenge.telegram_id&&Number(challenge.telegram_id)!==tgId)return json({ok:true});
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");
  const hash=await sha(id+":"+code+":"+env("TELEGRAM_OTP_PEPPER"));
  const name=String(message.from.first_name||"").slice(0,70);
  const {error:saveError}=await db.from("telegram_login_challenges").update({telegram_id:tgId,telegram_name:name,code_hash:hash,attempts:0}).eq("id",id).eq("consumed",false);
  if(saveError)return json({ok:false},500);
  await telegram("sendMessage",{chat_id:message.chat.id,text:"🔐 Profi.UZ\n\nВаш код для входа: "+code+"\n\nКод действует 5 минут. Никому его не сообщайте.\n\nProfi.UZ kirish kodi: "+code+"\nKod 5 daqiqa amal qiladi. Uni hech kimga bermang."});
  return json({ok:true});
 }
 if(req.headers.get("origin")&&req.headers.get("origin")!==allowed)return json({error:"Origin not allowed"},403);
 const body=await req.json().catch(()=>null);
 if(body?.action==="start"){
  const id=crypto.randomUUID();
  const {error}=await db.from("telegram_login_challenges").insert({id});
  if(error)return json({error:"Could not start login"},500);
  return json({challenge_id:id,bot_url:"https://t.me/"+(env("TELEGRAM_BOT_USERNAME")||"Profiuzbekistan_bot")+"?start="+id,expires_in:300});
 }
 if(body?.action==="verify"){
  if(!goodUuid(body.challenge_id)||!/^\d{6}$/.test(String(body.code||"")))return json({error:"Invalid code"},400);
  const hash=await sha(body.challenge_id+":"+body.code+":"+env("TELEGRAM_OTP_PEPPER"));
  const {data,error}=await db.rpc("consume_telegram_login_code",{p_id:body.challenge_id,p_hash:hash});
  if(error)return json({error:"Verification unavailable"},503);
  const identity=data?.[0];
  if(!identity)return json({error:"Incorrect, expired or already used code"},401);
  // Synthetic email is an internal identity key; no real email is requested from the user.
  const email="telegram-"+identity.telegram_id+"@auth.profiuz.example";
  const {data:link,error:linkError}=await db.auth.admin.generateLink({type:"magiclink",email,options:{data:{telegram_id:String(identity.telegram_id),first_name:identity.telegram_name||""}}});
  if(linkError||!link?.properties?.hashed_token)return json({error:"Could not create login session"},503);
  return json({token_hash:link.properties.hashed_token,type:"magiclink"});
 }
 return json({error:"Unknown action"},400);
});

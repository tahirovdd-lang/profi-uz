/* Profi.UZ Telegram code login; integrates with existing Supabase auth sheet. */
(()=>{
"use strict";
const social=document.getElementById("socialAuth");
const db=window.PROFI_DB;
const cfg=window.PROFI_SUPABASE;
if(!social||!db||!cfg?.url)return;
const endpoint=cfg.url.replace(/\/$/,"")+"/functions/v1/telegram-auth";
const labels={
ru:{button:"Продолжить с Telegram",title:"Вход через Telegram",hint:"Откройте бота, нажмите START и введите шестизначный код из сообщения.",open:"Открыть Telegram-бота",code:"Код из Telegram",verify:"Подтвердить вход",again:"Получить новый код",cancel:"Отмена",wait:"Проверяем код…",starting:"Создаём запрос…",expired:"Срок действия кода истёк. Запросите новый.",success:"Вход выполнен.",error:"Не удалось выполнить вход. Попробуйте ещё раз.",invalid:"Введите 6 цифр.",browser:"Если бот не открылся, нажмите «Открыть Telegram-бота»."},
uz:{button:"Telegram orqali davom etish",title:"Telegram orqali kirish",hint:"Botni oching, START tugmasini bosing va xabardagi 6 xonali kodni kiriting.",open:"Telegram botini ochish",code:"Telegram kodi",verify:"Kirishni tasdiqlash",again:"Yangi kod olish",cancel:"Bekor qilish",wait:"Kod tekshirilmoqda…",starting:"So‘rov yaratilmoqda…",expired:"Kod muddati tugadi. Yangi kod oling.",success:"Kirish muvaffaqiyatli.",error:"Kirish amalga oshmadi. Qayta urinib ko‘ring.",invalid:"6 ta raqam kiriting.",browser:"Bot ochilmasa, «Telegram botini ochish» tugmasini bosing."},
tj:{button:"Бо Telegram идома диҳед",title:"Воридшавӣ бо Telegram",hint:"Ботро кушоед, START-ро пахш кунед ва рамзи 6-рақамаро ворид намоед.",open:"Кушодани боти Telegram",code:"Рамзи Telegram",verify:"Тасдиқи воридшавӣ",again:"Гирифтани рамзи нав",cancel:"Бекор кардан",wait:"Санҷиши рамз…",starting:"Эҷоди дархост…",expired:"Муҳлати рамз гузашт. Рамзи нав гиред.",success:"Воридшавӣ анҷом ёфт.",error:"Воридшавӣ муяссар нашуд. Боз кӯшиш кунед.",invalid:"6 рақам ворид кунед.",browser:"Агар бот кушода нашавад, тугмаи кушодани ботро пахш кунед."}
};
const l=()=>labels[localStorage.getItem("profi_lang")]||labels.ru;
const css=document.createElement("style");
css.textContent=`#profiTelegramPanel{border:1px solid #e3e8f0;border-radius:14px;padding:15px;margin:12px 0;background:#f8faff}#profiTelegramPanel[hidden]{display:none!important}#profiTelegramPanel h3{font-size:17px;margin:0 0 8px}#profiTelegramPanel p{font-size:13px;line-height:1.5;margin:7px 0 12px;color:#526078}#profiTelegramPanel input{font-size:22px;letter-spacing:7px;text-align:center;width:100%;box-sizing:border-box;min-height:51px;border:1px solid #dce2ea;border-radius:12px;background:#fff}#profiTelegramPanel .tg-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#profiTelegramPanel .tg-actions button,#profiTelegramPanel .tg-open{flex:1;min-width:115px;padding:12px;border-radius:11px;font-weight:700}#profiTelegramPanel .tg-open{display:block;text-align:center;background:#229ed9;color:#fff;text-decoration:none}#profiTelegramPanel .tg-confirm{background:#f02e52;color:#fff}#profiTelegramPanel .tg-secondary{background:#e8edf5;color:#27354a}#profiTelegramPanel button:disabled{opacity:.55;cursor:wait}#profiTelegramStatus{font-size:13px;min-height:18px;margin-top:9px;overflow-wrap:anywhere}`;
document.head.append(css);
const btn=document.createElement("button");btn.id="telegramLogin";btn.type="button";btn.className="social-auth-button";
const logo=document.createElement("span");logo.textContent="✈";logo.style.cssText="color:#229ed9;font-size:23px;line-height:1";
const btnText=document.createElement("span");btn.append(logo,btnText);
const panel=document.createElement("div");panel.id="profiTelegramPanel";panel.hidden=true;
const title=document.createElement("h3"),hint=document.createElement("p"),link=document.createElement("a"),form=document.createElement("form"),codeLabel=document.createElement("label"),input=document.createElement("input"),actions=document.createElement("div"),confirm=document.createElement("button"),again=document.createElement("button"),cancel=document.createElement("button"),status=document.createElement("div");
link.className="tg-open";link.target="_blank";link.rel="noopener noreferrer";link.href="https://t.me/Profiuzbekistan_bot";
input.type="text";input.inputMode="numeric";input.autocomplete="one-time-code";input.maxLength=6;input.pattern="[0-9]{6}";input.required=true;input.placeholder="000000";input.setAttribute("aria-label","Telegram code");
actions.className="tg-actions";confirm.type="submit";confirm.className="tg-confirm";again.type="button";again.className="tg-secondary";cancel.type="button";cancel.className="tg-secondary";
status.id="profiTelegramStatus";status.setAttribute("role","status");codeLabel.style.display="block";codeLabel.style.marginBottom="8px";codeLabel.append(input);
actions.append(confirm,again,cancel);form.append(codeLabel,actions,status);panel.append(title,hint,link,form);
const apple=document.getElementById("appleLogin");if(apple)apple.after(btn,panel);else social.append(btn,panel);
let challenge=null,expiresAt=0,busy=false;
function translate(){const x=l();btnText.textContent=x.button;title.textContent=x.title;hint.textContent=x.hint;link.textContent=x.open;input.setAttribute("aria-label",x.code);confirm.textContent=x.verify;again.textContent=x.again;cancel.textContent=x.cancel}
function setStatus(message,bad=false){status.textContent=message;status.style.color=bad?"#bd2543":"#397b54"}
function setBusy(value){busy=value;btn.disabled=value;confirm.disabled=value;again.disabled=value;input.disabled=value}
async function call(body){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);try{const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.publishableKey},body:JSON.stringify(body),signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(typeof data.error==="string"?data.error:l().error);return data}finally{clearTimeout(timer)}}
async function openBot(url){if(window.Capacitor?.isNativePlatform?.()){try{const launcher=window.Capacitor?.Plugins?.AppLauncher;if(launcher?.openUrl){await launcher.openUrl({url});return}}catch(e){console.warn("Telegram AppLauncher:",e)}}try{window.open(url,"_blank","noopener,noreferrer")}catch(e){console.warn("Telegram browser:",e)}}
async function start(){if(busy)return;setBusy(true);panel.hidden=false;setStatus(l().starting);input.value="";challenge=null;try{const data=await call({action:"start"});if(!data.challenge||!data.bot_url)throw Error(l().error);challenge=data.challenge;expiresAt=Date.now()+Math.min(300,Number(data.expires_in)||300)*1000;link.href=data.bot_url;setStatus(l().browser);await openBot(data.bot_url);input.focus()}catch(e){setStatus(e.message||l().error,true)}finally{setBusy(false)}}
btn.addEventListener("click",start);again.addEventListener("click",start);cancel.addEventListener("click",()=>{panel.hidden=true;challenge=null;input.value="";setStatus("")});
form.addEventListener("submit",async event=>{event.preventDefault();if(busy)return;const code=input.value.trim();if(!/^\d{6}$/.test(code)){setStatus(l().invalid,true);return}if(!challenge||Date.now()>expiresAt){setStatus(l().expired,true);return}setBusy(true);setStatus(l().wait);try{const data=await call({action:"verify",challenge,code});if(!data.success||!data.access_token||!data.refresh_token)throw Error(l().error);const {data:session,error}=await db.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});if(error||!session?.session?.user)throw error||Error(l().error);challenge=null;input.value="";panel.hidden=true;setStatus(l().success);window.PROFI_AUTH_SHEET?.close?.()}catch(e){setStatus(e.message||l().error,true)}finally{setBusy(false)}});
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(translate,0)));
translate();
})();

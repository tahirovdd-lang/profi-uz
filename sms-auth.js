(()=>{
"use strict";
const $=id=>document.getElementById(id),cfg=window.PROFI_SUPABASE;
if(!cfg?.publishableKey||!window.supabase?.createClient||!$("smsAuth"))return;
const db=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const labels={ru:{title:"Вход по номеру телефона",phone:"Номер телефона Узбекистана",request:"Получить SMS-код",code:"Код из SMS",confirm:"Подтвердить",back:"Изменить номер",sent:"Код отправлен. Проверьте SMS.",success:"Номер подтверждён. Вы вошли в аккаунт.",invalid:"Введите корректный номер +998 и 9 цифр.",error:"Ошибка"},uz:{title:"Telefon raqami orqali kirish",phone:"O‘zbekiston telefon raqami",request:"SMS-kod olish",code:"SMS-kod",confirm:"Tasdiqlash",back:"Raqamni o‘zgartirish",sent:"Kod yuborildi. SMSni tekshiring.",success:"Raqam tasdiqlandi. Siz tizimga kirdingiz.",invalid:"+998 bilan 9 xonali raqam kiriting.",error:"Xatolik"},tj:{title:"Воридшавӣ бо рақами телефон",phone:"Рақами телефони Ӯзбекистон",request:"Гирифтани SMS-рамз",code:"Рамз аз SMS",confirm:"Тасдиқ",back:"Иваз кардани рақам",sent:"Рамз фиристода шуд. SMS-ро санҷед.",success:"Рақам тасдиқ шуд. Шумо ворид шудед.",invalid:"Рақами дурусти +998 ва 9 рақамро ворид кунед.",error:"Хато"}};
const t=()=>labels[localStorage.getItem("profi_lang")]||labels.ru;
const status=(text,bad=false)=>{$("smsStatus").textContent=text;$("smsStatus").style.color=bad?"#bd2543":"#397b54"};
let requestedPhone="",lastRequest=0;
function translate(){document.querySelectorAll("[data-sms]").forEach(x=>x.textContent=t()[x.dataset.sms]||"")}
function phone(){const digits=$("smsPhone").value.replace(/\D/g,"");const local=digits.startsWith("998")&&digits.length===12?digits.slice(3):digits;return /^\d{9}$/.test(local)?"+998"+local:null}
function busy(value){$("smsRequest").disabled=value;$("smsConfirm").disabled=value}
$("smsStart").onsubmit=async e=>{e.preventDefault();const p=phone();if(!p)return status(t().invalid,true);if(Date.now()-lastRequest<60000)return status("Подождите 60 секунд перед повторной отправкой.",true);busy(true);const {error}=await db.auth.signInWithOtp({phone:p,options:{channel:"sms"}});busy(false);if(error)return status(t().error+": "+error.message,true);requestedPhone=p;lastRequest=Date.now();$("smsStart").hidden=true;$("smsVerify").hidden=false;status(t().sent);$("smsCode").focus()};
$("smsVerify").onsubmit=async e=>{e.preventDefault();const token=$("smsCode").value.trim();if(!/^\d{6}$/.test(token))return;busy(true);const {error}=await db.auth.verifyOtp({phone:requestedPhone,token,type:"sms"});busy(false);if(error)return status(t().error+": "+error.message,true);status(t().success);$("smsCode").value="";$("smsVerify").hidden=true;$("smsStart").hidden=false};
$("smsBack").onclick=()=>{$("smsVerify").hidden=true;$("smsStart").hidden=false;status("")};
db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>{$("smsAuth").hidden=!!session?.user},0)});
db.auth.getSession().then(({data})=>{$("smsAuth").hidden=!!data?.session?.user});
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",translate));translate();
})();

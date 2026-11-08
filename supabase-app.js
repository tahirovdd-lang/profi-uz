/* Profi.UZ real account + orders (Samarkand MVP).
   Auth uses Supabase email OTP. No passwords or secret keys are stored in the source.
   Legacy demo forms remain local-only until full migration. */
(function(){
"use strict";
const cfg=window.PROFI_SUPABASE;
const root=document.getElementById("liveApp");
if(!root||!cfg?.publishableKey)return;
const tr={
ru:{title:"Личный кабинет онлайн",sub:"Реальные аккаунты и заказы через Supabase. Пока вход по электронной почте.",email:"Ваш email",send:"Отправить ссылку для входа",sent:"Проверьте почту и перейдите по ссылке для входа.",logout:"Выйти",signed:"Вы вошли как",service:"Услуга",desc:"Опишите задачу (минимум 5 символов)",post:"Опубликовать заказ",orders:"Мои заказы",loading:"Загрузка...",empty:"Заказов пока нет",need:"Сначала войдите в аккаунт",error:"Ошибка",created:"Заказ опубликован",logoutdone:"Вы вышли",notice:"Для специалиста и переписки будет отдельный этап. Демо-форма выше сохраняет заявки только на устройстве.",check:"Если письмо не пришло, проверьте спам."},
uz:{title:"Onlayn shaxsiy kabinet",sub:"Supabase orqali haqiqiy akkauntlar va buyurtmalar. Hozircha email orqali kirish.",email:"Email manzilingiz",send:"Kirish havolasini yuborish",sent:"Pochtangizni tekshiring va kirish havolasini bosing.",logout:"Chiqish",signed:"Siz kirdingiz:",service:"Xizmat",desc:"Vazifani tasvirlang (kamida 5 belgi)",post:"Buyurtma berish",orders:"Mening buyurtmalarim",loading:"Yuklanmoqda...",empty:"Buyurtmalar yo‘q",need:"Avval tizimga kiring",error:"Xatolik",created:"Buyurtma e’lon qilindi",logoutdone:"Siz chiqdingiz",notice:"Mutaxassislar va chat keyingi bosqichda. Yuqoridagi demo forma buyurtmalarni faqat qurilmada saqlaydi.",check:"Xat kelmasa, spam papkasini tekshiring."},
tj:{title:"Кабинети онлайни шахсӣ",sub:"Ҳисобҳо ва фармоишҳои воқеӣ тавассути Supabase. Ҳоло воридшавӣ бо email.",email:"Почтаи электронӣ",send:"Фиристодани пайванди воридшавӣ",sent:"Почтаро санҷед ва пайванди воридшавиро кушоед.",logout:"Баромадан",signed:"Шумо ворид шудед:",service:"Хизмат",desc:"Вазифаро тавсиф кунед (на камтар аз 5 аломат)",post:"Нашри фармоиш",orders:"Фармоишҳои ман",loading:"Боргирӣ...",empty:"Ҳоло фармоиш нест",need:"Аввал ворид шавед",error:"Хато",created:"Фармоиш нашр шуд",logoutdone:"Шумо баромадед",notice:"Мутахассисон ва чат дар марҳилаи оянда. Формаи намоишии боло маълумотро танҳо дар дастгоҳ нигоҳ медорад.",check:"Агар мактуб наояд, папкаи спамро бинед."}
};
const $=id=>document.getElementById(id);
const t=()=>tr[localStorage.getItem("profi_lang")]||tr.ru;
let db=null, user=null;
const msg=(value,err=false)=>{const m=$("liveMsg");m.textContent=value;m.style.color=err?"#bf2649":"#397b54"};
function translate(){const x=t();document.querySelectorAll("[data-live]").forEach(e=>{e.textContent=x[e.dataset.live]||""});$("liveEmail").placeholder=x.email;$("liveDescription").placeholder=x.desc;renderSession()}
function renderSession(){const signed=!!user;$("liveLogin").hidden=signed;$("liveSigned").hidden=!signed;$("liveOrderForm").hidden=!signed;$("liveOrderList").hidden=!signed;$("liveUser").textContent=signed?t().signed+" "+(user.email||""):t().need}
async function loadOrders(){if(!user)return;const box=$("liveOrders");box.replaceChildren();box.textContent=t().loading;const {data,error}=await db.from("orders").select("id,category,description,status,created_at").eq("client_id",user.id).order("created_at",{ascending:false}).limit(30);box.replaceChildren();if(error){msg(error.message,true);return}if(!data?.length){box.textContent=t().empty;return}for(const o of data){const card=document.createElement("div");card.className="dashitem";const h=document.createElement("strong");h.textContent=o.category;const p=document.createElement("p");p.textContent=o.description;const status=document.createElement("span");status.className="tag";status.textContent=o.status;card.append(h,p,status);box.append(card)}}
async function sessionChanged(){const {data,error}=await db.auth.getUser();if(error&&error.name!=="AuthSessionMissingError")msg(error.message,true);user=data?.user||null;renderSession();if(user)await loadOrders()}
function init(){if(!window.supabase?.createClient){msg("Не удалось загрузить Supabase JS",true);return}db=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
db.auth.onAuthStateChange(()=>{setTimeout(sessionChanged,0)});
$("liveLogin").onsubmit=async e=>{e.preventDefault();const email=$("liveEmail").value.trim();if(!email)return;const btn=$("liveSend");btn.disabled=true;const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});btn.disabled=false;msg(error?t().error+": "+error.message:t().sent+" "+t().check,!!error)};
$("liveLogout").onclick=async()=>{const {error}=await db.auth.signOut();if(error)msg(error.message,true);else{user=null;renderSession();msg(t().logoutdone)}};
$("liveOrderForm").onsubmit=async e=>{e.preventDefault();if(!user)return msg(t().need,true);const description=$("liveDescription").value.trim(),category=$("liveCategory").value;if(description.length<5)return;const btn=$("livePost");btn.disabled=true;const {error}=await db.from("orders").insert({client_id:user.id,category,description,city:"Samarkand"});btn.disabled=false;if(error){msg(t().error+": "+error.message,true)}else{$("liveDescription").value="";msg(t().created);await loadOrders()}};
sessionChanged();
}
for(const c of [["Ремонт и строительство","Ta’mirlash va qurilish","Таъмир ва сохтмон"],["Электрики","Elektriklar","Барқчиён"],["Уборка","Tozalash","Тозакунӣ"],["Репетиторы","Repetitorlar","Омӯзгорони хусусӣ"],["Красота","Go‘zallik","Зебоӣ"],["IT и дизайн","IT va dizayn","IT ва дизайн"],["Автоуслуги","Avtoxizmatlar","Хизматҳои автомобилӣ"],["Фото и видео","Foto va video","Акс ва видео"]]){const o=document.createElement("option");o.value=c[0];o.textContent=c[0];$("liveCategory").append(o)}
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",translate));
translate();init();
})();

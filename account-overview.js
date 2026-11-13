/* Profi.UZ account overview: client and specialist metrics, no schema changes. */
(()=>{"use strict";
const db=window.PROFI_DB,root=document.getElementById("liveSigned");if(!db||!root)return;
const panel=document.createElement("section");panel.id="profiAccountOverview";panel.className="dashpanel";panel.style.cssText="margin:14px 0 18px";
root.insertAdjacentElement("afterend",panel);
const lang=()=>["ru","uz","tj"].includes(localStorage.getItem("profi_lang"))?localStorage.getItem("profi_lang"):"ru";
const tr=(ru,uz,tj)=>({ru,uz,tj})[lang()];
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
let current="",busy=false,version=0,refreshTimer=0;
const money=n=>Number(n||0).toLocaleString("ru-RU")+" "+tr("сум","so‘m","сӯм");
function role(){const pro=document.getElementById("proMode");return !!pro&&!pro.hidden&&pro.classList.contains("primary")?"specialist":"client"}
function stat(container,label,value){const card=el("div","profi-overview-stat");card.style.cssText="padding:16px;border:1px solid #e6e8ee;border-radius:14px;background:var(--card,#fff)";card.append(el("div","",label));const number=el("strong","",String(value));number.style.cssText="display:block;font-size:clamp(19px,2.5vw,28px);margin-top:8px;overflow-wrap:anywhere";card.append(number);container.append(card)}
function jump(label,id){const b=el("button","outline",label);b.type="button";b.onclick=()=>{const target=document.getElementById(id);if(target){target.scrollIntoView({behavior:"smooth",block:"start"});if(target.hidden)target.hidden=false}};return b}
function shell(){panel.replaceChildren();const head=el("div");head.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap";head.append(el("h3","",tr("Мой профиль · Обзор","Mening profilim · Umumiy","Профили ман · Шарҳ")));const reload=el("button","outline",tr("Обновить","Yangilash","Навсозӣ"));reload.type="button";reload.onclick=()=>load(true);head.append(reload);panel.append(head);return panel}
function draw(roleName,orders,proposals,acceptedOrders){const grid=el("div");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:16px 0";
const completed=orders.filter(o=>o.status==="completed").length,open=orders.filter(o=>o.status==="open").length,waiting=roleName==="client"?orders.filter(o=>o.status==="open"&&!proposals.some(p=>p.order_id===o.id)).length:orders.filter(o=>o.status==="open").length;
if(roleName==="specialist"){
 const earned=acceptedOrders.filter(o=>o.status==="completed").reduce((sum,o)=>sum+Number(o.price||0),0);
 stat(grid,tr("Заработано по завершённым заказам*","Yakunlangan buyurtmalar bo‘yicha daromad*","Даромад аз фармоишҳои анҷомшуда*"),money(earned));
 stat(grid,tr("Выполнено заказов","Bajarilgan buyurtmalar","Фармоишҳои анҷомшуда"),acceptedOrders.filter(o=>o.status==="completed").length);
 stat(grid,tr("В работе","Jarayonda","Дар иҷро"),acceptedOrders.filter(o=>o.status==="in_progress").length);
 stat(grid,tr("Доступные открытые заказы","Ochiq buyurtmalar","Фармоишҳои кушода"),open);
 stat(grid,tr("Ожидают моего отклика","Javobimni kutmoqda","Посухи маро интизоранд"),waiting);
 stat(grid,tr("Мои отклики","Mening takliflarim","Пешниҳодҳои ман"),proposals.length);
}else{
 stat(grid,tr("Всего заказов","Jami buyurtmalar","Ҳамаи фармоишҳо"),orders.length);
 stat(grid,tr("Завершено","Yakunlangan","Анҷомшуда"),completed);
 stat(grid,tr("Открытые заказы","Ochiq buyurtmalar","Фармоишҳои кушода"),open);
 stat(grid,tr("Без откликов","Taklifsiz","Бе пешниҳод"),waiting);
 stat(grid,tr("В работе","Jarayonda","Дар иҷро"),orders.filter(o=>o.status==="in_progress").length);
 stat(grid,tr("Получено откликов","Kelgan takliflar","Пешниҳодҳои гирифташуда"),proposals.length);
}
panel.append(grid);
if(roleName==="specialist")panel.append(el("p","empty",tr("*Расчёт по ценам принятых откликов на завершённые заказы; это не подтверждённые платежи.","*Yakunlangan buyurtmalardagi qabul qilingan taklif narxlari; tasdiqlangan to‘lov emas.","*Нархҳои пешниҳодҳои қабулшуда барои фармоишҳои анҷомшуда, на пардохти тасдиқшуда.")));
const nav=el("div");nav.style.cssText="display:flex;gap:8px;flex-wrap:wrap";nav.append(jump(tr("Избранные","Sevimlilar","Дӯстдоштаҳо"),"accountFavorites"),jump(tr("Уведомления","Bildirishnomalar","Огоҳиҳо"),"accountNotifications"),jump(tr("Мои заказы","Buyurtmalarim","Фармоишҳои ман"),roleName==="specialist"?"proMyWorks":"liveOrders"),jump(tr("Каталог специалистов","Mutaxassislar","Мутахассисон"),"proDirectory"));panel.append(nav)}
async function load(force=false){const {data}=await db.auth.getUser();const uid=data?.user?.id||"";if(!uid){current="";panel.hidden=true;return}panel.hidden=false;const mode=role(),key=uid+":"+mode;if(busy&&!force)return;current=key;const request=++version;busy=true;shell();panel.append(el("p","empty",tr("Загрузка показателей...","Ko‘rsatkichlar yuklanmoqda...","Нишондиҳандаҳо бор мешаванд...")));
try{let orders=[],proposals=[],accepted=[];
 if(mode==="client"){
 const r=await db.from("orders").select("id,status").eq("client_id",uid).limit(1000);if(r.error)throw r.error;orders=r.data||[];
 if(orders.length){const ids=orders.map(o=>o.id);for(let i=0;i<ids.length;i+=150){const p=await db.from("proposals").select("order_id").in("order_id",ids.slice(i,i+150)).limit(1000);if(p.error)throw p.error;proposals.push(...(p.data||[]))}}
 }else{
 const [o,p]=await Promise.all([db.from("orders").select("id,status,category,city,service_key,target_specialist_id,client_id").eq("status","open").limit(1000),db.from("proposals").select("order_id,status,price_uzs").eq("specialist_id",uid).limit(1000)]);if(o.error)throw o.error;if(p.error)throw p.error;
 const city=window.PROFI_LOCATION?.getCity?.()||"Samarkand";orders=(o.data||[]).filter(x=>x.client_id!==uid&&(!x.target_specialist_id||x.target_specialist_id===uid)&&(!x.target_specialist_id?x.city===city:true));
 proposals=p.data||[];const responded=new Set(proposals.map(p=>p.order_id));orders=orders.filter(x=>!responded.has(x.id));
 const approved=proposals.filter(p=>p.status==="accepted");const byId=new Map(approved.map(p=>[p.order_id,p]));const ids=[...byId.keys()];
 for(let i=0;i<ids.length;i+=150){const a=await db.from("orders").select("id,status").in("id",ids.slice(i,i+150));if(a.error)throw a.error;accepted.push(...(a.data||[]).map(x=>({...x,price:byId.get(x.id)?.price_uzs})))}
 }
 if(request!==version||current!==key)return;shell();draw(mode,orders,proposals,accepted);
 }catch(e){if(request!==version)return;shell();panel.append(el("p","empty",tr("Не удалось загрузить показатели: ","Ko‘rsatkichlarni yuklab bo‘lmadi: ","Боргирии нишондиҳандаҳо нашуд: ")+(e.message||e)))}
 finally{busy=false}}
function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>load(true),350)}
db.auth.onAuthStateChange(()=>setTimeout(schedule,150));
window.addEventListener("profi:role-selected",schedule);window.addEventListener("profi:orders-updated",schedule);window.addEventListener("profi:profile-updated",schedule);
document.querySelectorAll("[data-lang]").forEach(x=>x.addEventListener("click",schedule));
setTimeout(schedule,500);
})();

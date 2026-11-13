/* Specialist work history. Additive UI; existing orders/proposals stay unchanged. */
(()=>{
"use strict";
const db=window.PROFI_DB,feed=document.getElementById("proFeed");
if(!db||!feed)return;
const tr={ru:["Мои работы","Принятые","В работе","Завершённые","Нет заказов","Обновить","Заказ","Стоимость предложения","Статус заказа","Не удалось загрузить работы"],uz:["Mening ishlarim","Qabul qilingan","Jarayonda","Tugallangan","Buyurtmalar yo‘q","Yangilash","Buyurtma","Taklif narxi","Buyurtma holati","Ishlarni yuklab bo‘lmadi"],tj:["Корҳои ман","Қабулшуда","Дар иҷро","Анҷомёфта","Фармоиш нест","Навсозӣ","Фармоиш","Нархи пешниҳод","Ҳолати фармоиш","Боргирӣ нашуд"]};
const language=()=>document.documentElement.lang?.slice(0,2)==="uz"?"uz":document.documentElement.lang?.slice(0,2)==="tj"?"tj":"ru";
const txt=()=>tr[language()];
const section=document.createElement("div");section.className="dashpanel";section.id="proMyWorks";section.hidden=true;
section.style.marginTop="16px";
const heading=document.createElement("h3"),tabs=document.createElement("div"),list=document.createElement("div"),refresh=document.createElement("button");
tabs.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0";
refresh.type="button";refresh.className="outline";refresh.style.marginBottom="12px";
section.append(heading,tabs,refresh,list);feed.insertAdjacentElement("afterend",section);
let filter="accepted",currentUser="",loading=false,cache=[];
const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=value;return el};
function render(){
 const x=txt();heading.textContent=x[0];refresh.textContent=x[5];tabs.replaceChildren();
 ["accepted","in_progress","completed"].forEach((key,i)=>{const b=make("button",key===filter?"primary":"outline",x[i+1]);b.type="button";b.onclick=()=>{filter=key;render()};tabs.append(b)});
 list.replaceChildren();const matching=cache.filter(o=>filter==="accepted"?o.status==="open":o.status===filter);
 if(!matching.length){list.append(make("p","empty",x[4]));return}
 for(const o of matching){const card=make("div","dashitem");card.append(make("strong","",o.category||x[6]));if(o.service_key)card.append(make("p","",o.service_key));card.append(make("p","",o.description||""));card.append(make("span","tag",filter==="accepted"?x[1]:filter==="in_progress"?x[2]:x[3]));if(o.proposalPrice!=null)card.append(make("p","",x[7]+": "+Number(o.proposalPrice).toLocaleString("ru-RU")+" UZS"));list.append(card)}
}
async function load(){
 if(loading||!currentUser)return;loading=true;refresh.disabled=true;
 try{
  const {data:proposals,error:pe}=await db.from("proposals").select("order_id,status,price_uzs").eq("specialist_id",currentUser).eq("status","accepted").limit(200);
  if(pe)throw pe;
  const byId=new Map((proposals||[]).map(p=>[p.order_id,p]));
  if(!byId.size){cache=[];render();return}
  const {data:orders,error:oe}=await db.from("orders").select("id,category,description,service_key,status").in("id",[...byId.keys()]).limit(200);
  if(oe)throw oe;
  cache=(orders||[]).map(o=>({...o,proposalPrice:byId.get(o.id)?.price_uzs}));
  render();
 }catch(e){list.replaceChildren(make("p","empty",txt()[9]+": "+(e.message||"")))}
 finally{loading=false;refresh.disabled=false}
}
refresh.onclick=load;
async function sync(){
 const {data}=await db.auth.getUser();const uid=data?.user?.id||"";
 const specialist=document.getElementById("proMode");
 const active=!!uid&&specialist&&!specialist.hidden&&specialist.classList.contains("primary")&&!feed.hidden;
 section.hidden=!active;
 if(!active){if(uid!==currentUser){currentUser=uid;cache=[]}return}
 if(uid!==currentUser){currentUser=uid;cache=[]}
 await load();
}
db.auth.onAuthStateChange(()=>setTimeout(sync,250));
for(const id of ["proMode","clientMode","adminMode"])document.getElementById(id)?.addEventListener("click",()=>setTimeout(sync,100));
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!section.hidden)load()});
window.addEventListener("profi:orders-updated",()=>{if(!section.hidden)load()});
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(render,30)));
setTimeout(sync,600);
})();

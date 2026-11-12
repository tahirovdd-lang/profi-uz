/* Profi.UZ verification UI: additive, existing admin panel and auth stay intact. */
(()=>{"use strict";
const tr=(ru,uz,tj)=>({ru,uz,tj})[localStorage.getItem("profi_lang")||"ru"]||ru;
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x};
const admin=document.getElementById("profiAdminPanel"),root=document.getElementById("liveApp");
if(!admin||!root)return;
const section=el("section");section.id="profiVerificationAdmin";section.style.marginTop="24px";
const title=el("h3",tr("Проверка специалистов","Mutaxassislarni tekshirish","Санҷиши мутахассисон"));
const reload=el("button",tr("Обновить заявки","Arizalarni yangilash","Навсозии дархостҳо"));reload.className="outline";reload.type="button";
const message=el("p");message.className="msg";message.setAttribute("aria-live","polite");
const list=el("div");list.className="admin-profiles";section.append(title,reload,message,list);admin.append(section);
const request=el("div");request.className="dashpanel";request.style.marginTop="16px";request.hidden=true;
const reqTitle=el("h3",tr("Проверка специалиста","Mutaxassisni tasdiqlash","Тасдиқи мутахассис"));
const reqText=el("p");const reqButton=el("button",tr("Подать заявку на проверку","Tasdiqlash uchun ariza","Дархост барои тасдиқ"));reqButton.className="outline";reqButton.type="button";
request.append(reqTitle,reqText,reqButton);root.append(request);
const db=()=>window.PROFI_DB;
async function load(){
 if(admin.hidden||!db())return;
 message.textContent=tr("Загрузка...","Yuklanmoqda...","Боркунӣ...");list.replaceChildren();
 const {data,error}=await db().rpc("profi_admin_list_verifications");
 if(error){message.textContent=error.message;return}
 message.textContent=tr("Заявок: ","Arizalar: ","Дархостҳо: ")+(data||[]).length;
 for(const p of data||[]){
  const row=el("div");row.className="admin-profile-row";
  const info=el("div");info.append(el("strong",p.display_name||p.specialist_id),el("small",[p.category,p.city,p.status].filter(Boolean).join(" · ")));
  row.append(info);
  if(p.status==="pending"){
   const actions=el("div");actions.style.display="flex";actions.style.gap="8px";
   for(const [status,label] of [["verified",tr("Подтвердить","Tasdiqlash","Тасдиқ")],["rejected",tr("Отклонить","Rad etish","Рад кардан")]]){
    const b=el("button",label);b.className="outline";b.type="button";
    b.onclick=async()=>{if(!confirm(label+"?"))return;b.disabled=true;const {error}=await db().rpc("profi_admin_decide_verification",{p_specialist_id:p.specialist_id,p_status:status,p_note:""});if(error){message.textContent=error.message;b.disabled=false}else{await load();window.dispatchEvent(new Event("profi:profile-updated"))}};
    actions.append(b);
   }row.append(actions);
  }list.append(row);
 }
}
async function refreshRequest(){
 if(!db())return;
 const {data:{user},error}=await db().auth.getUser();if(error||!user){request.hidden=true;return}
 const {data:profile}=await db().from("profiles").select("role,account_enabled").eq("id",user.id).maybeSingle();
 request.hidden=profile?.role!=="specialist"||profile.account_enabled===false;
 if(request.hidden)return;
 const {data}=await db().from("profi_specialist_verifications").select("status,note").eq("specialist_id",user.id).maybeSingle();
 reqText.textContent=data?.status==="verified"?tr("Профиль подтверждён","Profil tasdiqlangan","Профил тасдиқ шуд"):data?.status==="pending"?tr("Заявка рассматривается","Ariza ko‘rib chiqilmoqda","Дархост баррасӣ мешавад"):data?.status==="rejected"?tr("Отклонено. Можно подать повторно.","Rad etildi. Qayta yuborish mumkin.","Рад шуд. Такроран фиристед."):tr("Подайте заявку для получения статуса «Проверен».","Tasdiqlangan maqomini olish uchun ariza yuboring.","Барои мақоми тасдиқшуда дархост диҳед.");
 reqButton.hidden=data?.status==="pending"||data?.status==="verified";
}
reload.onclick=load;
reqButton.onclick=async()=>{reqButton.disabled=true;const {error}=await db().rpc("profi_request_verification");reqButton.disabled=false;if(error)reqText.textContent=error.message;else await refreshRequest()};
const observer=new MutationObserver(()=>{if(!admin.hidden)load()});observer.observe(admin,{attributes:true,attributeFilter:["hidden"]});
db()?.auth.onAuthStateChange(()=>setTimeout(refreshRequest,200));
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(()=>{title.textContent=tr("Проверка специалистов","Mutaxassislarni tekshirish","Санҷиши мутахассисон");reqTitle.textContent=tr("Проверка специалиста","Mutaxassisni tasdiqlash","Тасдиқи мутахассис");refreshRequest()},50)));
setTimeout(()=>{refreshRequest();if(!admin.hidden)load()},1200);
})();
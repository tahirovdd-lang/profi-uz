/* Require a real name after first sign-in; reuse existing profile RPC and form. */
(()=>{
"use strict";
const form=document.getElementById("completeNameForm");
if(!form)return;
const first=document.getElementById("completeFirst");
const last=document.getElementById("completeLast");
const firstLabel=document.getElementById("completeFirstLabel");
const lastLabel=document.getElementById("completeLastLabel");
const dialog=document.createElement("div");
dialog.id="profiNamePrompt";
dialog.hidden=true;
const css=document.createElement("style");
css.textContent=`#profiNamePrompt[hidden]{display:none!important}#profiNamePrompt{position:fixed;inset:0;z-index:100100;display:flex;align-items:center;justify-content:center;background:rgba(13,24,44,.72);padding:18px}#profiNamePromptInner{width:min(100%,440px);max-height:95dvh;overflow:auto;background:white;border-radius:22px;padding:26px 22px;box-shadow:0 24px 65px #0004}#profiNamePromptInner h2{font-size:23px;margin:0 0 10px}#profiNamePromptInner p{font-size:14px;color:#627088;line-height:1.5}#profiNamePrompt #completeNameForm{display:block!important;max-width:none!important;padding:0!important;margin:16px 0 0!important;background:transparent;border:0;box-shadow:none}#profiNamePrompt #completeNameForm label{display:block!important;margin-top:12px}#profiNamePrompt #completeNameForm #completeLast{display:block!important}#profiNamePrompt #completeNameForm #completeEmail,#profiNamePrompt #completeNameForm #completeEmailLabel{display:none!important}#profiNamePrompt #completeNameSave{width:100%;margin-top:10px}body.profi-name-open{overflow:hidden}`;
document.head.append(css);
const inner=document.createElement("section");inner.id="profiNamePromptInner";inner.setAttribute("role","dialog");inner.setAttribute("aria-modal","true");inner.setAttribute("aria-labelledby","profiNamePromptHeading");
const heading=document.createElement("h2");heading.id="profiNamePromptHeading";
const description=document.createElement("p");
inner.append(heading,description,form);dialog.append(inner);document.body.append(dialog);
const t=(ru,uz,tj)=>({ru,uz,tj})[localStorage.getItem("profi_lang")||"ru"]||ru;
function translate(){heading.textContent=t("Как вас зовут?","Ismingiz va familiyangiz","Ному насаби шумо");description.textContent=t("Укажите имя и фамилию для создания профиля Profi.UZ. Это нужно сделать один раз.","Profi.UZ profilingiz uchun ism va familiyangizni kiriting. Bu faqat bir marta kerak.","Барои профили Profi.UZ ном ва насабатонро ворид кунед. Ин танҳо як бор лозим аст.");firstLabel.textContent=t("Имя","Ism","Ном");lastLabel.textContent=t("Фамилия","Familiya","Насаб");first.placeholder=firstLabel.textContent;last.placeholder=lastLabel.textContent}
function close(){dialog.hidden=true;document.body.classList.remove("profi-name-open")}
function open(){translate();if(!form.hidden){dialog.hidden=false;document.body.classList.add("profi-name-open");first.focus()}}
window.PROFI_NAME_PROMPT={open,close};
first.required=true;last.required=true;
form.addEventListener("submit",event=>{
 if(dialog.hidden)return;
 const a=first.value.trim(),b=last.value.trim();
 if(!a||!b){event.preventDefault();event.stopImmediatePropagation();(a?last:first).focus();return}
 first.value=b+" "+a;
},true);
const observer=new MutationObserver(()=>{if(!dialog.hidden&&form.hidden)close()});
observer.observe(form,{attributes:true,attributeFilter:["hidden"]});
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(translate,0)));
})();

/* Profi.UZ location selector: region and city, persisted per browser. */
(()=>{"use strict";
const regions=[
["Ташкент","Toshkent","Тошканд",["Tashkent"]],
["Ташкентская область","Toshkent viloyati","Вилояти Тошканд",["Nurafshon","Chirchiq","Angren","Olmaliq","Bekobod","Yangiyo‘l"]],
["Самаркандская область","Samarqand viloyati","Вилояти Самарқанд",["Samarkand","Kattakurgan","Urgut","Jomboy","Bulungur"]],
["Бухарская область","Buxoro viloyati","Вилояти Бухоро",["Bukhara","Kogon","Gijduvon"]],
["Андижанская область","Andijon viloyati","Вилояти Андиҷон",["Andijan","Asaka","Shahrixon","Xonobod"]],
["Ферганская область","Farg‘ona viloyati","Вилояти Фарғона",["Fergana","Kokand","Margilan","Quva"]],
["Наманганская область","Namangan viloyati","Вилояти Намангон",["Namangan","Chust","Chortoq","Pop"]],
["Кашкадарьинская область","Qashqadaryo viloyati","Вилояти Қашқадарё",["Karshi","Shahrisabz","Kitob","Guzor"]],
["Сурхандарьинская область","Surxondaryo viloyati","Вилояти Сурхондарё",["Termez","Denov","Sherobod"]],
["Джизакская область","Jizzax viloyati","Вилояти Ҷиззах",["Jizzakh","Gallaorol","Dashtobod"]],
["Сырдарьинская область","Sirdaryo viloyati","Вилояти Сирдарё",["Gulistan","Yangiyer","Shirin"]],
["Навоийская область","Navoiy viloyati","Вилояти Навоӣ",["Navoi","Zarafshan","Karmana"]],
["Хорезмская область","Xorazm viloyati","Вилояти Хоразм",["Urgench","Khiva","Hazorasp"]],
["Республика Каракалпакстан","Qoraqalpog‘iston Respublikasi","Ҷумҳурии Қароқалпоқистон",["Nukus","Beruniy","Khujayli","Muynak"]]
];
const names={Samarkand:["Самарканд","Samarqand","Самарқанд"],Tashkent:["Ташкент","Toshkent","Тошканд"],Bukhara:["Бухара","Buxoro","Бухоро"],Andijan:["Андижан","Andijon","Андиҷон"],Fergana:["Фергана","Farg‘ona","Фарғона"],Kokand:["Коканд","Qo‘qon","Қӯқанд"],Margilan:["Маргилан","Marg‘ilon","Марғилон"],Namangan:["Наманган","Namangan","Намангон"],Karshi:["Карши","Qarshi","Қаршӣ"],Termez:["Термез","Termiz","Тирмиз"],Jizzakh:["Джизак","Jizzax","Ҷиззах"],Gulistan:["Гулистан","Guliston","Гулистон"],Navoi:["Навои","Navoiy","Навоӣ"],Urgench:["Ургенч","Urganch","Урганҷ"],Khiva:["Хива","Xiva","Хива"],Nukus:["Нукус","Nukus","Нукус"]};
const langs=["ru","uz","tj"];const phrases={ru:["Выберите регион и город","Регион","Город","Сохранить","Отмена","Другой населённый пункт","Название населённого пункта"],uz:["Viloyat va shaharni tanlang","Viloyat","Shahar","Saqlash","Bekor qilish","Boshqa aholi punkti","Aholi punkti nomi"],tj:["Вилоят ва шаҳрро интихоб кунед","Вилоят","Шаҳр","Сабт кардан","Бекор кардан","Маҳалли дигар","Номи маҳалли аҳолинишин"]};
const el=id=>document.getElementById(id),locale=()=>langs.includes(localStorage.getItem("profi_lang"))?localStorage.getItem("profi_lang"):"ru";
let city=localStorage.getItem("profi_city")||"Samarkand",region=localStorage.getItem("profi_region")||"Самаркандская область";
function display(n){return names[n]?.[langs.indexOf(locale())]||n}
function update(){el("locationName").textContent=display(city);const p=phrases[locale()];["locationTitle","regionLabel","cityLabel","locationSave","locationCancel"].forEach((id,i)=>el(id).textContent=p[i]);el("customCity").placeholder=p[6];document.querySelectorAll('[data-i="sub"]').forEach(x=>x.textContent=({ru:"Поиск услуг: ",uz:"Xizmatlar qidiruvi: ",tj:"Ҷустуҷӯи хизматрасонӣ: "})[locale()]+display(city));document.querySelectorAll('[data-live="sub"]').forEach(x=>x.textContent=({ru:"Заказы и отклики: ",uz:"Buyurtmalar va takliflar: ",tj:"Фармоишҳо ва пешниҳодҳо: "})[locale()]+display(city))}
function fillCities(){const r=regions.find(x=>x[0]===el("regionSelect").value)||regions[2];el("citySelect").replaceChildren();for(const n of [...r[3],"__other"]){const opt=document.createElement("option");opt.value=n;opt.textContent=n==="__other"?phrases[locale()][5]:display(n);el("citySelect").append(opt)}el("customCity").hidden=true}
function open(){const rs=el("regionSelect");rs.replaceChildren();for(const r of regions){const o=document.createElement("option");o.value=r[0];o.textContent=r[langs.indexOf(locale())];rs.append(o)}rs.value=regions.some(r=>r[0]===region)?region:regions[2][0];fillCities();if([...el("citySelect").options].some(o=>o.value===city))el("citySelect").value=city;else{el("citySelect").value="__other";el("customCity").hidden=false;el("customCity").value=city}update();el("locationDialog").showModal()}
el("locationOpen").onclick=open;el("locationCancel").onclick=()=>el("locationDialog").close();el("regionSelect").onchange=fillCities;el("citySelect").onchange=()=>{el("customCity").hidden=el("citySelect").value!=="__other"};
el("locationSave").onclick=()=>{const v=el("citySelect").value==="__other"?el("customCity").value.trim():el("citySelect").value;if(!v)return el("customCity").focus();city=v;region=el("regionSelect").value;localStorage.setItem("profi_city",city);localStorage.setItem("profi_region",region);el("locationDialog").close();update();window.dispatchEvent(new CustomEvent("profi:location-change",{detail:{city,region}}))};
window.PROFI_LOCATION={getCity:()=>city,getRegion:()=>region,refresh:update};document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>setTimeout(update,0)));update();
})();
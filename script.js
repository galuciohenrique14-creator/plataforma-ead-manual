"use strict";
const KEYS={theme:"manual-ead-theme",quick:"manual-ead-quick-steps",checks:"manual-ead-submission-checklist"};
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
function read(k,fallback){try{return JSON.parse(storage.get(k))??fallback}catch{return fallback}}
const root=document.documentElement,themeButton=document.getElementById("theme-button");
function setTheme(theme){root.dataset.theme=theme;document.getElementById("theme-icon").textContent=theme==="dark"?"☀":"☾";document.getElementById("theme-label").textContent=theme==="dark"?"Modo claro":"Modo escuro";themeButton.setAttribute("aria-label",theme==="dark"?"Ativar modo claro":"Ativar modo escuro");document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#0d1724":"#f5f8fc")}
setTheme(storage.get(KEYS.theme)||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
themeButton.addEventListener("click",()=>{const next=root.dataset.theme==="dark"?"light":"dark";storage.set(KEYS.theme,next);setTheme(next)});
document.getElementById("print-button").addEventListener("click",()=>print());

// Menu responsivo e fechamento por Escape.
const sidebar=document.getElementById("sidebar"),backdrop=document.getElementById("backdrop"),menuButton=document.getElementById("mobile-menu-button"),closeButton=document.getElementById("close-menu-button");
function openMenu(){sidebar.classList.add("is-open");backdrop.hidden=false;document.body.classList.add("menu-open");menuButton.setAttribute("aria-expanded","true");closeButton.focus()}
function closeMenu(){sidebar.classList.remove("is-open");backdrop.hidden=true;document.body.classList.remove("menu-open");menuButton.setAttribute("aria-expanded","false")}
menuButton.addEventListener("click",openMenu);closeButton.addEventListener("click",closeMenu);backdrop.addEventListener("click",closeMenu);
document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>{if(matchMedia("(max-width: 760px)").matches)closeMenu()}));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sidebar.classList.contains("is-open")){closeMenu();menuButton.focus()}});

// Destaque de navegação conforme a seção visível.
const links=[...document.querySelectorAll(".nav-link")],sections=links.map(a=>document.querySelector(a.getAttribute("href"))).filter(Boolean);
if("IntersectionObserver"in window){const observer=new IntersectionObserver(entries=>{const entry=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!entry)return;links.forEach(a=>a.getAttribute("href")===`#${entry.target.id}`?a.setAttribute("aria-current","location"):a.removeAttribute("aria-current"))},{rootMargin:"-15% 0px -70% 0px",threshold:[0,.15,.4,.7]});sections.forEach(s=>observer.observe(s))}

// Persistência do progresso e do checklist.
const quick=[...document.querySelectorAll(".quick-check")],progress=document.getElementById("quick-progress"),progressText=document.getElementById("progress-text"),percentText=document.getElementById("progress-percent"),live=document.getElementById("progress-live");
const quickSaved=read(KEYS.quick,[]);quick.forEach(c=>c.checked=quickSaved.includes(c.dataset.key));
function updateProgress(announce=false){const done=quick.filter(c=>c.checked).length,pct=Math.round(done/quick.length*100);progress.value=done;progressText.textContent=`${done} de ${quick.length} etapas concluídas`;percentText.textContent=`${pct}%`;storage.set(KEYS.quick,JSON.stringify(quick.filter(c=>c.checked).map(c=>c.dataset.key)));if(announce)live.textContent=`Progresso atualizado: ${done} de ${quick.length} etapas, ${pct} por cento.`}
quick.forEach(c=>c.addEventListener("change",()=>updateProgress(true)));updateProgress();
const checklist=[...document.querySelectorAll(".submission-check")],counter=document.getElementById("check-count"),checkLive=document.getElementById("check-live"),checkSaved=read(KEYS.checks,[]);checklist.forEach(c=>c.checked=checkSaved.includes(c.dataset.key));
function updateChecklist(announce=false){const done=checklist.filter(c=>c.checked).length;counter.textContent=`${done} de ${checklist.length} verificados`;storage.set(KEYS.checks,JSON.stringify(checklist.filter(c=>c.checked).map(c=>c.dataset.key)));if(announce)checkLive.textContent=done===checklist.length?"Checklist completo. Todos os itens foram verificados.":`${done} de ${checklist.length} itens verificados.`}
checklist.forEach(c=>c.addEventListener("change",()=>updateChecklist(true)));updateChecklist();

// Accordion com estado acessível.
document.querySelectorAll(".accordion-trigger").forEach(button=>button.addEventListener("click",()=>{const panel=document.getElementById(button.getAttribute("aria-controls")),expanded=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!expanded));panel.hidden=expanded}));

// Filtro instantâneo de texto nos títulos, parágrafos, perguntas e cartões.
const search=document.getElementById("search-input"),clear=document.getElementById("clear-search"),empty=document.getElementById("empty-state"),reset=document.getElementById("reset-search"),searchSections=[...document.querySelectorAll(".searchable-section")];
function filterManual(){const q=search.value.trim().toLocaleLowerCase("pt-BR");clear.hidden=!q;let matchesTotal=0;searchSections.forEach(section=>{const items=[...section.querySelectorAll(".filter-item")];if(!q){section.hidden=false;items.forEach(item=>item.hidden=false);matchesTotal++;return}let hits=0;items.forEach(item=>{const match=item.textContent.toLocaleLowerCase("pt-BR").includes(q);item.hidden=!match;if(match)hits++});const headingText=[...section.children].filter(child=>!child.classList.contains("filter-item")).map(child=>child.textContent).join(" ").toLocaleLowerCase("pt-BR");const headingMatch=headingText.includes(q);section.hidden=hits===0&&!headingMatch;if(!section.hidden)matchesTotal++});empty.hidden=!q||matchesTotal>0}
function clearSearch(){search.value="";filterManual();search.focus()}search.addEventListener("input",filterManual);clear.addEventListener("click",clearSearch);reset.addEventListener("click",clearSearch);

// Toast, cópia do e-mail e modal de ilustrações locais.
const toast=document.getElementById("toast");let toastTimer;function showToast(message){toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,3000)}
document.getElementById("copy-email").addEventListener("click",async()=>{const email=document.getElementById("support-email").textContent.trim();try{if(navigator.clipboard&&isSecureContext)await navigator.clipboard.writeText(email);else{const field=document.createElement("textarea");field.value=email;field.style.position="fixed";field.style.opacity="0";document.body.append(field);field.select();const ok=document.execCommand("copy");field.remove();if(!ok)throw Error("copy unavailable")}showToast("E-mail de suporte copiado.")}catch{showToast("Não foi possível copiar. Selecione o endereço e copie manualmente.")}});
const dialog=document.getElementById("image-dialog"),dialogImage=document.getElementById("dialog-image"),dialogTitle=document.getElementById("dialog-title"),dialogCaption=document.getElementById("dialog-caption"),dialogClose=document.getElementById("dialog-close");let previousTrigger=null;
document.querySelectorAll(".image-button").forEach(button=>button.addEventListener("click",()=>{previousTrigger=button;const img=button.querySelector("img");dialogImage.src=button.dataset.image;dialogImage.alt=img.alt;dialogTitle.textContent=button.dataset.title;dialogCaption.textContent=button.closest("figure").querySelector("figcaption").textContent;if(dialog.showModal)dialog.showModal()}));dialogClose.addEventListener("click",()=>dialog.close());dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});dialog.addEventListener("close",()=>previousTrigger?.focus());

// Voltar ao topo.
const topButton=document.getElementById("back-to-top");function updateTop(){topButton.hidden=window.scrollY<500}window.addEventListener("scroll",updateTop,{passive:true});updateTop();topButton.addEventListener("click",()=>window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));

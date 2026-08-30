const FIELDS=["SPORT","YEAR","BRAND","PROGRAM","CARD SET","ATHLETE","TEAM","POSITION","CARD NUMBER","SEQUENCE"];
const $=id=>document.getElementById(id);

let rawCards=[];
let expandedCards=[];
let selectedAthlete="";
let visibleCards=[];
let currentIndex=0;

const yearFilter=$("yearFilter");
const programFilter=$("programFilter");
const cardSetFilter=$("cardSetFilter");
const cardSetOptions=$("cardSetOptions");
const athleteSearch=$("athleteSearch");
const athleteList=$("athleteList");
const cardsList=$("cardsList");
const detailsGrid=$("detailsGrid");

initDetails();
setNavEnabled(false);
loadAllChecklists();

$("resetBtn").addEventListener("click",()=>{
  yearFilter.value="";
  programFilter.value="";
  cardSetFilter.value="";
  athleteSearch.value="";
  selectedAthlete="";
  updateAllFilters();
});

yearFilter.addEventListener("change",()=>{
  cardSetFilter.value="";
  selectedAthlete="";
  updateAllFilters();
});
programFilter.addEventListener("change",()=>{
  cardSetFilter.value="";
  selectedAthlete="";
  updateAllFilters();
});
cardSetFilter.addEventListener("input",()=>{
  selectedAthlete="";
  updateAllFilters();
});
athleteSearch.addEventListener("input",renderAthletes);

$("firstBtn").addEventListener("click",()=>goToCard(0));
$("backBtn").addEventListener("click",()=>goToCard(currentIndex-1));
$("nextBtn").addEventListener("click",()=>goToCard(currentIndex+1));
$("lastBtn").addEventListener("click",()=>goToCard(visibleCards.length-1));

document.addEventListener("keydown",e=>{
  const tag=(e.target.tagName||"").toLowerCase();
  if(tag==="input"||tag==="select"||tag==="textarea")return;
  if(e.key==="ArrowLeft"&&visibleCards.length)goToCard(currentIndex-1);
  if(e.key==="ArrowRight"&&visibleCards.length)goToCard(currentIndex+1);
});

async function loadAllChecklists(){
  try{
    const manifest=await fetch("checklists.json",{cache:"no-cache"}).then(r=>{
      if(!r.ok)throw new Error("Could not load checklists.json");
      return r.json();
    });

    const files=manifest.files||[];
    $("loadStatus").textContent=`Loading ${files.length} bundled checklists…`;

    let completed=0;
    const results=await Promise.all(files.map(async path=>{
      const response=await fetch(path);
      if(!response.ok)throw new Error(`Failed to load ${path}`);
      const text=await response.text();
      completed++;
      $("loadStatus").textContent=`Loading checklists… ${completed}/${files.length}`;
      return parseCSV(text);
    }));

    rawCards=results.flat();
    expandedCards=expandAthletes(rawCards);

    populateYears();
    updatePrograms();
    updateCardSetOptions(getBaseFilteredCards());
    enableFilters(true);
    updateAllFilters();

    $("loadStatus").textContent=`${files.length} checklists loaded • ${rawCards.length.toLocaleString()} checklist rows`;
    $("footerStatus").textContent=`${files.length} bundled checklists • No uploads required`;
  }catch(err){
    console.error(err);
    $("loadStatus").textContent="Checklist loading failed";
    athleteList.className="scroll-list empty";
    athleteList.textContent="Could not load checklist data. GitHub Pages must serve these files over HTTP.";
    $("footerStatus").textContent=err.message;
  }
}

function parseCSV(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){
      if(ch==='"'){
        if(text[i+1]==='"'){cell+='"';i++}else quoted=false;
      }else cell+=ch;
    }else{
      if(ch==='"')quoted=true;
      else if(ch===","){row.push(cell);cell=""}
      else if(ch==="\n"){row.push(cell);rows.push(row);row=[];cell=""}
      else if(ch!=="\r")cell+=ch;
    }
  }
  row.push(cell);
  if(row.some(v=>v!==""))rows.push(row);
  if(!rows.length)return[];

  const headers=rows.shift().map(x=>x.trim());
  return rows.map(vals=>{
    const obj={};
    for(let i=0;i<headers.length;i++)obj[headers[i]]=vals[i]??"";
    return obj;
  });
}

function splitAthletes(value){
  if(!value)return[];
  return String(value).split(/\s*(?:\/|&|;|\band\b)\s*/i).map(v=>v.trim()).filter(Boolean);
}

function normalizeAthlete(name){
  // Keep capitalization supplied by checklist while normalizing whitespace.
  return String(name||"").trim().replace(/\s+/g," ");
}

function expandAthletes(cards){
  const out=[];
  for(const card of cards){
    const names=splitAthletes(card.ATHLETE).map(normalizeAthlete);
    if(!names.length){
      out.push({...card,ATHLETE:"<Unknown>"});
    }else{
      for(const name of names)out.push({...card,ATHLETE:name});
    }
  }
  return out;
}

function uniqueSorted(values,numeric=false){
  const arr=[...new Set(values.filter(v=>String(v).trim()!==""))];
  return arr.sort((a,b)=>numeric?Number(a)-Number(b):String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:"base"}));
}

function populateYears(){
  const years=uniqueSorted(expandedCards.map(c=>c.YEAR),true);
  yearFilter.innerHTML='<option value="">All Years</option>';
  for(const y of years)yearFilter.add(new Option(y,y));
}

function updatePrograms(){
  const year=yearFilter.value;
  const prior=programFilter.value;
  const candidates=expandedCards.filter(c=>!year||c.YEAR===year);
  const programs=uniqueSorted(candidates.map(c=>c.PROGRAM));

  programFilter.innerHTML='<option value="">All Products</option>';
  for(const p of programs)programFilter.add(new Option(p,p));
  if(programs.includes(prior))programFilter.value=prior;
}

function getBaseFilteredCards(){
  const y=yearFilter.value,p=programFilter.value,setText=cardSetFilter.value.trim().toLowerCase();
  return expandedCards.filter(c=>
    (!y||c.YEAR===y)&&
    (!p||c.PROGRAM===p)&&
    (!setText||String(c["CARD SET"]||"").toLowerCase().includes(setText))
  );
}

function updateCardSetOptions(cards){
  const sets=uniqueSorted(cards.map(c=>c["CARD SET"]));
  // Avoid thousands of DOM nodes until Year/Product narrows the data.
  cardSetOptions.innerHTML="";
  const max=1500;
  for(const s of sets.slice(0,max)){
    const o=document.createElement("option");
    o.value=s;
    cardSetOptions.appendChild(o);
  }
  cardSetFilter.placeholder=sets.length?`All Card Sets (${sets.length.toLocaleString()})`:"No Card Sets";
}

function updateAllFilters(){
  updatePrograms();

  // Build set suggestions from year + program only, before applying typed set text.
  const y=yearFilter.value,p=programFilter.value;
  const forSets=expandedCards.filter(c=>(!y||c.YEAR===y)&&(!p||c.PROGRAM===p));
  updateCardSetOptions(forSets);

  const base=getBaseFilteredCards();
  renderAthletes(base);

  if(selectedAthlete){
    const stillExists=base.some(c=>c.ATHLETE===selectedAthlete);
    if(stillExists)selectAthlete(selectedAthlete,false);
    else clearCardSelection();
  }else clearCardSelection();

  updateActiveFilterText();
}

function renderAthletes(baseCards=getBaseFilteredCards()){
  const query=athleteSearch.value.trim().toLowerCase();
  const names=uniqueSorted(baseCards.map(c=>c.ATHLETE))
    .filter(n=>!query||n.toLowerCase().includes(query));

  $("athleteCount").textContent=names.length.toLocaleString();
  athleteList.innerHTML="";

  if(!names.length){
    athleteList.className="scroll-list empty";
    athleteList.textContent="No athletes match these filters.";
    return;
  }

  athleteList.className="scroll-list";
  const frag=document.createDocumentFragment();
  for(const name of names){
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="list-item"+(name===selectedAthlete?" selected":"");
    btn.textContent=name;
    btn.addEventListener("click",()=>selectAthlete(name,true));
    frag.appendChild(btn);
  }
  athleteList.appendChild(frag);
}

function selectAthlete(name,rerender=true){
  selectedAthlete=name;
  const base=getBaseFilteredCards();
  visibleCards=base.filter(c=>c.ATHLETE===name).sort(sortCards);
  currentIndex=0;

  if(rerender)renderAthletes(base);
  renderCards();
  if(visibleCards.length)showCurrentCard();
  else clearDetails();

  $("cardsHeading").textContent=name;
  updateActiveFilterText();
}

function clearCardSelection(){
  selectedAthlete="";
  visibleCards=[];
  currentIndex=0;
  $("cardsHeading").textContent="Cards";
  $("cardCount").textContent="0";
  cardsList.className="scroll-list empty";
  cardsList.textContent="Select an athlete.";
  clearDetails();
  setNavEnabled(false);
}

function sortCards(a,b){
  const ya=Number(a.YEAR)||0,yb=Number(b.YEAR)||0;
  if(ya!==yb)return ya-yb;
  let x=String(a.PROGRAM||"").localeCompare(String(b.PROGRAM||""),undefined,{numeric:true,sensitivity:"base"});
  if(x)return x;
  x=String(a["CARD SET"]||"").localeCompare(String(b["CARD SET"]||""),undefined,{numeric:true,sensitivity:"base"});
  if(x)return x;
  return String(a["CARD NUMBER"]||"").localeCompare(String(b["CARD NUMBER"]||""),undefined,{numeric:true,sensitivity:"base"});
}

function renderCards(){
  $("cardCount").textContent=visibleCards.length.toLocaleString();
  cardsList.innerHTML="";
  if(!visibleCards.length){
    cardsList.className="scroll-list empty";
    cardsList.textContent="No cards match.";
    setNavEnabled(false);
    return;
  }

  cardsList.className="scroll-list";
  const frag=document.createDocumentFragment();
  visibleCards.forEach((card,i)=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="list-item"+(i===currentIndex?" selected":"");

    const main=document.createElement("span");
    main.className="card-main";
    main.textContent=`${card.YEAR||""} ${card.PROGRAM||""} — ${card["CARD SET"]||""}`;

    const sub=document.createElement("span");
    sub.className="card-sub";
    const cn=card["CARD NUMBER"]?`#${card["CARD NUMBER"]}`:"";
    const seq=card.SEQUENCE?` • /${card.SEQUENCE}`:"";
    sub.textContent=`${cn}${seq}`;

    btn.append(main,sub);
    btn.addEventListener("click",()=>goToCard(i));
    frag.appendChild(btn);
  });
  cardsList.appendChild(frag);
  setNavEnabled(true);
}

function initDetails(){
  detailsGrid.innerHTML="";
  for(const field of FIELDS){
    const row=document.createElement("div");
    row.className="detail-row";
    const label=document.createElement("div");
    label.className="detail-label";
    label.textContent=field;
    const value=document.createElement("div");
    value.className="detail-value";
    value.dataset.field=field;
    row.append(label,value);
    detailsGrid.appendChild(row);
  }
}

function showCurrentCard(){
  if(!visibleCards.length)return;
  const c=visibleCards[currentIndex];
  for(const f of FIELDS){
    const node=detailsGrid.querySelector(`[data-field="${CSS.escape(f)}"]`);
    if(node)node.textContent=c[f]??"";
  }
  $("positionText").textContent=`${currentIndex+1} of ${visibleCards.length.toLocaleString()}`;

  [...cardsList.children].forEach((el,i)=>el.classList.toggle("selected",i===currentIndex));
  cardsList.children[currentIndex]?.scrollIntoView({block:"nearest"});
  updateNavButtons();
}

function goToCard(index){
  if(!visibleCards.length)return;
  currentIndex=Math.max(0,Math.min(index,visibleCards.length-1));
  showCurrentCard();
}

function clearDetails(){
  for(const f of FIELDS){
    const node=detailsGrid.querySelector(`[data-field="${CSS.escape(f)}"]`);
    if(node)node.textContent="";
  }
  $("positionText").textContent="";
}

function setNavEnabled(enabled){
  for(const id of ["firstBtn","backBtn","nextBtn","lastBtn"])$(id).disabled=!enabled;
  if(enabled)updateNavButtons();
}

function updateNavButtons(){
  $("firstBtn").disabled=!visibleCards.length||currentIndex===0;
  $("backBtn").disabled=!visibleCards.length||currentIndex===0;
  $("nextBtn").disabled=!visibleCards.length||currentIndex===visibleCards.length-1;
  $("lastBtn").disabled=!visibleCards.length||currentIndex===visibleCards.length-1;
}

function updateActiveFilterText(){
  const parts=[];
  if(yearFilter.value)parts.push(yearFilter.value);
  if(programFilter.value)parts.push(programFilter.value);
  if(cardSetFilter.value.trim())parts.push(`Set: ${cardSetFilter.value.trim()}`);
  $("activeFilters").textContent=parts.length?parts.join(" • "):"All checklists";
}

function enableFilters(enabled){
  yearFilter.disabled=!enabled;
  programFilter.disabled=!enabled;
  cardSetFilter.disabled=!enabled;
  athleteSearch.disabled=!enabled;
}

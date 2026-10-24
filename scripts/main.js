
const ID="jb2a-spell-browser",PREFIX="jbs_vfx_";
const slug=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const ok=p=>!!p&&!!globalThis.Sequencer?.Database?.entryExists(p);
const CUSTOM={
"fireball":{mode:"fireball",path:"jb2a.fireball.explosion.orange",beam:"jb2a.fireball.beam.orange.30ft",size:20},
"fire-bolt":{mode:"projectile",path:"jb2a.fire_bolt.orange",check:"jb2a.fire_bolt.orange.30ft",impact:"jb2a.impact.fire.01.orange.0"},
"wall-of-fire":{mode:"wall",path:"jb2a.wall_of_fire.300x100.yellow",ring:"jb2a.wall_of_fire.Ring.yellow",persistent:true},
"magic-missile":{mode:"missiles",path:"jb2a.magic_missile.purple.30ft.0"},
"misty-step":{mode:"teleport",path:"jb2a.misty_step.01.blue"},
"cure-wounds":{mode:"single",path:"jb2a.cure_wounds.400px.blue"},
"thunderwave":{mode:"area",path:"jb2a.thunderwave.center.blue",size:15},
"fog-cloud":{mode:"area",path:"jb2a.fog_cloud.01.white",size:20,persistent:true},
"moonbeam":{mode:"area",path:"jb2a.moonbeam.01.loop.blue",size:5,persistent:true},
"darkness":{mode:"area",path:"jb2a.darkness.black",size:15,persistent:true},
"bless":{mode:"single",path:"jb2a.bless.200px.loop.yellow",persistent:true},
"web":{mode:"area",path:"jb2a.web.01",size:20,persistent:true},
"lightning-bolt":{mode:"line",path:"jb2a.lightning_bolt.narrow.blue"},
"eldritch-blast":{mode:"projectile",path:"jb2a.eldritch_blast.purple.30ft"},
"guiding-bolt":{mode:"projectile",path:"jb2a.guiding_bolt.01.blueyellow.30ft"},
"scorching-ray":{mode:"projectile",path:"jb2a.scorching_ray.01.orange.30ft"},
"cone-of-cold":{mode:"cone",path:"jb2a.cone_of_cold.blue",size:60}
};
const LONG=new Set(["wall-of-fire","fog-cloud","darkness","moonbeam","web","bless","entangle","grease","spirit-guardians","silence","wall-of-force","sleet-storm","spike-growth","cloudkill"]);
const number=n=>{let x=parseFloat(n);return Number.isFinite(x)&&x>0?x:null};
function mapping(s){
 const fixed=CUSTOM[s.slug];
 if(fixed&&ok(fixed.check||fixed.path)&&(!fixed.beam||ok(fixed.beam)))return {...fixed,label:"Spezieller JB2A-Effekt",fallback:false};
 const base="jb2a."+s.slug.replaceAll("-","_");
 const entries=globalThis.Sequencer?.Database?.flattenedEntries||[];
 const paths=entries.filter(p=>typeof p==="string"&&(p===base||p.startsWith(base+".")));
 const t=s.template||"";
 let mode=t==="cone"?"cone":(t==="ray"||t==="line")?"line":["sphere","cylinder","circle","cube","emanation","square"].includes(t)?"area":"single";
 if(paths.length){
  paths.sort((a,b)=>(/\.loop/.test(b)?LONG.has(s.slug)?15:-10:0)-(/\.loop/.test(a)?LONG.has(s.slug)?15:-10:0)+(/\.complete|\.30ft/.test(b)?10:0)-(/\.complete|\.30ft/.test(a)?10:0));
  if(mode==="single"&&/\.30ft|\.beam/.test(paths[0]))mode="projectile";
  return {mode,path:paths[0],size:s.size,persistent:LONG.has(s.slug),label:"Namensgleicher JB2A-Effekt",fallback:false};
 }
 const fallback=ok("jb2a.detect_magic.circle.blue")?"jb2a.detect_magic.circle.blue":entries.find(p=>typeof p==="string"&&p.startsWith("jb2a.")&&ok(p));
 return {mode:"single",path:fallback,persistent:LONG.has(s.slug),size:s.size,label:"Allgemeine Ersatzanimation",fallback:true};
}
async function scan(){
 const found=new Map();let issues=0;
 const packs=game.packs.filter(p=>p.documentName==="Item"&&(/spell|zauber|grimoire/i.test(p.collection+" "+p.metadata?.label)||(p.metadata?.flags?.dnd5e?.types||[]).includes("spell")));
 const add=(doc,pack="")=>{
  if(!doc||doc.type!=="spell")return;
  // D&D5e-Versionen speichern "source" nicht einheitlich.
  // Bei alten Eintraegen kann "source" sogar eine Zahl sein.
  const s=doc.system&&typeof doc.system==="object"?doc.system:{};
  const source=s.source;
  const rawRules=typeof source==="string"?source:source&&typeof source==="object"?source.rules:"";
  const rules=String(rawRules||"");
  const edition=rules.includes("2024")||/spells24|players-handbook/.test(pack)?"2024":rules.includes("2014")||/dnd5e\\.spells$/.test(pack)?"2014":"?";
  const name=doc.name,code=slug(s.identifier||name),key=edition+":"+code;
  const score=/dnd-players-handbook/.test(pack)?100:/dnd5e\\.spells24/.test(pack)?80:pack?40:10;
  const prior=found.get(key);if(prior&&prior.score>=score)return;
  found.set(key,{key,name,slug:code,edition,level:Math.min(9,Math.max(0,Number(s.level)||0)),img:doc.img||"icons/svg/book.svg",size:number(s.target?.template?.size),template:s.target?.template?.type||"",score});
 };
 for(const p of packs){
  try{
   // Wichtig: keine verschachtelten getIndex-Felder anfordern!
   // Einige 2014/2024-Kompendien enthalten primitive Zwischenwerte,
   // was in Foundry zu "Cannot use 'in' operator ... rules in 1" fuehrt.
   const index=await p.getIndex();
   const ids=[...index].filter(i=>i?.type==="spell").map(i=>i._id).filter(Boolean);
   for(let i=0;i<ids.length;i+=75){
    const docs=await p.getDocuments({_id__in:ids.slice(i,i+75)});
    docs.forEach(d=>add(d,p.collection));
   }
   // Manche Kompendien liefern keinen Typ im Index.
   if(!ids.length){
    const docs=await p.getDocuments({type:"spell"});
    docs.forEach(d=>add(d,p.collection));
   }
  }catch(e){issues++;console.warn(ID,"Kompendium konnte nicht gelesen werden:",p.collection,e)}
 }
 for(const item of game.items.filter(i=>i.type==="spell"))add(item);
 console.info(ID,"Zaubervarianten:",found.size,"Kompendium-Fehler:",issues);
 return {rows:[...found.values()].sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,"de")),issues};
}
const active=()=>{try{return Sequencer.EffectManager.getEffects({name:PREFIX+"*",sceneId:canvas.scene.id})||[]}catch(e){console.warn(e);return []}};
async function play(spell,permanent,variant){
 if(!game.user.isGM||!canvas.ready||!globalThis.Sequencer?.Crosshair)return ui.notifications.warn("GM, aktive Szene und Sequencer erforderlich");
 const c=mapping(spell);if(!c.path)return ui.notifications.warn("Kein JB2A-Effekt verfügbar");
 const gd=Number(canvas.scene.grid.distance)||5,gs=Number(canvas.grid.size)||100;
 const px=f=>f/gd*gs;
 const choose=async(msg,size=gd/2)=>{
  ui.notifications.info(spell.name+": "+msg);
  const p=await Sequencer.Crosshair.show({t:"circle",distance:size,gridHighlight:size>gd,label:{text:msg}});
  return p?{x:p.x,y:p.y}:null;
 };
 const wall=(a,b)=>{
  const h=foundry.canvas.geometry.ClockwiseSweepPolygon.testCollision(a,b,{type:"move",mode:"closest"});
  if(!h||!Number.isFinite(h.x)||!Number.isFinite(h.y))return b;
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  return len?{x:h.x-3*dx/len,y:h.y-3*dy/len}:b;
 };
 const seq=new Sequence(),effect=()=>{const e=seq.effect().file(c.path);if(permanent)e.persist().name(PREFIX+spell.slug+"__"+foundry.utils.randomID());return e};
 const clip=(e,p,r)=>e.constrainedByWalls({type:"move",origin:p,radius:px(r)});
 try{
  if(c.mode==="wall"){
   if(variant==="ring"&&ok(c.ring)){const a=await choose("Mittelpunkt Feuerring",10);if(!a)return;const e=seq.effect().file(c.ring).atLocation(a).size(px(20));if(permanent)e.persist().name(PREFIX+spell.slug+"__"+foundry.utils.randomID())}
   else{const a=await choose("Anfang Feuerwand");if(!a)return;const b=await choose("Ende Feuerwand");if(!b)return;const length=Math.hypot(b.x-a.x,b.y-a.y)/gs*gd;if(length>60||length<1)return ui.notifications.warn("Feuerwand: Länge 1–60 Fuß");effect().atLocation(a).stretchTo(b,{onlyX:true})}
  }else if(c.mode==="fireball"){
   const a=await choose("Ausgangspunkt");if(!a)return;const b=await choose("Einschlagspunkt",20);if(!b)return;
   const to=wall(a,b);seq.effect().file(c.beam).atLocation(a).stretchTo(to).waitUntilFinished(-150);
   clip(effect().atLocation(to).size(px(40)),to,20);
  }else if(c.mode==="missiles"){
   const a=await choose("Ausgangspunkt");if(!a)return;for(let i=0;i<3;i++){const b=await choose("Geschoss "+(i+1)+"/3");if(!b)return;seq.effect().file(c.path).atLocation(a).stretchTo(wall(a,b)).delay(i*120)}
  }else if(c.mode==="teleport"){
   const a=await choose("Verschwinden");if(!a)return;const b=await choose("Erscheinen");if(!b)return;
   seq.effect().file(c.path).atLocation(a).size(gs*1.8).waitUntilFinished(-100);
   seq.effect().file(c.path).atLocation(b).size(gs*1.8);
  }else if(["projectile","line","cone"].includes(c.mode)){
   const a=await choose("Ausgangspunkt");if(!a)return;const b=await choose("Ziel oder Richtung");if(!b)return;
   const to=wall(a,b);const e=seq.effect().file(c.path).atLocation(a).stretchTo(to);
   if(c.mode!=="projectile")clip(e,a,Math.max(c.size||0,Math.hypot(to.x-a.x,to.y-a.y)/gs*gd+gd));
   if(ok(c.impact)){e.waitUntilFinished(-100);clip(seq.effect().file(c.impact).atLocation(to).size(gs*1.25),to,gd)}
  }else{
   const area=c.mode==="area",r=c.size||spell.size||(area?10:5);
   const p=await choose(area?"Mittelpunkt der Fläche":"Zielpunkt",area?r:gd/2);if(!p)return;
   clip(effect().atLocation(p).size(area?px(r*(spell.template==="cube"?1:2)):gs*1.5),p,r);
  }
  await seq.play();ui.notifications.info(spell.name+(permanent?" dauerhaft platziert":" abgespielt"));
 }catch(e){console.error(ID,spell.name,e);ui.notifications.error(spell.name+": "+(e.message||String(e)))}
}
const {ApplicationV2,HandlebarsApplicationMixin}=foundry.applications.api;
class Browser extends HandlebarsApplicationMixin(ApplicationV2){
 static DEFAULT_OPTIONS={id:"jb2a-spell-browser-window",classes:["jb2a-spell-browser"],window:{title:"D&D-Zauberbibliothek · JB2A",resizable:true},position:{width:900,height:650}};
 static PARTS={main:{template:"modules/"+ID+"/templates/library.hbs"}};
 constructor(...args){super(...args);this.rows=[];this.issues=0;this.selected=null;this.search="";this.level="all";this.edition="all"}
 static async open(){let app=foundry.applications.instances.get("jb2a-spell-browser-window");if(!app){app=new Browser();await app.reload()}await app.render(true);app.bringToFront();return app}
 async reload(){const res=await scan();this.rows=res.rows;this.issues=res.issues;await this.render(true)}
 async _prepareContext(o){
  const ctx=await super._prepareContext(o);
  const rows=this.rows.map(s=>({...s,selected:s.key===this.selected}));
  const chosen=rows.find(s=>s.key===this.selected);
  if(chosen){const effect=mapping(chosen);Object.assign(chosen,{effectLabel:effect.label,fallback:effect.fallback,persistent:!!effect.persistent,wall:effect.mode==="wall"})}
  return {...ctx,rows,chosen,issues:this.issues,search:this.search,levels:[0,1,2,3,4,5,6,7,8,9],effects:active().map(e=>({id:e.data?.name||e.name,name:(e.data?.name||e.name||"").replace(PREFIX,"").split("__")[0]}))};
 }
 _onRender(ctx,o){
  super._onRender(ctx,o);const root=this.element;
  const filter=()=>{const q=slug(this.search);root.querySelectorAll("[data-select]").forEach(el=>{const show=slug(el.dataset.name).includes(q)&&(this.level==="all"||el.dataset.level===this.level)&&(this.edition==="all"||el.dataset.edition===this.edition);el.hidden=!show})};
  root.querySelector("[data-search]")?.addEventListener("input",e=>{this.search=e.target.value;filter()});
  root.querySelector("[data-level]")?.addEventListener("change",e=>{this.level=e.target.value;filter()});
  root.querySelector("[data-edition]")?.addEventListener("change",e=>{this.edition=e.target.value;filter()});
  const level=root.querySelector("[data-level]"),edition=root.querySelector("[data-edition]");if(level)level.value=this.level;if(edition)edition.value=this.edition;filter();
  root.querySelectorAll("[data-select]").forEach(el=>el.addEventListener("click",async()=>{this.selected=el.dataset.select;await this.render(true)}));
  root.querySelector("[data-refresh]")?.addEventListener("click",()=>this.reload());
  root.querySelector("[data-play]")?.addEventListener("click",async()=>{const s=this.rows.find(x=>x.key===this.selected);if(!s)return;const keep=!!root.querySelector("[data-persist]")?.checked,variant=root.querySelector("[data-variant]")?.value||"line";try{await this.minimize();await play(s,keep,variant)}finally{if(this.rendered){await this.maximize();await this.render(true)}}});
  root.querySelector("[data-manager]")?.addEventListener("click",()=>Sequencer.EffectManager.show());
  root.querySelectorAll("[data-remove]").forEach(el=>el.addEventListener("click",async()=>{await Sequencer.EffectManager.endEffects({name:el.dataset.remove});await this.render(true)}));
 }
}
Hooks.on("getSceneControlButtons",controls=>{if(!game.user.isGM)return;const tools=controls.tokens?.tools;if(!tools)return;tools.jb2aSpellBrowser={name:"jb2aSpellBrowser",title:"D&D-Zauberbibliothek",icon:"fa-solid fa-book-open",button:true,visible:true,order:Object.keys(tools).length,onChange:()=>void Browser.open()}});
Hooks.once("ready",()=>{const module=game.modules.get(ID);if(module)module.api={open:()=>Browser.open()};console.info(ID,"bereit")});

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const db=createClient('https://exdbjmenogqmdsagtzsc.supabase.co','sb_publishable_aiD4YZk2gx8B1thwWfcB5Q_Zu9Y1UJO');
const $=id=>document.getElementById(id), q=(el,sel)=>el?.querySelector(sel);
let goalItems=[],goalSets=[],expandedRecipe=null,craftQty=1;let data={items:[],recipes:[],sets:[],materials:[]},cursor={catalog:0,recipes:0,sets:0,jewelry:0},filters={catalog:'',recipes:'',sets:'',jewelry:''},user=null,party=null,balances=[],dbRecipes=[],dbIngredients=[];
const safe=t=>String(t??''),slug=t=>safe(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const css=(el,n)=>el.classList.add(n);
const node=(tag,value='',cls='')=>{const el=document.createElement(tag);el.textContent=safe(value);if(cls)el.className=cls;return el};
const button=(label,handler)=>{const b=node('button',label);b.type='button';b.addEventListener('click',handler);return b};
const elink=(label,url)=>{if(!/^https:\/\//.test(url||''))return node('span','', 'meta');const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
const fmt=n=>Number(n||0).toLocaleString('es-AR');
const typeIcon={material:'⬡',recipe_item:'♜',weapon:'⚔',armor:'♞',jewelry:'◇',scroll:'▤',potion:'♧',shot:'✦',dye:'◈',spellbook:'✥',quest:'◉'};
async function json(path){try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch{return null}}
async function paged(table,columns,max=9000){const out=[];for(let start=0;start<max;start+=1000){const {data,error}=await db.from(table).select(columns).range(start,start+999);if(error)break;out.push(...data);if(data.length<1000)break}return out}
async function syncCatalog(){
 const [a,b,c,d,featured,featuredSets,icons,jewelry,moreArmor,moreWeapons,jewelryRecipes,guideSets]=await Promise.all(['data/items.json','data/recipes.json','data/sets.json','data/materials.json','data/featured-recipes.json','data/featured-sets.json','data/icons.json','data/jewelry.json','data/recipe-index-cba.json','data/weapon-recipes-cba.json','data/jewelry-recipes-cba.json','data/lu4-cba-guide-sets.json'].map(json));
 data.items=Array.isArray(a)?a:[];data.recipes=Array.isArray(b)?b:[];data.sets=Array.isArray(c)?c:[];data.materials=Array.isArray(d)?d:[];
 data.icons=icons&&typeof icons==='object'?icons:{byId:{},byName:{}};
 data.jewelry=Array.isArray(jewelry)?jewelry.filter(j=>['C','B','A'].includes(j.grade)):[];
 if(!data.items.length){data.items=await paged('items','id,name,grade,category,icon_url,source_url,verified');}
 if(!data.sets.length){data.sets=await paged('equipment_sets','id,name,grade,armor_type,image_url,set_bonus,verified');}
 if(!data.recipes.length){const rows=(await paged('recipes','id,output_item_id,output_quantity,success_rate,crafter_level,source_url,verified')).filter(r=>r.verified);data.recipes=rows.map(r=>({...r,name:'Recipe: '+(data.items.find(x=>x.id===r.output_item_id)?.name||'Ítem '+r.output_item_id)+' ('+Math.round(Number(r.success_rate)*100)+'%)',result:data.items.find(x=>x.id===r.output_item_id)?.name||'Ítem '+r.output_item_id,craft_level:r.crafter_level}));}
 if(Array.isArray(featuredSets)){for(const set of featuredSets){const ix=data.sets.findIndex(x=>x.name.toLowerCase()===set.name.toLowerCase());if(ix>=0)data.sets[ix]={...data.sets[ix],...set};else data.sets.push(set)}}
 if(Array.isArray(guideSets)){for(const g of guideSets){const ix=data.sets.findIndex(x=>x.name.toLowerCase()===g.name.toLowerCase());if(ix<0)data.sets.push(g);else {const old=data.sets[ix];data.sets[ix]={...old,...g,parts:g.parts?.length?g.parts:(old.parts||[])};}}}
 if(Array.isArray(featured)){const known=new Set(data.recipes.map(r=>(r.name||'').toLowerCase().replace(/\s+/g,' ').trim()));for(const recipe of featured){const k=recipe.name.toLowerCase().replace(/\s+/g,' ').trim();if(!known.has(k)){data.recipes.push(recipe);known.add(k)}else{const idx=data.recipes.findIndex(r=>(r.name||'').toLowerCase().replace(/\s+/g,' ').trim()===k);if(idx>=0&&!data.recipes[idx].ingredients?.length)data.recipes[idx]={...data.recipes[idx],...recipe}}}}
 const extra=[...(Array.isArray(moreArmor)?moreArmor:[]),...(Array.isArray(moreWeapons)?moreWeapons:[]),...(Array.isArray(jewelryRecipes)?jewelryRecipes:[])];
 const recipeKeys=new Set(data.recipes.map(r=>[r.result,r.success_rate,r.grade].join('|').toLowerCase()));
 for(const r of extra){const k=[r.result,r.success_rate,r.grade].join('|').toLowerCase();if(!recipeKeys.has(k)){data.recipes.push(r);recipeKeys.add(k)}}
 data.recipes=data.recipes.filter(r=>['C','B','A'].includes(r.grade));
 data.sets=data.sets.filter(r=>['C','B','A'].includes(r.grade));
 data.items=data.items.filter(r=>r.grade!=='S');
  [goalItems,goalSets]=await Promise.all([paged('items','id,name,category'),paged('equipment_sets','id,name')]);
 renderAll();
}
function vectorIcon(item){
 const n=safe(item.name).toLowerCase();let key='rune';
 if(item.category==='material'){
  if(/bone|horn|tooth/.test(n))key='bone';
  else if(/ore|iron|mithril|steel|coal|metal|ingot|nugget/.test(n))key='ore';
  else if(/skin|leather|thread|fabric|suede|hemp|braid|fiber/.test(n))key='fabric';
  else if(/gem|crystal|jewel|stone/.test(n))key='gem';
  else key='metal';
 }else key=({weapon:'weapon',armor:'armor',jewelry:'gem',recipe_item:'scroll',scroll:'scroll',potion:'potion',shot:'rune',spellbook:'scroll',dye:'gem'})[item.category]||'rune';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 48 48');svg.setAttribute('width','36');svg.setAttribute('height','36');svg.setAttribute('aria-hidden','true');
 const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','assets/icons.svg#'+key);svg.append(use);return svg;
}
const chestBySet={'zubei heavy':'Zubei Breastplate','blue wolf heavy':'Blue Wolf Breastplate','avadon heavy':'Avadon Breastplate','full plate':'Full Plate Armor','dark crystal heavy':'Dark Crystal Breastplate','tallum heavy':'Tallum Plate Armor','nightmare heavy':'Armor of Nightmare','doom heavy':'Doom Plate Armor','majestic heavy':'Majestic Plate Armor','majestic light':'Majestic Leather Armor','majestic robe':'Majestic Robe'};
function setPlaceholder(item){const e=node('div','','premium-icon set-portrait');e.classList.add('grade-'+safe(item.grade||'').toLowerCase(),'type-'+safe(item.armor_type||'heavy').toLowerCase());const letters=safe(item.name).split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();const wrap=node('div');wrap.append(node('div',letters,'set-symbol'),node('div',safe(item.grade||'—'),'set-symbol-mark'));e.append(wrap);e.title=safe(item.name);return e}
function imgIcon(item){
 const icon=node('div','','premium-icon');
 const isSet=!!item.armor_type&&item.category==='armor'; const names=[item.primary_item,chestBySet[safe(item.name).toLowerCase()],item.parts?.find(p=>p.slot==='Pechera'||p.slot==='Túnica'||p.slot==='Armadura completa'||p.slot==='Robe')?.recipe_result,item.parts?.[0]?.name,item.name,item.result].filter(Boolean);
 const norm=n=>safe(n).trim().toLowerCase().replace(/\s+/g,' ');
 const candidates=names.map(n=>data.icons?.byName?.[norm(n)]).filter(Boolean);
 const url=candidates[0]||data.icons?.byId?.[String(item.game_item_id||'')]||item.icon_url||item.image_url;
 if(url&&/^https:\/\//.test(url)){
   const image=document.createElement('img');
   image.src=url;image.loading='lazy';image.alt='';image.decoding='async';
   image.onerror=()=>{if(isSet)icon.replaceWith(setPlaceholder(item));else icon.replaceChildren(vectorIcon(item))};
   icon.append(image);
 }else if(isSet)return setPlaceholder(item);else icon.append(vectorIcon(item));
 return icon
}
function jewelryCard(obj){
 const c=node('article','','premium-card');
 const top=node('div','','premium-head'),right=node('div');
 right.append(node('h3',obj.name),node('div',({ring:'Anillo',earring:'Aro',necklace:'Collar'})[obj.kind]||'Joyería','meta'));
 top.append(imgIcon({...obj,category:'jewelry'}),right);c.append(top);
 const info=node('div','','set-description');
 info.append(node('span','M. Def. '+obj.magic_defense+' · Grado '+obj.grade));
 const rec=data.recipes.find(r=>r.result?.toLowerCase()===obj.name.toLowerCase()&&r.kind==='jewelry');
 if(obj.epic){info.append(node('strong',' · ÉPICA','epic-label'))}
 if(obj.mp_bonus!=null)info.append(node('span',' · MP +'+obj.mp_bonus,'meta'));
 c.append(info);
 if(Array.isArray(obj.effects)&&obj.effects.length){const details=document.createElement('details');details.className='recipe-detail';details.append(node('summary','Ver '+obj.effects.length+' bonus especiales'));const list=node('div','','source-list');for(const effect of obj.effects)list.append(node('div','✦ '+effect,'recipe-ingredient'));details.append(list);c.append(details)}

 if(rec&&!obj.epic){const btn=button('Ver receta',()=>{filters.recipes=obj.name.toLowerCase();cursor.recipes=0;const search=containers.recipes?.grid?.parentElement?.querySelector('input');if(search)search.value=obj.name;paint('recipes');document.querySelector('[data-tab="recipes"]')?.click()});btn.className='smallbutton';c.append(btn)}
 const foot=node('div','','bottom');foot.append(node('span',obj.epic?'Boss épico':obj.grade,'badge-grade'),elink('Ficha LU4 ↗',obj.source_url));c.append(foot);return c
}
 function card(obj,kind){
 const c=node('article','','premium-card'),head=node('div','','premium-head'),right=node('div');
 const item={...obj,category:kind==='sets'?'armor':kind==='recipes'?'recipe_item':obj.category};
 right.append(node('h3',obj.name||obj.result||'Ítem'),node('div',kind==='recipes'?obj.result||'Resultado':kind==='sets'?({heavy:'Armadura pesada · Heavy',light:'Armadura ligera · Light',robe:'Túnica · Robe'}[obj.armor_type]||'Set de armadura'):obj.category||'Ítem',kind==='sets'?'set-label':'meta'));head.append(imgIcon(item),right);c.append(head);
 if(kind==='recipes'){
 c.append(node('div','Grado '+(obj.grade||'—')+' · '+(obj.success_rate==null?'':Math.round(obj.success_rate*100)+'% de éxito')+(obj.craft_level?' · Nivel '+obj.craft_level:'')+(obj.armor_type?' · '+obj.armor_type.toUpperCase():''),'meta'));
 if(!Array.isArray(obj.ingredients)||!obj.ingredients.length){c.append(node('div','Receta registrada · Ingredientes disponibles en la ficha LU4','meta'))}
 if(Array.isArray(obj.ingredients)&&obj.ingredients.length){
   const details=document.createElement('details');details.className='recipe-detail';
   const summary=node('summary','Ver '+obj.ingredients.length+' materiales para '+fmt(craftQty)+' crafteo(s)');
   details.append(summary);
   let complete=0;const ul=node('div','','source-list');for(const part of obj.ingredients){
     const name=part.name.replace('Crystal (B-Grade)','Crystal: B Grade').replace('Crystal (A-Grade)','Crystal: A Grade');
     const match=goalItems.find(i=>i.name?.toLowerCase()===name.toLowerCase()||i.name?.toLowerCase()===part.name.toLowerCase());
     const qty=match?balances.filter(b=>b.item_id===match.id).reduce((sum,b)=>sum+Number(b.quantity),0):0;
     if(qty>=part.quantity*craftQty)complete++;
     const need=part.quantity*craftQty;const item=node('div',part.name+' — necesito '+fmt(need)+' · CP: '+fmt(qty)+(qty<need?' · faltan '+fmt(need-qty):' · completo'),'recipe-ingredient');
     ul.append(item);
   }details.append(ul,node('small',complete+' / '+obj.ingredients.length+' tipos cubiertos','muted'));c.append(details)
 }
 if(obj.id){
  const parts=dbIngredients.filter(x=>x.recipe_id===obj.id);
  if(parts.length){const box=node('div','','source-list');for(const part of parts){const name=goalItems.find(i=>i.id===part.item_id)?.name||'Ítem '+part.item_id;const quantity=balances.filter(b=>b.item_id===part.item_id).reduce((s,b)=>s+Number(b.quantity),0);box.append(node('span',name+' ×'+fmt(part.quantity)+' · CP: '+fmt(quantity)))}c.append(box)}
 }
}
 if(kind==='sets'){
 const bonus=obj.set_bonus;
 c.append(node('div','Grado '+(obj.grade||'—')+' · '+(({heavy:'Heavy',light:'Light',robe:'Robe'})[obj.armor_type]||'Armadura'),'meta'));
 if(bonus){
   const bonusDetails=document.createElement('details');bonusDetails.className='set-benefits';
   bonusDetails.append(node('summary','Características · '+bonus.split(' · ').length+' bonus'));
   const bonuses=node('div','','source-list');
   for(const entry of bonus.split(' · '))bonuses.append(node('div','✦ '+entry,'set-bonus-line'));
   bonusDetails.append(bonuses);c.append(bonusDetails)
 }
 if(Array.isArray(obj.parts)&&obj.parts.length){
  const details=document.createElement('details');details.className='recipe-detail';
  details.append(node('summary','Ver '+obj.parts.filter(p=>!p.optional).length+' piezas del set'+(obj.parts.some(p=>p.optional)?' y accesorios opcionales':'')));
  const list=node('div','','source-list');
  for(const part of obj.parts){
    const line=node('div','','recipe-ingredient');
    const icon=imgIcon({name:part.name,category:'armor'});
    icon.classList.add('piece-small');
    line.append(icon,node('span',part.slot+': '+part.name));
    const matchingResult=part.recipe_result||part.name;
    if(matchingResult){const recipe=data.recipes.find(r=>r.result===matchingResult&&r.success_rate===1)||data.recipes.find(r=>r.result===matchingResult);if(recipe){const see=button('Materiales ↗',()=>{filters.recipes=matchingResult.toLowerCase();cursor.recipes=0;const search=containers.recipes?.grid?.parentElement?.querySelector('input');if(search)search.value=matchingResult;paint('recipes');document.querySelectorAll('[data-tab="recipes"]')[0]?.click()});see.className='smallbutton';line.append(see)}}
    list.append(line);
  }details.append(list);c.append(details)
 }
}
 const foot=node('div','','bottom');foot.append(node('span',obj.grade||'—','badge-grade'));
 let link=obj.source_url;
 if(!link&&kind==='catalog'&&obj.name)link='https://la2wiki.com/lu4/items';
 if(!link&&kind==='sets')link='https://la2wiki.com/lu4/sets';
 if(!link&&kind==='recipes')link='https://la2wiki.com/lu4/recipes';
 if(link)foot.append(elink('Consultar LU4 ↗',link));
 c.append(foot);
 return c
}
function mount(id){const host=$(id);if(!host)return null;const shell=node('div','','panel'),bar=node('div','','premium-toolbar'),search=document.createElement('input');search.placeholder=id==='catalog'?'Buscar entre todos los ítems…':id==='recipes'?'Buscar receta o resultado…':id==='jewelry'?'Buscar joyas y épicas…':'Buscar set o armadura…';search.value=filters[id];bar.append(search);
 if(id==='jewelry'){
 const grade=document.createElement('select');grade.id='premium-jewelry-grade';
 for(const [value,label] of [['','C, B, A y Épica'],['C','Grado C'],['B','Grado B'],['A','Grado A'],['epic','Sólo épica']]){const opt=node('option',label);opt.value=value;grade.append(opt)}bar.append(grade);
 const type=document.createElement('select');type.id='premium-jewelry-type';
 for(const [value,label] of [['','Anillos, aros y collares'],['ring','Anillos'],['earring','Aros'],['necklace','Collares']]){const opt=node('option',label);opt.value=value;type.append(opt)}bar.append(type);
 grade.onchange=type.onchange=()=>{cursor.jewelry=0;paint('jewelry')};
 }
 if(id==='recipes'){
 const select=document.createElement('select');select.id='premium-recipe-kind';
 for(const [v,t] of [['','Todas las recetas'],['armor','Armaduras y sets'],['weapon','Armas'],['jewelry','Joyería'],['material','Materiales']]){const opt=node('option',t);opt.value=v;select.append(opt)}
 bar.append(select);select.onchange=()=>{cursor.recipes=0;paint('recipes')};
 const armorSelect=document.createElement('select');armorSelect.id='premium-armor-type';
 for(const [v,t] of [['','Heavy / Light / Robe'],['heavy','Heavy'],['light','Light'],['robe','Robe']]){const o=node('option',t);o.value=v;armorSelect.append(o)}
 bar.append(armorSelect);armorSelect.onchange=()=>{cursor.recipes=0;paint('recipes')};
 const quantity=document.createElement('input');quantity.type='number';quantity.min='1';quantity.max='1000';quantity.step='1';quantity.value=String(craftQty);quantity.title='Cantidad de crafteos';quantity.placeholder='Cantidad a fabricar';bar.append(quantity);
 quantity.oninput=()=>{const n=Number(quantity.value);if(Number.isSafeInteger(n)&&n>=1&&n<=1000){craftQty=n;paint('recipes')}}
}
 if(id==='catalog'){const select=document.createElement('select');select.id='premium-category';for(const [v,t] of [['','Todas las categorías'],['material','Materiales'],['weapon','Armas'],['armor','Armaduras'],['jewelry','Joyas'],['recipe_item','Recetas'],['scroll','Scrolls'],['potion','Pociones'],['shot','Shots y flechas'],['spellbook','Spellbooks']]){const opt=node('option',t);opt.value=v;select.append(opt)}bar.append(select);select.onchange=()=>{cursor.catalog=0;paint('catalog')}}else if(id==='sets'){
 const type=document.createElement('select');type.id='premium-set-type';for(const [v,t] of [['','Todos los tipos'],['heavy','Heavy'],['light','Light'],['robe','Robe']]){const o=node('option',t);o.value=v;type.append(o)}bar.append(type);type.onchange=()=>{cursor.sets=0;paint('sets')};
 const select=document.createElement('select');select.id='premium-grade';for(const v of ['Todos los grados','A','B','C']){const o=node('option',v);o.value=v==='Todos los grados'?'':v;select.append(o)}bar.append(select);select.onchange=()=>{cursor.sets=0;paint('sets')}}
 const counter=node('div','','small muted'),grid=node('div','','premium-grid'),foot=node('div','','premium-footer');
 shell.append(node('h2',id==='catalog'?'Catálogo LU4':id==='recipes'?'Recetas de crafting':id==='jewelry'?'Joyería C, B, A y Épica':'Sets de armaduras'),bar,counter,grid,foot);host.append(shell);
 search.oninput=()=>{filters[id]=search.value.toLocaleLowerCase();cursor[id]=0;paint(id)};return {grid,counter,foot}
}
const containers={};
function paint(id){
 const arr=data[id==='catalog'?'items':id]||[];let filtered=arr.filter(x=>{const str=[x.name,x.result,x.grade,x.armor_type,x.category].join(' ').toLocaleLowerCase();if(filters[id]&&!str.includes(filters[id]))return false;if(id==='recipes'&&$('premium-recipe-kind')?.value){
  const kind=$('premium-recipe-kind').value;const text=(x.result||x.name||'').toLowerCase();
  const category=x.kind||(/^recipe:/.test(text)&&(/armor|boots|gloves|helmet|gaiters|robe|leather|shield|circlet|tunic|stockings/.test(text))?'armor':/bow|sword|dagger|staff|mace|spear|blade|axe|lance|fist|hammer/.test(text)?'weapon':'material');
  if(category!==kind)return false;
 if($('premium-armor-type')?.value&&x.armor_type!==$('premium-armor-type').value)return false;
 }
 if(id==='recipes'&&!$('premium-recipe-kind')?.value&&$('premium-armor-type')?.value&&x.armor_type!==$('premium-armor-type').value)return false;
 if(id==='jewelry'){
  const grade=$('premium-jewelry-grade')?.value; const kind=$('premium-jewelry-type')?.value;
  if(grade==='epic'&&!x.epic)return false;
  if(grade&&grade!=='epic'&&x.grade!==grade)return false;
  if(kind&&x.kind!==kind)return false;
 }
 if(id==='catalog'&&$('premium-category')?.value&&x.category!==$('premium-category').value)return false;if(id==='sets'&&$('premium-grade')?.value&&x.grade!==$('premium-grade').value)return false;if(id==='sets'&&$('premium-set-type')?.value&&x.armor_type!==$('premium-set-type').value)return false;return true});
 const limit=60;cursor[id]=Math.max(0,Math.min(cursor[id],Math.max(0,Math.ceil(filtered.length/limit)-1)));const start=cursor[id]*limit;const h=containers[id];if(!h)return;h.grid.replaceChildren();h.foot.replaceChildren();
 for(const obj of filtered.slice(start,start+limit))h.grid.append(id==='jewelry'?jewelryCard(obj):card(obj,id));if(!filtered.length)h.grid.append(node('div','No se encontraron resultados.','premium-empty'));
 h.counter.textContent=fmt(filtered.length)+' resultados · Página '+(cursor[id]+1)+' de '+Math.max(1,Math.ceil(filtered.length/limit));
 const back=button('← Anterior',()=>{cursor[id]--;paint(id);h.grid.scrollIntoView({behavior:'smooth',block:'start'})});back.disabled=cursor[id]===0;const next=button('Siguiente →',()=>{cursor[id]++;paint(id);h.grid.scrollIntoView({behavior:'smooth',block:'start'})});next.disabled=start+limit>=filtered.length;h.foot.append(back,next)
}
function renderAll(){for(const id of ['catalog','recipes','sets','jewelry']){if(!containers[id])containers[id]=mount(id);paint(id)}goalsUI()}
async function sessionState(){const {data:{user:u}}=await db.auth.getUser();user=u;if(!user){party=null;balances=[];return}party=$('activeparty')?.value||null;if(!party){balances=[];return}await syncInventory();await syncGoals();paint('recipes')}
function goalsUI(){const host=$('goals');if(!host)return;host.replaceChildren();const panel=node('section','','panel'),h=node('h2','Objetivos de crafteo de la CP'),form=document.createElement('form'),row=node('div','','premium-toolbar'),target=document.createElement('select'),title=document.createElement('input'),priority=document.createElement('select'),submit=node('button','Crear objetivo','primary');submit.type='submit';title.placeholder='Nombre del objetivo';title.required=true;
 const first=node('option','Elegir objetivo: ítem o set');first.value='';target.append(first);
 for(const obj of goalItems.filter(i=>['weapon','armor','material'].includes(i.category)).slice(0,2000)){const o=node('option',obj.name);o.value='item:'+obj.id;target.append(o)}
 for(const obj of goalSets.filter(i=>i.id)){const o=node('option','Set: '+obj.name);o.value='set:'+obj.id;target.append(o)}
 for(const [v,t] of [['1','Prioridad alta'],['2','Prioridad media'],['3','Prioridad baja']]){const o=node('option',t);o.value=v;priority.append(o)}
 row.append(target,title,priority,submit);form.append(row);form.onsubmit=async e=>{e.preventDefault();if(!user||!party)return message('Primero ingresá a tu CP');const [kind,id]=target.value.split(':');if(!id)return message('Seleccioná un objetivo');const payload={party_id:party,title:title.value.trim(),priority:Number(priority.value),created_by:user.id};if(kind==='item')payload.target_item_id=Number(id);else payload.target_set_id=Number(id);const {error}=await db.from('crafting_projects').insert(payload);if(error)message(error.message);else{title.value='';await syncGoals()}};const list=node('div','', 'stack');panel.append(h,form,list);host.append(panel);host._list=list}
async function syncGoals(){
 if(!user||!party||!$('goals'))return;
 if(!$('goals')._list)goalsUI();
 const {data:goals,error}=await db.from('crafting_projects')
  .select('id,title,status,priority,target_item_id,target_set_id,selected_recipe_id')
  .eq('party_id',party).order('priority',{ascending:true});
 if(error)return message('Objetivos: '+error.message);
 if(!dbRecipes.length){
  dbRecipes=await paged('recipes','id,output_item_id,output_quantity,success_rate,verified');
  dbIngredients=await paged('recipe_ingredients','recipe_id,item_id,quantity');
 }
 const list=$('goals')._list;list.replaceChildren();
 if(!goals?.length){list.append(node('div','Todavía no hay objetivos registrados.','premium-empty'));return}
 for(const g of goals){
  const box=node('div','','premium-box'),top=node('div','','goal-title');
  const title=node('h3',g.title),actions=node('div','','goal-actions');
  const statusText=({pending:'Pendiente',gathering:'Reuniendo materiales',ready:'Listo',crafting:'Crafteando',completed:'Crafteado ✓',cancelled:'Cancelado'})[g.status]||'Pendiente';
  actions.append(node('span',statusText,'tag goal-status'));
  if(g.status!=='completed'){
   const remove=button('Eliminar',async()=>{
    if(!confirm('¿Eliminar el objetivo «'+g.title+'»? No modificará los materiales de la CP.'))return;
    remove.disabled=true;
    const {error}=await db.rpc('delete_cp_goal',{p_project:g.id});
    if(error){remove.disabled=false;return message('No se pudo eliminar: '+error.message)}
    message('Objetivo eliminado');await syncGoals();
   });
   remove.className='goal-delete';actions.append(remove);
  }
  top.append(title,actions);box.append(top);
  if(g.target_item_id){
   const variants=dbRecipes.filter(r=>r.output_item_id===g.target_item_id&&r.verified&&dbIngredients.some(i=>i.recipe_id===r.id))
    .sort((a,b)=>Number(b.success_rate)-Number(a.success_rate));
   if(!variants.length){
    box.append(node('p','Esta pieza todavía no tiene una receta con ingredientes verificados para LU4. No se pueden descontar materiales.','muted small'));
   }else{
    const picker=document.createElement('select');picker.setAttribute('aria-label','Variante de receta de '+g.title);
    const hint=node('option','Elegí receta de crafteo');hint.value='';hint.disabled=true;picker.append(hint);
    for(const r of variants){const option=node('option','Receta '+Math.round(Number(r.success_rate)*100)+'% · produce '+fmt(r.output_quantity));option.value=r.id;picker.append(option)}
    picker.value=variants.some(v=>v.id===g.selected_recipe_id)?String(g.selected_recipe_id):'';
    picker.disabled=g.status==='completed'||g.status==='cancelled';
    picker.onchange=async()=>{
     const {error}=await db.rpc('set_cp_goal_recipe',{p_project:g.id,p_recipe_id:Number(picker.value)});
     if(error)return message(error.message);
     message('Variante de receta guardada.');await syncGoals();
    };
    box.append(node('div','Variante de LU4:','small muted'),picker);
    const recipe=variants.find(r=>r.id===g.selected_recipe_id);
    if(!recipe){box.append(node('p','Elegí la variante (por ejemplo, 60% o 100%) para calcular los materiales de la CP.','muted small'))}
    else{
     const ingredients=dbIngredients.filter(i=>i.recipe_id===recipe.id);
     let present=0,required=0;
     for(const ing of ingredients){
      const available=balances.filter(b=>b.item_id===ing.item_id).reduce((sum,b)=>sum+Number(b.quantity),0);
      present+=Math.min(available,Number(ing.quantity));
      required+=Number(ing.quantity);
      const item=goalItems.find(i=>i.id===ing.item_id)||data.items.find(i=>i.id===ing.item_id);
      box.append(node('div',(item?.name||'Ítem '+ing.item_id)+' · CP: '+fmt(available)+' / '+fmt(ing.quantity),'small muted'));
     }
     const meter=node('div','','meter'),fill=node('span');
     fill.style.width=(required?Math.round(100*present/required):0)+'%';meter.append(fill);
     box.append(meter,node('div',(required?Math.round(100*present/required):0)+'% de ingredientes disponibles · éxito '+Math.round(Number(recipe.success_rate)*100)+'%','small'));
     if(g.status!=='completed'&&g.status!=='cancelled'){
      const {data:eligible,error:locationError}=await db.from('inventory_locations')
       .select('id,name,owner_user_id,character_id').eq('party_id',party).neq('name','Ubicación histórica (sin uso)');
      if(locationError)message(locationError.message);
      const owned=(eligible||[]).filter(l=>l.owner_user_id===user.id||l.owner_user_id===null);
      const place=document.createElement('select');place.setAttribute('aria-label','Destino del ítem crafteado');
      for(const loc of owned){const option=node('option',loc.name);option.value=loc.id;place.append(option)}
      box.append(node('div','Ubicación donde registrar el objeto:','small muted'),place);
      const finish=button('✓ Confirmar craft exitoso',async()=>{
       if(!place.value)return message('Seleccioná el inventario de destino');
       const rate=Math.round(Number(recipe.success_rate)*100);
       if(!confirm('¿Confirmás que '+g.title+' salió exitoso usando la receta '+rate+'%? Se descontarán materiales de toda la CP.'))return;
       finish.disabled=true;
       const {error}=await db.rpc('complete_cp_craft',{p_project:g.id,p_output_location:place.value});
       if(error){finish.disabled=false;return message('No se registró: '+error.message)}
       message('Craft confirmado: materiales descontados y objetivo completado.');
       document.dispatchEvent(new Event('carmine-craft-completed'));
       await sessionState();
      });
      finish.disabled=present<required||!owned.length;
      box.append(finish);
      if(finish.disabled)box.append(node('div',owned.length?'Faltan materiales de la CP para esta variante.':'No hay destino de inventario propio o común.','muted small'));
     }
    }
   }
  }
  if(g.target_set_id){
   const set=goalSets.find(x=>x.id===g.target_set_id);
   box.append(node('div','Set '+(set?.name||g.target_set_id)+' · registrá objetivos individuales de las piezas para consumir los materiales de sus recetas.','small muted'));
   const {data:parts,error:partsError}=await db.from('set_pieces').select('item_id,required_quantity').eq('set_id',g.target_set_id);
   if(partsError)box.append(node('div','Composición del set no disponible.','muted small'));
   else if(parts?.length){
    let completed=0;
    for(const part of parts){
     const item=goalItems.find(x=>x.id===part.item_id);
     const owned=balances.filter(b=>b.item_id===part.item_id).reduce((n,b)=>n+Number(b.quantity),0);
     if(owned>=part.required_quantity)completed++;
     box.append(node('div',(item?.name||'Pieza '+part.item_id)+' · CP: '+fmt(owned)+' / '+fmt(part.required_quantity),'small muted'));
    }
    const meter=node('div','','meter'),fill=node('span');
    fill.style.width=Math.round(100*completed/parts.length)+'%';meter.append(fill);
    box.append(meter,node('div',completed+' / '+parts.length+' piezas disponibles','small'));
   }
  }
  list.append(box);
 }
}
async function syncInventory(){if(!user||!party)return;const {data:bals,error}=await db.from('inventory_balances').select('item_id,quantity,location_id').eq('party_id',party);if(error){message('Inventario: '+error.message);return}balances=bals||[]}

function message(s){const n=$('notice');if(!n)return;n.textContent=s;n.style.display='block';setTimeout(()=>n.style.display='none',4000)}
function boot(){
 const main=document.querySelector('.content');if(!main)return;const jewelryPage=node('section','','view hide');jewelryPage.id='jewelry';main.append(jewelryPage);const goals=node('section','','view hide');goals.id='goals';const farming=node('section','','view hide');farming.id='farming';farming.append(node('div','', 'panel'));const panel=farming.firstChild;panel.append(node('h2','Drop y Spoil · LU4'),node('p','Consultá monstruos, niveles, zonas y porcentajes en las fichas LU4.','muted'));panel.append(elink('Abrir catálogo de Drop ↗','https://lu4.click/en/drop/'),node('div',' · '),elink('Abrir catálogo de Spoil ↗','https://lu4.click/en/spoil/'));const old=main.querySelector('.view#members');if(old){old.after(goals,farming)}
 const nav=document.querySelector('.nav');if(nav){const a=button('✧   Objetivos',()=>openExtra('goals'));a.dataset.extra='goals';const b=button('◈   Drop y Spoil',()=>openExtra('farming'));b.dataset.extra='farming';const j=button('◇   Joyería',()=>openExtra('jewelry'));j.dataset.extra='jewelry';nav.append(j,a,b);const membersButton=nav.querySelector('[data-tab="members"]');if(membersButton)nav.append(membersButton);nav.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{nav.querySelectorAll('[data-extra]').forEach(x=>x.classList.remove('active'))}))}
 document.querySelectorAll('[data-extra]').forEach(x=>x.addEventListener('click',()=>openExtra(x.dataset.extra)));
 // Hide the older raw tables in favour of the premium catalogue component.
 for(const id of ['catalog','recipes','sets','jewelry']){const host=$(id);if(host){const legacy=node('div','','hide');while(host.firstChild)legacy.append(host.firstChild);host.append(legacy)}}
 renderAll();goalsUI();syncCatalog();
 db.auth.onAuthStateChange(()=>setTimeout(sessionState,500));document.addEventListener('carmine-party-changed',()=>sessionState());sessionState()
}
function openExtra(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hide',v.id!==id));document.querySelectorAll('.nav button').forEach(v=>v.classList.toggle('active',v.dataset.extra===id));$('pagetitle').textContent=id==='goals'?'Objetivos de Crafteo':id==='jewelry'?'Joyería y Épicas':'Drop y Spoil';if(id==='goals')syncGoals();if(id==='jewelry')paint('jewelry')}
setTimeout(boot,300);

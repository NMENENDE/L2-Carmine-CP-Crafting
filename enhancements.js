import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const db=createClient('https://exdbjmenogqmdsagtzsc.supabase.co','sb_publishable_aiD4YZk2gx8B1thwWfcB5Q_Zu9Y1UJO');
const $=id=>document.getElementById(id), q=(el,sel)=>el?.querySelector(sel);
let goalItems=[],goalSets=[],expandedRecipe=null,craftQty=1;let data={items:[],recipes:[],sets:[],materials:[]},cursor={catalog:0,recipes:0,sets:0},filters={catalog:'',recipes:'',sets:''},user=null,party=null,balances=[],dbRecipes=[],dbIngredients=[];
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
 const [a,b,c,d,featured,featuredSets,icons]=await Promise.all(['data/items.json','data/recipes.json','data/sets.json','data/materials.json','data/featured-recipes.json','data/featured-sets.json','data/icons.json'].map(json));
 data.items=Array.isArray(a)?a:[];data.recipes=Array.isArray(b)?b:[];data.sets=Array.isArray(c)?c:[];data.materials=Array.isArray(d)?d:[];
 data.icons=icons&&typeof icons==='object'?icons:{byId:{},byName:{}};
 if(!data.items.length){data.items=await paged('items','id,name,grade,category,icon_url,source_url,verified');}
 if(!data.sets.length){data.sets=await paged('equipment_sets','id,name,grade,armor_type,image_url,set_bonus,verified');}
 if(!data.recipes.length){const rows=(await paged('recipes','id,output_item_id,output_quantity,success_rate,crafter_level,source_url,verified')).filter(r=>r.verified);data.recipes=rows.map(r=>({...r,name:'Recipe: '+(data.items.find(x=>x.id===r.output_item_id)?.name||'Ítem '+r.output_item_id)+' ('+Math.round(Number(r.success_rate)*100)+'%)',result:data.items.find(x=>x.id===r.output_item_id)?.name||'Ítem '+r.output_item_id,craft_level:r.crafter_level}));}
 if(Array.isArray(featuredSets)){for(const set of featuredSets){const ix=data.sets.findIndex(x=>x.name.toLowerCase()===set.name.toLowerCase());if(ix>=0)data.sets[ix]={...data.sets[ix],...set};else data.sets.push(set)}}
 if(Array.isArray(featured)){const known=new Set(data.recipes.map(r=>(r.name||'').toLowerCase().replace(/\s+/g,' ').trim()));for(const recipe of featured){const k=recipe.name.toLowerCase().replace(/\s+/g,' ').trim();if(!known.has(k)){data.recipes.push(recipe);known.add(k)}else{const idx=data.recipes.findIndex(r=>(r.name||'').toLowerCase().replace(/\s+/g,' ').trim()===k);if(idx>=0&&!data.recipes[idx].ingredients?.length)data.recipes[idx]={...data.recipes[idx],...recipe}}}}
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
function imgIcon(item){const icon=node('div','', 'premium-icon'),url=data.icons?.byId?.[String(item.game_item_id||'')]||data.icons?.byName?.[safe(item.name||item.result).trim().toLowerCase().replace(/\s+/g,' ')]||item.icon_url||item.image_url;if(url&&/^https:\/\//.test(url)){const image=document.createElement('img');image.src=url;image.loading='lazy';image.alt='';image.onerror=()=>{icon.replaceChildren(vectorIcon(item))};icon.append(image)}else{icon.append(vectorIcon(item))}return icon}
function card(obj,kind){
 const c=node('article','','premium-card'),head=node('div','','premium-head'),right=node('div');
 const item={...obj,category:kind==='sets'?'armor':kind==='recipes'?'recipe_item':obj.category};
 right.append(node('h3',obj.name||obj.result||'Ítem'),node('div',kind==='recipes'?obj.result||'Resultado':kind==='sets'?(obj.armor_type||'Armadura'):obj.category||'Ítem','meta'));head.append(imgIcon(item),right);c.append(head);
 if(kind==='recipes'){
 c.append(node('div','Grado '+(obj.grade||'—')+' · '+(obj.success_rate==null?'':Math.round(obj.success_rate*100)+'% de éxito')+(obj.craft_level?' · Nivel '+obj.craft_level:'')+(obj.armor_type?' · '+obj.armor_type.toUpperCase():''),'meta'));
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
 c.append(node('div','Grado '+(obj.grade||'—')+(obj.set_bonus?' · '+obj.set_bonus:''),'meta'));
 if(Array.isArray(obj.parts)&&obj.parts.length){
  const details=document.createElement('details');details.className='recipe-detail';
  details.append(node('summary','Ver '+obj.parts.length+' piezas del set'));
  const list=node('div','','source-list');
  for(const part of obj.parts){
    const line=node('div','','recipe-ingredient');line.append(node('span',part.slot+': '+part.name));
    if(part.recipe_result){const recipe=data.recipes.find(r=>r.result===part.recipe_result&&r.success_rate===1)||data.recipes.find(r=>r.result===part.recipe_result);if(recipe){const see=button('Materiales ↗',()=>{filters.recipes=part.recipe_result.toLowerCase();cursor.recipes=0;const search=containers.recipes?.grid?.parentElement?.querySelector('input');if(search)search.value=part.recipe_result;paint('recipes');document.querySelectorAll('[data-tab="recipes"]')[0]?.click()});see.className='smallbutton';line.append(see)}}
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
function mount(id){const host=$(id);if(!host)return null;const shell=node('div','','panel'),bar=node('div','','premium-toolbar'),search=document.createElement('input');search.placeholder=id==='catalog'?'Buscar entre todos los ítems…':id==='recipes'?'Buscar receta o resultado…':'Buscar set o armadura…';search.value=filters[id];bar.append(search);
 if(id==='recipes'){
 const select=document.createElement('select');select.id='premium-recipe-kind';
 for(const [v,t] of [['','Todas las recetas'],['armor','Armaduras y sets'],['weapon','Armas'],['material','Materiales']]){const opt=node('option',t);opt.value=v;select.append(opt)}
 bar.append(select);select.onchange=()=>{cursor.recipes=0;paint('recipes')};
 const armorSelect=document.createElement('select');armorSelect.id='premium-armor-type';
 for(const [v,t] of [['','Heavy / Light / Robe'],['heavy','Heavy'],['light','Light'],['robe','Robe']]){const o=node('option',t);o.value=v;armorSelect.append(o)}
 bar.append(armorSelect);armorSelect.onchange=()=>{cursor.recipes=0;paint('recipes')};
 const quantity=document.createElement('input');quantity.type='number';quantity.min='1';quantity.max='1000';quantity.step='1';quantity.value=String(craftQty);quantity.title='Cantidad de crafteos';quantity.placeholder='Cantidad a fabricar';bar.append(quantity);
 quantity.oninput=()=>{const n=Number(quantity.value);if(Number.isSafeInteger(n)&&n>=1&&n<=1000){craftQty=n;paint('recipes')}}
}
 if(id==='catalog'){const select=document.createElement('select');select.id='premium-category';for(const [v,t] of [['','Todas las categorías'],['material','Materiales'],['weapon','Armas'],['armor','Armaduras'],['jewelry','Joyas'],['recipe_item','Recetas'],['scroll','Scrolls'],['potion','Pociones'],['shot','Shots y flechas'],['spellbook','Spellbooks']]){const opt=node('option',t);opt.value=v;select.append(opt)}bar.append(select);select.onchange=()=>{cursor.catalog=0;paint('catalog')}}else if(id==='sets'){
 const type=document.createElement('select');type.id='premium-set-type';for(const [v,t] of [['','Todos los tipos'],['heavy','Heavy'],['light','Light'],['robe','Robe']]){const o=node('option',t);o.value=v;type.append(o)}bar.append(type);type.onchange=()=>{cursor.sets=0;paint('sets')};
 const select=document.createElement('select');select.id='premium-grade';for(const v of ['Todos los grados','S','A','B','C','D','NG']){const o=node('option',v);o.value=v==='Todos los grados'?'':v;select.append(o)}bar.append(select);select.onchange=()=>{cursor.sets=0;paint('sets')}}
 const counter=node('div','','small muted'),grid=node('div','','premium-grid'),foot=node('div','','premium-footer');
 shell.append(node('h2',id==='catalog'?'Catálogo LU4':id==='recipes'?'Recetas de crafting':'Sets de armaduras'),bar,counter,grid,foot);host.append(shell);
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
 if(id==='catalog'&&$('premium-category')?.value&&x.category!==$('premium-category').value)return false;if(id==='sets'&&$('premium-grade')?.value&&x.grade!==$('premium-grade').value)return false;if(id==='sets'&&$('premium-set-type')?.value&&x.armor_type!==$('premium-set-type').value)return false;return true});
 const limit=60;cursor[id]=Math.max(0,Math.min(cursor[id],Math.max(0,Math.ceil(filtered.length/limit)-1)));const start=cursor[id]*limit;const h=containers[id];if(!h)return;h.grid.replaceChildren();h.foot.replaceChildren();
 for(const obj of filtered.slice(start,start+limit))h.grid.append(card(obj,id));if(!filtered.length)h.grid.append(node('div','No se encontraron resultados.','premium-empty'));
 h.counter.textContent=fmt(filtered.length)+' resultados · Página '+(cursor[id]+1)+' de '+Math.max(1,Math.ceil(filtered.length/limit));
 const back=button('← Anterior',()=>{cursor[id]--;paint(id);h.grid.scrollIntoView({behavior:'smooth',block:'start'})});back.disabled=cursor[id]===0;const next=button('Siguiente →',()=>{cursor[id]++;paint(id);h.grid.scrollIntoView({behavior:'smooth',block:'start'})});next.disabled=start+limit>=filtered.length;h.foot.append(back,next)
}
function renderAll(){for(const id of ['catalog','recipes','sets']){if(!containers[id])containers[id]=mount(id);paint(id)}goalsUI()}
async function sessionState(){const {data:{user:u}}=await db.auth.getUser();user=u;if(!user)return;const {data:members}=await db.from('party_members').select('party_id').eq('user_id',user.id).limit(1);party=members?.[0]?.party_id||null;await syncInventory();await syncGoals();paint('recipes')}
function goalsUI(){const host=$('goals');if(!host)return;host.replaceChildren();const panel=node('section','','panel'),h=node('h2','Objetivos de crafteo de la CP'),form=document.createElement('form'),row=node('div','','premium-toolbar'),target=document.createElement('select'),title=document.createElement('input'),priority=document.createElement('select'),submit=node('button','Crear objetivo','primary');submit.type='submit';title.placeholder='Nombre del objetivo';title.required=true;
 const first=node('option','Elegir objetivo: ítem o set');first.value='';target.append(first);
 for(const obj of goalItems.filter(i=>['weapon','armor','material'].includes(i.category)).slice(0,2000)){const o=node('option',obj.name);o.value='item:'+obj.id;target.append(o)}
 for(const obj of goalSets.filter(i=>i.id)){const o=node('option','Set: '+obj.name);o.value='set:'+obj.id;target.append(o)}
 for(const [v,t] of [['1','Prioridad alta'],['2','Prioridad media'],['3','Prioridad baja']]){const o=node('option',t);o.value=v;priority.append(o)}
 row.append(target,title,priority,submit);form.append(row);form.onsubmit=async e=>{e.preventDefault();if(!user||!party)return message('Primero ingresá a tu CP');const [kind,id]=target.value.split(':');if(!id)return message('Seleccioná un objetivo');const payload={party_id:party,title:title.value.trim(),priority:Number(priority.value),created_by:user.id};if(kind==='item')payload.target_item_id=Number(id);else payload.target_set_id=Number(id);const {error}=await db.from('crafting_projects').insert(payload);if(error)message(error.message);else{title.value='';await syncGoals()}};const list=node('div','', 'stack');panel.append(h,form,list);host.append(panel);host._list=list}
async function syncGoals(){if(!user||!party||!$('goals'))return;if(!$('goals')._list)goalsUI();const {data:goals,error}=await db.from('crafting_projects').select('id,title,status,priority,target_item_id,target_set_id').eq('party_id',party).order('priority',{ascending:true});if(error){message(error.message);return}
 if(!dbRecipes.length){dbRecipes=await paged('recipes','id,output_item_id,output_quantity,success_rate,verified');dbIngredients=await paged('recipe_ingredients','recipe_id,item_id,quantity')}
 const list=$('goals')._list;list.replaceChildren();if(!goals?.length){list.append(node('div','Todavía no hay objetivos registrados.','premium-empty'));return}
 for(const g of goals){const box=node('div','','premium-box'),top=node('div','','goal-title');top.append(node('h3',g.title),node('span',g.status||'Activo','tag'));box.append(top);
 if(g.target_item_id){const recipe=dbRecipes.find(r=>r.output_item_id===g.target_item_id&&r.verified);if(recipe){const ingredients=dbIngredients.filter(i=>i.recipe_id===recipe.id);let ok=0,needed=0;for(const ing of ingredients){const owned=balances.filter(b=>b.item_id===ing.item_id).reduce((s,b)=>s+Number(b.quantity),0);const available=Math.min(owned,ing.quantity);ok+=available;needed+=Number(ing.quantity);const item=data.items.find(i=>i.id===ing.item_id);box.append(node('div',(item?.name||'Ítem '+ing.item_id)+' · '+fmt(owned)+' / '+fmt(ing.quantity),'small muted'))}if(needed){const meter=node('div','','meter'),bar=node('span');bar.style.width=Math.round(100*ok/needed)+'%';meter.append(bar);box.append(meter,node('div',Math.round(100*ok/needed)+'% de ingredientes disponibles','small'))}else box.append(node('div','Receta sin ingredientes cargados.','muted small'))}else box.append(node('div','Objetivo registrado. Consultá la ficha del ítem para su receta.','muted small'))}
 if(g.target_set_id)box.append(node('div','Set en seguimiento. Las piezas se vinculan al completar el catálogo.','muted small'));
 list.append(box)
 }
}
async function syncInventory(){if(!user||!party)return;const {data:locs}=await db.from('inventory_locations').select('id,name,owner_user_id').eq('party_id',party);if(!locs?.some(l=>l.owner_user_id===user.id)){const {error}=await db.from('inventory_locations').insert({party_id:party,owner_user_id:user.id,name:'Inventario de '+(user.email?.split('@')[0]||'personaje'),location_type:'personal'});if(error)message('Ubicación: '+error.message)}
 const {data:bals}=await db.from('inventory_balances').select('item_id,quantity,location_id').eq('party_id',party);balances=bals||[];
}
function message(s){const n=$('notice');if(!n)return;n.textContent=s;n.style.display='block';setTimeout(()=>n.style.display='none',4000)}
function boot(){
 const main=document.querySelector('.content');if(!main)return;const goals=node('section','','view hide');goals.id='goals';const farming=node('section','','view hide');farming.id='farming';farming.append(node('div','', 'panel'));const panel=farming.firstChild;panel.append(node('h2','Drop y Spoil · LU4'),node('p','Consultá monstruos, niveles, zonas y porcentajes en las fichas LU4.','muted'));panel.append(elink('Abrir catálogo de Drop ↗','https://lu4.click/en/drop/'),node('div',' · '),elink('Abrir catálogo de Spoil ↗','https://lu4.click/en/spoil/'));const old=main.querySelector('.view#members');if(old){old.after(goals,farming)}
 const nav=document.querySelector('.nav');if(nav){const a=button('✧   Objetivos',()=>openExtra('goals'));a.dataset.extra='goals';const b=button('◈   Drop y Spoil',()=>openExtra('farming'));b.dataset.extra='farming';nav.append(a,b);nav.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{nav.querySelectorAll('[data-extra]').forEach(x=>x.classList.remove('active'))}))}
 document.querySelectorAll('[data-extra]').forEach(x=>x.addEventListener('click',()=>openExtra(x.dataset.extra)));
 // Hide the older raw tables in favour of the premium catalogue component.
 for(const id of ['catalog','recipes','sets']){const host=$(id);if(host){const legacy=node('div','','hide');while(host.firstChild)legacy.append(host.firstChild);host.append(legacy)}}
 renderAll();goalsUI();syncCatalog();
 db.auth.onAuthStateChange(()=>setTimeout(sessionState,500));sessionState()
}
function openExtra(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hide',v.id!==id));document.querySelectorAll('.nav button').forEach(v=>v.classList.toggle('active',v.dataset.extra===id));$('pagetitle').textContent=id==='goals'?'Objetivos de Crafteo':'Drop y Spoil';if(id==='goals')syncGoals()}
setTimeout(boot,300);

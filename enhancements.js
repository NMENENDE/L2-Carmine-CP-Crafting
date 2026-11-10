import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const db=createClient('https://exdbjmenogqmdsagtzsc.supabase.co','sb_publishable_aiD4YZk2gx8B1thwWfcB5Q_Zu9Y1UJO');
const $=id=>document.getElementById(id), q=(el,sel)=>el?.querySelector(sel);
let data={items:[],recipes:[],sets:[],materials:[]},cursor={catalog:0,recipes:0,sets:0},filters={catalog:'',recipes:'',sets:''},user=null,party=null,balances=[],dbRecipes=[],dbIngredients=[];
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
 const [a,b,c,d]=await Promise.all(['data/items.json','data/recipes.json','data/sets.json','data/materials.json'].map(json));
 data.items=Array.isArray(a)?a:[];data.recipes=Array.isArray(b)?b:[];data.sets=Array.isArray(c)?c:[];data.materials=Array.isArray(d)?d:[];
 if(!data.items.length){data.items=await paged('items','id,name,grade,category,icon_url,source_url,verified');}
 if(!data.sets.length){data.sets=await paged('equipment_sets','id,name,grade,armor_type,image_url,set_bonus,verified');}
 if(!data.recipes.length){const rows=await paged('recipes','id,output_item_id,output_quantity,success_rate,crafter_level,source_url,verified');data.recipes=rows.map(r=>({...r,name:'Receta #'+r.id,result:data.items.find(x=>x.id===r.output_item_id)?.name||'Ítem '+r.output_item_id,craft_level:r.crafter_level}));}
 renderAll();
}
function imgIcon(item){const icon=node('div','', 'premium-icon'),url=item.icon_url||item.image_url;if(url&&/^https:\/\//.test(url)){const image=document.createElement('img');image.src=url;image.loading='lazy';image.alt='';image.onerror=()=>{icon.replaceChildren(node('span',typeIcon[item.category]||'✦'))};icon.append(image)}else{icon.append(node('span',typeIcon[item.category]||'✦'))}return icon}
function card(obj,kind){
 const c=node('article','','premium-card'),head=node('div','','premium-head'),right=node('div');
 const item={...obj,category:kind==='sets'?'armor':kind==='recipes'?'recipe_item':obj.category};
 right.append(node('h3',obj.name||obj.result||'Ítem'),node('div',kind==='recipes'?obj.result||'Resultado':kind==='sets'?(obj.armor_type||'Armadura'):obj.category||'Ítem','meta'));head.append(imgIcon(item),right);c.append(head);
 if(kind==='recipes')c.append(node('div','Grado '+(obj.grade||'—')+' · '+(obj.success_rate==null?'':Math.round(obj.success_rate*100)+'% de éxito'),'meta'));
 if(kind==='sets')c.append(node('div','Grado '+(obj.grade||'—')+(obj.set_bonus?' · '+obj.set_bonus:''),'meta'));
 const foot=node('div','','bottom');foot.append(node('span',obj.grade||'—','badge-grade'));
 let link=obj.source_url;
 if(!link&&kind==='catalog'&&obj.name)link='https://la2wiki.com/lu4/items';
 if(!link&&kind==='sets')link='https://la2wiki.com/lu4/sets';
 if(!link&&kind==='recipes')link='https://la2wiki.com/lu4/recipes';
 if(link)foot.append(elink('Consultar LU4 ↗',link));
 c.append(foot);
 return c
}
function mount(id){const host=$(id);if(!host)return null;host.replaceChildren();const shell=node('div','','panel'),bar=node('div','','premium-toolbar'),search=document.createElement('input');search.placeholder=id==='catalog'?'Buscar entre todos los ítems…':id==='recipes'?'Buscar receta o resultado…':'Buscar set o armadura…';search.value=filters[id];bar.append(search);
 if(id==='catalog'){const select=document.createElement('select');select.id='premium-category';for(const [v,t] of [['','Todas las categorías'],['material','Materiales'],['weapon','Armas'],['armor','Armaduras'],['jewelry','Joyas'],['recipe_item','Recetas'],['scroll','Scrolls'],['potion','Pociones'],['shot','Shots y flechas'],['spellbook','Spellbooks']]){const opt=node('option',t);opt.value=v;select.append(opt)}bar.append(select);select.onchange=()=>{cursor.catalog=0;paint('catalog')}}else if(id==='sets'){const select=document.createElement('select');select.id='premium-grade';for(const v of ['Todos los grados','S','A','B','C','D','NG']){const o=node('option',v);o.value=v==='Todos los grados'?'':v;select.append(o)}bar.append(select);select.onchange=()=>{cursor.sets=0;paint('sets')}}
 const counter=node('div','','small muted'),grid=node('div','','premium-grid'),foot=node('div','','premium-footer');
 shell.append(node('h2',id==='catalog'?'Catálogo LU4':id==='recipes'?'Recetas de crafting':'Sets de armaduras'),bar,counter,grid,foot);host.append(shell);
 search.oninput=()=>{filters[id]=search.value.toLocaleLowerCase();cursor[id]=0;paint(id)};return {grid,counter,foot}
}
const containers={};
function paint(id){
 const arr=data[id==='catalog'?'items':id]||[];let filtered=arr.filter(x=>{const str=[x.name,x.result,x.grade,x.armor_type,x.category].join(' ').toLocaleLowerCase();if(filters[id]&&!str.includes(filters[id]))return false;if(id==='catalog'&&$('premium-category')?.value&&x.category!==$('premium-category').value)return false;if(id==='sets'&&$('premium-grade')?.value&&x.grade!==$('premium-grade').value)return false;return true});
 const limit=60;cursor[id]=Math.max(0,Math.min(cursor[id],Math.max(0,Math.ceil(filtered.length/limit)-1)));const start=cursor[id]*limit;const h=containers[id];if(!h)return;h.grid.replaceChildren();h.foot.replaceChildren();
 for(const obj of filtered.slice(start,start+limit))h.grid.append(card(obj,id));if(!filtered.length)h.grid.append(node('div','No se encontraron resultados.','premium-empty'));
 h.counter.textContent=fmt(filtered.length)+' resultados · Página '+(cursor[id]+1)+' de '+Math.max(1,Math.ceil(filtered.length/limit));
 const back=button('← Anterior',()=>{cursor[id]--;paint(id);h.grid.scrollIntoView({behavior:'smooth',block:'start'})});back.disabled=cursor[id]===0;const next=button('Siguiente →',()=>{cursor[id]++;paint(id);h.grid.scrollIntoView({behavior:'smooth',block:'start'})});next.disabled=start+limit>=filtered.length;h.foot.append(back,next)
}
function renderAll(){for(const id of ['catalog','recipes','sets']){if(!containers[id])containers[id]=mount(id);paint(id)}}
async function sessionState(){const {data:{user:u}}=await db.auth.getUser();user=u;if(!user)return;const {data:members}=await db.from('party_members').select('party_id').eq('user_id',user.id).limit(1);party=members?.[0]?.party_id||null;await Promise.all([syncGoals(),syncInventory()])}
function goalsUI(){const host=$('goals');if(!host)return;host.replaceChildren();const panel=node('section','','panel'),h=node('h2','Objetivos de crafteo de la CP'),form=document.createElement('form'),row=node('div','','premium-toolbar'),target=document.createElement('select'),title=document.createElement('input'),priority=document.createElement('select'),submit=node('button','Crear objetivo','primary');submit.type='submit';title.placeholder='Nombre del objetivo';title.required=true;
 const first=node('option','Elegir objetivo: ítem o set');first.value='';target.append(first);
 for(const obj of data.items.filter(i=>['weapon','armor','material'].includes(i.category)).slice(0,2000)){const o=node('option',obj.name);o.value='item:'+obj.id;target.append(o)}
 for(const obj of data.sets.filter(i=>i.id)){const o=node('option','Set: '+obj.name);o.value='set:'+obj.id;target.append(o)}
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
 for(const id of ['catalog','recipes','sets']){const host=$(id);if(host)host.replaceChildren()}
 renderAll();goalsUI();syncCatalog();
 db.auth.onAuthStateChange(()=>setTimeout(sessionState,500));sessionState()
}
function openExtra(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hide',v.id!==id));document.querySelectorAll('.nav button').forEach(v=>v.classList.toggle('active',v.dataset.extra===id));$('pagetitle').textContent=id==='goals'?'Objetivos de Crafteo':'Drop y Spoil';if(id==='goals')syncGoals()}
setTimeout(boot,300);

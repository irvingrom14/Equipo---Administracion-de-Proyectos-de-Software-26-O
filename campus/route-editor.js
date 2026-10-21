import * as THREE from 'three';
import {modelToGeo,edgeMeters,routeIssues} from 'route-space';

export function createRouteEditor({scene,canvas,getCamera,getData,getGeo,initial,onDirty,message,viewTop,busy,onEnable}){
 const $=id=>document.getElementById(id);let net=structuredClone(initial),saved=JSON.stringify(net),past=[],future=[],selected='',edgeIndex=-1,linkFrom='';
 const group=new THREE.Group();group.name='Editor_red_peatonal_no_exportar';group.renderOrder=30;scene.add(group);
 const overlay=document.createElement('canvas');overlay.setAttribute('aria-label','Capa visual de la red peatonal');Object.assign(overlay.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'1'});canvas.parentElement.append(overlay);const ctx=overlay.getContext('2d');
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);let down;
 function remember(){past.push(structuredClone(net));if(past.length>60)past.shift();future=[];}
 function issues(complete=true){return routeIssues(net,getData(),getGeo(),{complete});}
 function status(){const errors=issues();$('routeStatus').textContent=`${net.nodos.length} nodos · ${net.aristas.length} tramos · ${net.destinos.length} destinos. `+(errors.length?errors.slice(0,3).join(' '):'Red conectada y sin cruces de cuerpos cerrados.');$('routeStatus').style.color=errors.length?'#a01735':'#285a35';$('routeUndo').disabled=!past.length;$('routeRedo').disabled=!future.length;}
 function rebuildOptions(el,items,value){el.replaceChildren();for(const [id,text]of items){const o=document.createElement('option');o.value=id;o.textContent=text;el.append(o);}el.value=value;}
 function fields(){const n=net.nodos.find(n=>n.id===selected);$('routeNodeX').value=n?.x??'';$('routeNodeZ').value=n?.z??'';$('routeNodeType').value=n?.tipo||'cruce';const e=net.aristas[edgeIndex];if(e){$('routeEdgeType').value=e.tipo;$('routeAccessible').checked=e.accesible;}}
 function refresh(){
  group.visible=$('showRoutes').checked;
  rebuildOptions($('routeNode'),[['','Selecciona un nodo'],...net.nodos.map(n=>[n.id,n.id+' · '+n.tipo])],selected);
  rebuildOptions($('routeEdge'),[['','Selecciona un tramo'],...net.aristas.map((e,i)=>[String(i),e.de+' ↔ '+e.a+' · '+e.metros+' m'])],edgeIndex<0?'':String(edgeIndex));
  const dest=$('routeDestination').value;rebuildOptions($('routeDestination'),net.destinos.map(d=>[d.id,d.nombre]),dest||net.destinos[0]?.id);fields();status();onDirty();
 }
 function chooseNode(id){selected=id;edgeIndex=-1;if($('routeTool').value==='link'&&!linkFrom)linkFrom=id;refresh();}
 function mutate(fn,{geometry=true}={}){if(busy())return;const old=structuredClone(net);fn();const errors=geometry?issues(false):[];if(errors.length){net=old;refresh();message(errors[0]);return;}past.push(old);if(past.length>60)past.shift();future=[];refresh();}
 function updateNode(n,x,z){n.x=+x.toFixed(4);n.z=+z.toFixed(4);Object.assign(n,modelToGeo(n.x,n.z,getGeo()));for(const e of net.aristas)if(e.de===n.id||e.a===n.id){e.metros=edgeMeters(net.nodos.find(n=>n.id===e.de),net.nodos.find(n=>n.id===e.a));}}
 function groundPoint(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,getCamera());return ray.ray.intersectPlane(ground,new THREE.Vector3());}
 function nearNode(e){const r=canvas.getBoundingClientRect(),camera=getCamera();let hit=null,best=15;for(const n of net.nodos){const p=new THREE.Vector3(n.x,1,n.z).project(camera);if(p.z<0||p.z>1)continue;const dist=Math.hypot((p.x+1)*r.width/2-(e.clientX-r.left),(1-p.y)*r.height/2-(e.clientY-r.top));if(dist<best){best=dist;hit=n;}}return hit;}
 function nearEdge(e){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let hit=-1,best=8;for(const [i,edge]of net.aristas.entries()){const a=net.nodos.find(n=>n.id===edge.de),b=net.nodos.find(n=>n.id===edge.a);const project=n=>{const p=new THREE.Vector3(n.x,1,n.z).project(getCamera());return {x:(p.x+1)*r.width/2,y:(1-p.y)*r.height/2};},p=project(a),q=project(b),dx=q.x-p.x,dy=q.y-p.y,t=Math.max(0,Math.min(1,((x-p.x)*dx+(y-p.y)*dy)/(dx*dx+dy*dy||1))),dist=Math.hypot(x-p.x-t*dx,y-p.y-t*dy);if(dist<best){best=dist;hit=i;}}return hit;}
 canvas.addEventListener('pointerdown',e=>{if($('editRoutes').checked)down=[e.clientX,e.clientY];},true);
 canvas.addEventListener('pointerup',e=>{
  if(!$('editRoutes').checked||busy()||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
  e.stopImmediatePropagation();const tool=$('routeTool').value,hit=nearNode(e),p=groundPoint(e);if(!p)return;
  if(tool==='add'){
   if(hit){chooseNode(hit.id);return;}const id='n'+(Math.max(0,...net.nodos.map(n=>Number(n.id.slice(1))||0))+1);
   const split=nearEdge(e);mutate(()=>{const n={id,x:0,z:0,lat:0,lon:0,nivel:0,tipo:'cruce'};net.nodos.push(n);if(split>=0){const old=net.aristas[split],a=net.nodos.find(n=>n.id===old.de),b=net.nodos.find(n=>n.id===old.a),dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));updateNode(n,a.x+t*dx,a.z+t*dz);net.aristas.splice(split,1,{...old,a:n.id,metros:edgeMeters(a,n)},{...old,de:n.id,metros:edgeMeters(n,b)});}else updateNode(n,p.x,p.z);selected=id;});
  }else if(tool==='move'){
   const n=net.nodos.find(n=>n.id===selected);if(!n){message('Selecciona primero el nodo que quieres mover.');return;}mutate(()=>updateNode(n,p.x,p.z));
  }else if(tool==='link'){
   if(!hit)return;if(!linkFrom){linkFrom=hit.id;selected=hit.id;refresh();message('Ahora pulsa el nodo de llegada.');return;}
   if(linkFrom===hit.id)return;const a=net.nodos.find(n=>n.id===linkFrom);mutate(()=>net.aristas.push({de:a.id,a:hit.id,metros:edgeMeters(a,hit),tipo:$('routeEdgeType').value,accesible:$('routeAccessible').checked}));linkFrom='';
  }else if(hit)chooseNode(hit.id);else{edgeIndex=nearEdge(e);selected='';refresh();}
 },true);
 $('showRoutes').onchange=()=>{group.visible=$('showRoutes').checked;if(!group.visible){$('editRoutes').checked=false;$('routeEditor').hidden=true;}};
 $('editRoutes').onchange=()=>{if(busy())return;const enabled=$('editRoutes').checked;$('routeEditor').hidden=!enabled;if(enabled){onEnable();$('showRoutes').checked=true;group.visible=true;viewTop();}linkFrom='';};
 $('routeTool').onchange=()=>{linkFrom=$('routeTool').value==='link'?selected:'';};
 $('routeNode').onchange=()=>chooseNode($('routeNode').value);
 $('routeEdge').onchange=()=>{edgeIndex=$('routeEdge').value===''?-1:Number($('routeEdge').value);selected='';refresh();};
 $('routeApplyNode').onclick=()=>{const n=net.nodos.find(n=>n.id===selected),x=Number($('routeNodeX').value),z=Number($('routeNodeZ').value);if(!n||![x,z].every(Number.isFinite)){message('Selecciona un nodo e introduce X/Z válidos.');return;}mutate(()=>{updateNode(n,x,z);n.tipo=$('routeNodeType').value;});};
 $('routeApplyEdge').onclick=()=>{if(!net.aristas[edgeIndex])return;mutate(()=>Object.assign(net.aristas[edgeIndex],{tipo:$('routeEdgeType').value,accesible:$('routeAccessible').checked}));};
 $('routeDelete').onclick=()=>{if(selected){if(net.destinos.some(d=>d.nodo===selected)){message('Reasigna el destino antes de quitar su nodo.');return;}mutate(()=>{net.nodos=net.nodos.filter(n=>n.id!==selected);net.aristas=net.aristas.filter(e=>e.de!==selected&&e.a!==selected);selected='';},{geometry:false});}else if(edgeIndex>=0)mutate(()=>{net.aristas.splice(edgeIndex,1);edgeIndex=-1;},{geometry:false});};
 $('routeAssign').onclick=()=>{if(!selected)return;mutate(()=>{const dest=net.destinos.find(d=>d.id===$('routeDestination').value);dest.nodo=selected;net.nodos.find(n=>n.id===selected).tipo=dest.id.startsWith('ACCESO_')?'acceso':'entrada';});};
 $('routeUndo').onclick=()=>{if(busy()||!past.length)return;future.push(net);net=past.pop();selected='';edgeIndex=-1;refresh();};
 $('routeRedo').onclick=()=>{if(busy()||!future.length)return;past.push(net);net=future.pop();selected='';edgeIndex=-1;refresh();};
 $('routeValidate').onclick=()=>{status();message(issues()[0]||'Red válida: conectada, destinos completos y sin cortes de edificios cerrados.');};
 $('routeImport').onclick=()=>$('routeFile').click();$('routeFile').onchange=async e=>{try{if(!e.target.files[0])return;const value=JSON.parse(await e.target.files[0].text());if(!['nodos','aristas','destinos'].every(k=>Array.isArray(value[k])))throw Error('Archivo de rutas incompleto.');const errors=routeIssues(value,getData(),getGeo());if(errors.length)throw Error(errors[0]);remember();net=value;selected='';edgeIndex=-1;refresh();message('Red importada. Usa Guardar cambios para conservarla.');}catch(err){message(err.message);}finally{e.target.value='';}};
 refresh();
 function paint(camera,w,h){
  overlay.hidden=!$('showRoutes').checked;if(overlay.hidden)return;const ratio=Math.min(devicePixelRatio,2);if(overlay.width!==Math.round(w*ratio)||overlay.height!==Math.round(h*ratio)){overlay.width=Math.round(w*ratio);overlay.height=Math.round(h*ratio);}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const points=new Map(net.nodos.map(n=>{const p=new THREE.Vector3(n.x,.9,n.z).project(camera);return [n.id,{x:(p.x+1)*w/2,y:(1-p.y)*h/2,visible:p.z>-1&&p.z<1}];}));
  for(const [i,e]of net.aristas.entries()){const a=points.get(e.de),b=points.get(e.a);if(!a?.visible||!b?.visible)continue;ctx.strokeStyle=i===edgeIndex?'#e9ad00':e.tipo==='escalera'?'#ad00c5':'#006be0';ctx.lineWidth=i===edgeIndex?4:2;ctx.setLineDash(e.accesible?[]:[5,3]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  ctx.setLineDash([]);for(const n of net.nodos){const p=points.get(n.id);if(!p.visible)continue;ctx.fillStyle=n.id===selected?'#ffe500':n.tipo==='acceso'?'#8823c9':n.tipo==='entrada'?'#ff9514':'#007ae8';ctx.strokeStyle='white';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,n.id===selected?6:n.tipo==='cruce'?3.5:5,0,Math.PI*2);ctx.fill();ctx.stroke();if(n.id===selected){ctx.font='bold 12px sans-serif';ctx.fillStyle='#132d46';ctx.fillText(n.id,p.x+8,p.y-7);}}
 }
 return {group,refresh,paint,isDirty:()=>JSON.stringify(net)!==saved,exportNet:()=>{const errors=issues();if(errors.length)throw Error('No se guardó: '+errors[0]);return structuredClone(net);},markSaved:value=>{saved=JSON.stringify(value);onDirty();},getNet:()=>structuredClone(net)};
}

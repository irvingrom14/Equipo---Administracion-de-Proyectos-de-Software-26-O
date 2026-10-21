export const ROUTE_FRAME={xMin:-390,xMax:390,zMin:-150,zMax:170};
export function modelToGeo(x,z,g){const u=(x+390)/780,v=(z+150)/320;return {lat:+(g.superiorIzquierda[0]+u*(g.superiorDerecha[0]-g.superiorIzquierda[0])+v*(g.inferiorIzquierda[0]-g.superiorIzquierda[0])).toFixed(8),lon:+(g.superiorIzquierda[1]+u*(g.superiorDerecha[1]-g.superiorIzquierda[1])+v*(g.inferiorIzquierda[1]-g.superiorIzquierda[1])).toFixed(8)};}
export function geoDistance(a,b){const r=Math.PI/180,p=(a.lat+b.lat)/2*r;return Math.hypot((b.lon-a.lon)*r*Math.cos(p),(b.lat-a.lat)*r)*6371008.8;}
export function edgeMeters(a,b){return +geoDistance(a,b).toFixed(2);}
export function pointInside(p,poly,strict=false){
 let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],cross=(p.x-a.x)*(b.z-a.z)-(p.z-a.z)*(b.x-a.x);if(Math.abs(cross)/Math.max(1e-9,Math.hypot(b.x-a.x,b.z-a.z))<.0002&&p.x>=Math.min(a.x,b.x)-.0002&&p.x<=Math.max(a.x,b.x)+.0002&&p.z>=Math.min(a.z,b.z)-.0002&&p.z<=Math.max(a.z,b.z)+.0002)return !strict;if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)hit=!hit;}return hit;
}
export function segmentCuts(a,b,poly){
 if(pointInside(a,poly,true)||pointInside(b,poly,true))return true;
 const ts=[0,1],dx=b.x-a.x,dz=b.z-a.z;
 for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],ex=q.x-p.x,ez=q.z-p.z,det=dx*ez-dz*ex;if(Math.abs(det)<1e-10)continue;const t=((p.x-a.x)*ez-(p.z-a.z)*ex)/det,u=((p.x-a.x)*dz-(p.z-a.z)*dx)/det;if(t>0&&t<1&&u>=0&&u<=1)ts.push(t);}
 ts.sort((a,b)=>a-b);return ts.some((t,i)=>i>0&&pointInside({x:a.x+dx*(t+ts[i-1])/2,z:a.z+dz*(t+ts[i-1])/2},poly,true));
}
export function obstacles(data){
 const s=data.metersPerPixel,out=[];
 for(const b of data.buildings)for(const [i,r]of b.rects.entries()){
  const cx=((r[0]+r[2])/2-895)*s+(b.offsetX||0),cz=((r[1]+r[3])/2-390)*s+(b.offsetZ||0),diamond=b.diamond?Math.SQRT1_2:1,w=(r[2]-r[0])*s*diamond,d=(r[3]-r[1])*s*diamond;
  const gallery=b.openGallery||b.galleryParts?.includes(i),gap=gallery?Math.min(2.8,d*.32):0,yaw=b.diamond?(b.facadeYaw??Math.PI/4):0;
  const poly=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2-gap],[-w/2,d/2-gap]].map(([x,z])=>({x:cx+x*Math.cos(yaw)+z*Math.sin(yaw),z:cz-x*Math.sin(yaw)+z*Math.cos(yaw)}));out.push({id:b.id,poly});
 }
 return out;
}
export function routeIssues(net,data,geo,{complete=true}={}){
 const errors=[],nodes=new Map(),edgeKeys=new Set(),adj=new Map(),blocks=obstacles(data),s=data.metersPerPixel,site=data.site.map(p=>({x:(p[0]-895)*s,z:(p[1]-390)*s}));
 if(net.version!==1||net.unidad!=='azcapotzalco')errors.push('Contrato de rutas incompatible.');
 for(const n of net.nodos||[]){if(!n.id||nodes.has(n.id))errors.push('ID de nodo repetido o vacío: '+n.id);nodes.set(n.id,n);adj.set(n.id,[]);if(![n.x,n.z,n.lat,n.lon,n.nivel].every(Number.isFinite)||!Number.isInteger(n.nivel)||n.nivel!==0)errors.push('Nodo sin coordenadas válidas en PB: '+n.id);if(!['cruce','acceso','entrada'].includes(n.tipo))errors.push('Tipo de nodo inválido: '+n.id);const ll=modelToGeo(n.x,n.z,geo);if(geoDistance(ll,n)>.08)errors.push('Lat/lon no coincide con X/Z: '+n.id);if(!pointInside(n,site))errors.push('Nodo fuera del predio: '+n.id);const block=blocks.find(o=>pointInside(n,o.poly,true));if(block)errors.push('Nodo dentro del cuerpo cerrado '+block.id+': '+n.id);}
 for(const e of net.aristas||[]){const a=nodes.get(e.de),b=nodes.get(e.a),key=[e.de,e.a].sort().join('|');if(!a||!b){errors.push('Arista con nodo inexistente: '+key);continue;}if(a===b||edgeKeys.has(key))errors.push('Arista repetida o de longitud cero: '+key);edgeKeys.add(key);if(!['exterior','pasillo','escalera','rampa','elevador'].includes(e.tipo)||typeof e.accesible!=='boolean')errors.push('Atributos de arista inválidos: '+key);if(!(e.metros>0)||Math.abs(e.metros-edgeMeters(a,b))>.06)errors.push('Metros incoherentes: '+key);for(const o of blocks)if(segmentCuts(a,b,o.poly))errors.push('Tramo '+key+' atraviesa cuerpo cerrado '+o.id);for(const t of [.25,.5,.75])if(!pointInside({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},site))errors.push('Tramo fuera del predio: '+key);adj.get(a.id).push(b.id);adj.get(b.id).push(a.id);}
 for(const e of net.aristas||[]){const a=nodes.get(e.de),b=nodes.get(e.a);if(!a||!b)continue;const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.001)continue;for(const n of nodes.values()){if(n.id===a.id||n.id===b.id||n.nivel!==a.nivel)continue;const t=((n.x-a.x)*dx+(n.z-a.z)*dz)/(len*len),dist=Math.abs((n.x-a.x)*dz-(n.z-a.z)*dx)/len;if(t*len>.02&&(1-t)*len>.02&&dist<.005)errors.push('Divide el tramo '+e.de+'|'+e.a+' en el nodo intermedio '+n.id);}}
 const edges=net.aristas||[];for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const e=edges[i],f=edges[j];if([e.de,e.a].some(id=>id===f.de||id===f.a))continue;const a=nodes.get(e.de),b=nodes.get(e.a),c=nodes.get(f.de),d=nodes.get(f.a);if(!a||!b||!c||!d||a.nivel!==c.nivel)continue;const dx=b.x-a.x,dz=b.z-a.z,ex=d.x-c.x,ez=d.z-c.z,det=dx*ez-dz*ex;if(Math.abs(det)<1e-9)continue;const t=((c.x-a.x)*ez-(c.z-a.z)*ex)/det,u=((c.x-a.x)*dz-(c.z-a.z)*dx)/det;if(t>1e-5&&t<1-1e-5&&u>1e-5&&u<1-1e-5)errors.push('Cruce sin nodo común entre '+e.de+'|'+e.a+' y '+f.de+'|'+f.a);}
 const destIds=new Set();for(const d of net.destinos||[]){if(destIds.has(d.id)||!d.id)errors.push('Destino repetido o vacío: '+d.id);destIds.add(d.id);const n=nodes.get(d.nodo);if(!n)errors.push('Destino sin nodo válido: '+d.id);if(!d.nombre)errors.push('Destino sin nombre: '+d.id);
  if(n){const shapes=blocks.filter(o=>o.id===d.id);if(shapes.length){let distance=Infinity;for(const shape of shapes)for(let i=0;i<shape.poly.length;i++){const a=shape.poly[i],b=shape.poly[(i+1)%shape.poly.length],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((n.x-a.x)*dx+(n.z-a.z)*dz)/(dx*dx+dz*dz)));distance=Math.min(distance,Math.hypot(n.x-a.x-t*dx,n.z-a.z-t*dz));}if(distance>5)errors.push('Entrada alejada de su edificio: '+d.id);}
   const gate=data.gates.find(g=>'ACCESO_'+g.id===d.id);if(gate&&Math.hypot(n.x-(gate.x-895)*s,n.z-(gate.y-390)*s)>3)errors.push('Nodo alejado del acceso: '+d.id);
   const plaza=data.plazas.find(p=>(p.name==='Plaza COSEI'?'COSEI':p.name==='Plaza Roja'?'PLAZA_ROJA':'')===d.id);if(plaza){const r=plaza.rect;if(n.x<(r[0]-895)*s||n.x>(r[2]-895)*s||n.z<(r[1]-390)*s||n.z>(r[3]-390)*s)errors.push('Destino fuera de su plaza: '+d.id);}
  }
 }
 if(complete){if(!nodes.size)errors.push('La red está vacía.');const seen=new Set(),stack=nodes.size?[nodes.keys().next().value]:[];while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);stack.push(...(adj.get(id)||[]));}if(seen.size!==nodes.size)errors.push('Falta conectar '+(nodes.size-seen.size)+' nodos a la red principal.');for(const id of [...data.buildings.map(b=>b.id),'COSEI','PLAZA_ROJA',...data.gates.filter(g=>g.type==='pedestrian').map(g=>'ACCESO_'+g.id)])if(!destIds.has(id))errors.push('Falta destino: '+id);}
 return [...new Set(errors)];
}

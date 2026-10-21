import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {ORIGINAL} from './model-data.js';
const b=await fs.readFile(new URL('./UAM_Azcapotzalco.glb',import.meta.url));
assert.equal(b.subarray(0,4).toString(),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);
const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
for(const building of ORIGINAL.buildings){const node=gltf.nodes.find(n=>n.name==='Edificio_'+building.id);assert.ok(node,'Falta '+building.id);assert.equal(node.extras.floors,building.floors);}
assert.equal(ORIGINAL.gates.filter(g=>g.type==='vehicle').length,3);assert.equal(ORIGINAL.gates.filter(g=>g.type==='pedestrian').length,3);assert.equal(ORIGINAL.buildings.find(b=>b.id==='T').noStreetExit,true);
for(const id of ['H','HO','HP'])assert.equal(ORIGINAL.buildings.find(b=>b.id===id).floors,4);
for(const id of ['W','P'])assert.equal(ORIGINAL.buildings.find(b=>b.id===id).floors,3);
for(const spec of ORIGINAL.bridges){const node=gltf.nodes.find(n=>n.name==='Puente_'+spec.id);assert.ok(node,'Falta puente '+spec.id);assert.equal(node.extras.floor,2);assert.equal(node.extras.from,spec.from);assert.equal(node.extras.to,spec.to);assert.equal(node.extras.deckHeight,2*ORIGINAL.storeyHeight);assert.ok(node.children.length>3,'Puente sin losa o barandales');}
assert.ok(!gltf.nodes.some(n=>n.name?.startsWith('Puente_')),'Quedan puentes aislados');
for(const spec of ORIGINAL.integratedLinks){const node=gltf.nodes.find(n=>n.name==='Conexion_integrada_'+spec.id);assert.ok(node,'Falta unión integrada '+spec.id);assert.equal(node.extras.integrated,true);assert.deepEqual(node.extras.levels,[0,1,2]);assert.equal(node.extras.from,spec.from);assert.equal(node.extras.to,'H');
 for(const floor of [0,1,2]){const name=floor===0?'Losa_PB':'Losa_piso_'+floor;const slab=node.children.map(i=>gltf.nodes[i]).find(n=>n.name===name);assert.ok(slab,'Unión sin '+name);const y=slab.matrix?.[13]??slab.translation?.[1]??0;assert.ok(Math.abs(y+.15-(floor===0?.35:floor*ORIGINAL.storeyHeight))<1e-5);}
}
function descendants(node){return (node.children||[]).flatMap(i=>[gltf.nodes[i],...descendants(gltf.nodes[i])]);}
for(const id of ['HO','HP']){const nodes=descendants(gltf.nodes.find(n=>n.name==='Edificio_'+id));assert.equal(nodes.filter(n=>n.name?.startsWith('Antepecho_curvo_')).length,4);assert.equal(nodes.filter(n=>n.name==='Cubierta_translúcida_superior').length,2);assert.ok(nodes.some(n=>n.name==='Cercha_amarilla'));assert.ok(!nodes.some(n=>n.name==='Remate cuadrado'),'Queda cubierta genérica antigua');
 for(const roof of nodes.filter(n=>n.name==='Cubierta_translúcida_superior')){const material=gltf.materials[gltf.meshes[roof.mesh].primitives[0].material];assert.equal(material.alphaMode,'BLEND');assert.ok(material.pbrMetallicRoughness.baseColorFactor[3]<1);}
}
for(const corridor of ORIGINAL.corridors){
 const node=gltf.nodes.find(n=>n.name==='Pasillo_'+corridor.id);assert.ok(node,'Falta pasillo');assert.deepEqual(node.extras.route,['P','K','H','E','C']);assert.deepEqual(node.extras.levels,[0,1,2]);
 assert.equal(node.extras.integrated,true);
 const runs=node.children.map(i=>gltf.nodes[i]).filter(n=>n.name.startsWith('Tramo_'));assert.equal(runs.length,4);
 for(let i=0;i<runs.length;i++){
  const run=runs[i];assert.deepEqual(run.extras.levels,[0,1,2]);
  if(i>0)assert.deepEqual(runs[i-1].extras.end,run.extras.start,'El pasillo tiene una discontinuidad');
  for(const floor of [0,1,2]){const name=floor===0?'Losa_PB':'Losa_piso_'+floor;const slab=run.children.map(j=>gltf.nodes[j]).find(n=>n.name===name);assert.ok(slab,'Falta '+name);const centerY=slab.matrix?.[13]??slab.translation?.[1]??0;assert.ok(Math.abs(centerY+.15-(floor===0?.35:floor*ORIGINAL.storeyHeight))<1e-5,'Altura incorrecta de '+name);}
 }
 assert.ok(node.children.map(i=>gltf.nodes[i]).every(n=>!n.name.startsWith('Enlace_')),'Quedan enlaces hacia un pasillo exterior');
 for(let x=455;x<=1293.5;x+=.5)for(const y of [395-corridor.width/2/ORIGINAL.metersPerPixel,395+corridor.width/2/ORIGINAL.metersPerPixel])assert.ok(ORIGINAL.buildings.filter(b=>['P','K','H','E','C'].includes(b.id)).flatMap(b=>b.rects).some(r=>x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3]),'El pasillo sale de la huella de los edificios');
 for(const run of runs)assert.ok(run.children.map(i=>gltf.nodes[i]).every(n=>!['Columna_del_pasillo','Cubierta_del_pasillo'].includes(n.name)),'Queda estructura paralela al edificio');
}
const footprint=id=>ORIGINAL.buildings.find(b=>b.id===id).rects[0];const c=footprint('C'),e=footprint('E'),f=footprint('F'),g=footprint('G');assert.equal(c[2],e[0]);assert.equal(c[2],f[0]);assert.equal(e[3],g[1]);assert.equal(f[2],g[0]);assert.ok(f[1]<g[3]);
assert.equal(gltf.nodes.filter(n=>n.name?.startsWith('Jacaranda_Plaza_Roja_')).length,ORIGINAL.jacarandas.length);
const cosei=gltf.nodes.find(n=>n.name==='Plaza_COSEI_detalle');assert.ok(cosei);assert.equal(cosei.extras.library,'I');
const coseiNodes=descendants(cosei),steps=coseiNodes.filter(n=>n.name?.startsWith('Escalón_COSEI_'));assert.equal(steps.length,ORIGINAL.cosei.steps);
let previousTop=ORIGINAL.cosei.baseElevation;
for(const step of steps){const y=step.matrix?.[13]??step.translation?.[1]??0,sy=step.matrix?.[5]??step.scale?.[1]??1;const top=y+sy/2;assert.ok(top>previousTop,'Escalinata sin incremento de cota');previousTop=top;}
assert.ok(Math.abs(previousTop-(ORIGINAL.cosei.baseElevation+ORIGINAL.cosei.rise))<1e-5,'Escalones no llegan a la plataforma');
assert.equal(coseiNodes.filter(n=>n.name?.startsWith('Jardinera_COSEI_')).length,2);
const asta=coseiNodes.find(n=>n.name==='Asta_bandera_COSEI');assert.ok(asta);assert.equal(asta.extras.height,18);
const pole=descendants(asta).find(n=>n.name==='Mástil');const polePosition=gltf.accessors[gltf.meshes[pole.mesh].primitives[0].attributes.POSITION];assert.ok(Math.abs(polePosition.max[1]-polePosition.min[1]-18)<1e-4,'Altura geométrica del mástil incorrecta');
const flag=descendants(asta).find(n=>n.name==='Bandera_México');assert.ok(flag);const flagMat=gltf.materials[gltf.meshes[flag.mesh].primitives[0].material];const flagTexture=gltf.textures[flagMat.pbrMetallicRoughness.baseColorTexture.index];assert.ok(Number.isInteger(gltf.images[flagTexture.source].bufferView),'La textura de la bandera no está incrustada en el GLB');
const html=await fs.readFile(new URL('./Visor_UAM_autonomo.html',import.meta.url),'utf8');
const imports=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
assert.deepEqual(Object.keys(imports).sort(),['three','orbit','exporter','texture-utils','model-data','copyright-layout','route-space','route-data','route-editor'].sort());assert.ok(Object.values(imports).every(v=>v.startsWith('data:text/javascript;base64,')));
const exporter=Buffer.from(imports.exporter.split(',')[1],'base64').toString();assert.ok(exporter.includes("from 'texture-utils'"));
const png=await fs.readFile(new URL('./Vista_actual.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');
console.log('Verificado: GLB 2 con asta de 18 m, bandera con textura incrustada, seis escalones que alcanzan la plataforma COSEI y dos jardineras; biblioteca I, conexiones, Plaza Roja y cubiertas conservadas; visor autónomo y PNG.');
for(const id of ['HO','HP']){const part=gltf.nodes.find(n=>n.name===id+'_volumen_0');assert.equal(part.extras.facadeFacing,'parking');assert.ok(Math.cos(part.extras.facadeYaw)<0);}
const reinforced=gltf.nodes.find(n=>n.name==='Refuerzos_estructurales_G');assert.ok(reinforced);const faces=reinforced.children.map(i=>gltf.nodes[i]).filter(n=>n.name?.startsWith('Fachada_reforzada_'));assert.equal(faces.length,2);for(const face of faces)assert.ok(descendants(face).filter(n=>n.name==='Diagonal_roja_G').length>=40);
assert.equal(ORIGINAL.buildings.filter(b=>b.reinforced).length,1);assert.equal(ORIGINAL.buildings.find(b=>b.reinforced).id,'G');
const sculpture=gltf.nodes.find(n=>n.name==='Escultura_lado_COSEI_G');assert.equal(sculpture.extras.side,'COSEI');assert.ok(ORIGINAL.sculpture.position[0]>footprint('G')[2]);
const rear=[0,1,2,5,6],seen=new Set([0]);let changed=true;while(changed){changed=false;for(const i of rear)if(!seen.has(i)&&[...seen].some(j=>{const a=ORIGINAL.parking[i],b=ORIGINAL.parking[j];return a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];})){seen.add(i);changed=true;}}assert.equal(seen.size,rear.length,'Estacionamientos desconectados');
assert.ok(gltf.nodes.some(n=>n.name==='Carril_estacionamientos_conectados'));
console.log('Versión 7 verificada: HO/HP hacia estacionamiento, estacionamientos conectados, refuerzos de G en ambos lados y escultura hacia COSEI.');

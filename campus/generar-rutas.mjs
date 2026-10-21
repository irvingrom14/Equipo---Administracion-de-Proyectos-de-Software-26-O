import fs from 'node:fs/promises';
import {modelToGeo,edgeMeters,routeIssues} from './route-space.js';
const data=JSON.parse(await fs.readFile(new URL('./campus_editado.json',import.meta.url)));
const geo=JSON.parse(await fs.readFile(new URL('./georreferencia.json',import.meta.url)));
// Trazos de PB sobre el croquis canónico; coordenadas heredadas, no centros de edificios.
const strokes=[];const draw=(p,tipo='exterior',accesible=true)=>strokes.push({p,tipo,accesible});
draw([[66,482],[85,482],[85,459],[235,459],[420,459]]);
draw([[66,574],[85,574],[235,574],[420,574],[420,605],[600,605],[638,605],[638,670]]);
draw([[85,459],[85,574],[85,670],[235,670],[638,670],[710,670],[976,670],[1142,670],[1343,670],[1440,670]]);
draw([[235,240],[235,390],[235,459]]);draw([[220,390],[235,390]],'exterior',false);draw([[300,470],[300,459]]);
draw([[235,240],[541,240],[746,240],[960,240],[1140,240],[1235,240]]);
draw([[400,316],[400,321],[541,321],[541,365],[680,365],[746,365],[746,270],[746,240]]);
draw([[541,240],[541,321]]);draw([[746,270],[824,270],[960,270],[960,366],[927.5,366],[927.5,358]]);draw([[960,240],[960,270]]);
draw([[717.5,360],[717.5,365],[746,365]]);draw([[1235,240],[1235,258]]);draw([[1140,240],[1140,220],[1365,220],[1365,233]]);
draw([[477,406],[610,406],[700,406],[752,406],[760,408],[824,408],[890,408],[900,410],[973,410],[1026,410],[1142,410],[1160,407],[1205,406],[1245,406],[1293.5,406],[1300,406],[1410,406],[1438,406]],'pasillo');
draw([[610,406],[610,490],[566,490]]);draw([[700,406],[710,420],[710,455],[800,455],[933,455],[973,455]]);
draw([[710,455],[710,670]]);draw([[933,455],[933,487]]);draw([[973,410],[973,455],[973,520],[973,612]]);draw([[982,520],[973,520]]);
draw([[800,455],[835,455],[835,503.907]]);draw([[835,503.907],[835,510]],'escalera',false);draw([[835,510],[835,560],[835,578]]);
draw([[566,599],[566,605]]);draw([[638,605],[638,620],[650,620]]);draw([[976,655],[976,670]]);
draw([[1142,410],[1142,590],[1265,590],[1343,590],[1343,670],[1335,695]]);
draw([[1200,619],[1200,610],[1265,610],[1265,590]]);draw([[1175,406],[1175,409]],'pasillo');draw([[1300,406],[1300,409]],'pasillo');draw([[1410,406],[1410,409]],'pasillo');
draw([[1205,406],[1205,420],[1205,510],[1235,510],[1235,534]]);draw([[1245,406],[1245,420],[1245,430]]);draw([[1380,406],[1380,420],[1355,420],[1355,426]]);
draw([[1438,406],[1440,420],[1440,445],[1440,590],[1440,670]]);draw([[1440,445],[1625,445],[1625,500],[1625,520]]);
const destPoints={A:[220,390],B:[300,470],C:[477,406],D:[400,316],E:[610,406],F:[566,599],G:[650,620],H:[824,408],HO:[717.5,360],HP:[927.5,358],I:[835,578],J:[933,487],K:[1026,410],L:[982,520],M:[1200,619],O:[1245,430],P:[1293.5,406],P1:[1175,409],P2:[1300,409],P3:[1410,409],P4:[1355,426],Q:[1625,520],R:[1365,233],S:[1235,534],T:[976,655],W:[1235,258],COSEI:[800,455],PLAZA_ROJA:[566,490],ACCESO_P1:[66,482],ACCESO_P2:[66,574],ACCESO_P3:[1335,695]};
const raw=[];for(const s of strokes)for(let i=1;i<s.p.length;i++)raw.push({a:s.p[i-1],b:s.p[i],tipo:s.tipo,accesible:s.accesible,ts:[0,1]});
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
for(const s of raw)for(const p of [...raw.flatMap(s=>[s.a,s.b]),...Object.values(destPoints)]){const v=sub(s.b,s.a),w=sub(p,s.a),t=(w[0]*v[0]+w[1]*v[1])/(v[0]**2+v[1]**2);if(Math.abs(cross(v,w))<1e-5&&t>0&&t<1)s.ts.push(t);}
for(let i=0;i<raw.length;i++)for(let j=i+1;j<raw.length;j++){const a=raw[i],b=raw[j],v=sub(a.b,a.a),w=sub(b.b,b.a),det=cross(v,w);if(Math.abs(det)<1e-8)continue;const diff=sub(b.a,a.a),t=cross(diff,w)/det,u=cross(diff,v)/det;if(t>0&&t<1&&u>0&&u<1){a.ts.push(t);b.ts.push(u);}}
const net={version:1,unidad:'azcapotzalco',nodos:[],aristas:[],destinos:[]},keys=new Map(),pairs=new Set();
function node(p){const x=+((p[0]-895)*data.metersPerPixel).toFixed(4),z=+((p[1]-390)*data.metersPerPixel).toFixed(4),key=x+','+z;if(keys.has(key))return keys.get(key);const n={id:'n'+(net.nodos.length+1),...modelToGeo(x,z,geo),x,z,nivel:0,tipo:'cruce'};net.nodos.push(n);keys.set(key,n);return n;}
for(const s of raw){const ts=[...new Set(s.ts.map(t=>+t.toFixed(9)))].sort((a,b)=>a-b);for(let i=1;i<ts.length;i++){const at=t=>[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t],a=node(at(ts[i-1])),b=node(at(ts[i])),key=[a.id,b.id].sort().join('|');if(a.id===b.id||pairs.has(key))continue;pairs.add(key);net.aristas.push({de:a.id,a:b.id,metros:edgeMeters(a,b),tipo:s.tipo,accesible:s.accesible});}}
for(const [id,p]of Object.entries(destPoints)){const n=node(p);n.tipo=id.startsWith('ACCESO_')?'acceso':'entrada';const b=data.buildings.find(b=>b.id===id);net.destinos.push({id,nombre:id==='COSEI'?'Plaza COSEI':id==='PLAZA_ROJA'?'Plaza Roja':id.startsWith('ACCESO_')?'Acceso peatonal '+id.slice(7):id==='I'?'I · Biblioteca / COSEI':id==='J'?'J · Cafetería':id==='A'?'A · acceso exterior a zona de obra':b?.name||'Edificio '+id,nodo:n.id});}
const issues=routeIssues(net,data,geo);if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}else if(process.argv.includes('--write')){
 await fs.writeFile(new URL('./rutas.json',import.meta.url),JSON.stringify(net,null,2)+'\n');await fs.writeFile(new URL('./route-data.js',import.meta.url),'export const ROUTE_GEO='+JSON.stringify(geo)+';\nexport const BASE_ROUTES='+JSON.stringify(net)+';\n');console.log(`${net.nodos.length} nodos, ${net.aristas.length} aristas y ${net.destinos.length} destinos: red válida.`);
}else console.log(`${net.nodos.length} nodos, ${net.aristas.length} aristas y ${net.destinos.length} destinos: trazado inicial válido. No se escribió nada. --write sustituye la red por este trazado inicial.`);

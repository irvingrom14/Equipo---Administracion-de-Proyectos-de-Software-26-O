import * as THREE from 'three';
import {OrbitControls} from 'orbit';
import {GLTFExporter} from 'exporter';
import {ORIGINAL} from 'model-data';
import {copyrightPanelsForSite} from 'copyright-layout';
import {createRouteEditor} from 'route-editor';
import {BASE_ROUTES,ROUTE_GEO} from 'route-data';

const $=id=>document.getElementById(id);
const editables=new Map();
let editMode=false,editSelected='',undoHistory=[],redoHistory=[],savedData='',isSaving=false,drawStart=null,drawPreview=null,dragEdit=null;
let georeference=ROUTE_GEO,routeEditor=null;
let data=structuredClone(ORIGINAL), world, vegetation, buildingGroups=new Map(), labels=[], selected='', topMode=false,focusMode=false;
const mount=$('viewport'), labelLayer=$('labels');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#edf1ed');renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
mount.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#edf1ed',1400,2300);
scene.add(new THREE.HemisphereLight('#fff6e6','#4b6750',2.3));
const sun=new THREE.DirectionalLight('#fff3de',3);sun.position.set(-280,550,320);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-500,right:500,top:500,bottom:-500,near:1,far:1200});sun.shadow.bias=-.0003;sun.shadow.normalBias=.5;scene.add(sun);
const perspective=new THREE.PerspectiveCamera(42,1,1,3000), ortho=new THREE.OrthographicCamera(-460,460,270,-270,1,2500);let camera=perspective;
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=30;controls.maxDistance=1500;controls.maxPolarAngle=THREE.MathUtils.degToRad(78);controls.target.set(0,0,10);
const grid=new THREE.GridHelper(1000,100,'#6f8f80','#b9c9bc');grid.position.y=.3;grid.visible=false;scene.add(grid);
const matCache=new Map();
function material(color){if(!matCache.has(color))matCache.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return matCache.get(color);}
const cube=new THREE.BoxGeometry(1,1,1), cylinder=new THREE.CylinderGeometry(1,1,1,7), crown=new THREE.IcosahedronGeometry(1,1);
const translucentRoof=new THREE.MeshPhysicalMaterial({color:'#ede6c1',transparent:true,opacity:.32,roughness:.25,metalness:0,side:THREE.DoubleSide,depthWrite:false});
function box(parent,name,x,y,z,w,h,d,color){const o=new THREE.Mesh(cube,material(color));o.name=name;o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=h>1;o.receiveShadow=true;parent.add(o);return o;}
const S=()=>data.metersPerPixel;
const X=px=>(px-895)*S(),Z=py=>(py-390)*S();
function slab(parent,r,color,y=.18,height=.25,name='Superficie'){return box(parent,name,X((r[0]+r[2])/2),y,Z((r[1]+r[3])/2),(r[2]-r[0])*S(),height,(r[3]-r[1])*S(),color);}
function meshPoly(parent,points,y,color,name){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(X(p[0]),-Z(p[1])):shape.moveTo(X(p[0]),-Z(p[1])));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
function line(parent,points,color='#eeeee0',width=.22,y=.5){for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];let o=box(parent,'Línea', (a[0]+b[0])/2,y,(a[1]+b[1])/2,width,.04,Math.hypot(dx,dz),color);o.rotation.y=Math.atan2(dx,dz);}}
function label(text,x,y,z,cls=''){const el=document.createElement('div');el.className='label '+cls;el.textContent=text;labelLayer.append(el);labels.push({el,p:new THREE.Vector3(x,y,z)});}
function pavilion(parent,b,w,d,h){
 const story=data.storeyHeight,r=w*.46,depthScale=d/w*.72;
 parent.userData={facadeFacing:'parking',facadeYaw:b.facadeYaw,pavilion:true,curvedFacade:true,upperLevel:3,roofMaterial:'Translúcido aproximado; material real no confirmado'};
 box(parent,'Núcleo del pabellón',0,h/2,-d*.15,w*.88,h,d*.62,'#c8c4b8');
 function arc(name,y,height,mat){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,height,40,1,true,-Math.PI/2,Math.PI),mat);o.name=name;o.position.set(0,y,-d*.03);o.scale.z=depthScale;o.castShadow=!mat.transparent;parent.add(o);return o;}
 function floor(y,name){const shape=new THREE.Shape();shape.moveTo(-r,d*.46);shape.lineTo(-r,d*.03);for(let i=0;i<=40;i++){const a=-Math.PI/2+i*Math.PI/40;shape.lineTo(r*Math.sin(a),d*.03-r*Math.cos(a)*depthScale);}shape.lineTo(r,d*.46);shape.closePath();const o=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:false}),material('#c8c7bb'));o.name=name;o.rotation.x=-Math.PI/2;o.position.y=y-.25;o.receiveShadow=true;o.castShadow=true;parent.add(o);}
 for(let f=0;f<b.floors;f++){
  floor(f===0?.35:f*story,'Losa_pabellón_'+f);
  arc('Antepecho_curvo_'+f,f*story+.7,1.1,material('#b8b7ae'));
  if(f<3)arc('Ventanal_curvo_'+f,f*story+2.15,.9,material('#657c7d'));
  else arc('Cierre_translúcido_superior',f*story+2.1,1.6,translucentRoof);
 }
 for(const side of [-1,1])box(parent,'Remate_terracota',side*(w/2-.55),h/2,-d*.06,1.1,h+.4,d*.8,'#a65640');
 const roofBase=h+.25,rise=1.15,coverDepth=d*.97,half=w*.52;
 function beam(name,a,b,radius=.085){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const mesh=new THREE.Mesh(cylinder,material('#d0ac37'));mesh.name=name;mesh.position.copy(av).add(bv).multiplyScalar(.5);mesh.scale.set(radius,dir.length(),radius);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;parent.add(mesh);}
 for(const side of [-1,1]){
  const panel=new THREE.Mesh(cube,translucentRoof);panel.name='Cubierta_translúcida_superior';panel.position.set(side*half/2,roofBase+rise/2,0);panel.scale.set(Math.hypot(half,rise),.07,coverDepth);panel.rotation.z=-side*Math.atan2(rise,half);parent.add(panel);
  beam('Marco_amarillo_borde',[side*half,roofBase,-coverDepth/2],[side*half,roofBase,coverDepth/2]);
 }
 beam('Cumbrera_amarilla',[0,roofBase+rise,-coverDepth/2],[0,roofBase+rise,coverDepth/2]);
 for(let i=0;i<=5;i++){const z=-coverDepth/2+i*coverDepth/5;for(const side of [-1,1]){beam('Cercha_amarilla',[side*half,roofBase,z],[0,roofBase+rise,z]);beam('Diagonal_amarilla',[side*half,roofBase,z],[0,roofBase,z]);beam('Columna_amarilla',[side*half,3*story,z],[side*half,roofBase,z],.07);}}
}

function reinforceG(parent,w,d,h,floors){
 const group=new THREE.Group();group.name='Refuerzos_estructurales_G';group.userData={building:'G',sides:[-1,1],approximate:true};parent.add(group);
 function beam(name,a,b,holder=group){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),o=new THREE.Mesh(cube,material('#b9252d'));o.name=name;o.position.copy(av).add(bv).multiplyScalar(.5);o.scale.set(.38,delta.length(),.38);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;holder.add(o);}
 const bays=8,step=(d-2)/bays;
 for(const side of [-1,1]){const face=new THREE.Group();face.name='Fachada_reforzada_'+(side<0?'Plaza_Roja':'COSEI');face.userData={side,building:'G'};group.add(face);
  for(let bay=0;bay<=bays;bay++)box(face,'Pilastra_gris_G',side*(w/2+.28),h/2,-d/2+1+bay*step,.65,h,1,'#a8afae');
  for(let f=0;f<floors;f++){const y=f*data.storeyHeight+.65;
   for(let bay=0;bay<bays;bay++){if(bay===3||bay===4)continue;const z=-d/2+1+bay*step,x=side*(w/2+.73);beam('Diagonal_roja_G',[x,y,z+.6],[x,y+2.05,z+step/2],face);beam('Diagonal_roja_G',[x,y+2.05,z+step/2],[x,y,z+step-.6],face);}
   box(face,'Dintel_rojo_G',side*(w/2+.65),y+.05,0,.45,.32,d-2,'#b9252d');
  }
 }
}
function sculptureG(spec){
 const group=new THREE.Group();group.name='Escultura_lado_COSEI_G';group.userData={...spec,approximate:true};group.position.set(X(spec.position[0]),0,Z(spec.position[1]));world.add(group);registerEditable('sculpture_G','Escultura · G / COSEI','sculpture',group);
 box(group,'Base_escultura',0,.48,0,5.5,.3,4.6,'#9a9b8e');
 for(let i=0;i<3;i++){const shape=new THREE.Shape();shape.moveTo(-.65,0);shape.lineTo(.65,0);shape.bezierCurveTo(.3,1.2,1.4,2.2,.65,3.3);shape.bezierCurveTo(.1,3.7,.6,4.3,.15,4.8);shape.lineTo(-.5,4.8);shape.bezierCurveTo(-.1,3.1,-1.1,2.5,-.65,0);const plate=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false}),material('#673b2b'));plate.name='Placa_abstracta_aproximada';plate.position.set((i-1)*1.35,.63,(i%2)*1.05-.5);plate.rotation.y=(i-1)*.6;plate.castShadow=true;group.add(plate);}
}
function serpentinaH(spec){
 const group=new THREE.Group();group.name='Serpentina_II_frente_H_estacionamiento';group.userData={building:'H',side:'estacionamiento',approximate:true,reference:'Fotos y captura Maps aportadas por Gabriel'};group.position.set(X(spec.position[0]),0,Z(spec.position[1]));group.scale.setScalar(spec.scale||1);world.add(group);
 registerEditable('sculpture_serpentina_H','Serpentina II · H / estacionamiento','sculpture',group);
 function disc(name,r,h,y,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,48),material(color));m.name=name;m.position.y=y;m.receiveShadow=true;group.add(m);}
 function ring(name,inner,outer,y,color){const m=new THREE.Mesh(new THREE.RingGeometry(inner,outer,64),material(color));m.name=name;m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;group.add(m);}
 disc('Serpentina_plazoleta_circular',4,.16,.44,'#555d58');
 ring('Serpentina_anillo_claro_exterior',3.5,3.8,.53,'#c7c6b4');
 ring('Serpentina_anillo_claro_interior',1.7,2,.54,'#c7c6b4');
 disc('Serpentina_isleta_central',1.65,.12,.56,'#72815c');
 disc('Serpentina_base',.65,.16,.67,'#797d71');
 const palettes=['#ad252b','#dddcd2','#33383a'];
 const ribbons=palettes.map(color=>new THREE.MeshStandardMaterial({color,metalness:.48,roughness:.4,side:THREE.DoubleSide}));
 function branch(name,points,turns,radius,hand=1){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=80,frames=curve.computeFrenetFrames(segments,false);
  const rod=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.11,8,false),material('#333c3d'));rod.name='Serpentina_eje_'+name;rod.castShadow=true;group.add(rod);
  for(let color=0;color<3;color++){
   const vertices=[],indices=[];
   for(let i=0;i<=segments;i++){
    const t=i/segments,theta=hand*t*turns*Math.PI*2+color*Math.PI*2/3,radial=frames.normals[i].clone().multiplyScalar(Math.cos(theta)).addScaledVector(frames.binormals[i],Math.sin(theta)),center=curve.getPointAt(t),r=radius*(.88+.12*Math.sin(Math.PI*t));
    for(const side of [-1,1]){const p=center.clone().addScaledVector(radial,r+side*.2);vertices.push(p.x,p.y,p.z);}
    if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
   const ribbon=new THREE.Mesh(geometry,ribbons[color]);ribbon.name='Serpentina_cinta_'+name+'_'+color;ribbon.castShadow=true;ribbon.userData.disposeMaterial=name==='tronco';group.add(ribbon);
  }
 }
 branch('tronco',[[0,.75,0],[0,1.6,0],[0,2.8,0]],1.6,.65);
 branch('brazo_izquierdo',[[0,2.6,0],[-1.4,3.8,0],[-3.1,4.6,0],[-4.5,5.7,0]],2.5,.68,-1);
 branch('brazo_derecho',[[0,2.6,0],[1.4,3.8,0],[3.1,4.6,0],[4.5,5.7,0]],2.5,.68,1);
 if(group.parent)label('Serpentina II',group.position.x,7,group.position.z,'place');
}


// Marca que pertenece a la maqueta y viaja en GLB; bandera persistente en JSON.
function copyrightStyle(){return data.copyrightStyle||ORIGINAL.copyrightStyle;}
function copyrightEnabled(){return data.showCopyright!==false;}
function syncCopyright(){const enabled=copyrightEnabled();const node=world?.getObjectByName('Marca_copyright_modelo');if(node)node.visible=enabled;$('copyrightToggle').checked=enabled;$('watermark').hidden=!enabled;$('watermark').style.color=copyrightStyle().color;}
function addCopyrightToModel(){
 const group=new THREE.Group();group.name='Marca_copyright_modelo';group.userData={presentation:true,flag:'showCopyright',text:'copyright @gabrielhuav'};world.add(group);
 const style=copyrightStyle();group.userData.color=style.color;group.userData.pattern='tiled-site';
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=192;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 112px sans-serif';ctx.lineWidth=9;ctx.strokeStyle='#fff8e9';ctx.strokeText('copyright @gabrielhuav',768,96,1470);ctx.fillStyle=style.color;ctx.fillText('copyright @gabrielhuav',768,96,1470);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:style.opacity,fog:false,toneMapped:false,side:THREE.DoubleSide,depthWrite:false});
 const height=Math.max(...data.buildings.map(b=>b.floors*data.storeyHeight))+4;
 const panels=copyrightPanelsForSite(data.site,data.metersPerPixel,style);
 group.userData.panelCount=panels.length;const north=campusNorth(georeference)||{x:0,z:-1},textAngle=Math.atan2(-north.x,-north.z);group.userData.northAligned=true;group.userData.textAngle=textAngle;
 for(const [i,p]of panels.entries()){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.width/8),mat);mesh.name='Copyright_integrado_'+i;mesh.rotation.set(-Math.PI/2,0,textAngle);mesh.position.set(p.x,height,p.z);mesh.renderOrder=5;mesh.userData.disposeCopyrightMaterial=i===0;group.add(mesh);}
 syncCopyright();
}
$('copyrightToggle').onchange=()=>{if(isSaving)return;rememberEdit();data.showCopyright=$('copyrightToggle').checked;syncCopyright();updateSaveState();message(copyrightEnabled()?'Marca integrada activada. Guarda cambios para actualizar GLB y PNG.':'Marca desactivada. Guarda cambios para exportar sin ella.');};

function azcBuildingT(part,b,w,d,h){
 const details=new THREE.Group();details.name='T_AZC_fachada_y_escalera';details.userData={approximate:true,reference:'Dos fotos de Gabriel; proporciones y orientación de fachada interpretativas',noStreetExit:true};part.add(details);
 const stone='#b9b8aa',red='#b72f32',terra='#ad6550',front=-d/2,rise=Math.min(data.storeyHeight,h*.5),run=8.2,stairsX=-w*.27,stairsWidth=4.8;
 box(details,'T_cuerpo_PB_retranqueado',0,rise/2,1,w,rise,d-2,stone);
 box(details,'T_cuerpo_superior',0,(h+rise)/2,0,w,h-rise,d,stone);
 box(details,'T_azotea',0,h+.15,0,w+.2,.3,d+.2,'#cfcec2');
 for(const z of [-d/2,d/2])box(details,'T_pretil',0,h+.48,z,w,.45,.24,'#c0bfb2');
 box(details,'T_ventanal_inferior',0,1.6,front+1.95,w-2,1.9,.12,'#455a57');
 for(let x=-w/2+1;x<w/2;x+=3.5){box(details,'T_montante_PB',x,1.6,front+1.83,.12,2,.2,'#c4c7bd');box(details,'T_pilar_PB',x,rise/2,front+.4,.3,rise,.45,stone);}
 box(details,'T_galeria_exterior',0,rise-.15,front-.7,w,.3,2.5,'#b8b3a3');
 box(details,'T_acceso_superior',3,rise+1.1,front-.08,6,2.2,.14,'#555d57');
 box(details,'T_ventana_galeria',w*.28,rise+1.1,front-.08,w*.23,1.15,.14,'#78817a');
 const canopy=box(details,'T_marquesina_curva_aproximada',w*.16,rise+2.1,front-.8,7.5,.25,2.7,'#a99d88');canopy.rotation.z=.04;
 for(const x of [w*.16-3.5,w*.16+3.5])box(details,'T_soporte_rojo_marquesina',x,rise+1,front-1.8,.12,2,.12,red);
 // Escalera exterior hacia el patio interior (lado -Z), sin abrir el perímetro sur.
 const count=18,tread=run/count;
 for(let i=1;i<=count;i++)box(details,'T_peldano_exterior',stairsX,rise*i/count/2,front-run+(i-.5)*tread,stairsWidth,rise*i/count,tread+.01,'#b8957b');
 function beam(name,a,b,width,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=box(details,name,0,0,0,width,delta.length(),width,color);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
 for(const side of [-1,1]){
  const x=stairsX+side*(stairsWidth/2-.12);
  beam('T_pasamanos_rojo_escalera',[x,.95,front-run],[x,rise+.95,front],.1,red);
  beam('T_barra_intermedia_escalera',[x,.5,front-run],[x,rise+.5,front],.07,red);
  for(let i=0;i<=count;i+=3)box(details,'T_poste_rojo_escalera',x,rise*i/count+.5,front-run+run*i/count,.08,1,.08,red);
 }
 const shape=new THREE.Shape();shape.moveTo(-(front-run),0);shape.lineTo(-front,0);shape.lineTo(-front,rise+1);shape.lineTo(-(front-run),.28);shape.closePath();
 const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.4,bevelEnabled:false}),material(terra));wall.name='T_muro_inclinado_terracota';wall.rotation.y=Math.PI/2;wall.position.x=stairsX+stairsWidth/2;wall.castShadow=true;wall.receiveShadow=true;details.add(wall);
 const railStart=stairsX+stairsWidth/2+.5,railEnd=w*.48;
 for(const y of [rise+.5,rise+1])box(details,'T_barandal_rojo_galeria',(railStart+railEnd)/2,y,front-1.9,railEnd-railStart,.08,.08,red);
 for(let x=railStart;x<railEnd;x+=2.2)box(details,'T_poste_rojo_galeria',x,rise+.5,front-1.9,.08,1,.08,red);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle=red;ctx.textAlign='center';ctx.font='bold 170px sans-serif';ctx.fillText('t',64,158);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const letter=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.95),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));letter.name='T_rotulo_rojo';letter.userData.disposeMaterial=true;letter.rotation.y=Math.PI;letter.position.set(-w/2+2.4,h-.9,front-.15);details.add(letter);
 const plaza=box(details,'T_explanada_interior',-w*.22,.1,front-run*.65,w*.52,.18,run*1.6,'#aaa697');
 for(let x=plaza.position.x-w*.26;x<plaza.position.x+w*.26;x+=3.6)box(details,'T_junta_explanada',x,.21,plaza.position.z,.035,.02,run*1.6,'#cec8b7');
 for(let z=front-run*1.4;z<front;z+=3.6)box(details,'T_junta_explanada',plaza.position.x,.22,z,w*.52,.02,.035,'#cec8b7');
}
function building(b){const g=new THREE.Group();g.name='Edificio_'+b.id;g.userData={id:b.id,name:b.name||b.id,floors:b.floors,approximate:true};g.position.set(b.offsetX||0,0,b.offsetZ||0);world.add(g);buildingGroups.set(b.id,g);const h=b.height??b.floors*data.storeyHeight;
 for(const [idx,r] of b.rects.entries()){
  // La caja de referencia de un pabellón es la envolvente del rombo ya girado.
  const diagonalFactor=b.diamond?Math.SQRT1_2:1;
  const w=(r[2]-r[0])*S()*diagonalFactor,d=(r[3]-r[1])*S()*diagonalFactor,x=X((r[0]+r[2])/2),z=Z((r[1]+r[3])/2);
  if(b.construction){box(g,'Losa en construcción',x,.8,z,w,.6,d,'#b8b8aa');
   for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(g,'Columna sin terminar',x-w/2+1+i*(w-2)/3,3,z-d/2+1+j*(d-2)/3,.65,5,.65,'#9e9d91');
   for(let j=0;j<2;j++)box(g,'Viga',x,5.4,z+(j?1:-1)*(d/2-1),w,.6,.7,'#b8b6a9');
   for(let j=0;j<2;j++)box(g,'Cerca de obra',x,.9,z+(j?1:-1)*d/2,w,1.8,.3,'#d98c38');continue;
  }
  const part=new THREE.Group();part.name=b.id+'_volumen_'+idx;part.position.set(x,0,z);if(b.diamond)part.rotation.y=b.facadeYaw??Math.PI/4;g.add(part);
  if(b.pavilion){pavilion(part,b,w,d,h);continue;}
  if(b.id==='T'){azcBuildingT(part,b,w,d,h);continue;}
  const gallery=b.openGallery||b.galleryParts?.includes(idx),galleryWidth=Math.min(2.8,d*.32),galleryTop=Math.min(h,3*data.storeyHeight);
  if(gallery){
   box(part,'Cuerpo integrado al pasillo',0,h/2,-galleryWidth/2,w,h,d-galleryWidth,'#d3d0bd');
   if(h>galleryTop)box(part,'Piso superior sobre galería',0,(h+galleryTop)/2,(d-galleryWidth)/2,w,h-galleryTop,galleryWidth,'#d3d0bd');
   for(const level of [0,1,2])if(level<b.floors){const yy=level===0?.35:level*data.storeyHeight;
    box(part,'Galería_integrada_'+level,0,yy-.15,(d-galleryWidth)/2,w,.3,galleryWidth,'#c8c4b3');
    if(level>0)box(part,'Antepecho de galería',0,yy+.5,d/2-.13,w,.8,.2,'#d3d0bd');
   }
   const divisions=Math.max(1,Math.ceil(w/5));for(let i=0;i<=divisions;i++)box(part,'Pilar integrado',-w/2+i*w/divisions,galleryTop/2,d/2-.2,.3,galleryTop,.35,'#b7beaf');
  }else box(part,'Cuerpo de concreto',0,h/2,0,w,h,d,b.reinforced?'#d4d6d1':'#d3d0bd');
  for(let f=0;f<b.floors;f++){
   const wy=f*data.storeyHeight+2;
   if(w>4)for(const side of [-1,1]){if(gallery&&side===1&&f<3)continue;
    box(part,'Ventana_nivel_'+f,0,wy,side*(d/2+.025),w-1,1.15,.1,'#425f61');
    for(let k=-w/2+3;k<w/2-1;k+=3)box(part,'Montante',k,wy,side*(d/2+.09),.11,1.2,.1,'#c8c8b9');
   }
   if(d>4)for(const side of [-1,1])box(part,'Ventana_lateral_nivel_'+f,side*(w/2+.025),wy,0,.1,1.15,d-1,'#425f61');
  }
  box(part,'Azotea',0,h+.2,0,w+.25,.4,d+.25,b.roof||'#dcded2');
  for(const side of [-1,1]){
   box(part,'Pretil',0,h+.55,side*d/2,w,.55,.25,'#c2c5b7');
   box(part,'Remate lateral',side*w/2,h+.55,0,.25,.55,d,'#c2c5b7');
   if(!b.reinforced)box(part,'Acento guinda',side*(w/2-.7),h/2,d/2+.1,1.1,h,.17,'#823747');
  }
  if(b.reinforced)reinforceG(part,w,d,h,b.floors);
  if(b.ribbed)for(let zz=-d/2+1;zz<d/2;zz+=2.4)box(part,'Nervadura de cubierta',0,h+.6,zz,w,.35,.22,'#7e2426');
  if(b.skylight){box(part,'Lucernario base',0,h+1,0,w*.47,1.4,d*.47,'#36464a');box(part,'Lucernario vidrio',0,h+1.8,0,w*.35,.3,d*.35,'#9cbcc2');}
  if(b.diamond){const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.min(w,d)*.74,3,4),material('#e5dfc3'));roof.position.y=h+1.7;roof.rotation.y=Math.PI/4;roof.castShadow=true;part.add(roof);box(part,'Remate cuadrado',0,h+3.3,0,w*.45,.4,d*.45,'#5a6467');box(part,'Tragaluz',0,h+3.6,0,2,.15,2,'#b6cdcd');}
  if(['H','K','W'].includes(b.id)&&idx===0){for(let n=0;n<2;n++)box(part,'Equipo de azotea',w/2-2-n*2.6,h+.9,0,1.8,.8,1.8,'#728182');}
 }
 if(b.id==='H'){
  const x=X(824),z=Z(320),hh=h+3;box(g,'Torre_acristalada_H',x,hh/2,z,7,hh,3,'#405961');
  for(let y=1;y<hh;y+=1.8)box(g,'Retícula torre',x,y,z+1.6,7.2,.1,.1,'#b3b8ad');
  for(let xoff=-3.5;xoff<=3.5;xoff+=1.4)box(g,'Montante torre H',x+xoff,hh/2,z+1.6,.1,hh,.1,'#b3b8ad');
  box(g,'Panel geométrico H',x,hh-1.5,z+1.65,7,3,.15,'#9f163f');
  for(let n=0;n<7;n++)box(g,'Detalle panel',x-3+n,hh-1.2+(n%2?-.2:.3),z+1.8,.26,2.2,.1,n%2?'#dedbd3':'#26272b');
 }
 const rs=b.rects;const cx=rs.reduce((s,r)=>s+(r[0]+r[2])/2,0)/rs.length,cy=rs.reduce((s,r)=>s+(r[1]+r[3])/2,0)/rs.length;
 label(b.id==='A'?'A · Obra':b.id==='I'?'I · Biblioteca':b.id,X(cx)+(b.offsetX||0),h+4,Z(cy)+(b.offsetZ||0));
 return g;
}
function bridge(spec){
 const from=data.buildings.find(b=>b.id===spec.from),to=data.buildings.find(b=>b.id===spec.to);
 if(!from||!to||from.floors<=spec.floor||to.floors<=spec.floor)return;
 const a=new THREE.Vector3(X(spec.fromAnchor[0])+(from.offsetX||0),0,Z(spec.fromAnchor[1])+(from.offsetZ||0));
 const b=new THREE.Vector3(X(spec.toAnchor[0])+(to.offsetX||0),0,Z(spec.toAnchor[1])+(to.offsetZ||0));
 const height=spec.floor*data.storeyHeight,width=spec.width||2.6,length=a.distanceTo(b)+.8;
 const g=new THREE.Group();g.name='Puente_'+spec.id;g.userData={from:spec.from,to:spec.to,floor:spec.floor,deckHeight:height,approximate:true};g.position.copy(a).add(b).multiplyScalar(.5);g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);world.add(g);
 box(g,'Losa_piso_'+spec.floor,0,height-.15,0,width,.3,length,'#babcae');
 for(const side of [-1,1]){
  for(const railHeight of [.55,1.1])box(g,'Barandal',side*width/2,height+railHeight,0,.08,.08,length,'#667d7e');
  for(let z=-length/2;z<=length/2+.01;z+=length/Math.max(1,Math.ceil(length/1.8)))box(g,'Poste_barandal',side*width/2,height+.55,z,.08,1.1,.08,'#667d7e');
 }
 label('Piso 2',g.position.x,height+2,g.position.z,'place');
}
function integratedLink(spec){
 const from=data.buildings.find(b=>b.id===spec.from),to=data.buildings.find(b=>b.id===spec.to);if(!from||!to)return;
 const levels=spec.levels.filter(n=>n<Math.min(from.floors,to.floors));if(!levels.length)return;
 const point=(p,b)=>new THREE.Vector3(X(p[0])+(b.offsetX||0),0,Z(p[1])+(b.offsetZ||0));const a=point(spec.fromAnchor,from),b=point(spec.toAnchor,to),length=a.distanceTo(b)+2,height=(Math.max(...levels)+1)*data.storeyHeight;
 const g=new THREE.Group();g.name='Conexion_integrada_'+spec.id;g.userData={from:spec.from,to:spec.to,levels,integrated:true,approximate:true};g.position.copy(a).add(b).multiplyScalar(.5);g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);world.add(g);
 // Un cuerpo de unión de tres plantas, apoyado desde PB y con fachadas continuas.
 box(g,'Cuerpo_de_unión',0,height/2,0,spec.width,height,length,'#c6c5b8');
 for(const floor of levels){const yy=floor===0?.35:floor*data.storeyHeight;box(g,floor===0?'Losa_PB':'Losa_piso_'+floor,0,yy-.15,0,spec.width+.12,.3,length,'#b5b9ab');
  for(const side of [-1,1]){box(g,'Ventana_unión_piso_'+floor,side*(spec.width/2+.03),floor*data.storeyHeight+2,0,.1,1.1,Math.max(.5,length-.5),'#708587');for(let z=-length/2+.6;z<length/2;z+=1.5)box(g,'Montante_de_unión',side*(spec.width/2+.1),floor*data.storeyHeight+2,z,.1,1.1,.09,'#d7d6c6');}
 }
 box(g,'Azotea_continua_de_unión',0,height+.1,0,spec.width+.2,.25,length,'#bbbfae');
}
function corridor(spec){
 const stops=spec.stations.map(s=>{const b=data.buildings.find(b=>b.id===s.building);if(!b)throw Error('Falta el edificio '+s.building+' del pasillo');
  const point=p=>new THREE.Vector3(X(p[0])+(b.offsetX||0),0,Z(p[1])+(b.offsetZ||0));return {building:b,spine:point(s.spine),facade:point(s.facade)};});
 const g=new THREE.Group();g.name='Pasillo_'+spec.id;g.userData={route:spec.stations.map(s=>s.building),levels:spec.levels,width:spec.width,integrated:!!spec.integrated,approximate:true};world.add(g);
 function segment(a,b,name,rails=true){const length=a.distanceTo(b);if(length<.01)return;const group=new THREE.Group();group.name=name;group.position.copy(a).add(b).multiplyScalar(.5);group.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);g.add(group);
  const levels=spec.levels.filter(f=>stops.every(s=>s.building.floors>f));const top=(Math.max(...levels)+1)*data.storeyHeight;
  group.userData={start:a.toArray(),end:b.toArray(),levels,approximate:true};
  for(const level of levels){const height=level===0?.35:level*data.storeyHeight;
   box(group,'Losa_'+(level===0?'PB':'piso_'+level),0,height-.15,0,spec.width,.3,length+.12,'#cabfa9');
   if(!spec.integrated&&rails&&level>0)for(const side of [-1,1]){
    for(const rail of [.55,1.1])box(group,'Barandal_piso_'+level,side*spec.width/2,height+rail,0,.08,.08,Math.max(.1,length-1.5),'#6d8080');
   }
  }
  if(spec.integrated)return; // Las fachadas y cubiertas son las del edificio, no una estructura paralela.
  box(group,'Cubierta_del_pasillo',0,top+.1,0,spec.width+.3,.25,length+.12,'#d8d8c9');
  const divisions=Math.max(1,Math.ceil(length/6));for(let i=0;i<=divisions;i++)for(const side of [-1,1])box(group,'Columna_del_pasillo',side*(spec.width/2-.15),top/2,-length/2+i*length/divisions,.22,top,.22,'#a6ad9f');
 }
 for(let i=1;i<stops.length;i++)segment(stops[i-1].spine,stops[i].spine,'Tramo_'+stops[i-1].building.id+'_'+stops[i].building.id);
 for(const s of stops)segment(s.spine,s.facade,'Enlace_'+s.building.id,false);
 const mid=stops[Math.floor(stops.length/2)].spine;label('Pasillo integrado · PB + 1 + 2',mid.x,11.8,mid.z+3,'place');
}
function jacaranda(px,py,index){
 const group=new THREE.Group();group.name='Jacaranda_Plaza_Roja_'+index;group.userData={species:'Jacaranda',plaza:'Plaza Roja'};group.position.set(X(px),0,Z(py));vegetation.add(group);registerEditable('jacaranda_'+index,'Jacaranda · Plaza Roja '+(index+1),'tree',group);
 function branch(a,b,r){const delta=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),o=new THREE.Mesh(cylinder,material('#675446'));o.name='Rama de jacaranda';o.position.set(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5);o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());o.castShadow=true;group.add(o);}
 branch([0,0,0],[.3,5.5,0],.5);
 for(let n=0;n<6;n++){const angle=n*Math.PI/3+index*.7,x=Math.cos(angle)*3.4,z=Math.sin(angle)*3.4,y=8+(n%3)*.55;branch([.3,4.5,0],[x,y,z],.2);branch([x,y,z],[x*1.3,y+1,z*1.3],.09);
  const foliage=new THREE.Mesh(crown,material(['#a793c9','#b4a0d3','#8774b4','#719866'][n%4]));foliage.name='Copa en flor';foliage.scale.set(3.2,1.6,3);foliage.position.set(x,y+.8,z);foliage.castShadow=true;group.add(foliage);
 }
}
function tree(px,py,size=1,palm=false,elevation=0){
 const group=new THREE.Group();group.name=palm?'Palmera_editable':'Árbol_editable';group.position.set(X(px),0,Z(py));vegetation.add(group);
 registerEditable('tree_'+px+'_'+py,(palm?'Palmera':'Árbol')+' · '+Math.round(X(px))+', '+Math.round(Z(py))+' m','tree',group);
 const x=0,z=0,trunk=new THREE.Mesh(cylinder,material('#75654c'));trunk.name=palm?'Palmera_tronco':'Árbol_tronco';trunk.scale.set(palm?.3:.4,palm?12:4,.4);trunk.position.set(x,(palm?6:2)+elevation,z);trunk.castShadow=true;group.add(trunk);
 if(palm){for(let a=0;a<8;a++){const leaf=new THREE.Mesh(crown,material('#567d3d'));leaf.scale.set(3.5,.4,.8);leaf.rotation.y=a*Math.PI/4;leaf.position.set(x+1.2*Math.cos(a*Math.PI/4),12+elevation,z+1.2*Math.sin(a*Math.PI/4));group.add(leaf);}}
 else {const c=new THREE.Mesh(crown,material(['#47774e','#5b8557','#689460'][Math.floor(px+py)%3]));c.scale.set(2.9*size,3.3*size,2.9*size);c.position.set(x,5*size+elevation,z);c.castShadow=true;group.add(c);}
}
function inside(px,py,poly){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>py)!=(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
function excluded(x,y){const t=data.buildings.find(b=>b.id==='T'),r=t?.rects[0];if(r&&x>r[0]-5+(t.offsetX||0)/S()&&x<r[0]+70+(t.offsetX||0)/S()&&y>r[1]-36+(t.offsetZ||0)/S()&&y<r[1]+(t.offsetZ||0)/S())return true;const rects=[...data.buildings.flatMap(b=>b.rects),...data.plazas.map(p=>p.rect),...data.parking,...data.paths,[1453,360,1650,686],[1440,260,1510,375]];return rects.some(r=>x>r[0]-10&&x<r[2]+10&&y>r[1]-10&&y<r[3]+10);}
let mexicanFlagMaterial;
function flagMaterial(){
 if(mexicanFlagMaterial)return mexicanFlagMaterial;
 const canvas=document.createElement('canvas');canvas.width=420;canvas.height=240;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#006847';ctx.fillRect(0,0,140,240);ctx.fillStyle='#fffdf0';ctx.fillRect(140,0,140,240);ctx.fillStyle='#ce1126';ctx.fillRect(280,0,140,240);
 // Emblema esquemático, para lectura a escala de campus; no es una reproducción oficial.
 ctx.strokeStyle='#487447';ctx.lineWidth=6;ctx.beginPath();ctx.arc(210,125,39,.18,Math.PI-.18);ctx.stroke();
 ctx.fillStyle='#795438';ctx.beginPath();ctx.ellipse(210,119,17,26,-.4,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(214,118);ctx.lineTo(242,92);ctx.lineTo(235,123);ctx.lineTo(217,137);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.arc(202,94,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c6a44a';ctx.beginPath();ctx.moveTo(194,92);ctx.lineTo(185,99);ctx.lineTo(200,99);ctx.fill();
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 mexicanFlagMaterial=new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:1});return mexicanFlagMaterial;
}
function coseiPlaza(spec){
 const g=new THREE.Group();g.name='Plaza_COSEI_detalle';g.userData={library:'I',rise:spec.rise,steps:spec.steps,approximate:true};world.add(g);
 const r=spec.terrace,base=spec.baseElevation,top=base+spec.rise;
 slab(g,r,'#b87861',base+spec.rise/2,spec.rise,'Plataforma_elevada_COSEI');
 for(let x=r[0]+4;x<r[2];x+=35)slab(g,[x,r[1],x+1,r[3]],'#d7bc9c',top+.02,.025,'Junta_plataforma');
 for(let y=r[1]+9;y<r[3];y+=35)slab(g,[r[0],y,r[2],y+1],'#d7bc9c',top+.02,.025,'Junta_plataforma');
 const treadPx=spec.tread/S();
 for(let i=0;i<spec.steps;i++){const rise=spec.rise*(i+1)/spec.steps,y0=r[1]-(spec.steps-i)*treadPx;
  slab(g,[spec.stairWidth[0],y0,spec.stairWidth[1],y0+treadPx+.025],'#c0b9a6',base+rise/2,rise,'Escalón_COSEI_'+(i+1));
 }
 const wallRects=[[r[0],r[1],spec.stairWidth[0],r[1]+1],[spec.stairWidth[1],r[1],r[2],r[1]+1],[r[0],r[1],r[0]+1,r[3]]];
 for(const [i,wall] of wallRects.entries())slab(g,wall,'#a7aaa1',base+(spec.rise+.1)/2,spec.rise+.1,'Murete_desnivel_'+i);
 for(const [i,p] of spec.planters.entries()){
  const height=.5;slab(g,p,'#969d90',base+height/2,height,'Jardinera_COSEI_'+i);
  slab(g,[p[0]+2,p[1]+2,p[2]-2,p[3]-2],'#627c4e',base+height+.015,.05,'Área_verde_jardinera');
  for(const edge of [[p[0],p[1],p[2],p[1]+1.7],[p[0],p[3]-1.7,p[2],p[3]]])slab(g,edge,'#d7d0ba',base+height+.06,.12,'Banca_murete_COSEI');
  tree((p[0]+p[2])/2,(p[1]+p[3])/2,.6,false,base+height);
 }
 for(const p of spec.palms)tree(p[0],p[1],1,true,base);
 const flag=spec.flag,x=X(flag.position[0]),z=Z(flag.position[1]),poleBase=top+.24;
 const flagGroup=new THREE.Group();flagGroup.name='Asta_bandera_COSEI';flagGroup.userData={height:flag.height,library:'I',flag:'México, emblema esquemático',approximate:true};flagGroup.position.set(x,poleBase,z);g.add(flagGroup);registerEditable('flag_COSEI','Bandera · Plaza COSEI','flag',flagGroup);
 box(flagGroup,'Pedestal_asta',0,-.12,0,1.5,.24,1.5,'#d3d2bf');
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.13,flag.height,16),material('#c8cfd0'));pole.name='Mástil';pole.position.y=flag.height/2;pole.castShadow=true;flagGroup.add(pole);
 const finial=new THREE.Mesh(crown,material('#c7c0a7'));finial.name='Remate_asta';finial.scale.setScalar(.16);finial.position.y=flag.height;flagGroup.add(finial);
 const geometry=new THREE.PlaneGeometry(flag.width,flag.width*4/7,24,12);geometry.translate(flag.width/2,-flag.width*2/7,0);
 const positions=geometry.attributes.position;for(let i=0;i<positions.count;i++){const xx=positions.getX(i),yy=positions.getY(i);positions.setZ(i,.3*Math.sin(xx*1.9+yy*.5)*xx/flag.width);}
 geometry.computeVertexNormals();const cloth=new THREE.Mesh(geometry,flagMaterial());cloth.name='Bandera_México';cloth.position.y=flag.height-.25;cloth.castShadow=true;flagGroup.add(cloth);
 // Frente acristalado de la biblioteca, con el acceso a la cota de la plataforma.
 const lib=data.buildings.find(b=>b.id==='I'),front=lib.rects[0],glassWidth=(front[2]-front[0])*S()*.85,glassX=X((front[0]+front[2])/2)+(lib.offsetX||0),glassZ=Z(front[1])+(lib.offsetZ||0)-.12;
 box(g,'Acceso_acristalado_Biblioteca_I',glassX,top+2.4,glassZ,glassWidth,4.8,.12,'#3b555c');
 for(let dx=-glassWidth/2;dx<=glassWidth/2;dx+=2.6)box(g,'Montante_biblioteca',glassX+dx,top+2.4,glassZ-.08,.1,4.9,.1,'#bfc6bf');
 box(g,'Travesaño_biblioteca',glassX,top+2.4,glassZ-.08,glassWidth,.1,.1,'#bfc6bf');
}
function generate(){
 if(world){scene.remove(world);world.traverse(o=>{if(o.geometry&&!([cube,cylinder,crown].includes(o.geometry)))o.geometry.dispose();if(o.userData.disposeMaterial||o.userData.disposeCopyrightMaterial){o.material.map?.dispose();o.material.dispose();}});}
 clearEditSelection();labelLayer.replaceChildren();labels=[];buildingGroups.clear();editables.clear();world=new THREE.Group();world.name='UAM_Azcapotzalco';world.userData={units:'meters',approximate:true,reference:'v7 approved',scaleEstimate:740};scene.add(world);
 vegetation=new THREE.Group();vegetation.name='Vegetación';world.add(vegetation);
 box(world,'Base maqueta',0,-2,10,760,4,310,'#b8beaf');meshPoly(world,data.site,.1,'#82a276','Predio');
 slab(world,[30,706,1770,736],'#88918d',-.03,.2,'Eje_5_Norte_Montevideo');slab(world,[22,70,48,705],'#88918d',-.03,.2,'Av_San_Pablo');
 for(const r of data.paths)slab(world,r,'#d5cbb1');
 for(const p of data.plazas){const roja=p.name==='Plaza Roja';slab(world,p.rect,roja?'#b86d50':'#b87861',.23);const r=p.rect,joint=roja?'#bd795d':'#d7bc9c',thickness=roja?.25:1.2;
  for(let x=r[0];x<r[2];x+=35)slab(world,[x,r[1],x+thickness,r[3]],joint,.38,.025,'Junta de plaza');
  for(let y=r[1];y<r[3];y+=35)slab(world,[r[0],y,r[2],y+thickness],joint,.39,.025,'Junta de plaza');
  if(p.name!=='Patio H')label(p.name,X((r[0]+r[2])/2),1,Z((r[1]+r[3])/2),'place');
 }
 for(const [i,r] of data.parking.entries())parkingArea(r,'parking_'+i,'Estacionamiento '+(i+1));
 for(const [i,p] of (data.extraParking||[]).entries())parkingArea(p.rect,p.id,'Estacionamiento nuevo '+(i+1));
 for(const r of data.driveAisles||[])slab(world,r,'#69726e',.37,.08,'Carril_estacionamientos_conectados');
 // Canchas y estadio: trazado fijo, sin fotografías como textura.
 slab(world,[1452,448,1596,684],'#4c995e',.21,.3,'Campo_futbol');
 const field=[[X(1460),Z(455)],[X(1588),Z(455)],[X(1588),Z(677)],[X(1460),Z(677)],[X(1460),Z(455)]];line(world,field,'#d5e9d0',.2,.43);line(world,[[X(1460),Z(566)],[X(1588),Z(566)]],'#d5e9d0',.2,.43);
 const circle=new THREE.Mesh(new THREE.TorusGeometry(8,.12,4,48),material('#d5e9d0'));circle.rotation.x=-Math.PI/2;circle.position.set(X(1524),.46,Z(566));world.add(circle);
 for(const y of [455,652])line(world,[[X(1492),Z(y)],[X(1492),Z(y+25)],[X(1556),Z(y+25)],[X(1556),Z(y)]],'#d5e9d0',.15,.45);
 for(const r of [[1451,377,1515,437],[1521,377,1589,437],[1602,587,1669,648],[1602,651,1674,686]]){
  slab(world,r,'#4c9196',.25);line(world,[[X(r[0]+3),Z(r[1]+3)],[X(r[2]-3),Z(r[1]+3)],[X(r[2]-3),Z(r[3]-3)],[X(r[0]+3),Z(r[3]-3)],[X(r[0]+3),Z(r[1]+3)]],'#d6dbbb',.13,.46);
 }
 slab(world,[1441,265,1498,369],'#697470',.2,.3,'Pista');
 for(const b of data.buildings)building(b);
 if(data.sculpture)sculptureG(data.sculpture);
 if(data.serpentina)serpentinaH(data.serpentina);
 for(const spec of data.bridges||[])bridge(spec);
 for(const spec of data.integratedLinks||[])integratedLink(spec);
 for(const spec of data.corridors||[])corridor(spec);
 if(data.cosei)coseiPlaza(data.cosei);
 // Perímetro cerrado, excepto en los seis accesos definidos; T permanece sin salida.
 const poly=[...data.site,data.site[0]];
 for(let i=1;i<poly.length;i++){const a=poly[i-1],b=poly[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<len;t+=8){const u=(t+4)/len,px=a[0]+(b[0]-a[0])*u,py=a[1]+(b[1]-a[1])*u;if(data.gates.some(g=>Math.hypot(g.x-px,g.y-py)<21))continue;
  const o=box(world,'Perímetro',X(px),.9,Z(py),8*S(),1.7,.45,'#71816d');o.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}}
 for(const gate of data.gates){const color=gate.type==='vehicle'?'#bc3535':'#1d72b6';box(world,'Acceso_'+gate.id,X(gate.x),.5,Z(gate.y),gate.type==='vehicle'?7:3,.6,5,color);label(gate.type==='vehicle'?'Auto':'Peatón',X(gate.x),5,Z(gate.y),gate.type);}
 let seed=1729;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<520;n++){const x=75+rand()*1600,y=95+rand()*590;if(inside(x,y,data.site)&&!excluded(x,y))tree(x,y,.7+rand()*.6);}
 for(let x=90;x<1560;x+=39){let y=80+(x-60)*144/1515+11;if(!excluded(x,y))tree(x,y,.9);}
 for(let x=80;x<1650;x+=34)if(!data.gates.some(g=>Math.hypot(g.x-x,g.y-689)<25))tree(x,688,.8);
 tree(803,354,1,true);tree(845,354,1,true);for(const p of [[805,331],[847,331]])tree(p[0],p[1],.6);
 for(const [i,p] of (data.jacarandas||[]).entries())jacaranda(p[0],p[1],i);
 for(const px of [715,877])for(let py=436;py<565;py+=48){if(data.cosei&&px>760&&py>=480)continue;if(!data.sculpture||Math.hypot(px-data.sculpture.position[0],py-data.sculpture.position[1])>18)tree(px,py,.6);}
 label('Eje 5 Norte · Montevideo',X(870),2,Z(743),'place');label('Av. San Pablo',X(-8),2,Z(400),'place');
 vegetation.visible=$('trees').checked;labelLayer.hidden=!$('names').checked;
 addCopyrightToModel();world.updateMatrixWorld(true);selectBuilding(selected);refreshEditor();routeEditor?.refresh();
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
renderer.domElement.addEventListener('pointerup',e=>{if(editMode)return;if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...buildingGroups.values()],true);if(hits.length){let o=hits[0].object;while(o.parent&&o.userData.id===undefined)o=o.parent;selectBuilding(o.userData.id);}});
let highlight;
function selectBuilding(id){selected=id||'';$('building').value=selected;if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
 const b=data.buildings.find(b=>b.id===selected);$('editor').hidden=!b;
 if(!b){$('info').textContent='Haz clic en un edificio o selecciónalo en la lista.';return;}
 $('info').textContent=(b.name||'Edificio '+b.id)+' · '+b.floors+' nivel(es)'+(['H','HO','HP'].includes(b.id)?' · Conexión integrada en PB, 1 y 2':'')+(b.pavilion?' · Cubierta translúcida superior':'')+(b.id==='T'?' · Sin salida hacia Eje 5 Norte':'')+(b.construction?' · Obra conceptual':'');
 for(const key of ['floors','offsetX','offsetZ'])$(key).value=b[key]||0;
 highlight=new THREE.BoxHelper(buildingGroups.get(b.id),'#ffb02e');scene.add(highlight);
}
for(const b of data.buildings){const option=document.createElement('option');option.value=b.id;option.textContent=b.name||'Edificio '+b.id;$('building').append(option);}
$('building').onchange=e=>selectBuilding(e.target.value);
$('apply').onclick=()=>{const b=data.buildings.find(b=>b.id===selected);if(!b)return;const n=Number($('floors').value),ox=Number($('offsetX').value),oz=Number($('offsetZ').value);if(!Number.isInteger(n)||n<1||n>8||![ox,oz].every(Number.isFinite)){message('Introduce niveles entre 1 y 8 y desplazamientos válidos.');return;}rememberEdit();b.floors=n;delete b.height;b.offsetX=ox;b.offsetZ=oz;generate();updateSaveState();message('Edificio actualizado. Guarda datos y GLB para conservar el cambio.');};
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();const span=480;ortho.left=-span;ortho.right=span;ortho.top=span*h/w;ortho.bottom=-span*h/w;ortho.updateProjectionMatrix();if(!topMode&&focusMode&&$('serpentina').classList.contains('active')){const distance=Math.max(34,7/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}else if(!topMode&&focusMode&&$('tdetail').classList.contains('active')){const distance=Math.max(48,20/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}else if(!topMode&&!focusMode){const distance=Math.max(850,420/(Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect));perspective.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);controls.update();}}
window.addEventListener('resize',resize);
$('expand').onclick=()=>{const panel=document.querySelector('aside');panel.hidden=!panel.hidden;mount.style.left=panel.hidden?'0px':'';$('expand').textContent=panel.hidden?'Mostrar controles':'Ampliar vista';resize();};
// Misma transformación de norte que Campus.kt; no escala la geometría ni aplica dos veces la calibración.
function campusNorth(geo){
 if(!geo)return null;
 const ul=geo.superiorIzquierda,ur=geo.superiorDerecha,ll=geo.inferiorIzquierda;
 if(![ul,ur,ll].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))||!(geo.ancho>0&&geo.alto>0))return null;
 const cosLat=Math.cos(ul[0]*Math.PI/180),ax=(ur[1]-ul[1])*cosLat/geo.ancho,ay=(ur[0]-ul[0])/geo.ancho,bx=(ll[1]-ul[1])*cosLat/geo.alto,by=(ll[0]-ul[0])/geo.alto,det=ax*by-ay*bx;
 if(Math.abs(det)<1e-18)return null;
 const x=-bx/det,z=ax/det,length=Math.hypot(x,z);return {x:x/length,z:z/length};
}
function view(mode){topMode=mode==='top';controls.maxPolarAngle=topMode?Math.PI:THREE.MathUtils.degToRad(78);focusMode=['plaza','pavilions','cosei','gdetail','parking','tdetail','serpentina'].includes(mode);camera=topMode?ortho:perspective;controls.object=camera;controls.enableRotate=!topMode;controls.target.set(0,0,0);camera.zoom=1;camera.up.set(0,1,0);
 if(mode==='serpentina'){const node=editables.get('sculpture_serpentina_H')?.node;controls.target.copy(node?.position||new THREE.Vector3(X(824),0,Z(265)));controls.target.y=3.4;camera.position.copy(controls.target).add(new THREE.Vector3(-8,6,-23));}
 else if(mode==='tdetail'){const b=data.buildings.find(b=>b.id==='T'),r=b.rects[0];controls.target.set(X((r[0]+r[2])/2)+(b.offsetX||0)-(r[2]-r[0])*S()*.27,2.5,Z(r[1])+(b.offsetZ||0)-3);camera.position.copy(controls.target).add(new THREE.Vector3(-12,12,-45));}
 else if(mode==='plaza'){controls.target.set(X(563.5),3,Z(486.5));camera.position.copy(controls.target).add(new THREE.Vector3(35,115,155));}
 else if(mode==='pavilions'){controls.target.set(X(824),6,Z(337));camera.position.copy(controls.target).add(new THREE.Vector3(-45,90,-140));}
 else if(mode==='cosei'){controls.target.set(X(817),4,Z(540));camera.position.copy(controls.target).add(new THREE.Vector3(-15,80,-145));}
 else if(mode==='gdetail'){controls.target.set(X(670),5,Z(526));camera.position.copy(controls.target).add(new THREE.Vector3(120,48,30));}
 else if(mode==='parking'){controls.target.set(X(790),3,Z(255));camera.position.copy(controls.target).add(new THREE.Vector3(-80,170,-200));}
 else if(mode==='maps'){const north=campusNorth(georeference);camera.position.set(north?-north.x*630:-70,580,north?-north.z*630:-630);}
 else if(mode==='top'){camera.position.set(0,1000,0);const north=campusNorth(georeference);if(north)camera.up.set(north.x,0,north.z);else camera.up.set(.17,0,.985);}
 else camera.position.set(0,580,630);
 camera.lookAt(controls.target);camera.updateProjectionMatrix();controls.update();for(const id of ['approved','maps','top','plaza','pavilions','cosei','gdetail','parking','tdetail','serpentina'])$(id).classList.toggle('active',id===mode);resize();}
for(const mode of ['approved','maps','top','plaza','pavilions','cosei','gdetail','parking','tdetail','serpentina'])$(mode).onclick=()=>view(mode);
$('spin').onclick=()=>{if(topMode)view('maps');controls.autoRotate=!controls.autoRotate;$('spin').classList.toggle('active',controls.autoRotate);};
$('trees').onchange=()=>vegetation.visible=$('trees').checked;$('names').onchange=()=>labelLayer.hidden=!$('names').checked;$('grid').onchange=()=>grid.visible=$('grid').checked;
function message(text){$('status').textContent=text;clearTimeout(message.timer);message.timer=setTimeout(()=>$('status').textContent='',6500);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),6000);}
async function save(blob,kind,name){if(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)){const res=await fetch('/guardar/'+kind,{method:'POST',body:blob});if(!res.ok)throw Error('No se pudo guardar');const r=await res.json();message('Guardado en la carpeta del modelo: '+r.saved);}else{download(blob,name);message('Archivo preparado para descargar.');}}
$('saveglb').onclick=async()=>{if(isSaving)return;const btn=$('saveglb');btn.disabled=true;message('Preparando modelo GLB…');const was=vegetation.visible;try{vegetation.visible=true;const result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb','UAM_Azcapotzalco.glb');}catch(e){$('error').textContent=e.message;}finally{vegetation.visible=was;btn.disabled=false;}};
$('savejson').onclick=()=>saveEditorChanges(false);
$('savepng').onclick=async()=>{renderer.render(scene,camera);const canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;const ctx=canvas.getContext('2d');ctx.drawImage(renderer.domElement,0,0);const factor=canvas.width/mount.clientWidth;if($('names').checked)for(const l of labels){if(l.el.style.display==='none')continue;const x=parseFloat(l.el.style.left)*factor,y=parseFloat(l.el.style.top)*factor;ctx.font=`600 ${12*factor}px sans-serif`;const w=ctx.measureText(l.el.textContent).width+12*factor;ctx.fillStyle=l.el.classList.contains('vehicle')?'#bc3535':l.el.classList.contains('pedestrian')?'#1d72b6':'#fffdf0';ctx.fillRect(x-w/2,y-10*factor,w,20*factor);ctx.fillStyle=['vehicle','pedestrian'].some(c=>l.el.classList.contains(c))?'white':'#243b2e';ctx.textAlign='center';ctx.fillText(l.el.textContent,x,y+4*factor);}
 ctx.textAlign='left';ctx.font=`${12*factor}px sans-serif`;ctx.fillStyle='#344d3f';ctx.fillText('UAM Azcapotzalco · Modelo aproximado basado en v7',18*factor,canvas.height-18*factor);drawWatermark(ctx);canvas.toBlob(async b=>{try{await save(b,'png','Vista_UAM.png');}catch(e){message(e.message);}},'image/png');};
$('loadjson').onclick=()=>$('filejson').click();
$('filejson').onchange=async e=>{try{if(!e.target.files[0])return;const loaded=validateCampus(JSON.parse(await e.target.files[0].text()));rememberEdit();data=loaded;selected='';editSelected='';generate();updateSaveState();message('Datos cargados. Usa Guardar cambios para conservarlos.');}catch(e){message('No se pudo abrir: '+e.message);}finally{e.target.value='';}};
// Editor ligero: los cambios son datos; los controles no forman parte del GLB.
let editHelper=null;
function clearEditSelection(){if(editHelper){scene.remove(editHelper);editHelper.geometry.dispose();editHelper.material.dispose();editHelper=null;}}
function registerEditable(id,title,kind,node,size){
 if((data.removedElements||[]).includes(id)){node.removeFromParent();return;}
 const entry={id,title,kind,node,basePosition:node.position.clone(),baseAngle:node.rotation.y,size};editables.set(id,entry);node.userData.editableId=id;
 const change=data.elementEdits?.[id]||{};node.position.x+=change.offsetX||0;node.position.z+=change.offsetZ||0;node.rotation.y+=change.rotation||0;
 if(size){node.scale.x=(change.width||size.width)/size.width;node.scale.z=(change.depth||size.depth)/size.depth;}
}
function parkingArea(r,id,title){
 const w=(r[2]-r[0])*S(),d=(r[3]-r[1])*S(),group=new THREE.Group();group.name='Estacionamiento_editable_'+id;group.position.set(X((r[0]+r[2])/2),0,Z((r[1]+r[3])/2));world.add(group);registerEditable(id,title,'parking',group,{width:w,depth:d});
 box(group,'Asfalto',0,.16,0,w,.25,d,'#777f78');
 // Los cajones no sobrepasan la superficie y dejan pasillos de circulación.
 for(let x=-w/2+3;x<w/2-1;x+=2.5)for(let z=-d/2+1;z+5<d/2-1;z+=10)box(group,'Cajón',x,.32,z+2.5,.055,.025,5,'#dfd4a0');
}
function editSnapshot(){return structuredClone(data);}
function rememberEdit(snapshot=editSnapshot()){undoHistory.push(snapshot);if(undoHistory.length>40)undoHistory.shift();redoHistory=[];}
function updateSaveState(){const dirty=JSON.stringify(data)!==savedData||routeEditor?.isDirty();$('saveState').textContent=isSaving?'Guardando…':dirty?'Hay cambios sin guardar.':'Sin cambios pendientes.';$('editUndo').disabled=!undoHistory.length;$('editRedo').disabled=!redoHistory.length;}
function rebuildAfterEdit(){generate();updateSaveState();}
function editorOptions(){
 const selector=$('editObject'),kind=$('editFilter').value;selector.replaceChildren(new Option('Selecciona en el mapa o en esta lista',''));
 for(const e of editables.values())if(kind==='all'||e.kind===kind)selector.add(new Option(e.title,e.id));
 selector.value=editSelected;
}
function refreshEditor(){editorOptions();showObjectFields();}
function showObjectFields(){
 clearEditSelection();const e=editables.get(editSelected);$('objectFields').hidden=!e;if(!e)return;
 $('editObject').value=e.id;$('objectX').value=e.node.position.x.toFixed(2);$('objectZ').value=e.node.position.z.toFixed(2);$('objectAngle').value=THREE.MathUtils.radToDeg(e.node.rotation.y).toFixed(1);
 $('parkingFields').hidden=e.kind!=='parking';if(e.size){$('parkingWidth').value=(e.size.width*e.node.scale.x).toFixed(2);$('parkingDepth').value=(e.size.depth*e.node.scale.z).toFixed(2);}
 if(editMode){editHelper=new THREE.BoxHelper(e.node,'#f4a622');editHelper.name='Selección_editor';scene.add(editHelper);}
}
function chooseEditable(id){editSelected=id||'';const e=editables.get(id);if(e&&$('editFilter').value!=='all'&&$('editFilter').value!==e.kind)$('editFilter').value='all';refreshEditor();}
function resetDraw(){drawStart=null;if(drawPreview){scene.remove(drawPreview);drawPreview.geometry.dispose();drawPreview.material.dispose();drawPreview=null;}}
function setEditing(value){
 editMode=value;resetDraw();controls.autoRotate=false;$('spin').classList.remove('active');controls.enabled=true;$('sceneEditor').hidden=!value;$('toggleEdit').textContent=value?'Cerrar modo edición':'Activar modo edición';$('toggleEdit').setAttribute('aria-expanded',String(value));mount.classList.toggle('editing',value);refreshEditor();
 if(value)message('Selecciona y arrastra un elemento. Los cambios se conservan con Guardar cambios.');
}
$('toggleEdit').onclick=()=>{if(!editMode){$('editRoutes').checked=false;$('routeEditor').hidden=true;}setEditing(!editMode);};
$('editObject').onchange=e=>chooseEditable(e.target.value);
$('editFilter').onchange=()=>{editSelected='';refreshEditor();};
$('editTop').onclick=()=>view('top');
$('editTool').onchange=()=>{resetDraw();message($('editTool').value==='parking'?'Marca dos esquinas del estacionamiento. Esc cancela.':$('editTool').value==='place'?'Selecciona un elemento en la lista y haz clic en su nueva ubicación.':'Selecciona un elemento y arrástralo.');};
$('editUndo').onclick=()=>{if(isSaving||!undoHistory.length)return;resetDraw();redoHistory.push(editSnapshot());data=undoHistory.pop();rebuildAfterEdit();message('Cambio deshecho.');};
$('editRedo').onclick=()=>{if(isSaving||!redoHistory.length)return;resetDraw();undoHistory.push(editSnapshot());data=redoHistory.pop();rebuildAfterEdit();message('Cambio recuperado.');};
function writeTransform(e,x,z,angle,width,depth){
 data.elementEdits??={};data.elementEdits[e.id]={offsetX:x-e.basePosition.x,offsetZ:z-e.basePosition.z,rotation:angle-e.baseAngle,...(e.size?{width:width??e.size.width*e.node.scale.x,depth:depth??e.size.depth*e.node.scale.z}:{})};
}
$('applyObject').onclick=()=>{
 const e=editables.get(editSelected);if(!e)return;const x=Number($('objectX').value),z=Number($('objectZ').value),angle=Number($('objectAngle').value),w=Number($('parkingWidth').value),d=Number($('parkingDepth').value);
 if(![x,z,angle].every(Number.isFinite)||Math.abs(x)>1000||Math.abs(z)>1000||(e.size&&(![w,d].every(Number.isFinite)||w<2||w>750||d<2||d>310))){message('Revisa las medidas. Estacionamientos: ancho de 2 a 750 m y fondo de 2 a 310 m.');return;}
 rememberEdit();writeTransform(e,x,z,THREE.MathUtils.degToRad(angle),w,d);rebuildAfterEdit();message('Elemento actualizado.');
};
$('resetObject').onclick=()=>{if(!editables.has(editSelected))return;rememberEdit();delete data.elementEdits?.[editSelected];rebuildAfterEdit();message('Elemento restablecido.');};
$('deleteObject').onclick=()=>{if(!editables.has(editSelected))return;rememberEdit();data.removedElements??=[];data.removedElements.push(editSelected);editSelected='';rebuildAfterEdit();message('Elemento quitado. Puedes recuperarlo con Deshacer.');};
function canvasRay(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function groundPoint(e){canvasRay(e);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p);}
function snapped(p){if($('editSnap').checked){p.x=Math.round(p.x*2)/2;p.z=Math.round(p.z*2)/2;}return p;}
function editableAt(e){canvasRay(e);const hits=raycaster.intersectObjects([...editables.values()].filter(e=>e.kind!=='tree'||vegetation.visible).map(e=>e.node),true);const selected=editables.get(editSelected);if(selected&&hits.length){const selectedHits=raycaster.intersectObject(selected.node,true);if(selectedHits.length&&selectedHits[0].distance<=hits[0].distance+.3)return selected;}for(const hit of hits){let node=hit.object;while(node&&!node.userData.editableId)node=node.parent;if(node)return editables.get(node.userData.editableId);}return null;}
function consumePointer(e){e.preventDefault();e.stopImmediatePropagation();}
function validParkingPoint(p){return inside(p.x/S()+895,p.z/S()+390,data.site);}
function finishParking(p){
 const a=drawStart,w=Math.abs(p.x-a.x),d=Math.abs(p.z-a.z);if(w<2||d<2){message('Marca una segunda esquina a más de 2 m de la primera.');return;}
 const points=[[Math.min(a.x,p.x),Math.min(a.z,p.z)],[Math.max(a.x,p.x),Math.min(a.z,p.z)],[Math.max(a.x,p.x),Math.max(a.z,p.z)],[Math.min(a.x,p.x),Math.max(a.z,p.z)]];
 if(!points.every(([x,z])=>validParkingPoint(new THREE.Vector3(x,0,z)))){message('Las cuatro esquinas deben quedar dentro del campus.');return;}
 rememberEdit();data.extraParking??=[];const id='parking_new_'+Date.now().toString(36)+'_'+data.extraParking.length;
 data.extraParking.push({id,rect:[points[0][0]/S()+895,points[0][1]/S()+390,points[2][0]/S()+895,points[2][1]/S()+390]});resetDraw();editSelected=id;$('editFilter').value='parking';rebuildAfterEdit();$('editTool').value='move';message('Estacionamiento creado. Puedes moverlo, girarlo y ajustar sus medidas.');
}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!editMode||e.button!==0||isSaving)return;const tool=$('editTool').value;
 if(tool==='parking'){consumePointer(e);const p=groundPoint(e);if(!p)return;snapped(p);if(!drawStart){if(!validParkingPoint(p)){message('Marca la primera esquina dentro del campus.');return;}drawStart=p;message('Ahora marca la esquina opuesta.');}else finishParking(p);return;}
 if(tool==='place'){consumePointer(e);const entry=editables.get(editSelected),p=groundPoint(e);if(!entry){message('Elige primero un elemento en la lista.');return;}if(!p)return;snapped(p);rememberEdit();writeTransform(entry,p.x,p.z,entry.node.rotation.y);rebuildAfterEdit();message('Elemento colocado.');return;}
 const entry=editableAt(e);if(!entry)return;consumePointer(e);const p=groundPoint(e);if(!p)return;chooseEditable(entry.id);controls.enabled=false;dragEdit={entry,start:p,position:entry.node.position.clone(),snapshot:editSnapshot(),pointerId:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);
},true);
renderer.domElement.addEventListener('pointermove',e=>{
 if(!editMode)return;
 if(dragEdit){consumePointer(e);const p=groundPoint(e);if(!p)return;const target=dragEdit.position.clone().add(p.sub(dragEdit.start));snapped(target);dragEdit.entry.node.position.x=target.x;dragEdit.entry.node.position.z=target.z;editHelper?.update();return;}
 if(drawStart){const p=groundPoint(e);if(!p)return;snapped(p);if(!drawPreview){drawPreview=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#efb542',transparent:true,opacity:.55,depthTest:false}));drawPreview.name='Vista_previa_estacionamiento';drawPreview.renderOrder=10;scene.add(drawPreview);}drawPreview.position.set((drawStart.x+p.x)/2,.5,(drawStart.z+p.z)/2);drawPreview.scale.set(Math.max(.05,Math.abs(p.x-drawStart.x)),.15,Math.max(.05,Math.abs(p.z-drawStart.z)));}
},true);
function endEditDrag(e,cancel=false){if(!dragEdit)return;consumePointer(e);const drag=dragEdit;dragEdit=null;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);
 const moved=drag.entry.node.position.distanceTo(drag.position)>.01;if(cancel){drag.entry.node.position.copy(drag.position);showObjectFields();return;}if(moved){rememberEdit(drag.snapshot);writeTransform(drag.entry,drag.entry.node.position.x,drag.entry.node.position.z,drag.entry.node.rotation.y);rebuildAfterEdit();}else showObjectFields();
}
renderer.domElement.addEventListener('pointerup',e=>endEditDrag(e),true);
renderer.domElement.addEventListener('pointercancel',e=>endEditDrag(e,true),true);
document.addEventListener('keydown',e=>{if(!editMode||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='Escape'){resetDraw();message('Dibujo cancelado.');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'editRedo':'editUndo').click();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();$('editRedo').click();}});
window.addEventListener('beforeunload',e=>{if(savedData&&(JSON.stringify(data)!==savedData||routeEditor?.isDirty())){e.preventDefault();e.returnValue='';}});
function validateCampus(d){
 if(d?.serpentina&&(!Array.isArray(d.serpentina.position)||d.serpentina.position.length!==2||!d.serpentina.position.every(Number.isFinite)||(d.serpentina.scale!==undefined&&(!Number.isFinite(d.serpentina.scale)||d.serpentina.scale<.2||d.serpentina.scale>4))))throw Error('Serpentina inválida');
 if(d?.showCopyright!==undefined&&typeof d.showCopyright!=='boolean')throw Error('showCopyright debe ser true o false');
 const rect=r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[2]>r[0]&&r[3]>r[1];
 if(!d||!Array.isArray(d.buildings)||!Array.isArray(d.site)||!(d.metersPerPixel>0)||!Number.isFinite(d.storeyHeight)||!d.buildings.every(b=>typeof b.id==='string'&&Number.isInteger(b.floors)&&b.floors>=1&&b.floors<=8&&Array.isArray(b.rects)&&b.rects.every(rect))||!['plazas','paths','parking','gates'].every(k=>Array.isArray(d[k]))||!d.parking.every(rect)||!d.paths.every(rect)||!d.plazas.every(p=>rect(p.rect)))throw Error('Datos de campus inválidos');
 if(d.extraParking!==undefined&&(!Array.isArray(d.extraParking)||d.extraParking.length>500||!d.extraParking.every(p=>typeof p.id==='string'&&/^parking_new_[a-z0-9_]+$/.test(p.id)&&rect(p.rect))))throw Error('Estacionamientos inválidos');
 if(d.removedElements!==undefined&&(!Array.isArray(d.removedElements)||!d.removedElements.every(id=>typeof id==='string')))throw Error('Elementos retirados inválidos');
 if(d.elementEdits!==undefined&&(!d.elementEdits||Array.isArray(d.elementEdits)||typeof d.elementEdits!=='object'||!Object.values(d.elementEdits).every(v=>v&&typeof v==='object'&&Object.entries(v).every(([key,n])=>['offsetX','offsetZ','rotation','width','depth'].includes(key)&&Number.isFinite(n)&&Math.abs(n)<10000)&&(!('width'in v)||v.width>=2)&&(!('depth'in v)||v.depth>=2))))throw Error('Posiciones de elementos inválidas');
 return {...d,version:8};
}
// Plano 2D para la app móvil: vista ortográfica desde arriba, fondo transparente, +X a la derecha y -Z arriba.
// La app lo coloca sobre el mapa real con georreferencia.json; estos límites (m) deben coincidir con los de ahí.
// Marca temporal sobre la imagen, nunca sobre la geometría exportada.
function drawWatermark(ctx){
 if(!copyrightEnabled())return;
 const text='copyright @gabrielhuav',margin=12,size=14;ctx.save();ctx.font='500 '+size+'px system-ui, sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';const width=ctx.measureText(text).width;
 ctx.fillStyle='rgba(255,255,255,.78)';ctx.fillRect(ctx.canvas.width-margin-width-8,ctx.canvas.height-margin-size-6,width+16,size+12);ctx.fillStyle=copyrightStyle().color;ctx.fillText(text,ctx.canvas.width-margin,ctx.canvas.height-margin);ctx.restore();
}
async function watermarkedPlan(source,withMark=true){
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);if(withMark)drawWatermark(ctx);return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo crear el plano PNG.')),'image/png'));
}
const PLANO={xMin:-390,xMax:390,zMin:-150,zMax:170,pxPorMetro:2};
async function planoBlob(withMark=true){
 const w=(PLANO.xMax-PLANO.xMin)*PLANO.pxPorMetro,h=(PLANO.zMax-PLANO.zMin)*PLANO.pxPorMetro;
 const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(w,h,false);r.setClearColor(0,0);
 r.outputColorSpace=renderer.outputColorSpace;r.toneMapping=renderer.toneMapping;r.toneMappingExposure=renderer.toneMappingExposure;
 const cam=new THREE.OrthographicCamera(PLANO.xMin,PLANO.xMax,-PLANO.zMin,-PLANO.zMax,1,2500);cam.position.set(0,1000,0);cam.up.set(0,0,-1);cam.lookAt(0,0,0);
 const ocultos=[...['Base maqueta','Eje_5_Norte_Montevideo','Av_San_Pablo'].map(n=>world.getObjectByName(n)),editHelper,highlight,routeEditor?.group].filter(Boolean).map(node=>({node,visible:node.visible})),was=vegetation.visible,fog=scene.fog,g=grid.visible;
 for(const o of ocultos)o.node.visible=false;vegetation.visible=true;scene.fog=null;grid.visible=false;
 try{r.render(scene,cam);return await watermarkedPlan(r.domElement,withMark);}
 finally{for(const o of ocultos)o.node.visible=o.visible;vegetation.visible=was;scene.fog=fog;grid.visible=g;r.dispose();}
}
async function saveEditorChanges(withModel=true){
 if(isSaving||!routeEditor)return;let routeSnapshot;try{routeSnapshot=routeEditor.exportNet();}catch(e){message(e.message);return;}isSaving=true;resetDraw();updateSaveState();const buttons=['copyrightToggle','saveChanges','saveglb','savejson','apply','applyObject','deleteObject','resetObject','loadjson','toggleEdit','editUndo','editRedo'];for(const id of buttons)$(id).disabled=true;
 const snapshot=JSON.stringify(data);try{
  if(withModel){const was=vegetation.visible,mark=world.getObjectByName('Marca_copyright_modelo'),visible=mark?.visible;vegetation.visible=true;try{
   let result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb','UAM_Azcapotzalco.glb');await save(await planoBlob(),'plano','plano_2d.png');
   if(mark)mark.visible=false;result=await new GLTFExporter().parseAsync(world,{binary:true,onlyVisible:true});await save(new Blob([result],{type:'model/gltf-binary'}),'glb-sin-marca','UAM_Azcapotzalco_sin_marca.glb');await save(await planoBlob(false),'plano-sin-marca','plano_2d_sin_marca.png');
  }finally{vegetation.visible=was;if(mark)mark.visible=visible;}}
  await save(new Blob([JSON.stringify(JSON.parse(snapshot),null,2)],{type:'application/json'}),'json','campus_editado.json');await save(new Blob([JSON.stringify(routeSnapshot,null,2)],{type:'application/json'}),'rutas','rutas.json');savedData=snapshot;routeEditor.markSaved(routeSnapshot);message(withModel?'Campus, rutas.json y variantes con/sin marca guardados.':'Datos editables y rutas.json guardados.');
 }catch(e){message('No se pudo completar el guardado: '+e.message);}finally{isSaving=false;for(const id of buttons)$(id).disabled=false;updateSaveState();}
}
$('saveChanges').onclick=()=>saveEditorChanges(true);

async function startCampus(){
 if(location.protocol==='http:'){try{const geo=await fetch('./georreferencia.json',{cache:'no-store'});if(geo.ok){const candidate=await geo.json();if(campusNorth(candidate))georeference=candidate;}}catch{ /* El visor portátil mantiene su orientación de reserva. */ }}
 let notice='Listo: gira el modelo con el ratón.';
 if(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)){
  try{const response=await fetch('./campus_editado.json',{cache:'no-store'});if(response.ok){data=validateCampus(await response.json());notice='Se cargaron tus últimos cambios guardados.';}}
  catch(e){notice='No se pudieron cargar los datos guardados. Se muestra la base; revisa el archivo antes de guardar.';}
 }
 let routes=structuredClone(BASE_ROUTES);if(location.protocol==='http:'){try{const response=await fetch('./rutas.json',{cache:'no-store'});if(response.ok)routes=await response.json();}catch{notice+=' Se usa la red incorporada al visor.';}}
 data.version=8;savedData=JSON.stringify(data);generate();
 routeEditor=createRouteEditor({scene,canvas:renderer.domElement,getCamera:()=>camera,getData:()=>data,getGeo:()=>georeference,initial:routes,onDirty:updateSaveState,message,viewTop:()=>view('top'),busy:()=>isSaving,onEnable:()=>{if(editMode)setEditing(false);}});
 view('approved');resize();updateSaveState();message(notice);
}
startCampus();
const v=new THREE.Vector3();function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);const w=mount.clientWidth,h=mount.clientHeight;routeEditor?.paint(camera,w,h);for(const l of labels){v.copy(l.p).project(camera);l.el.style.display=(!focusMode||!$('serpentina').classList.contains('active')||['H','Serpentina II'].includes(l.el.textContent))&&v.z<1&&v.z>-1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1?'':'none';l.el.style.left=((v.x+1)*w/2)+'px';l.el.style.top=((-v.y+1)*h/2)+'px';}
 // Escala local en el plano del suelo: varía con cámara y perspectiva.
 const a=new THREE.Vector3(0,0,0).project(camera),b=new THREE.Vector3(50,0,0).project(camera);const px=Math.abs(b.x-a.x)*w/2;mount.querySelector('.scale').style.width=Math.max(2,px)+'px';$('scaleText').textContent='50 m aprox. · Referencia local en el centro del terreno';}
animate();

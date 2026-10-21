import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),app=fs.readFileSync(new URL('app.js',root),'utf8'),geo=JSON.parse(fs.readFileSync(new URL('georreferencia.json',root),'utf8'));
const scope={};vm.createContext(scope);vm.runInContext(app.slice(app.indexOf('function campusNorth('),app.indexOf('function view(mode)')),scope);
const north=scope.campusNorth(geo);assert.ok(north);assert.ok(Math.abs(Math.hypot(north.x,north.z)-1)<1e-12);assert.equal(scope.campusNorth(null),null);assert.equal(scope.campusNorth({...geo,superiorDerecha:geo.superiorIzquierda}),null);
const [ul,ur,ll]=[geo.superiorIzquierda,geo.superiorDerecha,geo.inferiorIzquierda],c=Math.cos(ul[0]*Math.PI/180),east=north.x*(ur[1]-ul[1])*c/geo.ancho+north.z*(ll[1]-ul[1])*c/geo.alto,up=north.x*(ur[0]-ul[0])/geo.ancho+north.z*(ll[0]-ul[0])/geo.alto;
assert.ok(Math.abs(east)<1e-14);assert.ok(up>0);assert.ok(app.includes('maxPolarAngle=THREE.MathUtils.degToRad(78)'));
const png=fs.readFileSync(new URL('plano_2d.png',root));assert.equal(png.readUInt32BE(16),geo.ancho);assert.equal(png.readUInt32BE(20),geo.alto);assert.ok(app.includes('xMin:-390,xMax:390,zMin:-150,zMax:170,pxPorMetro:2'));
console.log('Contrato compartido verificado: PNG y georreferencia compatibles; norte correcto y cámara sobre el horizonte.');

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const canonical=path.dirname(fileURLToPath(import.meta.url));
const replica='C:/Users/gabri/Downloads/1151055 Administracion/Proyecto/Modelo_3D_UAM';
const manifestPath=path.join(replica,'replica-manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
if(path.resolve(manifest.canonical)!==path.resolve(canonical)||path.resolve(manifest.replica)!==path.resolve(replica))throw Error('Las rutas del manifiesto no corresponden a esta réplica.');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pending=[],conflicts=[];
for(const [file,previous] of Object.entries(manifest.files)){
 if(path.basename(file)!==file)throw Error('Nombre no permitido en el manifiesto');
 const source=await fs.readFile(path.join(canonical,file));let target=null;
 try{target=await fs.readFile(path.join(replica,file));}catch(e){if(e.code!=='ENOENT')throw e;}
 const sourceHash=hash(source),targetHash=target?hash(target):null;
 if(targetHash!==null&&targetHash!==previous&&targetHash!==sourceHash)conflicts.push(file);
 pending.push({file,source,sourceHash});
}
if(conflicts.length)throw Error('La réplica tiene cambios propios; revisarlos antes de sincronizar: '+conflicts.join(', '));
if(!process.argv.includes('--check')){
 for(const p of pending){await fs.writeFile(path.join(replica,p.file),p.source);manifest.files[p.file]=p.sourceHash;}
 await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
}
console.log(process.argv.includes('--check')?'Comprobación correcta: no hay divergencias que perder.':'Réplica actualizada desde la fuente canónica; sin borrar archivos.');

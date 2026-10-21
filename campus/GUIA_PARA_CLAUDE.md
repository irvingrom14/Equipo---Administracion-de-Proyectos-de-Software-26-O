> Actualización 18 oct 2026: la fuente vigente está en C:/dev/navegacion-uam-equipo-00/campus y la memoria en ../MEMORIA_COMPARTIDA_CAMPUS.md. El visor guarda también plano_2d.png y existe georreferencia.json calibrada por Claude. Las menciones inferiores a ausencia de georreferencia describen la entrega original v8.

# Entrega técnica para Claude: campus UAM Azcapotzalco

Estado: visor y editor versión 8. Esta guía describe los archivos existentes; no incluye una integración Android/Flutter.

## Ubicación

Proyecto general: `C:\Users\gabri\Downloads\1151055 Administracion`

Carpeta del campus: `C:\Users\gabri\Downloads\1151055 Administracion\Proyecto\Modelo_3D_UAM`

El contenido de esta carpeta es el paquete de trabajo. Si Claude trabaja en otra computadora o un entorno remoto, hay que entregarle los archivos; la ruta de Windows y la dirección localhost no le dan acceso remoto.

## Archivos que debe conocer

- `Visor_UAM_autonomo.html`: visor/editor empaquetado. Incluye el código de la interfaz y las bibliotecas en el mismo HTML. Se genera a partir de las fuentes; no es el archivo recomendado para editar a mano.
- `index.html`: interfaz fuente, estilos y controles. Es la página que sirve la raíz `/`.
- `app.js`: construcción de geometría con Three.js, cámaras, selección, herramientas de edición, historial, carga de datos, imágenes y exportación GLB.
- `model-data.js`: exporta ORIGINAL, la definición base del campus: huellas, niveles, edificios, plazas, accesos, conexiones, estacionamientos y escala aproximada.
- `campus_base.json`: copia JSON de ORIGINAL producida por build.mjs. No contiene automáticamente los ajustes hechos en el visor.
- `campus_editado.json`: estado guardado por el usuario. Es el archivo que carga el visor al abrirse desde localhost. Tiene prioridad sobre ORIGINAL cuando está disponible y es válido.
- `UAM_Azcapotzalco.glb`: instantánea exportada de la geometría, materiales, jerarquía y metadatos. Para mostrar el campus con un visor compatible con GLB, este es el activo principal. El editor y las cámaras de la interfaz no están incluidos en él.
- `vendor/`: bibliotecas locales de Three.js, OrbitControls, GLTFExporter, TextureUtils y licencia. No requiere obtenerlas de una CDN.
- `server.mjs`: servidor de escritorio en 127.0.0.1:8768. Sirve archivos y recibe guardados. Requiere Node.js.
- `build.mjs`: reconstruye el HTML autónomo y campus_base.json. No exporta por sí solo un GLB actualizado.
- `Abrir_visor.cmd`: inicia el servidor con Node y abre el navegador. Si ya hay un servidor en el puerto, no se debe iniciar otro.
- `verificar.mjs` y `verificar-editor.mjs`: comprobaciones de la entrega base. Incluyen expectativas sobre distribución, niveles y ausencia de modificaciones de prueba; algunas dejarán de aplicar si el usuario cambia deliberadamente esos elementos.
- `Referencias/`: fotografías usadas como referencia, no necesarias para ejecutar el visor.
- `LEEME.md`: uso e historial. La parte superior es la vigente; las versiones inferiores describen estados anteriores.
- `Checkpoint_v7_2026-10-17_modelo_actual/`: respaldo anterior a añadir las herramientas de edición, con manifiesto SHA256.json. No es la aplicación actual v8.

## Cómo ejecutarlo

Desde PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\gabri\Downloads\1151055 Administracion\Proyecto\Modelo_3D_UAM'
node server.mjs
```

Luego abrir:

`http://127.0.0.1:8768/Visor_UAM_autonomo.html`

También existe la entrada modular `http://127.0.0.1:8768/`.

No hace falta instalar paquetes para este visor: las bibliotecas están en vendor. Node se usa para el servidor y para reconstruir el HTML. Un servidor genérico que solo sirva archivos no implementa las rutas de guardado.

## Cómo se construyó

Las primeras referencias fueron planos e imágenes. El modelo actual es geometría real generada por código, no una imagen a la que se aplica un efecto 3D. Las huellas se trazaron manualmente sobre el plano de referencia y se fueron corrigiendo con las fotografías, la toma aérea y las indicaciones del usuario.

app.js crea losas, muros, ventanas, cubiertas, vegetación, plazas y conexiones usando geometrías simples. Los detalles particulares incluyen el patio y torre de H, fachadas curvas de HO/HP hacia el estacionamiento, cubierta superior translúcida, refuerzos rojos de G, escultura aproximada y plataforma, escalinata y bandera de COSEI frente a la biblioteca I.

No es un levantamiento topográfico, BIM ni una reproducción arquitectónica exacta. El material translúcido y la escultura son interpretaciones visuales. No afirmar medidas certificadas.

## Coordenadas y datos

Una unidad de la escena representa aproximadamente un metro. El suelo usa X/Z y la altura usa Y. Muchas huellas y posiciones base están almacenadas en píxeles del plano de referencia, no directamente en metros.

Conversión actual:

```js
S = metersPerPixel; // 740 / 1670, aprox. 0.4431 m/píxel
X = (px - 895) * S;
Z = (py - 390) * S;
```

La altura de planta usada es storeyHeight = 3.3 m. No hay georreferenciación latitud/longitud ni una transformación calibrada con Google Maps. La vista Google Maps es una orientación de cámara.

Los elementos editables se registran con IDs persistentes: flag_COSEI, sculpture_G, parking_0, jacaranda_0 y árboles identificados por su posición de origen. Es importante conservar los IDs para no perder ajustes.

Los cambios del editor se almacenan en campus_editado.json:

- elementEdits: offsets X/Z en metros, rotation en radianes y, para estacionamientos, width/depth en metros. La interfaz muestra el giro en grados.
- extraParking: estacionamientos nuevos con ID y rectángulo base en coordenadas del plano.
- removedElements: IDs de elementos retirados.
- buildings: conserva niveles y desplazamientos de cada edificio.

Al reconstruir la escena, registerEditable aplica los cambios sobre la posición y el giro de origen. El visor no modifica el GLB directamente para editarlo: modifica datos y vuelve a generar geometría.

## Edición y guardado

Activar modo edición permite seleccionar y arrastrar elementos sobre el plano del suelo, colocarlos con un clic, introducir posición/giro y dibujar estacionamientos rectangulares con dos esquinas. Estos últimos admiten ajuste de ancho y fondo. Hay pasos opcionales de 0.5 m, quitar/restablecer y deshacer/rehacer hasta 40 estados de la sesión.

El editor no comprueba colisiones con edificios ni ajusta automáticamente la altura de los objetos al terreno. El asta conserva la altura de base de la plataforma COSEI.

Guardar cambios exporta el mundo con GLTFExporter y guarda GLB y JSON mediante el servidor:

- POST /guardar/glb -> UAM_Azcapotzalco.glb
- POST /guardar/json -> campus_editado.json
- POST /guardar/png -> Vista_actual.png, mediante el botón de imagen

El guardado de GLB y JSON consiste en dos peticiones sucesivas, no una transacción única. Revisar el resultado de ambas si se adapta este flujo.

Al iniciar desde localhost se intenta cargar campus_editado.json; si no existe, se usa ORIGINAL. Los datos se validan antes de generar el modelo. Sin servidor, al abrir el HTML como archivo, los botones descargan archivos y los datos se recuperan con Abrir datos guardados.

Guardar no crea checkpoints. El usuario guarda, revisa y después pide un checkpoint. La preferencia es conservar solo el checkpoint más reciente aceptado y retirar los anteriores de manera recuperable.

## Flujo de trabajo para continuar

1. Guardar desde el visor antes de tomar el estado del usuario como referencia.
2. Para cambiar la interfaz o la generación del modelo, editar index.html/app.js. Para corregir la base, revisar model-data.js.
3. Tener presente que campus_editado.json contiene una copia completa y tiene prioridad al iniciar: cambiar ORIGINAL no migra automáticamente un JSON guardado anteriormente. Si se modifica el esquema o las huellas, migrar esos datos conservando los ajustes del usuario.
4. Ejecutar node build.mjs después de cambiar las fuentes, para actualizar Visor_UAM_autonomo.html.
5. Abrir/recargar el visor, comprobar el resultado y pulsar Guardar cambios para actualizar el JSON y GLB. Ejecutar build.mjs no sustituye este paso.
6. Verificar visualmente y, cuando corresponda, con los comprobadores. No dejar elementos de prueba en los archivos entregados.

## Qué reutilizar para la app

Si la app solo debe mostrar y girar el campus, reutilizar el GLB exportado es el camino con menos dependencia del editor. Si debe conservar estas herramientas, reutilizar la interfaz y el generador web junto con el JSON, adaptando el guardado al almacenamiento de la app.

El servidor Node y localhost pertenecen al entorno de escritorio y no deben suponerse disponibles dentro de una aplicación móvil. No se ha realizado esa adaptación todavía. Cualquier visor que cargue solo el GLB tendrá la apariencia exportada, pero no las herramientas de edición de este HTML.

Para una entrega completa a Claude, compartir la carpeta Modelo_3D_UAM con fuentes, vendor, JSON y GLB. Para una demostración mínima del visor autónomo, compartir el HTML y el JSON guardado; para mostrar únicamente el modelo, compartir el GLB. Conservar la licencia de las bibliotecas al redistribuirlas.

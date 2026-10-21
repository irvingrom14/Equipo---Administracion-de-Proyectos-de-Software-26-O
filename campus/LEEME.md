# Herramientas de edición · Versión 8 (actual)

El checkpoint anterior a las herramientas es **Checkpoint_v7_2026-10-17_modelo_actual**. Fue verificado antes de comenzar y se conserva como único checkpoint. No se modificó su contenido.

## Uso

1. Abre el visor y pulsa **Activar modo edición**. Puedes usar COSEI · Biblioteca o Ver desde arriba para acercarte al lugar.
2. Selecciona la bandera, escultura, un árbol/palmera o un estacionamiento haciendo clic, o usa el filtro y la lista. Arrastra para mover; con Posición X/Z y Giro puedes afinar los valores. También puedes usar Colocar seleccionado con un clic.
3. Para crear aparcamiento, elige **Dibujar estacionamiento** y marca dos esquinas dentro del campus. Se crean cajones esquemáticos. Ajusta ancho, fondo y giro. No se comprueban colisiones con edificios: revisa visualmente su ubicación.
4. **Quitar elemento** retira el elemento. **Deshacer/Rehacer** recuperan cambios de esta sesión (hasta 40); Ctrl+Z / Ctrl+Y también funcionan fuera de los campos. Restablecer elemento devuelve posición, giro y tamaño a su estado inicial. Esc cancela un dibujo sin terminar.
5. **Guardar cambios** actualiza campus_editado.json y UAM_Azcapotzalco.glb. El visor servido localmente carga ese JSON al abrirse. Después avisa para crear un nuevo checkpoint; guardar no crea checkpoints ni los elimina.
6. Cierra el modo edición para volver a la navegación habitual. Los controles y la selección no se exportan en el GLB. Los edificios conservan su editor de niveles y desplazamiento, ahora con deshacer.

Sin servidor (al abrir el HTML directamente), los botones descargan archivos; usa Abrir datos guardados para recuperar tu JSON. El guardado local automático requiere el servidor que ya acompaña al proyecto. No se añadieron dependencias ni una adaptación para Android/Flutter.

La escala sigue siendo aproximada. Los estacionamientos de esta herramienta son rectangulares. Las herramientas no modifican la altura de los objetos; el asta conserva la cota de la plataforma COSEI.

---

# Actualización 7 · HO, HP, estacionamiento y G

HO y HP usan mayúsculas y sus fachadas curvas se orientan al estacionamiento, conservando sus cuatro niveles y conexiones con H. Se conectaron las áreas de estacionamiento detrás de H, sustituyendo la vegetación en ese espacio. G tiene refuerzos rojos en ambas fachadas largas y una interpretación aproximada de la escultura del lado de COSEI. Los botones G · Refuerzos y Estacionamiento · H permiten revisar los cambios.

Checkpoint vigente: **Checkpoint_v6_2026-10-17_antes_G_estacionamiento**, verificado con SHA-256. El anterior se envió a la Papelera. Las dimensiones y la escultura siguen siendo aproximaciones visuales.

# UAM Azcapotzalco: modelo 3D editable

## Plaza COSEI y biblioteca I · Versión 6 (historial)

Se añadió el asta con bandera mexicana frente a la biblioteca I, una plataforma elevada con escalinata, muretes, dos jardineras con asiento y palmeras sobre el lado de la plaza. La biblioteca sigue identificada como I; se refinó su frente acristalado hacia la plataforma. El botón COSEI · Biblioteca enfoca esta zona.

Las fotos están en Referencias/COSEI. El desnivel de 0.72 m, seis escalones, posiciones, dimensiones y mástil de 18 m son supuestos visuales ajustables, no medidas obtenidas de las fotos. La bandera tiene un emblema esquemático para lectura a esta escala. La imagen repetida proporcionada no se duplicó como referencia.

El checkpoint previo es **Checkpoint_v5_2026-10-17_antes_COSEI**. Se verificó antes de enviar el checkpoint v4 a la Papelera. Se mantiene únicamente el checkpoint más reciente, según la preferencia del usuario. Los apartados inferiores son historial.

## Hp y Ho según fotografías · Versión 5 (historial)

Las conexiones con H ahora son cuerpos integrados desde PB, con circulación en PB, primero y segundo, en lugar de puentes independientes a una sola altura. Se conservan cuatro niveles en los pabellones. Sus fachadas incorporan bandas curvas grises, remates terracota y un tercer piso bajo una cubierta translúcida con cerchas amarillas. El material real de la cubierta no está confirmado; se representa su apariencia, sin afirmar que sea acrílico. Medidas, posición exacta de las uniones y detalles siguen siendo aproximados.

El botón H · Ho · Hp permite inspeccionar estos cambios. Las tres fotos del usuario se conservan en Referencias/Hp_Ho. El checkpoint previo a esta edición es **Checkpoint_v4_2026-10-17_antes_Hp_Ho**, completo y con manifiesto SHA256. Los respaldos v1 y v2 anteriores se enviaron a la Papelera, de forma recuperable; el único checkpoint en esta carpeta es el v4. Las secciones siguientes describen el historial: las menciones a puentes aislados y respaldos antiguos ya no describen el estado actual.

## Pasillo integrado y Plaza Roja · Versión 4 (historial)

La versión 4 sustituye la representación de pasarela exterior de la versión 3: el pasillo P–K–H–E–C se aloja dentro de las huellas de las alas conectadas, con circulación en PB, piso 1 y piso 2 y galerías integradas en sus fachadas. Se suprimieron su cubierta y sus columnas exteriores independientes. Se prolongaron las alas para unir los bloques sin separaciones.

Se cerró el patio de Plaza Roja con las alas C, E, F y G, manteniendo grupos separados para editar cada edificio. Se añadieron ocho jacarandas esquemáticas con ramificación y copas de flores lilas y verdes, y pavimento rojizo con juntas discretas, a partir de la foto del usuario en Referencias/Plaza_Roja_jacarandas.png. Los árboles son una representación de la especie y el ambiente; su cantidad y ubicación son ilustrativas.

El checkpoint v2 previo al pasillo permanece intacto. Las secciones siguientes describen el historial de cambios; la descripción de la pasarela independiente en v3 ya no corresponde a la geometría actual.

## Pasillo P–K–H–E–C · Versión 3

Se añadió un pasillo continuo junto a las fachadas de P, K, H y E, hasta conectar con C, en PB y pisos 1 y 2. Incluye tres losas de circulación, columnas, barandales y una cubierta esquemática, con enlaces desde el pasillo a los edificios. El trazado y los tres niveles fueron confirmados por el usuario; ancho, materiales y detalles estructurales son aproximados. Las estaciones se vinculan a los edificios cuando estos se desplazan en el editor. Si se reducen los niveles de uno de los bloques, se representan solamente los niveles comunes disponibles.

El checkpoint previo al cambio es **Checkpoint_v2_2026-10-17_antes_pasillo**, que incluye el visor portátil, el GLB, datos, fuentes y un manifiesto SHA256. Su HTML portátil se puede abrir directamente para recuperar visualmente la versión anterior. No contiene el pasillo nuevo.

## Corrección de niveles y conexiones · Versión 2

H, Ho y Hp tienen PB + 3 pisos (cuatro niveles). Se representan dos puentes laterales en el segundo piso, interpretado como PB + 2: Ho–H y Hp–H. El recorrido entre Ho y Hp pasa por H. Las losas y barandales son esquemáticos; las alturas y anchos no se han medido. Los puentes siguen a sus edificios cuando se desplazan en el editor y se ocultan si se reduce alguno por debajo del piso de conexión.

W y el bloque identificado como P tienen tres niveles totales (PB + 2). Se mantuvieron los niveles previos de P1, P2, P3 y P4: la corrección se aplica al edificio P indicado por el usuario. W ya tenía tres niveles en los datos iniciales; se verificó que ese valor se conserve.

Se ajustó la envolvente de los pabellones girados Ho/Hp para que no invadan H. El respaldo anterior está en Respaldo_modelo_v1. El visor, los datos y el GLB actuales incorporan estas correcciones.

Esta es una primera maqueta geométrica del campus. Ya permite girar la cámara sin regenerar imágenes ni modificar los edificios al cambiar de ángulo. Es más sencilla visualmente que las ilustraciones anteriores.

## Abrir

Haz doble clic en **Visor_UAM_autonomo.html**. El archivo incluye las bibliotecas y los datos, y funciona sin conexión en un navegador moderno con WebGL. No hace falta instalar un programa de modelado.

Alternativa: abre **Abrir_visor.cmd**. Utiliza Node.js, ya disponible en este equipo, para abrir el visor en http://127.0.0.1:8768. Esta modalidad guarda las exportaciones directamente en esta carpeta. Si ya hay un visor abierto, puedes utilizar esa misma dirección. El servidor escucha únicamente en este equipo.

## Controles

- Arrastra con el botón izquierdo para girar, usa la rueda para acercarte y el botón derecho para desplazar.
- Usa Vista aprobada, Google Maps y Plano superior para cambiar la cámara sobre la misma geometría.
- Ampliar vista oculta el panel; Mostrar controles lo recupera.
- Árboles, etiquetas y retícula se pueden mostrar u ocultar.
- Selecciona un edificio por clic o por la lista para modificar sus niveles y desplazarlo. Los cambios se aplican en el visor; guarda los datos para conservarlos.
- Guardar imagen exporta el ángulo actual como PNG, con las etiquetas visibles.

## Archivos

- **UAM_Azcapotzalco.glb**: modelo 3D real en glTF binario, con 26 grupos de edificios identificados, vegetación, terreno, canchas y accesos. Se puede importar en Blender y otros visores compatibles. Las etiquetas del visor son superposiciones; los objetos GLB conservan sus nombres.
- **campus_base.json**: datos iniciales de las huellas, pisos, plazas y entradas.
- **campus_editado.json**: copia guardada durante la verificación. H permanece en cuatro niveles. Se puede abrir desde el visor.
- **model-data.js**: fuente del trazado inicial sobre la v7.
- **app.js / index.html**: visor y construcción del modelo.
- **Visor_UAM_autonomo.html**: versión portátil en un solo archivo.

Las modificaciones del visor no reescriben automáticamente el archivo portátil ni las fuentes. Para seguir editando, guarda el JSON y vuelve a cargarlo desde Abrir datos guardados. Para modificar permanentemente la fuente inicial, edita model-data.js y ejecuta `node build.mjs`. El GLB guarda la geometría exportada, pero no los controles del visor.

## Alcance y referencias

Se trazaron huellas manualmente sobre el **plano 2D v7 aprobado**, que continúa intacto en ../Mapas_UAM_Azcapotzalco/Referencia_aprobada_v7. No se hizo una reconstrucción fotogramétrica automática ni se obtuvo geometría 3D de Google Maps.

Las unidades son metros aproximados, con calibración global de 740 m / 1670 píxeles del frente de la imagen. Esta relación conserva la aproximación anterior; no es una escala topográfica ni garantiza dimensiones individuales. Los bloques académicos principales usan PB + 3 pisos, con 3.3 m por nivel como supuesto ajustable. Otros edificios y naves son simplificados. T no tiene salida exterior hacia Eje 5 Norte; J se mantiene junto a L y se conserva la plaza libre frente al H.

Se pueden seguir ajustando huellas, fachadas, alturas y vegetación a partir de nuevas referencias. Esta versión fija una base consistente para hacerlo una sola vez, en lugar de generar cada vista por separado.

## Verificación realizada

Se comprobó en el navegador el renderizado, las vistas de cámara, el giro por arrastre, la selección del H, el cambio de sus niveles y su restitución a cuatro, el guardado de datos y la exportación a GLB. El GLB se revisó como glTF 2, con los 26 grupos de edificios y metadatos del H con cuatro niveles. El archivo portátil se comprobó servido localmente; no requiere recursos externos.

## Bibliotecas

Three.js 0.160.1 (MIT); licencia en vendor/LICENSE_three.txt. Documentación: https://threejs.org/docs/ . Se incluyen OrbitControls y GLTFExporter. Los archivos de biblioteca se conservan localmente para evitar dependencias de red durante el uso.

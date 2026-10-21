# Red peatonal de Azcapotzalco · PB

`rutas.json` sustituye completa la red provisional de Claude. Contrato versión 1, unidad `azcapotzalco`, aristas **no dirigidas**. Entrega inicial: **115 nodos, 120 aristas, 31 destinos, un componente**. No se modifica el diseño de edificios ni los planos de las otras unidades.

Se trazó sobre el croquis canónico: centros de caminos representados, ejes de plazas, borde de estacionamientos y franjas de galería abierta en PB. No es un levantamiento de puertas, anchos, pavimentos o accesibilidad. La ubicación exacta de cada entrada sigue siendo aproximada y se puede ajustar en el editor. No se toma el centro del edificio como entrada ni se usa la red provisional como base geométrica.

## Destinos y circulación

Un destino por cada uno de los 26 edificios **existentes en el croquis**: A, B, C, D, E, F, G, H, HO, HP, I, J, K, L, M, O, P, P1, P2, P3, P4, Q, R, S, T y W. No se inventan edificios para completar letras ausentes. Se añaden `COSEI`, `PLAZA_ROJA` y `ACCESO_P1`, `ACCESO_P2`, `ACCESO_P3`. Estos últimos no se confunden con los edificios P1/P2/P3. I se identifica como biblioteca y J como cafetería. A termina en el límite exterior de la zona de obra, con su tramo marcado no accesible.

La red cubre las tres entradas peatonales, circulación exterior principal, plazas y galerías E–H–K–P, acceso a C desde E y conexiones hacia los sectores oeste, estacionamientos y edificios de talleres. Se rodea el campo de fútbol y se pasa por la franja entre éste y las canchas. No se crea una salida del T hacia Eje 5 Norte. No se promueven los tres accesos vehiculares a destinos peatonales.

En COSEI se representa la escalera que ya existe en el modelo, con `tipo: escalera` y `accesible: false`, antes de alcanzar la entrada de I. No se inventa una rampa o elevador. Los demás tramos de exterior/galería sin barrera representada llevan accesibilidad **estimada**; no es certificación de una ruta para silla de ruedas. Los nodos son de PB (`nivel: 0`); no se trazan rutas por pisos superiores ni conexiones verticales nuevas.

## Edificios y galerías

El comprobador detecta intersecciones con los **cuerpos cerrados** de los edificios. Deriva los obstáculos del mismo JSON y de la misma construcción usada por `building()` del visor, con desplazamientos y giro de los pabellones HO/HP. Para E, K, P y la parte sur de H, la franja libre de galería de PB se calcula con el ancho que ya representa el modelo: `min(2.8 m, 32% del fondo)`. Esa franja abierta no se trata como un muro. Las entradas pueden terminar en la cara del edificio; no penetran su cuerpo cerrado.

Así los pasillos pueden aparecer sobre la huella techada de E/H/K/P en un plano superior, pero no atraviesan su volumen cerrado. No hay una excepción general para aristas llamadas «pasillo»: un tramo de ese tipo que corte una habitación o el cuerpo de L también se rechaza. Los pilares, jardineras, estado del suelo y anchos libres requieren revisión de campo. La red se conserva prudente frente a cuerpos que el croquis todavía muestra cerrados, de modo que algunas rutas dan rodeos y no garantizan el recorrido real más corto.

## Coordenadas y metros

X/Z son metros del modelo, Y vertical, con la transformación heredada `(px-895, py-390) * metersPerPixel`. El PNG conserva **1560×640**, marco **X [-390,390], Z [-150,170]**, sin giro o recorte nuevos.

Se usa exactamente `georreferencia.json`:

```
u = (x + 390) / 780
v = (z + 150) / 320
latLon = superiorIzquierda
       + u * (superiorDerecha - superiorIzquierda)
       + v * (inferiorIzquierda - superiorIzquierda)
```

No se invierte el PNG ni se aplica otra rotación a las coordenadas. Cada tramo guarda `metros` como distancia horizontal terrestre aproximada entre sus extremos calibrados, usando latitud/longitud local y radio terrestre medio. No es simplemente la distancia X/Z sin calibrar: el ajuste geográfico de AZC incluye una escala próxima a 1,09. No se mide longitud 3D de peldaños ni pendientes. Se conserva la incertidumbre del croquis/georreferencia (orden de varios metros), no precisión topográfica por escribir ocho decimales.

## Editar en el visor

La sesión de revisión está abierta en **http://127.0.0.1:8780/Visor_UAM_autonomo.html**, sirviendo esta misma carpeta. El servidor previo en 8768 sigue abierto con su manejador anterior; reiniciarlo antes de usar allí el guardado de rutas. En un inicio nuevo, `node server.mjs` sigue usando 8768 por defecto; puede elegirse otro puerto con la variable PORT.

1. En «Red peatonal · PB», activar «Ver nodos y caminos» o «Editar red de caminos». La edición cambia a vista superior y desactiva la edición de objetos del campus.
2. Seleccionar un nodo o tramo con un clic o en las listas. Naranja: entrada; violeta: acceso; azul: cruce; amarillo: seleccionado. Escalera violeta; tramos no accesibles discontinuos. Los marcadores conservan tamaño legible al acercar/alejar.
3. Mover el nodo con X/Z o con la herramienta «Mover nodo». Al aplicar se recalculan lat/lon y los metros de sus aristas. Los movimientos inválidos se revierten.
4. «Añadir nodo» sobre un tramo lo divide manteniendo tipo y accesibilidad. Fuera de un tramo añade un nodo que deberá conectarse antes de guardar. «Unir dos nodos» necesita seleccionar ambos; no salta por encima de cruces intermedios sin conectar.
5. Cambiar tipo/accesibilidad del tramo o asignar un destino al nodo seleccionado. Para quitar un nodo que contiene un destino, reasignar primero ese destino.
6. Deshacer/rehacer red usa su propio historial. «Comprobar red» muestra problemas. Se puede abrir otro rutas.json válido.
7. **Guardar cambios** valida la red antes de escribir y exporta `rutas.json` junto con los archivos del campus. Una desconexión o corte de cuerpo cerrado impide guardar. El servidor vuelve a validar las rutas recibidas.

La red es una capa de edición, **no se hornea en el GLB ni en plano_2d.png**. La aplicación de Claude dibuja las rutas sobre sus mapas/planos. `Guardar cambios` también regenera `UAM_Azcapotzalco_sin_marca.glb` y `plano_2d_sin_marca.png` sin cambiar la preferencia guardada de copyright. «Guardar datos editables» guarda JSON y rutas, sin regenerar los assets visuales.

`rutas.json` es la fuente editable al iniciar por HTTP. `route-data.js` lleva una copia y la georreferencia para el HTML autónomo; `node build.mjs` la actualiza desde los JSON actuales. No se deben mantener dos redes manualmente. `generar-rutas.mjs` contiene el trazado inicial reproducible: por defecto sólo comprueba; `--write` **sustituye** la red por ese trazado inicial y no debe usarse para conservar ajustes hechos después en el visor.

## Verificar e integrar

Desde la raíz del repositorio: `node verificar-rutas.mjs`. Comprueba contrato, IDs, referencias, destinos, conectividad, intersecciones, coherencia geográfica y distancias, edificios/georreferencia conservados y plano sin cambio de tamaño. Incluye casos que deben fallar y recorridos de prueba por todos los destinos. También verifica que la capa de edición no viaje en los GLB y que la variante sin marca no tenga copyright.

La marca de AZC se orientó al norte calibrado (giro del texto ≈ -170,67°), sin girar el plano ni sus esquinas. El verificador comprueba la dirección de los 33 paneles exportados, no sólo su etiqueta. El PNG sin marca sigue siendo idéntico píxel a píxel al anterior; en el marcado sólo cambia la orientación del texto. Pendiente confirmar su presentación en la app de Claude.

Para Claude: las claves del contrato se mantienen. Sustituir el archivo provisional por `campus/rutas.json` de esta rama; no ejecutar otra vez `red_provisional.py` sobre esta entrega. Copiar también los assets de AZC actualizados con/sin marca. Las apps no se modificaron. Repetir pruebas de origen por GPS, selección de destinos, 2D/Mapa y cambio de sede. La aceptación visual y las correcciones de campo siguen pendientes; esta entrega no añade rutas AR ni rutas para las otras cuatro unidades.

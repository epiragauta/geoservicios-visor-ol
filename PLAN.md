# Prototipo básico con OpenLayers: plan

## 1. ¿Framework (React/Vue) o JavaScript sin framework?

**Decisión: sin framework (JavaScript con módulos ES y Vite como herramienta de desarrollo).**

| Criterio | Sin framework | React / Vue |
|---|---|---|
| Curva de aprendizaje para un grupo básico | Solo JS + API de OpenLayers | JS + OpenLayers + componentes, estado, ciclo de vida, JSX/SFC |
| Encaje con OpenLayers | Directo: OL ya gestiona su propio estado (capas, vista, overlays) | Hay que "envolver" el mapa (useEffect/onMounted, refs, evitar dobles renders) y sincronizar dos estados |
| Tamaño del prototipo | Un mapa y 3-4 paneles: no hay UI compleja que justifique componentes | Su ventaja aparece con muchas vistas, formularios, rutas o estado compartido |
| Depuración | Lo que se ve es lo que se ejecuta | Capas extra (virtual DOM, reactividad) que confunden al principiante |
| Ejemplos oficiales de OL | Escritos en JS sin framework, se copian casi tal cual | Hay que adaptarlos |

Un framework vale la pena **más adelante** si el prototipo crece hacia una aplicación con varias pantallas, autenticación, formularios de edición, tablas de atributos sincronizadas con el mapa, etc. En ese punto recomendaría **Vue** (curva más suave para un grupo básico). Como el código ya está escrito en módulos ES con Vite, la migración será sencilla: `npm create vite` ofrece plantillas de Vue y React.

**¿Por qué Vite y no un `<script>` de CDN como en el ejemplo Leaflet?** Es la forma documentada por OpenLayers (`npm i ol` + `import`), permite usar `proj4` y da servidor local con recarga automática. Además resuelve el problema de abrir `index.html` con doble clic, porque así `fetch()` del GeoJSON falla.

## 2. Referencia analizada (`C:\tmp\ws\webapp`, Leaflet)

Lo que hace y que se replica en OpenLayers:

| Leaflet | OpenLayers |
|---|---|
| `L.map(...).setView([lat, lon], z)` | `new Map({ view: new View({ center: fromLonLat([lon, lat]), zoom }) })` (**ojo: orden lon, lat**) |
| `L.tileLayer(osm)` | `new TileLayer({ source: new OSM() })` |
| `L.tileLayer(esri)` | `new TileLayer({ source: new XYZ({ url }) })` |
| `L.tileLayer.wms(url, { layers })` | `new TileLayer({ source: new TileWMS({ url, params: { LAYERS } }) })` |
| `L.geoJSON(data, { style })` | `new VectorLayer({ source: new VectorSource({ url, format: new GeoJSON() }), style })` |
| `bindPopup` | `Overlay` + `map.on('singleclick')` + `forEachFeatureAtPixel` |
| `mouseover/mouseout` + `setStyle` | `map.on('pointermove')` + función de estilo |
| `fitBounds` | `view.fit(extent)` |
| `L.control.layers` | Panel HTML propio (OL no trae control de capas; existe `ol-layerswitcher` como plugin) |
| `L.control.scale` | `ScaleLine` |
| `L.control` (info, buscador) | `div` HTML posicionados con CSS |

Problemas detectados en la referencia (para no arrastrarlos):

1. `app.js` líneas 196-206 usan `feature` y `layer` fuera de cualquier función, lo que provoca un `ReferenceError` al cargar.
2. `assets/images/marker-icon.png` no existe y el marcador personalizado sale roto. Además, hay dos marcadores en Bogotá.
3. `css/style.css` está vacío: los estilos están dentro de `index.html`.
4. La atribución dice "IGAC / GeoServer", pero el servicio es un ArcGIS MapServer del **DANE** (MGN 2024).
5. El GeoJSON está en **EPSG:4686 (MAGNA-SIRGAS)**. Leaflet lo ignora y lo trata como WGS84. OpenLayers sí lee el `crs` y hay que registrar 4686 con `proj4`. Es un buen punto didáctico sobre proyecciones en Colombia.

## 3. Estructura del proyecto

```
tutorial-ol/
├── index.html                  # contenedor del mapa y paneles HTML
├── package.json                # ol, proj4, vite
├── public/datos/departamentos.geojson
└── src/
    ├── main.js                 # toda la lógica, en secciones numeradas
    └── style.css
```

## 4. Fases (cada una puede ser una sesión del tutorial)

| # | Fase | Conceptos | Sección en `main.js` |
|---|---|---|---|
| 0 | Entorno: Node LTS, `npm install`, `npm run dev` | npm, Vite, módulos ES | — |
| 1 | Primer mapa con OSM | `Map`, `View`, `TileLayer`, proyección 3857, `fromLonLat` | 2, 5 |
| 2 | Capas base y WMS del DANE | `XYZ`, `TileWMS`, parámetros WMS | 2, 3 |
| 3 | Datos vectoriales GeoJSON | `VectorSource`, `GeoJSON`, `Style`, EPSG:4686 con `proj4`, `view.fit` | 1, 4, 5 |
| 4 | Interacción | eventos `pointermove`/`singleclick`, `forEachFeatureAtPixel`, `Overlay` | 6, 7 |
| 5 | Controles de UI | control de capas propio, `ScaleLine`, panel info | 8 |
| 6 | Buscador | recorrer features, normalizar texto (tildes) | 9 |
| 7 (opcional) | Extras | marcadores con `Icon`, coordenadas del cursor (`MousePosition`), `GetFeatureInfo` sobre el WMS, municipios en GeoJSON | — |

## 5. Cómo ejecutarlo

```powershell
winget install OpenJS.NodeJS.LTS     # una sola vez; luego reabrir la terminal
cd C:\ws\UJdeC\tutorial-ol
npm install
npm run dev                          # abre http://localhost:5173
```

`npm run build` genera `dist/`, una carpeta estática que se puede publicar en cualquier servidor web.

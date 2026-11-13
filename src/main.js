// =====================================================================
// Prototipo OpenLayers: Colombia - departamentos y municipios
// Equivalente en OpenLayers del ejemplo Leaflet de referencia.
// =====================================================================

import 'ol/ol.css';
import './style.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Overlay from 'ol/Overlay.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import XYZ from 'ol/source/XYZ.js';
import TileWMS from 'ol/source/TileWMS.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Style, Fill, Stroke } from 'ol/style.js';
import { ScaleLine, defaults as defaultControls } from 'ol/control.js';
import { fromLonLat } from 'ol/proj.js';
import { register } from 'ol/proj/proj4.js';
import { getCenter } from 'ol/extent.js';
import proj4 from 'proj4';

// ---------------------------------------------------------------------
// 1. Proyección MAGNA-SIRGAS (EPSG:4686)
// El GeoJSON declara "crs": "urn:ogc:def:crs:EPSG::4686". OpenLayers solo
// conoce EPSG:4326 y EPSG:3857 de fábrica; si no registramos 4686, los
// polígonos no se reproyectan y aparecen en (0,0).
// ---------------------------------------------------------------------
proj4.defs('EPSG:4686', '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs');
proj4.defs('urn:ogc:def:crs:EPSG::4686', proj4.defs('EPSG:4686'));
register(proj4);

// ---------------------------------------------------------------------
// 2. Capas base (solo una visible a la vez)
// Las propiedades "title" y "type" son nuestras: OpenLayers las guarda
// y las leemos luego con capa.get('title').
// ---------------------------------------------------------------------
const osm = new TileLayer({
    title: 'OpenStreetMap',
    type: 'base',
    source: new OSM(),
});

const satelite = new TileLayer({
    title: 'Satélite',
    type: 'base',
    visible: false,
    source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles &copy; Esri',
        maxZoom: 19,
    }),
});

// ---------------------------------------------------------------------
// 3. Capas WMS del DANE (Marco Geoestadístico Nacional 2024)
// ---------------------------------------------------------------------
const DANE_WMS = 'https://geoportal.dane.gov.co/mparcgis/services/MGN2024/Serv_CapasMGN_2024/MapServer/WMSServer';

function crearCapaWMS(titulo, nombreCapa, visible) {
    return new TileLayer({
        title: titulo,
        visible,
        source: new TileWMS({
            url: DANE_WMS,
            params: { LAYERS: nombreCapa }, // FORMAT=image/png y TRANSPARENT=true son los valores por defecto
            attributions: 'DANE - MGN 2024',
        }),
    });
}

const departamentosWMS = crearCapaWMS('Departamentos (WMS)', '8', true);
const municipiosWMS = crearCapaWMS('Municipios (WMS)', '7', false);

// ---------------------------------------------------------------------
// 4. Capa vectorial GeoJSON con estilo normal y resaltado
// ---------------------------------------------------------------------
const estiloNormal = new Style({
    stroke: new Stroke({ color: '#232323', width: 2 }),
    fill: new Fill({ color: 'rgba(232, 248, 129, 0.5)' }),
});

const estiloResaltado = new Style({
    stroke: new Stroke({ color: '#666', width: 5 }),
    fill: new Fill({ color: 'rgba(232, 248, 129, 0.7)' }),
    zIndex: 1, // se dibuja encima de los vecinos (como bringToFront en Leaflet)
});

let featureResaltado = null;

const departamentos = new VectorLayer({
    title: 'Departamentos (GeoJSON)',
    source: new VectorSource({
        url: 'datos/departamentos.geojson', // servido desde la carpeta public/
        format: new GeoJSON(),
    }),
    // Función de estilo: se evalúa para cada feature en cada redibujado
    style: (feature) => (feature === featureResaltado ? estiloResaltado : estiloNormal),
});

// ---------------------------------------------------------------------
// 5. Mapa
// OpenLayers trabaja en EPSG:3857 por defecto: las coordenadas lon/lat
// se convierten con fromLonLat (¡ojo: orden lon, lat!).
// ---------------------------------------------------------------------
const map = new Map({
    target: 'map',
    layers: [osm, satelite, departamentosWMS, municipiosWMS, departamentos],
    view: new View({
        center: fromLonLat([-74.2973, 4.5709]),
        zoom: 6,
    }),
    controls: defaultControls().extend([new ScaleLine({ units: 'metric' })]),
});

// Cuando el GeoJSON termina de cargar, encuadramos el mapa en sus datos
const fuenteDepartamentos = departamentos.getSource();
fuenteDepartamentos.once('featuresloadend', () => {
    map.getView().fit(fuenteDepartamentos.getExtent(), { padding: [20, 20, 20, 20] });
});
fuenteDepartamentos.on('featuresloaderror', () => {
    console.error('Error cargando datos/departamentos.geojson');
});

// ---------------------------------------------------------------------
// 6. Popup (Overlay = elemento HTML anclado a una coordenada del mapa)
// ---------------------------------------------------------------------
const popupElemento = document.getElementById('popup');
const popupContenido = document.getElementById('popup-contenido');

const popup = new Overlay({
    element: popupElemento,
    autoPan: { animation: { duration: 250 } },
});
map.addOverlay(popup);

function mostrarPopup(feature, coordenada) {
    popupContenido.innerHTML = `
        <strong>${feature.get('dpto_cnmbr')}</strong><br>
        Código: ${feature.get('dpto_ccdgo')}
    `;
    popup.setPosition(coordenada);
}

function cerrarPopup() {
    popup.setPosition(undefined);
}

document.getElementById('popup-cerrar').addEventListener('click', (e) => {
    e.preventDefault();
    cerrarPopup();
});

function zoomAFeature(feature) {
    map.getView().fit(feature.getGeometry().getExtent(), {
        duration: 500,
        padding: [40, 40, 40, 40],
    });
}

// Devuelve el departamento bajo un píxel de pantalla (o undefined)
function departamentoEnPixel(pixel) {
    return map.forEachFeatureAtPixel(pixel, (f) => f, {
        layerFilter: (capa) => capa === departamentos,
    });
}

// ---------------------------------------------------------------------
// 7. Interacción: resaltar al pasar el mouse, popup + zoom al hacer clic
// ---------------------------------------------------------------------
map.on('pointermove', (evt) => {
    if (evt.dragging) return;
    const feature = departamentoEnPixel(evt.pixel) ?? null;
    if (feature !== featureResaltado) {
        featureResaltado = feature;
        departamentos.changed(); // fuerza a recalcular los estilos
    }
    map.getTargetElement().style.cursor = feature ? 'pointer' : '';
});

map.on('singleclick', (evt) => {
    const feature = departamentoEnPixel(evt.pixel);
    if (!feature) {
        cerrarPopup();
        return;
    }
    mostrarPopup(feature, evt.coordinate);
    zoomAFeature(feature);
});

// ---------------------------------------------------------------------
// 8. Control de capas (HTML propio construido a partir de las capas)
// ---------------------------------------------------------------------
function construirControlCapas() {
    const contenedorBase = document.getElementById('capas-base');
    const contenedorSuperpuestas = document.getElementById('capas-superpuestas');

    map.getLayers().forEach((capa) => {
        const esBase = capa.get('type') === 'base';

        const input = document.createElement('input');
        input.type = esBase ? 'radio' : 'checkbox';
        input.name = esBase ? 'capa-base' : capa.get('title');
        input.checked = capa.getVisible();

        input.addEventListener('change', () => {
            if (esBase) {
                // Solo una capa base visible
                map.getLayers().forEach((otra) => {
                    if (otra.get('type') === 'base') otra.setVisible(otra === capa);
                });
            } else {
                capa.setVisible(input.checked);
            }
        });

        const label = document.createElement('label');
        label.append(input, ' ', capa.get('title'));
        (esBase ? contenedorBase : contenedorSuperpuestas).append(label);
    });
}

construirControlCapas();

// ---------------------------------------------------------------------
// 9. Buscador de departamentos (ignora mayúsculas y tildes)
// ---------------------------------------------------------------------
const buscarTexto = document.getElementById('buscar-texto');
const buscarMensaje = document.getElementById('buscar-mensaje');

function normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function buscarDepartamento() {
    const texto = normalizar(buscarTexto.value);
    buscarMensaje.textContent = '';
    if (!texto) return;

    const encontrado = fuenteDepartamentos
        .getFeatures()
        .find((f) => normalizar(f.get('dpto_cnmbr')).includes(texto));

    if (!encontrado) {
        buscarMensaje.textContent = 'No se encontró ningún departamento.';
        return;
    }
    zoomAFeature(encontrado);
    mostrarPopup(encontrado, getCenter(encontrado.getGeometry().getExtent()));
}

document.getElementById('buscar-boton').addEventListener('click', buscarDepartamento);
buscarTexto.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarDepartamento();
});

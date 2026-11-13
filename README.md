# Visor de geoservicios con OpenLayers

Prototipo básico de visor web con [OpenLayers](https://openlayers.org/). Muestra departamentos y municipios de Colombia con:

- Mapas base: OpenStreetMap y satélite (Esri).
- Capas WMS del DANE (Marco Geoestadístico Nacional 2024).
- Departamentos en GeoJSON: se resaltan al pasar el mouse y, al hacer clic, abren un popup y hacen zoom.
- Control de capas, escala, panel informativo y buscador de departamentos.

Está hecho en JavaScript sin framework, con [Vite](https://vite.dev/) como servidor de desarrollo. La justificación y las fases del tutorial están en [PLAN.md](PLAN.md).

## Requisitos

- [Node.js](https://nodejs.org/) **20.19 o superior** (se recomienda la versión LTS), que incluye `npm`
- [Git](https://git-scm.com/)
- Conexión a internet (los mapas base y el WMS se cargan desde servicios externos)

### Instalar Node.js

**Windows** (PowerShell):

```powershell
winget install OpenJS.NodeJS.LTS
```

**macOS** (Homebrew):

```bash
brew install node
```

**Linux**: use el gestor de paquetes de su distribución o [nvm](https://github.com/nvm-sh/nvm).

Después de instalarlo, **cierre y vuelva a abrir la terminal** y verifique:

```bash
node -v
npm -v
```

## Instalación

```bash
git clone https://github.com/epiragauta/geoservicios-visor-ol.git
cd geoservicios-visor-ol
npm install
```

`npm install` descarga las dependencias (`ol`, `proj4` y `vite`) en la carpeta `node_modules/`.

## Ejecución

```bash
npm run dev
```

Abra en el navegador la dirección que aparece en la terminal, normalmente <http://localhost:5173>. Los cambios en el código se recargan automáticamente. Para detener el servidor, pulse `Ctrl + C`.

## Generar versión para publicar

```bash
npm run build     # genera la carpeta dist/
npm run preview   # sirve dist/ localmente para revisarla
```

La carpeta `dist/` contiene archivos estáticos que se pueden subir a cualquier servidor web (Apache, Nginx, GitHub Pages, etc.).

## Estructura

```
├── index.html                       # contenedor del mapa y paneles HTML
├── package.json                     # dependencias y scripts
├── public/datos/departamentos.geojson
├── src/
│   ├── main.js                      # lógica del mapa, en secciones numeradas
│   └── style.css                    # estilos
└── PLAN.md                          # evaluación, plan y fases del tutorial
```

## Problemas frecuentes

| Problema | Solución |
|---|---|
| `node` o `npm` "no se reconoce como nombre de un cmdlet" | Cierre y vuelva a abrir la terminal después de instalar Node.js. Si persiste, reinicie la sesión de Windows. |
| En PowerShell: "la ejecución de scripts está deshabilitada" al usar `npm` | Ejecute una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| La página sale en blanco al abrir `index.html` con doble clic | El proyecto debe servirse con `npm run dev`; abierto como archivo, el navegador bloquea los módulos y la carga del GeoJSON. |
| Los departamentos aparecen en el océano, cerca de (0,0) | No se registró la proyección EPSG:4686. Revise la sección 1 de `src/main.js`. |
| Las capas WMS tardan o no cargan | Dependen del servicio del DANE. Verifique la conexión o pruebe más tarde. |
| El puerto 5173 está ocupado | Vite usará el siguiente puerto libre. Use la dirección que indique la terminal. |

## Datos y créditos

- Límites departamentales y servicio WMS: [DANE – Geoportal](https://geoportal.dane.gov.co/), MGN 2024
- Mapa base: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Imágenes satelitales: © Esri

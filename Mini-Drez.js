import * as THREE from 'three';

/* ══════════════════════════════════════════════
   PALETA SEGA GENESIS
   ══════════════════════════════════════════════ */
const PAL = {
  tileDark : 0x2a2f6b,   // azul índigo profundo
  tileLight: 0xe9d8a6,   // crema dorado
  base     : 0x11142e,   // azul noche
  neon     : 0x2fd4d4,   // cian
  gold     : 0xf2c96b
};

/* ══════════════════════════════════════════════
   RENDERER — baja resolución + escalado pixelado
   ══════════════════════════════════════════════ */
const stage = document.getElementById('stage');
const PIXEL_SCALE = 0.30;

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.style.imageRendering = 'pixelated';
stage.appendChild(renderer.domElement);

/* ══════════════════════════════════════════════
   ESCENA Y CÁMARA
   ══════════════════════════════════════════════ */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

let theta  = 0.62;        
const PHI  = 0.955;       // Inclinación FIJA 2.5D
let radius = 20.0;        // Cámara alejada para encuadrar el tablero 5x8

const target = new THREE.Vector3(0, -0.3, 0);

function updateCamera(){
  camera.position.set(
    target.x + radius * Math.sin(PHI) * Math.sin(theta),
    target.y + radius * Math.cos(PHI),
    target.z + radius * Math.sin(PHI) * Math.cos(theta)
  );
  camera.lookAt(target);
}

/* ══════════════════════════════════════════════
   LUCES
   ══════════════════════════════════════════════ */
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x1a0f2e, 0.70));

const key = new THREE.DirectionalLight(0xfff4e0, 1.75);
key.position.set(6, 11, 7);
scene.add(key);

const fill = new THREE.DirectionalLight(0x6a7cff, 0.65);
fill.position.set(-8, 5, -7);
scene.add(fill);

const cyanLight = new THREE.PointLight(0x00e5e5, 45, 20, 2);
cyanLight.position.set(-6.5, 2.6, -5.5);
scene.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff3f9f, 35, 20, 2);
magentaLight.position.set(7, 1.8, 5.5);
scene.add(magentaLight);

/* ══════════════════════════════════════════════
   TABLERO 5x8 (8 columnas X, 5 filas Z)
   ══════════════════════════════════════════════ */
const board = new THREE.Group();
scene.add(board);

const COLS = 8;  // Eje X
const ROWS = 5;  // Eje Z
const TILE = 1;
const GAP  = 0.06;
const STEP = TILE + GAP;
const TILE_H = 0.26;

// Centrado del tablero
const HALF_X = (COLS - 1) / 2;
const HALF_Z = (ROWS - 1) / 2;

const tileGeo = new THREE.BoxGeometry(TILE, TILE_H, TILE);

const matDark = new THREE.MeshStandardMaterial({
  color: PAL.tileDark, roughness: 0.62, metalness: 0.18
});
const matLight = new THREE.MeshStandardMaterial({
  color: PAL.tileLight, roughness: 0.55, metalness: 0.05
});

// Array para guardar referencia de las casillas a futuro (útil para las piezas)
const gridTiles = [];

for (let x = 0; x < COLS; x++){
  for (let z = 0; z < ROWS; z++){
    const isDark = (x + z) % 2 === 1;
    const tile = new THREE.Mesh(tileGeo, isDark ? matDark : matLight);
    
    // Posición exacta en el mundo 3D
    const posX = (x - HALF_X) * STEP;
    const posZ = (z - HALF_Z) * STEP;
    
    tile.position.set(posX, -TILE_H / 2, posZ);
    
    // Guardamos los datos por si los necesitas para la lógica de las piezas
    tile.userData = { gridX: x, gridZ: z, isDark: isDark };
    gridTiles.push(tile);
    
    board.add(tile);
  }
}

/* ---------- Peana Rectangular ---------- */
const boardSizeX = COLS * STEP + 0.60;
const boardSizeZ = ROWS * STEP + 0.60;
const baseH     = 0.54;

const baseGeo = new THREE.BoxGeometry(boardSizeX, baseH, boardSizeZ);
const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({
  color: PAL.base, roughness: 0.85, metalness: 0.30
}));
base.position.y = -TILE_H - baseH / 2;
board.add(base);

/* Filo neón */
const edges = new THREE.LineSegments(
  new THREE.EdgesGeometry(baseGeo),
  new THREE.LineBasicMaterial({
    color: PAL.neon, transparent: true, opacity: 0.42
  })
);
edges.position.copy(base.position);
board.add(edges);

/* Pie dorado inferior */
const footGeo = new THREE.BoxGeometry(boardSizeX - 0.85, 0.10, boardSizeZ - 0.85);
const foot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({
  color: PAL.gold, roughness: 0.35, metalness: 0.75
}));
foot.position.y = -TILE_H - baseH - 0.05;
board.add(foot);

/* ══════════════════════════════════════════════
   RESIZE
   ══════════════════════════════════════════════ */
function resize(){
  const w = stage.clientWidth  || 1;
  const h = stage.clientHeight || 1;

  renderer.setSize(
    Math.max(1, Math.round(w * PIXEL_SCALE)),
    Math.max(1, Math.round(h * PIXEL_SCALE)),
    false
  );
  renderer.domElement.style.width  = '100%';
  renderer.domElement.style.height = '100%';

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // Ajuste dinámico para pantallas más cuadradas o verticales
  radius = camera.aspect >= 1
    ? 20.0
    : 20.0 + (1 - camera.aspect) * 12;
}
new ResizeObserver(resize).observe(stage);
resize();

/* ══════════════════════════════════════════════
   INTERACCIÓN — SOLO ROTACIÓN HORIZONTAL
   ══════════════════════════════════════════════ */
let dragging = false, lastX = 0;

stage.addEventListener('pointerdown', e => {
  dragging = true;
  lastX = e.clientX;
  stage.style.cursor = 'grabbing';
  stage.setPointerCapture(e.pointerId);
});

stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;

  theta -= dx * 0.0060;
});

function endDrag(){
  dragging = false;
  stage.style.cursor = 'grab';
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

/* ══════════════════════════════════════════════
   LOOP
   ══════════════════════════════════════════════ */
function animate(){
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}

updateCamera();
animate();

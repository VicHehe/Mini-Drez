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

let theta  = 0.62;        // Giro horizontal permitido
const PHI  = 0.955;       // Inclinación FIJA 2.5D
let radius = 16.5;        // Distancia para que el tablero no se corte

// Ajustamos el objetivo un poco hacia abajo para centrar la peana y el pie
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
   TABLERO 5 × 5
   ══════════════════════════════════════════════ */
const board = new THREE.Group();
scene.add(board);

const N = 5;
const TILE = 1;
const GAP  = 0.06;
const STEP = TILE + GAP;
const HALF = (N - 1) / 2;
const TILE_H = 0.26;

const tileGeo = new THREE.BoxGeometry(TILE, TILE_H, TILE);

const matDark = new THREE.MeshStandardMaterial({
  color: PAL.tileDark, roughness: 0.62, metalness: 0.18
});
const matLight = new THREE.MeshStandardMaterial({
  color: PAL.tileLight, roughness: 0.55, metalness: 0.05
});

for (let x = 0; x < N; x++){
  for (let z = 0; z < N; z++){
    const isDark = (x + z) % 2 === 1;
    const tile = new THREE.Mesh(tileGeo, isDark ? matDark : matLight);
    tile.position.set(
      (x - HALF) * STEP,
      -TILE_H / 2,
      (z - HALF) * STEP
    );
    board.add(tile);
  }
}

/* ---------- Peana ---------- */
const boardSize = N * STEP + 0.60;
const baseH     = 0.54;

const baseGeo = new THREE.BoxGeometry(boardSize, baseH, boardSize);
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
const footGeo = new THREE.BoxGeometry(boardSize - 0.85, 0.10, boardSize - 0.85);
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

  radius = camera.aspect >= 1
    ? 16.5
    : 16.5 + (1 - camera.aspect) * 10;
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

  // Únicamente giro izquierda / derecha
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

import * as THREE from 'three';
import { iniciarSeleccion } from './seleccion.js';
import { elegirMovimientoCPU } from './cpu.js';

// Importación de todas las piezas
import { PeonClasico } from './piezas/PeonClasico.js';
import { Bandido } from './piezas/Bandido.js';
import { GuardiaGigante } from './piezas/GuardiaGigante.js';
import { Reina } from './piezas/Reina.js';
import { ReyClasico } from './piezas/ReyClasico.js';
import { EmperadorInvocador } from './piezas/EmperadorInvocador.js';
import { Caballo } from './piezas/Caballo.js';
import { Alfil } from './piezas/Alfil.js';
import { Bombardero } from './piezas/Bombardero.js';
import { Torre } from './piezas/Torre.js';
import { Fantasma } from './piezas/Fantasma.js';
import { ReyCaido } from './piezas/ReyCaido.js';

/* ══════════════════════════════════════════════
   PALETA SEGA GENESIS
   ══════════════════════════════════════════════ */
const PAL = {
  tileDark : 0x2a2f6b,
  tileLight: 0xe9d8a6,
  base     : 0x11142e,
  neon     : 0x2fd4d4,
  gold     : 0xf2c96b,
  white    : 0xe9d8a6,
  black    : 0x2a2f6b,
  highlight: 0x2fd4d4,
  danger   : 0xe0409b
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
const PHI  = 0.955;       
let radius = 20.0;        

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
   TABLERO 8x5
   ══════════════════════════════════════════════ */
const boardGroup = new THREE.Group();
scene.add(boardGroup);

const COLS = 8;
const ROWS = 5;
const TILE = 1;
const GAP  = 0.06;
const STEP = TILE + GAP;
const TILE_H = 0.26;

const HALF_X = (COLS - 1) / 2;
const HALF_Z = (ROWS - 1) / 2;

const tileGeo = new THREE.BoxGeometry(TILE, TILE_H, TILE);

const matDark = new THREE.MeshStandardMaterial({
  color: PAL.tileDark, roughness: 0.62, metalness: 0.18
});
const matLight = new THREE.MeshStandardMaterial({
  color: PAL.tileLight, roughness: 0.55, metalness: 0.05
});

const gridTiles = []; // Para raycasting y posicionamiento

for (let x = 0; x < COLS; x++){
  for (let z = 0; z < ROWS; z++){
    const isDark = (x + z) % 2 === 1;
    const tile = new THREE.Mesh(tileGeo, isDark ? matDark : matLight);
    
    const posX = (x - HALF_X) * STEP;
    const posZ = (z - HALF_Z) * STEP;
    
    tile.position.set(posX, -TILE_H / 2, posZ);
    tile.userData = { gridX: x, gridZ: z };
    gridTiles.push(tile);
    boardGroup.add(tile);
  }
}

/* ---------- Peana ---------- */
const boardSizeX = COLS * STEP + 0.60;
const boardSizeZ = ROWS * STEP + 0.60;
const baseH     = 0.54;

const baseGeo = new THREE.BoxGeometry(boardSizeX, baseH, boardSizeZ);
const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({
  color: PAL.base, roughness: 0.85, metalness: 0.30
}));
base.position.y = -TILE_H - baseH / 2;
boardGroup.add(base);

const edges = new THREE.LineSegments(
  new THREE.EdgesGeometry(baseGeo),
  new THREE.LineBasicMaterial({ color: PAL.neon, transparent: true, opacity: 0.42 })
);
edges.position.copy(base.position);
boardGroup.add(edges);

const footGeo = new THREE.BoxGeometry(boardSizeX - 0.85, 0.10, boardSizeZ - 0.85);
const foot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({
  color: PAL.gold, roughness: 0.35, metalness: 0.75
}));
foot.position.y = -TILE_H - baseH - 0.05;
boardGroup.add(foot);

/* ══════════════════════════════════════════════
   ESTADO DEL JUEGO
   ══════════════════════════════════════════════ */
let config = null;
let board = []; // Matriz 8x5 de piezas
let turn = 1; // 1 = Blanco (Jugador), 2 = Negro (Rival/CPU)
let selectedPiece = null;
let validMoves = [];
let highlightMeshes = [];

// Configuración visual de los highlights
const highlightGeo = new THREE.BoxGeometry(TILE - 0.1, 0.02, TILE - 0.1);
const matHighlight = new THREE.MeshBasicMaterial({ color: PAL.highlight, transparent: true, opacity: 0.6 });
const matDanger = new THREE.MeshBasicMaterial({ color: PAL.danger, transparent: true, opacity: 0.6 });

/* ══════════════════════════════════════════════
   INICIALIZACIÓN DEL JUEGO
   ══════════════════════════════════════════════ */
iniciarSeleccion((datosSeleccion) => {
  config = datosSeleccion;
  
  // Crear matriz vacía
  for (let x = 0; x < COLS; x++) {
    board[x] = [];
    for (let z = 0; z < ROWS; z++) {
      board[x][z] = null;
    }
  }

  // Colocar piezas iniciales (Jugador 1 - Blancas en Z=0,1)
  colocarPieza(3, 0, config.piezasJugador.defensa_cercana, 'w');
  colocarPieza(4, 0, config.piezasJugador.rey, 'w');
  colocarPieza(5, 0, config.piezasJugador.defensa_lejana, 'w');
  colocarPieza(4, 1, config.piezasJugador.peon, 'w');

  // Colocar piezas iniciales (Jugador 2 - Negras en Z=3,4)
  colocarPieza(3, 4, config.piezasCPU.defensa_cercana, 'b');
  colocarPieza(4, 4, config.piezasCPU.rey, 'b');
  colocarPieza(5, 4, config.piezasCPU.defensa_lejana, 'b');
  colocarPieza(4, 3, config.piezasCPU.peon, 'b');

  turn = 1; // Empieza el jugador
});

function colocarPieza(x, z, piezaDef, color) {
  const colorHex = color === 'w' ? PAL.white : PAL.black;
  const mesh = piezaDef.createMesh(colorHex);
  
  const posX = (x - HALF_X) * STEP;
  const posZ = (z - HALF_Z) * STEP;
  
  mesh.position.set(posX, 0, posZ); // Y=0 es la superficie del tablero
  
  boardGroup.add(mesh);
  
  board[x][z] = {
    def: piezaDef,
    color: color,
    mesh: mesh,
    hasMoved: false,
    isCharging: false
  };
}

/* ══════════════════════════════════════════════
   INTERACCIÓN (RAYCASTING)
   ══════════════════════════════════════════════ */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

stage.addEventListener('pointerdown', (e) => {
  // Si es turno de la CPU, ignorar clics del jugador
  if (turn === 2 && config.modo === 'cpu') return;

  // Calcular posición del ratón en NDC (-1 a 1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  // Intersección con los mosaicos del tablero
  const intersects = raycaster.intersectObjects(gridTiles);
  
  if (intersects.length > 0) {
    const tile = intersects[0].object;
    const { gridX, gridZ } = tile.userData;
    manejarClic(gridX, gridZ);
  }
});

function manejarClic(x, z) {
  const clickedPiece = board[x][z];

  // Si ya hay una pieza seleccionada y hacemos clic en un movimiento válido
  if (selectedPiece) {
    const move = validMoves.find(m => m.x === x && m.z === z);
    if (move) {
      ejecutarMovimiento(selectedPiece.x, selectedPiece.z, x, z, move);
      return;
    }
  }

  // Si hacemos clic en una pieza propia, la seleccionamos
  if (clickedPiece && clickedPiece.color === (turn === 1 ? 'w' : 'b')) {
    // Si ya estaba seleccionada, la deseleccionamos (para el Guardia Gigante)
    if (selectedPiece && selectedPiece.x === x && selectedPiece.z === z) {
      // El Guardia Gigante usa el clic sobre sí mismo para atacar
      if (clickedPiece.def.categoria === 'peon' && clickedPiece.def.name === 'GuardiaGigante' && clickedPiece.isCharging) {
        const moves = clickedPiece.def.getValidMoves(x, z, turn, board, clickedPiece.isCharging);
        const areaAttack = moves.find(m => m.type === 'area_attack');
        if (areaAttack) {
          ejecutarMovimiento(x, z, x, z, areaAttack);
          return;
        }
      }
      deseleccionar();
    } else {
      seleccionar(x, z);
    }
  } else {
    deseleccionar();
  }
}

function seleccionar(x, z) {
  deseleccionar(); // Limpiar selección previa
  const piece = board[x][z];
  if (!piece) return;

  selectedPiece = { x, z };
  validMoves = piece.def.getValidMoves(x, z, turn, board, piece.hasMoved, piece.isCharging);

  // Crear Highlights visuales
  validMoves.forEach(m => {
    const hl = new THREE.Mesh(highlightGeo, m.capture || m.type === 'convert' || m.type === 'area_attack' ? matDanger : matHighlight);
    hl.position.set((m.x - HALF_X) * STEP, 0.01, (m.z - HALF_Z) * STEP);
    boardGroup.add(hl);
    highlightMeshes.push(hl);
  });
}

function deseleccionar() {
  selectedPiece = null;
  validMoves = [];
  highlightMeshes.forEach(hl => boardGroup.remove(hl));
  highlightMeshes = [];
}

/* ══════════════════════════════════════════════
   EJECUCIÓN DE MOVIMIENTOS
   ══════════════════════════════════════════════ */
function ejecutarMovimiento(fromX, fromZ, toX, toZ, move) {
  const piece = board[fromX][fromZ];
  const target = board[toX][toZ];
  
  deseleccionar();

  // 1. Manejar Intercambio (Rey Clásico)
  if (move.type === 'swap') {
    board[fromX][fromZ] = target;
    board[toX][toZ] = piece;
    
    // Actualizar posiciones visuales
    piece.mesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
    target.mesh.position.set((fromX - HALF_X) * STEP, 0, (fromZ - HALF_Z) * STEP);
    
    piece.hasMoved = true;
    target.hasMoved = true;
    finalizarTurno();
    return;
  }

  // 2. Manejar Ataque en Área (Guardia Gigante)
  if (move.type === 'area_attack') {
    move.targets.forEach(t => {
      const victim = board[t.x][t.z];
      if (victim) {
        // Si es inmortal, no muere
        if (!victim.def.isImmortal) {
          boardGroup.remove(victim.mesh);
          board[t.x][t.z] = null;
        }
      }
    });
    piece.hasMoved = false; // Permanece quieto, pero su estado de carga cambia
    piece.isCharging = false;
    finalizarTurno();
    return;
  }

  // 3. Manejar Conversión (Emperador Invocador)
  if (move.type === 'convert') {
    // Eliminar enemigo
    boardGroup.remove(target.mesh);
    
    // Crear el nuevo peón del jugador actual
    const nuevoPeon = turn === 1 ? config.piezasJugador.peon : config.piezasCPU.peon;
    const colorHex = turn === 1 ? PAL.white : PAL.black;
    const nuevoMesh = nuevoPeon.createMesh(colorHex);
    
    nuevoMesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
    boardGroup.add(nuevoMesh);
    
    board[toX][toZ] = {
      def: nuevoPeon,
      color: turn === 1 ? 'w' : 'b',
      mesh: nuevoMesh,
      hasMoved: false,
      isCharging: false
    };
    
    // Mover al Emperador a la casilla
    board[fromX][fromZ] = null;
    board[toX][toZ] = piece;
    piece.mesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
    piece.hasMoved = true;
    
    finalizarTurno();
    return;
  }

  // 4. Movimiento o Captura Normal
  if (target) {
    // Si la pieza objetivo es inmortal, no se puede capturar (el movimiento es inválido)
    if (target.def.isImmortal) {
      return; 
    }

    // Verificar si explota (Bombardero)
    if (target.def.getExplosionArea) {
      const area = target.def.getExplosionArea(toX, toZ);
      area.forEach(a => {
        const v = board[a.x][a.z];
        if (v) {
          if (!v.def.isImmortal) {
            boardGroup.remove(v.mesh);
            board[a.x][a.z] = null;
          }
        }
      });
    } else {
      boardGroup.remove(target.mesh);
    }
  }

  // Mover pieza
  board[fromX][fromZ] = null;
  board[toX][toZ] = piece;
  piece.mesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
  
  // Actualizar estados
  piece.hasMoved = true;
  piece.isCharging = false; 

  finalizarTurno();
}

/* ══════════════════════════════════════════════
   CONTROL DE TURNOS Y CPU
   ══════════════════════════════════════════════ */
function finalizarTurno() {
  // Cambiar estado de carga (Guardia Gigante) a todas las piezas del jugador actual
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const p = board[x][z];
      if (p && p.color === (turn === 1 ? 'w' : 'b')) {
        if (!p.hasMoved) {
          p.isCharging = true; // Si no se movió, se carga para el próximo turno
        } else {
          p.isCharging = false;
        }
      }
    }
  }

  turn = turn === 1 ? 2 : 1;

  // Comprobar si alguien perdió su Rey
  let reyW = false, reyB = false;
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const p = board[x][z];
      if (p && p.def.categoria === 'rey') {
        if (p.color === 'w') reyW = true;
        if (p.color === 'b') reyB = true;
      }
    }
  }

  if (!reyW) { alert("¡Gana el Jugador 2 (Negras)!"); location.reload(); return; }
  if (!reyB) { alert("¡Gana el Jugador 1 (Blancas)!"); location.reload(); return; }

  // Turno de la CPU
  if (turn === 2 && config.modo === 'cpu') {
    setTimeout(turnoCPU, 600); // Pequeño delay para que parezca natural
  }
}

function turnoCPU() {
  const mov = elegirMovimientoCPU(board, config.piezasCPU, config.piezasJugador, config.dificultad);
  
  if (mov) {
    // Ejecutar el movimiento de la CPU
    // Nota: El motor de CPU devuelve {x, z, fromX, fromZ, ...moveData}
    ejecutarMovimiento(mov.fromX, mov.fromZ, mov.x, mov.z, mov);
  } else {
    // Si no hay movimientos, pierde el turno
    finalizarTurno();
  }
}

/* ══════════════════════════════════════════════
   RESIZE Y RENDER LOOP
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
    ? 20.0
    : 20.0 + (1 - camera.aspect) * 12;
}
new ResizeObserver(resize).observe(stage);
resize();

let dragging = false, lastX = 0, hasDragged = false;

stage.addEventListener('pointerdown', e => {
  dragging = true;
  hasDragged = false;
  lastX = e.clientX;
  stage.style.cursor = 'grabbing';
  stage.setPointerCapture(e.pointerId);
});

stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;

  if (Math.abs(dx) > 3) hasDragged = true;

  theta -= dx * 0.0060;
});

function endDrag(e){
  dragging = false;
  stage.style.cursor = 'grab';
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

function animate(){
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}

updateCamera();
animate();

import * as THREE from 'three';
import { iniciarSeleccion } from './seleccion.js';
import { elegirMovimientoCPU } from './cpu.js';

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

const PAL = {
  tileDark : 0x2a2f6b, tileLight: 0xe9d8a6, base: 0x11142e,
  neon: 0x2fd4d4, gold: 0xf2c96b, white: 0xe9d8a6, black: 0x2a2f6b,
  highlight: 0x2fd4d4, danger: 0xe0409b
};

const stage = document.getElementById('stage');
const PIXEL_SCALE = 0.65; 

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.style.imageRendering = 'pixelated';
stage.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

let theta  = 0.62;        
const PHI  = 0.955;       
let radius = 24.0; 

const target = new THREE.Vector3(0, -0.3, 0);

function updateCamera(){
  camera.position.set(
    target.x + radius * Math.sin(PHI) * Math.sin(theta),
    target.y + radius * Math.cos(PHI),
    target.z + radius * Math.sin(PHI) * Math.cos(theta)
  );
  camera.lookAt(target);
}

scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x1a0f2e, 0.70));
const key = new THREE.DirectionalLight(0xfff4e0, 1.75);
key.position.set(6, 11, 7); scene.add(key);
const fill = new THREE.DirectionalLight(0x6a7cff, 0.65);
fill.position.set(-8, 5, -7); scene.add(fill);

const cyanLight = new THREE.PointLight(0x00e5e5, 45, 20, 2);
cyanLight.position.set(-6.5, 2.6, -5.5); scene.add(cyanLight);
const magentaLight = new THREE.PointLight(0xff3f9f, 35, 20, 2);
magentaLight.position.set(7, 1.8, 5.5); scene.add(magentaLight);

const boardGroup = new THREE.Group();
scene.add(boardGroup);

const COLS = 5; const ROWS = 8;
const TILE = 1; const GAP  = 0.06; const STEP = TILE + GAP; const TILE_H = 0.26;
const HALF_X = (COLS - 1) / 2; const HALF_Z = (ROWS - 1) / 2;

const tileGeo = new THREE.BoxGeometry(TILE, TILE_H, TILE);
const matDark = new THREE.MeshStandardMaterial({ color: PAL.tileDark, roughness: 0.62, metalness: 0.18 });
const matLight = new THREE.MeshStandardMaterial({ color: PAL.tileLight, roughness: 0.55, metalness: 0.05 });

const gridTiles = [];

for (let x = 0; x < COLS; x++){
  for (let z = 0; z < ROWS; z++){
    const isDark = (x + z) % 2 === 1;
    const tile = new THREE.Mesh(tileGeo, isDark ? matDark : matLight);
    tile.position.set((x - HALF_X) * STEP, -TILE_H / 2, (z - HALF_Z) * STEP);
    tile.userData = { gridX: x, gridZ: z };
    gridTiles.push(tile);
    boardGroup.add(tile);
  }
}

const boardSizeX = COLS * STEP + 0.60; const boardSizeZ = ROWS * STEP + 0.60; const baseH = 0.54;
const baseGeo = new THREE.BoxGeometry(boardSizeX, baseH, boardSizeZ);
const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: PAL.base, roughness: 0.85, metalness: 0.30 }));
base.position.y = -TILE_H - baseH / 2; boardGroup.add(base);

const edges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({ color: PAL.neon, transparent: true, opacity: 0.42 }));
edges.position.copy(base.position); boardGroup.add(edges);

const footGeo = new THREE.BoxGeometry(boardSizeX - 0.85, 0.10, boardSizeZ - 0.85);
const foot = new THREE.Mesh(footGeo, new THREE.MeshStandardMaterial({ color: PAL.gold, roughness: 0.35, metalness: 0.75 }));
foot.position.y = -TILE_H - baseH - 0.05; boardGroup.add(foot);

let config = null; let board = []; let turn = 1; 
let selectedPiece = null; let validMoves = []; let highlightMeshes = [];

const highlightGeo = new THREE.BoxGeometry(TILE - 0.1, 0.02, TILE - 0.1);
const matHighlight = new THREE.MeshBasicMaterial({ color: PAL.highlight, transparent: true, opacity: 0.6 });
const matDanger = new THREE.MeshBasicMaterial({ color: PAL.danger, transparent: true, opacity: 0.6 });

// ══════════════════════════════════════════════
// SISTEMA DE JAQUE
// ══════════════════════════════════════════════
function estaEnJaque(reyX, reyZ, colorRey, boardState) {
  const oponenteColor = colorRey === 'w' ? 'b' : 'w';
  const oponenteTurno = colorRey === 'w' ? 2 : 1;

  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const p = boardState[x][z];
      if (p && p.color === oponenteColor) {
        const movs = p.def.getValidMoves(x, z, oponenteTurno, boardState, p.hasMoved, p.isCharging);
        // Verifica si alguna pieza enemiga puede llegar a la casilla del rey
        if (movs.some(m => m.x === reyX && m.z === reyZ || (m.targets && m.targets.some(t => t.x === reyX && t.z === reyZ)))) {
          return true;
        }
      }
    }
  }
  return false;
}

function esMovimientoSeguro(fromX, fromZ, toX, toZ, boardState, piece, isSwap = false) {
  const fakeBoard = [];
  for (let x = 0; x < COLS; x++) {
    fakeBoard[x] = [];
    for (let z = 0; z < ROWS; z++) {
      fakeBoard[x][z] = boardState[x][z];
    }
  }
  
  const targetPiece = fakeBoard[toX][toZ];
  fakeBoard[toX][toZ] = piece;
  fakeBoard[fromX][fromZ] = isSwap ? targetPiece : null;

  let reyX = -1, reyZ = -1;
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const p = fakeBoard[x][z];
      if (p && p.color === piece.color && p.def.categoria === 'rey') {
        if (p === piece) { reyX = toX; reyZ = toZ; } 
        else { reyX = x; reyZ = z; }
      }
    }
  }

  if (reyX === -1) return true; 
  return !estaEnJaque(reyX, reyZ, piece.color, fakeBoard);
}

// ══════════════════════════════════════════════
// INICIALIZACIÓN
// ══════════════════════════════════════════════
iniciarSeleccion((datosSeleccion) => {
  config = datosSeleccion;
  for (let x = 0; x < COLS; x++) {
    board[x] = [];
    for (let z = 0; z < ROWS; z++) board[x][z] = null;
  }

  colocarPieza(0, 0, config.piezasJugador.defensa_lejana, 'w');
  colocarPieza(1, 0, config.piezasJugador.defensa_cercana, 'w');
  colocarPieza(2, 0, config.piezasJugador.rey, 'w');
  colocarPieza(3, 0, config.piezasJugador.defensa_cercana, 'w');
  colocarPieza(4, 0, config.piezasJugador.defensa_lejana, 'w');
  for (let x = 0; x < COLS; x++) colocarPieza(x, 1, config.piezasJugador.peon, 'w');

  colocarPieza(0, 7, config.piezasCPU.defensa_lejana, 'b');
  colocarPieza(1, 7, config.piezasCPU.defensa_cercana, 'b');
  colocarPieza(2, 7, config.piezasCPU.rey, 'b');
  colocarPieza(3, 7, config.piezasCPU.defensa_cercana, 'b');
  colocarPieza(4, 7, config.piezasCPU.defensa_lejana, 'b');
  for (let x = 0; x < COLS; x++) colocarPieza(x, 6, config.piezasCPU.peon, 'b');

  turn = 1;
});

function colocarPieza(x, z, piezaDef, color) {
  const mesh = piezaDef.createMesh(color === 'w' ? PAL.white : PAL.black);
  mesh.position.set((x - HALF_X) * STEP, 0, (z - HALF_Z) * STEP);
  boardGroup.add(mesh);
  board[x][z] = { def: piezaDef, color: color, mesh: mesh, hasMoved: false, isCharging: false };
}

// ══════════════════════════════════════════════
// INTERACCIÓN (CORREGIDO EL CLIC Y EL ARRASTRE)
// ══════════════════════════════════════════════
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let dragging = false, hasDragged = false, lastX = 0, lastY = 0;

stage.addEventListener('pointerdown', e => {
  dragging = true;
  hasDragged = false;
  lastX = e.clientX;
  lastY = e.clientY;
  stage.style.cursor = 'grabbing';
});

stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  
  // Si el ratón se mueve más de 3 píxeles, es un arrastre
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    hasDragged = true;
    theta -= dx * 0.0060;
  }
  lastX = e.clientX;
  lastY = e.clientY;
});

stage.addEventListener('pointerup', e => {
  // Si fue un clic (no un arrastre), procesamos la interacción
  if (dragging && !hasDragged) {
    if (turn === 2 && config.modo === 'cpu') return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(gridTiles);
    
    if (intersects.length > 0) {
      const tile = intersects[0].object;
      manejarClic(tile.userData.gridX, tile.userData.gridZ);
    }
  }
  dragging = false;
  stage.style.cursor = 'grab';
});

function manejarClic(x, z) {
  const clickedPiece = board[x][z];

  if (selectedPiece) {
    const move = validMoves.find(m => m.x === x && m.z === z);
    if (move) {
      ejecutarMovimiento(selectedPiece.x, selectedPiece.z, x, z, move);
      return;
    }
  }

  if (clickedPiece && clickedPiece.color === (turn === 1 ? 'w' : 'b')) {
    if (selectedPiece && selectedPiece.x === x && selectedPiece.z === z) {
      const piezaActual = turn === 1 ? config.piezasJugador.peon : config.piezasCPU.peon;
      if (clickedPiece.def === piezaActual && clickedPiece.isCharging) {
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
  deseleccionar();
  const piece = board[x][z];
  if (!piece) return;

  selectedPiece = { x, z };
  let rawMoves = piece.def.getValidMoves(x, z, turn, board, piece.hasMoved, piece.isCharging);
  
  // Filtrar movimientos que dejan al rey en jaque
  validMoves = rawMoves.filter(m => esMovimientoSeguro(x, z, m.x, m.z, board, piece, m.type === 'swap'));

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

function ejecutarMovimiento(fromX, fromZ, toX, toZ, move) {
  const piece = board[fromX][fromZ];
  const target = board[toX][toZ];
  deseleccionar();

  // Doble comprobación de seguridad (por si la CPU intenta algo ilegal)
  if (!esMovimientoSeguro(fromX, fromZ, toX, toZ, board, piece, move.type === 'swap')) return;

  if (move.type === 'swap') {
    board[fromX][fromZ] = target;
    board[toX][toZ] = piece;
    piece.mesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
    target.mesh.position.set((fromX - HALF_X) * STEP, 0, (fromZ - HALF_Z) * STEP);
    piece.hasMoved = true;
    target.hasMoved = true;
    finalizarTurno();
    return;
  }

  if (move.type === 'area_attack') {
    move.targets.forEach(t => {
      const victim = board[t.x][t.z];
      if (victim && !victim.def.isImmortal) {
        boardGroup.remove(victim.mesh);
        board[t.x][t.z] = null;
      }
    });
    piece.hasMoved = false;
    piece.isCharging = false;
    finalizarTurno();
    return;
  }

  if (move.type === 'convert') {
    boardGroup.remove(target.mesh);
    const nuevoPeon = turn === 1 ? config.piezasJugador.peon : config.piezasCPU.peon;
    const nuevoMesh = nuevoPeon.createMesh(turn === 1 ? PAL.white : PAL.black);
    
    nuevoMesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
    boardGroup.add(nuevoMesh);
    
    board[toX][toZ] = { def: nuevoPeon, color: turn === 1 ? 'w' : 'b', mesh: nuevoMesh, hasMoved: false, isCharging: false };
    board[fromX][fromZ] = null;
    board[toX][toZ] = piece;
    piece.mesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
    piece.hasMoved = true;
    finalizarTurno();
    return;
  }

  if (target) {
    if (target.def.isImmortal) return; 
    if (target.def.getExplosionArea) {
      const area = target.def.getExplosionArea(toX, toZ);
      area.forEach(a => {
        const v = board[a.x][a.z];
        if (v && !v.def.isImmortal) {
          boardGroup.remove(v.mesh);
          board[a.x][a.z] = null;
        }
      });
    } else {
      boardGroup.remove(target.mesh);
    }
  }

  board[fromX][fromZ] = null;
  board[toX][toZ] = piece;
  piece.mesh.position.set((toX - HALF_X) * STEP, 0, (toZ - HALF_Z) * STEP);
  piece.hasMoved = true;
  piece.isCharging = false; 

  finalizarTurno();
}

function finalizarTurno() {
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const p = board[x][z];
      if (p && p.color === (turn === 1 ? 'w' : 'b')) {
        p.isCharging = !p.hasMoved;
      }
    }
  }

  turn = turn === 1 ? 2 : 1;

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

  if (!reyW) { alert("¡Gana el Jugador 2!"); location.reload(); return; }
  if (!reyB) { alert("¡Gana el Jugador 1!"); location.reload(); return; }

  if (turn === 2 && config.modo === 'cpu') {
    setTimeout(turnoCPU, 600);
  }
}

function turnoCPU() {
  const mov = elegirMovimientoCPU(board, config.piezasCPU, config.piezasJugador, config.dificultad, esMovimientoSeguro);
  if (mov) {
    ejecutarMovimiento(mov.fromX, mov.fromZ, mov.x, mov.z, mov);
  } else {
    finalizarTurno();
  }
}

function resize(){
  const w = stage.clientWidth || 1; const h = stage.clientHeight || 1;
  renderer.setSize(Math.max(1, Math.round(w * PIXEL_SCALE)), Math.max(1, Math.round(h * PIXEL_SCALE)), false);
  renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
  camera.aspect = w / h; camera.updateProjectionMatrix();
  radius = camera.aspect >= 1 ? 24.0 : 24.0 + (1 - camera.aspect) * 15;
}
new ResizeObserver(resize).observe(stage);
resize();

function animate(){
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}
updateCamera();
animate();

import * as THREE from 'three';

export const Torre = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'defensa_lejana', // Defensa de largo alcance

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, fortaleza)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true 
    });

    const matGold = new THREE.MeshStandardMaterial({
      color: 0xf2c96b,
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuerpo principal (Troncocónico)
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.6, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.45;
    group.add(body);

    // 3. Borde superior (Anillo)
    const rimGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8);
    const rim = new THREE.Mesh(rimGeo, matGold);
    rim.position.y = 0.8;
    group.add(rim);

    // 4. Almenas (4 bloques en la parte superior)
    const merlonGeo = new THREE.BoxGeometry(0.12, 0.18, 0.12);
    const positions = [
      { x: 0.23, z: 0.23 },
      { x: -0.23, z: 0.23 },
      { x: 0.23, z: -0.23 },
      { x: -0.23, z: -0.23 }
    ];

    for (let pos of positions) {
      const merlon = new THREE.Mesh(merlonGeo, mat);
      merlon.position.set(pos.x, 0.94, pos.z);
      group.add(merlon);
    }

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO (Alcance Infinito)
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // Rango máximo (se detendrá solo si choca o sale del tablero)
    const MAX_RANGE = 8; 

    // Direcciones ortogonales (Arriba, Abajo, Izquierda, Derecha)
    const directions = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, 
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
    ];

    for (let dir of directions) {
      for (let step = 1; step <= MAX_RANGE; step++) {
        const tx = x + (dir.dx * step);
        const tz = z + (dir.dz * step);

        // 1. Verificar límites del tablero (8x5)
        if (tx < 0 || tx >= 8 || tz < 0 || tz >= 5) {
          break; 
        }

        const targetPiece = board[tx][tz];

        // 2. Si la casilla está vacía, se añade el movimiento
        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, capture: false });
        } 
        // 3. Si hay una pieza
        else {
          // Si es enemiga, se puede capturar
          if (targetPiece.color === enemyColor) {
            moves.push({ x: tx, z: tz, capture: true });
          }
          // Si es aliada o enemiga, el bucle se rompe porque la torre no puede saltar
          break; 
        }
      }
    }

    return moves;
  }
};

import * as THREE from 'three';

export const Alfil = {
  categoria: 'defensa_cercana',

  createMesh: (colorHex) => {
    const group = new THREE.Group();
    
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex, roughness: 0.5, metalness: 0.3, flatShading: true 
    });
    const matGold = new THREE.MeshStandardMaterial({
      color: 0xf2c96b, roughness: 0.3, metalness: 0.8, flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuerpo
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.3, 0.5, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.4;
    group.add(body);

    // 3. Anillo de la cabeza
    const ringGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 8);
    const ring = new THREE.Mesh(ringGeo, matGold);
    ring.position.y = 0.68;
    group.add(ring);

    // 4. Gorro / Mitra (Cono clásico del alfil)
    const mitreGeo = new THREE.ConeGeometry(0.18, 0.35, 8);
    const mitre = new THREE.Mesh(mitreGeo, mat);
    mitre.position.y = 0.88;
    group.add(mitre);

    // 5. Corte diagonal (Pequeña caja oscura para simular la hendidura del alfil)
    const sliceGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
    const slice = new THREE.Mesh(sliceGeo, matGold);
    slice.position.set(0, 0.95, 0.1);
    slice.rotation.x = -0.4;
    group.add(slice);

    return group;
  },

  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // NERFEO / ROL: Al ser "Defensa Cercana", limitamos su rango a 3 casillas
    const MAX_RANGE = 3; 

    const directions = [
      { dx: 1, dz: 1 }, { dx: -1, dz: 1 },
      { dx: 1, dz: -1 }, { dx: -1, dz: -1 }
    ];

    for (let dir of directions) {
      for (let step = 1; step <= MAX_RANGE; step++) {
        const tx = x + (dir.dx * step);
        const tz = z + (dir.dz * step);

        // Límites del tablero
        if (tx < 0 || tx >= 8 || tz < 0 || tz >= 5) {
          break; 
        }

        const targetPiece = board[tx][tz];

        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, capture: false });
        } else {
          if (targetPiece.color === enemyColor) {
            moves.push({ x: tx, z: tz, capture: true });
          }
          break; // Bloqueado (no puede saltar)
        }
      }
    }
    return moves;
  }
};

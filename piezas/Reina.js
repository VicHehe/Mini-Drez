import * as THREE from 'three';

export const Reina = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'rey', // El motor usará esta etiqueta para aplicar la regla de Jaque

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, elegante y real)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.5,
      metalness: 0.35,
      flatShading: true 
    });

    const matGold = new THREE.MeshStandardMaterial({
      color: 0xf2c96b, // Dorado Genesis
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Vestido / Cuerpo (Troncocónico alto)
    const dressGeo = new THREE.CylinderGeometry(0.15, 0.38, 0.6, 8);
    const dress = new THREE.Mesh(dressGeo, mat);
    dress.position.y = 0.45;
    group.add(dress);

    // 3. Capa (Caja fina en la parte trasera)
    const capeGeo = new THREE.BoxGeometry(0.35, 0.6, 0.05);
    const cape = new THREE.Mesh(capeGeo, matGold);
    cape.position.set(0, 0.45, -0.15);
    cape.rotation.x = -0.15;
    group.add(cape);

    // 4. Cabeza
    const headGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.82;
    group.add(head);

    // 5. Corona (Anillo base + 3 puntas)
    const crownBaseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 8);
    const crownBase = new THREE.Mesh(crownBaseGeo, matGold);
    crownBase.position.y = 0.94;
    group.add(crownBase);

    const spikeGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(spikeGeo, matGold);
      const angle = (i / 3) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 0.12, 1.03, Math.sin(angle) * 0.12);
      group.add(spike);
    }

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO (Rango infinito clásico)
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // Rango máximo igual al tamaño máximo del tablero (8x5). 
    // Al ser infinito, el bucle se detendrá solo al salir del tablero o chocar.
    const MAX_RANGE = 8; 

    const directions = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, // Horizontal
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 }, // Vertical
      { dx: 1, dz: 1 }, { dx: -1, dz: 1 }, // Diagonales
      { dx: 1, dz: -1 }, { dx: -1, dz: -1 }
    ];

    for (let dir of directions) {
      for (let step = 1; step <= MAX_RANGE; step++) {
        const tx = x + (dir.dx * step);
        const tz = z + (dir.dz * step);

        // 1. Límites del tablero
        if (tx < 0 || tx >= 8 || tz < 0 || tz >= 5) {
          break; 
        }

        const targetPiece = board[tx][tz];

        // 2. Casilla vacía
        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, capture: false });
        } 
        // 3. Casilla ocupada
        else {
          if (targetPiece.color === enemyColor) {
            moves.push({ x: tx, z: tz, capture: true });
          }
          break; // Bloqueado por pieza (aliada o enemiga)
        }
      }
    }

    return moves;
  }
};

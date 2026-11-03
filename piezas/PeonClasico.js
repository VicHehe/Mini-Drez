import * as THREE from 'three';

export const PeonClasico = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'peon',

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly estilo Genesis)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    // Material con flatShading para que las caras se noten (estilo retro)
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.6,
      metalness: 0.2,
      flatShading: true 
    });

    // Base circular
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // Cuerpo troncocónico
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.3, 0.4, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.35;
    group.add(body);

    // Cabeza esférica (baja resolución)
    const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.65;
    group.add(head);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO
  // ══════════════════════════════════════════════
  // board: matriz 2D de 8x5 (X: 0-7, Z: 0-4)
  // player: 1 (abajo, avanza hacia Z+) o 2 (arriba, avanza hacia Z-)
  getValidMoves: (x, z, player, board, hasMoved) => {
    const moves = [];
    const dir = player === 1 ? 1 : -1;
    const enemyColor = player === 1 ? 'b' : 'w'; // Asumiendo que las piezas tienen color 'w' o 'b'
    
    // Filas iniciales en un tablero de 5 filas:
    // J1 empieza en Z=1, J2 empieza en Z=3
    const startRow = player === 1 ? 1 : 3;

    // 1. Avance vertical (1 casilla)
    const nextZ = z + dir;
    if (nextZ >= 0 && nextZ < 5 && board[x][nextZ] === null) {
      moves.push({ x: x, z: nextZ, capture: false });

      // 2. Avance vertical doble (solo si es el primer movimiento)
      const nextZDouble = z + (dir * 2);
      if (!hasMoved && z === startRow && nextZDouble >= 0 && nextZDouble < 5 && board[x][nextZDouble] === null) {
        moves.push({ x: x, z: nextZDouble, capture: false });
      }
    }

    // 3. Capturas en diagonal
    const diagonals = [-1, 1];
    for (const dx of diagonals) {
      const capX = x + dx;
      const capZ = z + dir;
      
      // Verificar límites del tablero
      if (capX >= 0 && capX < 8 && capZ >= 0 && capZ < 5) {
        const targetPiece = board[capX][capZ];
        // Si hay una pieza y es del color enemigo
        if (targetPiece !== null && targetPiece.color === enemyColor) {
          moves.push({ x: capX, z: capZ, capture: true });
        }
      }
    }

    return moves;
  }
};

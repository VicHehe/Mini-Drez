import * as THREE from 'three';

export const Bandido = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'peon', // Pertenece a la categoría de peones

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly estilo Genesis)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    // Material principal (color del jugador)
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true 
    });

    // Material para la daga y la sombra de la cara
    const matDark = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      flatShading: true
    });

    // 1. Base (igual que el peón clásico para mantener la armonía)
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuerpo (un poco más encorvado y ancho)
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.3, 0.35, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.325;
    body.rotation.x = 0.1; // Ligera inclinación hacia adelante (sneaky)
    group.add(body);

    // 3. Capucha puntiaguda
    const hoodGeo = new THREE.ConeGeometry(0.26, 0.45, 8);
    const hood = new THREE.Mesh(hoodGeo, mat);
    hood.position.y = 0.65;
    hood.position.z = 0.05; // Un poco hacia adelante
    hood.rotation.x = 0.2; // Inclinada hacia adelante
    group.add(hood);

    // 4. Sombra de la cara (pequeña caja negra bajo la capucha)
    const faceGeo = new THREE.BoxGeometry(0.18, 0.1, 0.1);
    const face = new THREE.Mesh(faceGeo, matDark);
    face.position.set(0, 0.55, 0.18);
    group.add(face);

    // 5. Daga (pequeña hoja y mango)
    const bladeGeo = new THREE.BoxGeometry(0.05, 0.25, 0.05);
    const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 }));
    blade.position.set(0.25, 0.4, 0.1);
    blade.rotation.z = -0.4;
    group.add(blade);

    const hiltGeo = new THREE.BoxGeometry(0.12, 0.04, 0.04);
    const hilt = new THREE.Mesh(hiltGeo, matDark);
    hilt.position.set(0.22, 0.28, 0.1);
    hilt.rotation.z = -0.4;
    group.add(hilt);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO
  // ══════════════════════════════════════════════
  // board: matriz 2D de 8x5 (X: 0-7, Z: 0-4)
  // player: 1 (abajo, avanza hacia Z+) o 2 (arriba, avanza hacia Z-)
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const dir = player === 1 ? 1 : -1;
    const enemyColor = player === 1 ? 'b' : 'w';
    
    const nextZ = z + dir;

    // Verificar que no se salga del tablero (límites Z: 0 a 4)
    if (nextZ >= 0 && nextZ < 5) {
      const targetPiece = board[x][nextZ];

      // 1. Si la casilla de enfrente está vacía, es un movimiento normal
      if (targetPiece === null) {
        moves.push({ x: x, z: nextZ, capture: false });
      } 
      // 2. Si hay una pieza enemiga de frente, la captura
      else if (targetPiece.color === enemyColor) {
        moves.push({ x: x, z: nextZ, capture: true });
      }
      // (Si es aliado, no se hace nada, se queda bloqueado)
    }

    return moves;
  }
};

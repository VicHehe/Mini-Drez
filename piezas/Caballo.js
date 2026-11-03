import * as THREE from 'three';

export const Caballo = {
  categoria: 'defensa_cercana',

  createMesh: (colorHex) => {
    const group = new THREE.Group();
    
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex, roughness: 0.6, metalness: 0.2, flatShading: true 
    });
    const matDark = new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.9, flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuello
    const neckGeo = new THREE.BoxGeometry(0.25, 0.4, 0.3);
    const neck = new THREE.Mesh(neckGeo, mat);
    neck.position.set(0, 0.35, -0.05);
    neck.rotation.x = -0.2; // Inclinado hacia adelante
    group.add(neck);

    // 3. Cabeza (Bloque alargado)
    const headGeo = new THREE.BoxGeometry(0.2, 0.25, 0.5);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.set(0, 0.6, 0.1);
    head.rotation.x = 0.2;
    group.add(head);

    // 4. Hocico
    const snoutGeo = new THREE.BoxGeometry(0.15, 0.15, 0.2);
    const snout = new THREE.Mesh(snoutGeo, mat);
    snout.position.set(0, 0.52, 0.35);
    group.add(snout);

    // 5. Orejas (Pequeños conos)
    const earGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
    const earL = new THREE.Mesh(earGeo, mat);
    earL.position.set(-0.08, 0.78, 0);
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, mat);
    earR.position.set(0.08, 0.78, 0);
    group.add(earR);

    // 6. Crin (Bloque oscuro en la parte trasera del cuello)
    const maneGeo = new THREE.BoxGeometry(0.1, 0.35, 0.15);
    const mane = new THREE.Mesh(maneGeo, matDark);
    mane.position.set(0, 0.5, -0.15);
    group.add(mane);

    return group;
  },

  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // Los 8 movimientos en L clásicos del caballo
    const jumps = [
      { dx: 2, dz: 1 }, { dx: 2, dz: -1 },
      { dx: -2, dz: 1 }, { dx: -2, dz: -1 },
      { dx: 1, dz: 2 }, { dx: 1, dz: -2 },
      { dx: -1, dz: 2 }, { dx: -1, dz: -2 }
    ];

    for (let jump of jumps) {
      const tx = x + jump.dx;
      const tz = z + jump.dz;

      // Límites del tablero 8x5
      if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
        const targetPiece = board[tx][tz];

        // El caballo salta, así que solo importa la casilla de destino
        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, capture: false });
        } else if (targetPiece.color === enemyColor) {
          moves.push({ x: tx, z: tz, capture: true });
        }
      }
    }
    return moves;
  }
};

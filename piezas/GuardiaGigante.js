import * as THREE from 'three';

export const GuardiaGigante = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'peon',

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, robusto y pesado)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.65,
      metalness: 0.3,
      flatShading: true 
    });

    const matMetal = new THREE.MeshStandardMaterial({
      color: 0x555566,
      roughness: 0.4,
      metalness: 0.8,
      flatShading: true
    });

    // 1. Base Pesada (Más ancha que los demás peones)
    const baseGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.18, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.09;
    group.add(base);

    // 2. Cuerpo Acorazado (Caja ancha)
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.45, 0.4);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.4;
    group.add(body);

    // 3. Hombreras (Pequeños cubos a los lados)
    const shoulderGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const shoulderL = new THREE.Mesh(shoulderGeo, matMetal);
    shoulderL.position.set(-0.35, 0.55, 0);
    group.add(shoulderL);
    
    const shoulderR = new THREE.Mesh(shoulderGeo, matMetal);
    shoulderR.position.set(0.35, 0.55, 0);
    group.add(shoulderR);

    // 4. Cabeza con Casco (Caja pequeña con un cono encima)
    const headGeo = new THREE.BoxGeometry(0.25, 0.2, 0.25);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.725;
    group.add(head);

    const helmetGeo = new THREE.ConeGeometry(0.18, 0.15, 4); // 4 caras = look tosco
    const helmet = new THREE.Mesh(helmetGeo, matMetal);
    helmet.position.y = 0.9;
    helmet.rotation.y = Math.PI / 4; // Alinear las caras del cono
    group.add(helmet);

    // 5. Escudo Gigante (Bloque a un lado)
    const shieldGeo = new THREE.BoxGeometry(0.15, 0.6, 0.5);
    const shield = new THREE.Mesh(shieldGeo, matMetal);
    shield.position.set(0.4, 0.4, 0);
    group.add(shield);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO Y ATAQUE
  // ══════════════════════════════════════════════
  // board: matriz 2D de 8x5 (X: 0-7, Z: 0-4)
  // player: 1 (abajo, avanza hacia Z+) o 2 (arriba, avanza hacia Z-)
  // isCharging: booleano que indica si la pieza ya pasó un turno sin moverse
  getValidMoves: (x, z, player, board, isCharging) => {
    const moves = [];
    const dir = player === 1 ? 1 : -1;
    const enemyColor = player === 1 ? 'b' : 'w';
    
    const nextZ = z + dir;

    // 1. Movimiento normal: Avanzar 1 casilla (solo si está vacía)
    if (nextZ >= 0 && nextZ < 5) {
      if (board[x][nextZ] === null) {
        moves.push({ x: x, z: nextZ, type: 'move' });
      }
      // Nota: No puede capturar moviéndose hacia adelante. 
      // Si hay un enemigo, se bloquea su avance y debe usar el ataque.
    }

    // 2. Ataque en Área: Solo disponible si la pieza estuvo quieta (isCharging)
    if (isCharging) {
      const targets = [];
      const orthogonal = [
        { dx: 1, dz: 0 }, { dx: -1, dz: 0 },
        { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
      ];

      for (let o of orthogonal) {
        let tx = x + o.dx;
        let tz = z + o.dz;
        
        // Verificar límites del tablero
        if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
          const targetPiece = board[tx][tz];
          // Solo contabilizamos enemigos para el ataque
          if (targetPiece !== null && targetPiece.color === enemyColor) {
            targets.push({ x: tx, z: tz });
          }
        }
      }

      // El movimiento es quedarse en la misma casilla, pero marcado como ataque
      moves.push({ 
        x: x, 
        z: z, 
        type: 'area_attack', 
        targets: targets 
      });
    }

    return moves;
  }
};

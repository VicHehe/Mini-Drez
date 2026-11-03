import * as THREE from 'three';

export const Fantasma = {
  // ══════════════════════════════════════════════
  // CATEGORÍA Y PROPIEDADES ESPECIALES
  // ══════════════════════════════════════════════
  categoria: 'defensa_lejana', // Clasificado aquí según tu idea
  isImmortal: true,            // EL MOTOR DEBE LEER ESTO Y NO ELIMINARLO NUNCA

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, espectral)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    // Material espectral translúcido
    const matGhost = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.1,
      metalness: 0.0,
      transparent: true,
      opacity: 0.75,
      emissive: colorHex,
      emissiveIntensity: 0.3,
      flatShading: true 
    });

    const matDark = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.9,
      flatShading: true
    });

    // 1. Cuerpo flotante (Cilindro hueco que se estrecha hacia abajo)
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.1, 0.6, 8);
    const body = new THREE.Mesh(bodyGeo, matGhost);
    body.position.y = 0.4; // Flota un poco más alto que las piezas normales
    group.add(body);

    // 2. Cabeza redondeada
    const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const head = new THREE.Mesh(headGeo, matGhost);
    head.position.y = 0.8;
    group.add(head);

    // 3. Cola ondulante (Pequeños cubos desvaneciéndose)
    const tailGeo = new THREE.BoxGeometry(0.15, 0.1, 0.15);
    const tail1 = new THREE.Mesh(tailGeo, matGhost);
    tail1.position.set(0, 0.15, 0);
    group.add(tail1);

    const tail2 = new THREE.Mesh(tailGeo, matGhost);
    tail2.scale.set(0.7, 0.7, 0.7);
    tail2.position.set(0, 0.05, 0);
    group.add(tail2);

    // 4. Ojos vacíos (Dos pequeñas cajas negras)
    const eyeGeo = new THREE.BoxGeometry(0.05, 0.08, 0.05);
    
    const eyeL = new THREE.Mesh(eyeGeo, matDark);
    eyeL.position.set(-0.08, 0.82, 0.18); // Al frente
    group.add(eyeL);
    
    const eyeR = new THREE.Mesh(eyeGeo, matDark);
    eyeR.position.set(0.08, 0.82, 0.18); // Al frente
    group.add(eyeR);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    const dirZ = player === 1 ? 1 : -1; // Dirección "adelante" para el jugador
    
    // Movimiento en forma de cruz (Ortogonal, 1 casilla)
    const directions = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, 
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
    ];

    for (let dir of directions) {
      const tx = x + dir.dx;
      const tz = z + dir.dz;

      // Límites del tablero 8x5
      if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
        const targetPiece = board[tx][tz];

        // 1. Movimiento normal (casilla vacía)
        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, type: 'move' });
        } 
        // 2. Captura (Solo puede comer hacia adelante)
        else if (targetPiece.color === enemyColor) {
          // Verificamos si el movimiento es estrictamente hacia adelante
          // Para P1, adelante es dz = 1 (y dx = 0). Para P2, adelante es dz = -1 (y dx = 0).
          if (dir.dx === 0 && dir.dz === dirZ) {
            moves.push({ x: tx, z: tz, type: 'capture' });
          }
          // Si es a los lados o hacia atrás, no hace nada (queda bloqueado)
        }
      }
    }

    return moves;
  }
};

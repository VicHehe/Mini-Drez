import * as THREE from 'three';

export const EmperadorInvocador = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'rey', // Sigue las reglas de Jaque (no puede exponerse)

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, místico y regio)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.6,
      metalness: 0.2,
      flatShading: true 
    });

    const matMagic = new THREE.MeshStandardMaterial({
      color: 0xe0409b, // Magenta Genesis (Energía mágica)
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xe0409b,
      emissiveIntensity: 0.4,
      flatShading: true
    });

    const matGold = new THREE.MeshStandardMaterial({
      color: 0xf2c96b,
      roughness: 0.3,
      metalness: 0.9,
      flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Túnica / Cuerpo (Cónico alto)
    const robeGeo = new THREE.CylinderGeometry(0.18, 0.35, 0.65, 8);
    const robe = new THREE.Mesh(robeGeo, mat);
    robe.position.y = 0.45;
    group.add(robe);

    // 3. Capucha mística (Cono hacia atrás)
    const hoodGeo = new THREE.ConeGeometry(0.22, 0.35, 8);
    const hood = new THREE.Mesh(hoodGeo, mat);
    hood.position.set(0, 0.8, -0.05);
    hood.rotation.x = -0.2; // Inclinada hacia atrás
    group.add(hood);

    // 4. Cabeza (Sombra oscura bajo la capucha)
    const headGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
    head.position.set(0, 0.8, 0.08);
    group.add(head);

    // 5. Corona flotante (Anillo dorado)
    const crownGeo = new THREE.TorusGeometry(0.2, 0.03, 4, 8);
    const crown = new THREE.Mesh(crownGeo, matGold);
    crown.position.y = 1.0;
    crown.rotation.x = Math.PI / 2; // Acostado
    group.add(crown);

    // 6. Báculo de Invocación
    const staffGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    const staff = new THREE.Mesh(staffGeo, matGold);
    staff.position.set(-0.35, 0.55, 0.15);
    staff.rotation.z = 0.2; // Ligeramente hacia fuera
    group.add(staff);

    // 7. Gema flotante (Octaedro mágico en la punta del báculo)
    const gemGeo = new THREE.OctahedronGeometry(0.12);
    const gem = new THREE.Mesh(gemGeo, matMagic);
    gem.position.set(-0.45, 1.0, 0.2);
    group.add(gem);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO Y CONVERSIÓN
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // Movimiento restringido: SOLO ortogonal (arriba, abajo, izquierda, derecha)
    const directions = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, 
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
    ];

    for (let dir of directions) {
      const tx = x + dir.dx;
      const tz = z + dir.dz;

      // Verificar límites del tablero (8x5)
      if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
        const targetPiece = board[tx][tz];

        // 1. Movimiento normal (casilla vacía)
        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, type: 'move' });
        } 
        // 2. HABILIDAD ESPECIAL: Conversión (enemigo)
        else if (targetPiece.color === enemyColor) {
          moves.push({ 
            x: tx, 
            z: tz, 
            type: 'convert', // El motor debe interceptar esto y abrir el menú de selección
            targetX: tx, 
            targetZ: tz 
          });
        } 
        // 3. Bloqueo (aliado)
        else if (targetPiece.color !== enemyColor) {
          // No se puede mover a una casilla ocupada por un aliado
        }
      }
    }

    return moves;
  }
};

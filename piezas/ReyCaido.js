import * as THREE from 'three';

export const ReyCaido = {
  // ══════════════════════════════════════════════
  // CATEGORÍA Y PROPIEDADES ESPECIALES
  // ══════════════════════════════════════════════
  categoria: 'defensa_lejana', // El motor NO le aplicará las restricciones de Jaque

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, corrupto)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true 
    });

    const matDark = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a, // Casi negro
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    const matCorrupt = new THREE.MeshStandardMaterial({
      color: 0xe0409b, // Magenta Genesis
      emissive: 0xe0409b,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, matDark);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuerpo (Ligeramente encorvado)
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.32, 0.5, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.4;
    body.rotation.x = 0.1; // Inclinación agresiva
    group.add(body);

    // 3. Capa desgarrada
    const capeGeo = new THREE.BoxGeometry(0.45, 0.55, 0.08);
    const cape = new THREE.Mesh(capeGeo, matDark);
    cape.position.set(0, 0.4, -0.18);
    cape.rotation.x = -0.25;
    group.add(cape);

    // 4. Cabeza (Sombra)
    const headGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const head = new THREE.Mesh(headGeo, matDark);
    head.position.y = 0.75;
    group.add(head);

    // 5. Corona Torcida (Anillo + Púas)
    const crownBaseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 8);
    const crownBase = new THREE.Mesh(crownBaseGeo, matCorrupt);
    crownBase.position.set(0, 0.88, 0);
    crownBase.rotation.z = 0.2; // Torcida
    crownBase.rotation.x = 0.1;
    group.add(crownBase);

    const spikeGeo = new THREE.ConeGeometry(0.04, 0.2, 4);
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(spikeGeo, matCorrupt);
      const angle = (i / 4) * Math.PI * 2;
      spike.position.set(
        Math.cos(angle) * 0.12, 
        0.98, 
        Math.sin(angle) * 0.12
      );
      spike.rotation.z = 0.2;
      spike.rotation.x = 0.1;
      group.add(spike);
    }

    // 6. Espada (Clavada o sostenida)
    const bladeGeo = new THREE.BoxGeometry(0.06, 0.5, 0.02);
    const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.3 }));
    blade.position.set(0.35, 0.35, 0.1);
    blade.rotation.z = -0.3;
    blade.rotation.x = 0.2;
    group.add(blade);

    const hiltGeo = new THREE.BoxGeometry(0.18, 0.05, 0.05);
    const hilt = new THREE.Mesh(hiltGeo, matCorrupt);
    hilt.position.set(0.28, 0.55, 0.12);
    hilt.rotation.z = -0.3;
    hilt.rotation.x = 0.2;
    group.add(hilt);

    // 7. Aura de energía (Pequeño octaedro detrás)
    const auraGeo = new THREE.OctahedronGeometry(0.08);
    const aura = new THREE.Mesh(auraGeo, matCorrupt);
    aura.position.set(-0.25, 0.6, -0.1);
    group.add(aura);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO (Rey sin limitaciones)
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // Se mueve como un rey (1 casilla) pero sin restricciones de Jaque
    const directions = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, 
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
      { dx: 1, dz: 1 }, { dx: -1, dz: 1 }, 
      { dx: 1, dz: -1 }, { dx: -1, dz: -1 }
    ];

    for (let dir of directions) {
      const tx = x + dir.dx;
      const tz = z + dir.dz;

      // Verificar límites del tablero 8x5
      if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
        const targetPiece = board[tx][tz];

        // 1. Movimiento normal (casilla vacía)
        if (targetPiece === null) {
          moves.push({ x: tx, z: tz, type: 'move' });
        } 
        // 2. Captura normal (enemigo)
        else if (targetPiece.color === enemyColor) {
          moves.push({ x: tx, z: tz, type: 'capture' });
        }
        // (Si es aliado, se bloquea el paso en esa dirección)
      }
    }

    return moves;
  }
};

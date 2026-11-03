import * as THREE from 'three';

export const ReyClasico = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'rey', // Sujeto a las reglas de Jaque del motor principal

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, imponente)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.5,
      metalness: 0.4,
      flatShading: true 
    });

    const matGold = new THREE.MeshStandardMaterial({
      color: 0xf2c96b,
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true
    });

    const matDark = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuerpo (Cilindro ancho y bajo)
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.5, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.4;
    group.add(body);

    // 3. Capa (Caja trasera con un poco de vuelo)
    const capeGeo = new THREE.BoxGeometry(0.4, 0.55, 0.06);
    const cape = new THREE.Mesh(capeGeo, matDark);
    cape.position.set(0, 0.4, -0.16);
    cape.rotation.x = -0.1;
    group.add(cape);

    // 4. Cabeza
    const headGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.76;
    group.add(head);

    // 5. Corona (Anillo + Cruz)
    const crownBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 8);
    const crownBase = new THREE.Mesh(crownBaseGeo, matGold);
    crownBase.position.y = 0.91;
    group.add(crownBase);

    // Cruz de la corona (dos cajas cruzadas)
    const crossVGeo = new THREE.BoxGeometry(0.06, 0.18, 0.06);
    const crossV = new THREE.Mesh(crossVGeo, matGold);
    crossV.position.y = 1.03;
    group.add(crossV);

    const crossHGeo = new THREE.BoxGeometry(0.16, 0.06, 0.06);
    const crossH = new THREE.Mesh(crossHGeo, matGold);
    crossH.position.y = 1.03;
    group.add(crossH);

    // 6. Cetro (En la mano derecha)
    const staffGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
    const staff = new THREE.Mesh(staffGeo, matGold);
    staff.position.set(0.35, 0.5, 0.1);
    staff.rotation.z = -0.2;
    staff.rotation.x = 0.1;
    group.add(staff);

    const staffTopGeo = new THREE.OctahedronGeometry(0.06);
    const staffTop = new THREE.Mesh(staffTopGeo, matGold);
    staffTop.position.set(0.38, 0.76, 0.13);
    group.add(staffTop);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO Y ENROQUE TÁCTICO
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const enemyColor = player === 1 ? 'b' : 'w';
    
    // El rey solo tiene rango 1
    const directions = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 }, 
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
      { dx: 1, dz: 1 }, { dx: -1, dz: 1 }, 
      { dx: 1, dz: -1 }, { dx: -1, dz: -1 }
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
        // 2. Captura normal (enemigo)
        else if (targetPiece.color === enemyColor) {
          moves.push({ x: tx, z: tz, type: 'capture' });
        } 
        // 3. BUFF: Intercambio táctico (aliado)
        else if (targetPiece.color !== enemyColor) {
          // Es una pieza aliada. El movimiento es un "swap" (intercambio de posición)
          moves.push({ 
            x: tx, 
            z: tz, 
            type: 'swap', 
            targetX: tx, 
            targetZ: tz 
          });
        }
      }
    }

    return moves;
  }
};

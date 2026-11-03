import * as THREE from 'three';

export const Bombardero = {
  // ══════════════════════════════════════════════
  // CATEGORÍA
  // ══════════════════════════════════════════════
  categoria: 'peon',

  // ══════════════════════════════════════════════
  // DISEÑO 3D (Low-poly, peligroso)
  // ══════════════════════════════════════════════
  createMesh: (colorHex) => {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.6,
      metalness: 0.3,
      flatShading: true 
    });

    const matDanger = new THREE.MeshStandardMaterial({
      color: 0xe0409b, // Magenta Genesis (Peligro/Explosivo)
      emissive: 0xe0409b,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      flatShading: true
    });

    const matDark = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      flatShading: true
    });

    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 8);
    const base = new THREE.Mesh(baseGeo, mat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Cuerpo abultado (Bomba)
    const bodyGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.45;
    group.add(body);

    // 3. Bandas metálicas (Cruces para dar look de bomba)
    const bandHGeo = new THREE.BoxGeometry(0.7, 0.08, 0.08);
    const bandH = new THREE.Mesh(bandHGeo, matDark);
    bandH.position.y = 0.45;
    group.add(bandH);

    const bandVGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
    const bandV = new THREE.Mesh(bandVGeo, matDark);
    bandV.position.y = 0.45;
    group.add(bandV);

    // 4. Núcleo explosivo visible (Pequeña esfera brillante)
    const coreGeo = new THREE.OctahedronGeometry(0.15);
    const core = new THREE.Mesh(coreGeo, matDanger);
    core.position.y = 0.75;
    group.add(core);

    // 5. Mecha (Cilindro fino)
    const fuseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4);
    const fuse = new THREE.Mesh(fuseGeo, matDark);
    fuse.position.set(0, 0.9, 0);
    fuse.rotation.z = 0.3;
    group.add(fuse);

    // 6. Chispa encendida (Pequeño cubo brillante)
    const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const spark = new THREE.Mesh(sparkGeo, matDanger);
    spark.position.set(0.06, 1.0, 0);
    group.add(spark);

    return group;
  },

  // ══════════════════════════════════════════════
  // LÓGICA DE MOVIMIENTO
  // ══════════════════════════════════════════════
  getValidMoves: (x, z, player, board) => {
    const moves = [];
    const dir = player === 1 ? 1 : -1;
    const enemyColor = player === 1 ? 'b' : 'w';
    
    const nextZ = z + dir;

    // 1. Avance de 1 casilla (solo si está vacía)
    if (nextZ >= 0 && nextZ < 5 && board[x][nextZ] === null) {
      moves.push({ x: x, z: nextZ, capture: false });
    }

    // 2. Captura en diagonal (como un peón normal)
    const diagonals = [-1, 1];
    for (const dx of diagonals) {
      const capX = x + dx;
      const capZ = z + dir;
      
      if (capX >= 0 && capX < 8 && capZ >= 0 && capZ < 5) {
        const targetPiece = board[capX][capZ];
        if (targetPiece !== null && targetPiece.color === enemyColor) {
          moves.push({ x: capX, z: capZ, capture: true });
        }
      }
    }

    return moves;
  },

  // ══════════════════════════════════════════════
  // HABILIDAD DE MUERTE (EXPLOSIÓN)
  // ══════════════════════════════════════════════
  // Esta función devuelve las coordenadas de las casillas afectadas
  // cuando el Bombardero muere.
  getExplosionArea: (x, z) => {
    const targets = [];
    
    // El centro (donde muere)
    targets.push({ x: x, z: z });
    
    // Las 4 casillas ortogonales (arriba, abajo, izquierda, derecha)
    const orthogonals = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 },
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 }
    ];

    for (let dir of orthogonals) {
      const tx = x + dir.dx;
      const tz = z + dir.dz;
      
      // Verificar que estén dentro del tablero 8x5
      if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
        targets.push({ x: tx, z: tz });
      }
    }

    return targets;
  }
};

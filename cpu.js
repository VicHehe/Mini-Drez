export function elegirMovimientoCPU(board, piezasCPU, piezasJugador, dificultad, validator, getValidMovesWrapper) {
  const movimientos = [];

  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 8; z++) {
      const pieza = board[x][z];
      if (pieza && pieza.color === 'b') { 
        // Usamos el wrapper para traducir coordenadas
        let movs = getValidMovesWrapper(pieza.def, x, z, 2, board, pieza.hasMoved, pieza.isCharging);
        
        // Filtrar movimientos que dejan al rey en jaque
        if (validator) {
          movs = movs.filter(m => validator(x, z, m.x, m.z, board, pieza, m.type === 'swap'));
        }
        
        movs.forEach(m => movimientos.push({ ...m, fromX: x, fromZ: z, pieza }));
      }
    }
  }

  if (movimientos.length === 0) return null;

  let factorAleatorio = 0;
  if (dificultad === 'facil') factorAleatorio = 0.8;
  else if (dificultad === 'medio') factorAleatorio = 0.4;
  else if (dificultad === 'dificil') factorAleatorio = 0.1;
  else if (typeof dificultad === 'number') {
    factorAleatorio = Math.max(0, 1 - (dificultad - 500) / 2000);
  }

  if (Math.random() < factorAleatorio) {
    return movimientos[Math.floor(Math.random() * movimientos.length)];
  }

  let mejorMovimiento = null;
  let mejorPuntuacion = -Infinity;

  for (const mov of movimientos) {
    let puntuacion = 0;

    if (mov.capture) {
      const victima = board[mov.x][mov.z];
      if (victima) {
        const val = { 'peon': 10, 'rey': 100, 'defensa_cercana': 30, 'defensa_lejana': 40 };
        puntuacion += val[victima.def.categoria] || 10;
      }
    }

    // Centro del tablero 5x8 es (2, 3.5)
    const centroX = 2;
    const centroZ = 3.5;
    const distActual = Math.abs(mov.fromX - centroX) + Math.abs(mov.fromZ - centroZ);
    const distNueva = Math.abs(mov.x - centroX) + Math.abs(mov.z - centroZ);
    puntuacion += (distActual - distNueva) * 0.5;

    let peligro = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        const tx = mov.x + dx;
        const tz = mov.z + dz;
        if (tx >= 0 && tx < 5 && tz >= 0 && tz < 8) {
          const vecino = board[tx][tz];
          if (vecino && vecino.color === 'w') peligro += 5;
        }
      }
    }
    puntuacion -= peligro;

    if (mov.pieza.def.categoria === 'rey') {
      puntuacion += 10;
    }

    puntuacion += Math.random() * 2;

    if (puntuacion > mejorPuntuacion) {
      mejorPuntuacion = puntuacion;
      mejorMovimiento = mov;
    }
  }

  return mejorMovimiento;
}

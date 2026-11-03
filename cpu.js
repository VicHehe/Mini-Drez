// cpu.js

// Valores base de las piezas (para la evaluación)
const VALOR_PIEZA = {
  'peon': 10,
  'rey': 100,
  'defensa_cercana': 30,
  'defensa_lejana': 40
};

export function elegirMovimientoCPU(board, piezasCPU, piezasJugador, dificultad) {
  // Recopilar todos los movimientos válidos de la CPU
  const movimientos = [];

  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 5; z++) {
      const pieza = board[x][z];
      if (pieza && pieza.color === 'b') { // Asumiendo que la CPU es 'b' (negras)
        const movs = pieza.logic.getValidMoves(x, z, 2, board);
        movs.forEach(m => movimientos.push({ ...m, fromX: x, fromZ: z, pieza }));
      }
    }
  }

  if (movimientos.length === 0) return null;

  // Factor de aleatoriedad según dificultad
  let factorAleatorio = 0;
  if (dificultad === 'facil') factorAleatorio = 0.8;
  else if (dificultad === 'medio') factorAleatorio = 0.4;
  else if (dificultad === 'dificil') factorAleatorio = 0.1;
  else if (typeof dificultad === 'number') {
    // Mapear ELO a probabilidad de aleatorio (más ELO = menos aleatorio)
    factorAleatorio = Math.max(0, 1 - (dificultad - 500) / 2000);
  }

  // Si cae en el factor aleatorio, elegir uno al azar
  if (Math.random() < factorAleatorio) {
    return movimientos[Math.floor(Math.random() * movimientos.length)];
  }

  // Si no, evaluar cada movimiento
  let mejorMovimiento = null;
  let mejorPuntuacion = -Infinity;

  for (const mov of movimientos) {
    let puntuacion = 0;

    // 1. Premiar capturas
    if (mov.capture) {
      const victima = board[mov.x][mov.z];
      if (victima) {
        puntuacion += VALOR_PIEZA[victima.categoria] || 10;
      }
    }

    // 2. Premiar el avance (control del centro)
    const centroX = 3.5;
    const centroZ = 2;
    const distActual = Math.abs(mov.fromX - centroX) + Math.abs(mov.fromZ - centroZ);
    const distNueva = Math.abs(mov.x - centroX) + Math.abs(mov.z - centroZ);
    puntuacion += (distActual - distNueva) * 0.5;

    // 3. Penalizar moverse a casillas donde pueda ser capturado fácilmente
    // (Simulación rápida: si el destino está amenazado por el jugador)
    let peligro = 0;
    // Aquí podrías iterar sobre las piezas del jugador y ver si tienen movimiento a (mov.x, mov.z)
    // Para simplificar, solo revisamos si hay piezas enemigas adyacentes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        const tx = mov.x + dx;
        const tz = mov.z + dz;
        if (tx >= 0 && tx < 8 && tz >= 0 && tz < 5) {
          const vecino = board[tx][tz];
          if (vecino && vecino.color === 'w') {
            peligro += 5; // Penalización simple
          }
        }
      }
    }
    puntuacion -= peligro;

    // 3.5 Si es un tipo rey, priorizar la seguridad (moverse a casillas no amenazadas)
    if (mov.pieza.categoria === 'rey') {
      // Lógica adicional de seguridad para reyes
      puntuacion += 10; // Priorizar moverse si está en peligro
    }

    // 4. Añadir un pequeño ruido aleatorio para que no sea perfecto
    puntuacion += Math.random() * 2;

    if (puntuacion > mejorPuntuacion) {
      mejorPuntuacion = puntuacion;
      mejorMovimiento = mov;
    }
  }

  return mejorMovimiento;
}

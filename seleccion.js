import { PeonClasico } from './piezas/PeonClasico.js';
import { Bandido } from './piezas/Bandido.js';
import { GuardiaGigante } from './piezas/GuardiaGigante.js';
import { Reina } from './piezas/Reina.js';
import { ReyClasico } from './piezas/ReyClasico.js';
import { EmperadorInvocador } from './piezas/EmperadorInvocador.js';
import { Caballo } from './piezas/Caballo.js';
import { Alfil } from './piezas/Alfil.js';
import { Bombardero } from './piezas/Bombardero.js';
import { Torre } from './piezas/Torre.js';
import { Fantasma } from './piezas/Fantasma.js';
import { ReyCaido } from './piezas/ReyCaido.js';

const PIEZAS = {
  peon: [
    { obj: PeonClasico, nombre: 'PEÓN CLÁSICO' },
    { obj: Bandido, nombre: 'BANDIDO' },
    { obj: GuardiaGigante, nombre: 'GUARDIA GIGANTE' }
  ],
  rey: [
    { obj: Reina, nombre: 'REINA' },
    { obj: ReyClasico, nombre: 'REY CLÁSICO' },
    { obj: EmperadorInvocador, nombre: 'EMPERADOR' }
  ],
  defensa_cercana: [
    { obj: Caballo, nombre: 'CABALLO' },
    { obj: Alfil, nombre: 'ALFIL' },
    { obj: Bombardero, nombre: 'BOMBARDERO' }
  ],
  defensa_lejana: [
    { obj: Torre, nombre: 'TORRE' },
    { obj: Fantasma, nombre: 'FANTASMA' },
    { obj: ReyCaido, nombre: 'REY CAÍDO' }
  ]
};

const NOMBRES_CAT = {
  peon: 'PEONES',
  rey: 'REYES',
  defensa_cercana: 'DEFENSAS CERCANAS',
  defensa_lejana: 'DEFENSAS LEJANAS'
};

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

export function iniciarSeleccion(onComplete) {
  const overlay = document.createElement('div');
  overlay.id = 'overlay-seleccion';
  
  const style = document.createElement('style');
  style.textContent = `
    #overlay-seleccion {
      position: fixed; inset: 0; z-index: 100;
      background: #050714;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: monospace; color: #c9d1ff;
      letter-spacing: 0.1em; overflow-y: auto; padding: 20px;
    }
    .screen { display: none; text-align: center; width: 100%; }
    .screen.active { display: block; }
    h2 { font-size: 24px; color: #2fd4d4; text-shadow: 0 0 10px #2fd4d4; margin-bottom: 30px;}
    button {
      background: transparent; color: #c9d1ff; border: 2px solid #2fd4d4;
      padding: 10px 20px; margin: 10px; cursor: pointer; font-family: monospace;
      font-size: 16px; transition: all 0.2s;
    }
    button:hover { background: #2fd4d4; color: #050714; box-shadow: 0 0 15px #2fd4d4; }
    .input-group { margin: 20px 0; }
    input[type="number"] {
      background: transparent; border: 1px solid #2fd4d4; color: #f2c96b;
      padding: 8px; font-family: monospace; font-size: 16px; width: 100px; text-align: center;
    }
    .draft-container { display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 800px; margin: 0 auto; }
    .categoria-row { background: rgba(255,255,255,0.05); padding: 15px; border: 1px solid rgba(47,212,212,0.3); }
    .categoria-titulo { font-size: 14px; color: #f2c96b; margin-bottom: 10px; text-align: left; }
    .opciones { display: flex; justify-content: space-around; gap: 10px; }
    .opcion {
      flex: 1; padding: 15px; border: 2px dashed #555; display: flex;
      align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
      font-size: 12px; text-align: center;
    }
    .opcion:hover { border-color: #2fd4d4; background: rgba(47,212,212,0.1); }
    .opcion.elegida { border: 2px solid #2fd4d4; background: rgba(47,212,212,0.3); pointer-events: none; color: #2fd4d4; }
    .opcion.cpu { border: 2px solid #e0409b; background: rgba(224,64,155,0.2); pointer-events: none; color: #e0409b; }
    #btn-empezar { display: none; margin-top: 30px; color: #f2c96b; border-color: #f2c96b; font-weight: bold; }
    #btn-empezar:hover { background: #f2c96b; color: #050714; box-shadow: 0 0 15px #f2c96b; }
  `;
  document.head.appendChild(style);

  overlay.innerHTML = `
    <div class="screen active" id="screen-modo">
      <h2>MINI-DREZ</h2>
      <button id="btn-local">JUGAR LOCAL</button>
      <button id="btn-cpu">JUGAR VS CPU</button>
    </div>

    <div class="screen" id="screen-dificultad">
      <h2>DIFICULTAD</h2>
      <button class="btn-dif" data-dif="facil">FÁCIL</button>
      <button class="btn-dif" data-dif="medio">MEDIO</button>
      <button class="btn-dif" data-dif="dificil">DIFÍCIL</button>
      <div class="input-group">
        <p>O introduce ELO (500-2500):</p>
        <input type="number" id="elo-input" min="500" max="2500" value="1200">
        <button id="btn-elo">JUGAR CON ELO</button>
      </div>
    </div>

    <div class="screen" id="screen-draft">
      <h2>SELECCIONA TUS PIEZAS</h2>
      <div class="draft-container" id="draft-container"></div>
      <button id="btn-empezar">EMPEZAR PARTIDA</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const screenModo = document.getElementById('screen-modo');
  const screenDif = document.getElementById('screen-dificultad');
  const screenDraft = document.getElementById('screen-draft');
  const draftContainer = document.getElementById('draft-container');
  const btnEmpezar = document.getElementById('btn-empezar');

  let modo = 'local';
  let dificultad = 'medio';
  let piezasJugador = {};
  let piezasCPU = {};
  let seleccionesHechas = 0;

  document.getElementById('btn-local').onclick = () => {
    modo = 'local';
    iniciarDraft();
  };
  
  document.getElementById('btn-cpu').onclick = () => {
    modo = 'cpu'; // CORRECCIÓN: Faltaba asignar el modo
    screenModo.classList.remove('active');
    screenDif.classList.add('active');
  };

  document.querySelectorAll('.btn-dif').forEach(btn => {
    btn.onclick = () => {
      dificultad = btn.dataset.dif;
      iniciarDraft();
    };
  });

  document.getElementById('btn-elo').onclick = () => {
    const elo = parseInt(document.getElementById('elo-input').value);
    if (elo >= 500 && elo <= 2500) {
      dificultad = elo;
      iniciarDraft();
    } else {
      alert("ELO debe estar entre 500 y 2500");
    }
  };

  function iniciarDraft() {
    screenModo.classList.remove('active');
    screenDif.classList.remove('active');
    screenDraft.classList.add('active');

    draftContainer.innerHTML = '';
    seleccionesHechas = 0;
    piezasJugador = {};
    piezasCPU = {};

    Object.keys(PIEZAS).forEach(cat => {
      const opciones = shuffle([...PIEZAS[cat]]).slice(0, 2);
      
      const row = document.createElement('div');
      row.className = 'categoria-row';
      row.innerHTML = `<div class="categoria-titulo">${NOMBRES_CAT[cat]}</div>`;
      
      const opcionesDiv = document.createElement('div');
      opcionesDiv.className = 'opciones';

      opciones.forEach(piezaData => {
        const div = document.createElement('div');
        div.className = 'opcion';
        div.innerHTML = `<span>${piezaData.nombre}</span>`;
        
        div.onclick = () => {
          div.classList.add('elegida');
          piezasJugador[cat] = piezaData.obj;
          
          const otraPiezaData = opciones.find(p => p !== piezaData);
          const otraDiv = opcionesDiv.querySelectorAll('.opcion')[opciones.indexOf(otraPiezaData)];
          otraDiv.classList.add('cpu');
          piezasCPU[cat] = otraPiezaData.obj;

          seleccionesHechas++;
          if (seleccionesHechas === 4) {
            btnEmpezar.style.display = 'inline-block';
          }
        };
        opcionesDiv.appendChild(div);
      });

      row.appendChild(opcionesDiv);
      draftContainer.appendChild(row);
    });
  }

  btnEmpezar.onclick = () => {
    overlay.remove();
    style.remove();
    onComplete({ modo, dificultad, piezasJugador, piezasCPU });
  };
}

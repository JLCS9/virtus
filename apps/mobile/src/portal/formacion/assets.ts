// Imágenes de Formación, las mismas que importa la web (src/formacion/*, src/assets/*).

// Portadas del listado (src/assets/formacion/, reducidas a 800 px).
export const img01 = require('./assets/escultura-01-atleta.jpg');
export const cuadro01 = require('./assets/cuadro-01-caminante-friedrich.jpg');
export const cuadro03 = require('./assets/cuadro-03-pastoral-cuyp.jpg');
export const cuadro05 = require('./assets/cuadro-05-veleros-heade.jpg');
export const cuadro07 = require('./assets/cuadro-07-rio-corot.webp');
export const cuadro08 = require('./assets/cuadro-08-fel-c1.jpg');
export const cuadro09 = require('./assets/cuadro-09-fel-c2.jpg');
export const cuadro10 = require('./assets/cuadro-10-mel-c3.jpg');

// Diagramas y retratos (src/formacion/ y src/formacion/assets/).
export const diagramaVirtudesImg = require('../web/formacion/assets/diagrama-virtudes.png');
export const diagramaTemperamentosImg = require('../web/formacion/assets/diagrama-temperamentos.webp');
export const DIAGRAMA_TEMP: Record<string, number> = {
  COL: require('../web/formacion/assets/diagrama-COL.png'),
  MEL: require('../web/formacion/assets/diagrama-MEL.png'),
  SAN: require('../web/formacion/assets/diagrama-SAN.png'),
  FLE: require('../web/formacion/assets/diagrama-FLE.png'),
};

const retratoCOL = require('../web/formacion/assets/retrato-COL.jpg');
const retratoMEL = require('../web/formacion/assets/retrato-MEL.jpg');
const retratoSAN = require('../web/formacion/assets/retrato-SAN.jpg');
const retratoFLE = require('../web/formacion/assets/retrato-FLE.jpg');
export const RETRATO_TEMP: Record<string, number> = { COL: retratoCOL, MEL: retratoMEL, SAN: retratoSAN, FLE: retratoFLE };
export const CONCEPTO_A_RETRATO: Record<string, number> = {
  Temperamento: require('../web/formacion/assets/retrato-TEMP.jpg'),
  'Temperamento colérico': retratoCOL,
  'Temperamento melancólico': retratoMEL,
  'Temperamento sanguíneo': retratoSAN,
  'Temperamento flemático': retratoFLE,
  Carácter: require('../web/formacion/assets/retrato-caracter.jpg'),
  Prudencia: require('../web/formacion/assets/retrato-prudencia.jpg'),
  Fortaleza: require('../web/formacion/assets/retrato-fortaleza.jpg'),
  'Dominio de sí': require('../web/formacion/assets/retrato-dominio.jpg'),
  Justicia: require('../web/formacion/assets/retrato-justicia.jpg'),
  Magnanimidad: require('../web/formacion/assets/retrato-magnanimidad.jpg'),
};

// Test de carácter y del corazón (src/assets/).
const faceJudith = require('../web/assets/Judith.jpg.jpeg');
export const CHAR_FACES: Record<string, number> = {
  P: require('../web/assets/Pastorelle.jpg.jpeg'),
  C: require('../web/assets/Courage.jpg.jpeg'),
  S: faceJudith,
  J: faceJudith,
  M: require('../web/assets/Paul.jpg.jpeg'),
  H: require('../web/assets/Jean.jpg.jpeg'),
};
export const HEART_FACES: Record<string, number> = {
  R: require('../web/assets/heart-disorder-R.jpeg'),
  VR: require('../web/assets/heart-disorder-VR.jpeg'),
  VM: require('../web/assets/heart-disorder-VM.jpeg'),
  VI: require('../web/assets/heart-disorder-VI.jpeg'),
  VC: require('../web/assets/heart-disorder-VC.jpeg'),
  SV: require('../web/assets/heart-disorder-SV.jpeg'),
  SI: require('../web/assets/heart-disorder-SI.jpeg'),
  SC: require('../web/assets/heart-disorder-SC.jpeg'),
};

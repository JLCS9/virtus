// Metro: configuración por defecto de Expo + un arreglo para pdf-lib (cuaderno personal en PDF).
// pdf-lib trae tslib 1.x, cuyo envoltorio ESM (`modules/index.js`) importa `default` de un fichero
// CommonJS; con Metro ese `default` llega vacío y la pantalla del módulo no carga
// («Cannot destructure property '__extends' of 'tslib.default'»). Se resuelve `tslib` a su versión
// ES (`tslib.es6.js`), que exporta cada helper por nombre.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const resolverPorDefecto = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    const resuelto = (resolverPorDefecto ?? context.resolveRequest)(context, 'tslib/package.json', platform);
    if (resuelto.type === 'sourceFile') {
      return { type: 'sourceFile', filePath: path.join(path.dirname(resuelto.filePath), 'tslib.es6.js') };
    }
  }
  return (resolverPorDefecto ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;

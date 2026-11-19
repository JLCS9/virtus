// Babel por defecto de Expo. El React Compiler no se aplica a src/web/ (copia del código de la web,
// escrito para React 18 sin el compilador): así se comporta igual que en virtuousleadership.com.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        { 'react-compiler': { sources: (fichero) => !/[\\/]src[\\/]web[\\/]/.test(fichero) } },
      ],
    ],
  };
};

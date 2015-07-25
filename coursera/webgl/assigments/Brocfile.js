var babel = require('broccoli-babel-transpiler');

assigments = babel('es6', {
    browserPolyfill: true
});

module.exports = assigments;

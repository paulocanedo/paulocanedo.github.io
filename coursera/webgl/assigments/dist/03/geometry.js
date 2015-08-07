'use strict';

var geometry = (function () {
    return {
        multMatriceVector: function multMatriceVector(matrice, vector) {
            var result = [];
            for (var i = 0; i < vector.length; i++) {
                var mline = matrice[i];

                var sum = 0;
                for (var j = 0; j < vector.length; j++) {
                    sum += mline[j] * vector[j];
                }
                result.push(sum);
            }
            return result;
        },
        multMatrixVertices: function multMatrixVertices(translateMatrix, vertices) {
            var result = [];
            for (var i = 0; i < vertices.length; i++) {
                result.push(geometry.multMatriceVector(translateMatrix, vec4(vertices[i], 1)).slice(0, 3));
            }
            return result;
        }
    };
})();

var Axis = (function () {
    return Object.defineProperties({

        toString: function toString(axis) {
            if (axis === Axis.X) {
                return 'x';
            } else if (axis === Axis.Y) {
                return 'y';
            } else if (axis === Axis.Z) {
                return 'z';
            } else if (axis === Axis.W) {
                return 'w';
            }
            throw Error('Invalid axis: ' + axis);
        }
    }, {
        X: {
            get: function get() {
                return 0;
            },
            configurable: true,
            enumerable: true
        },
        Y: {
            get: function get() {
                return 1;
            },
            configurable: true,
            enumerable: true
        },
        Z: {
            get: function get() {
                return 2;
            },
            configurable: true,
            enumerable: true
        },
        W: {
            get: function get() {
                return 3;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

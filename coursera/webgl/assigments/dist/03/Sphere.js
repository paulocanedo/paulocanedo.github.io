'use strict';

var Sphere = (function () {
    var build = function build(radius, latitudeBands, longitudeBands) {
        var vertexPositionData = [],
            indexData = [],
            colorData = [];
        for (var _latNumber = 0; _latNumber <= latitudeBands; _latNumber++) {
            var theta = _latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var _longNumber = 0; _longNumber <= longitudeBands; _longNumber++) {
                var phi = _longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                vertexPositionData.push(vec3(radius * x, radius * y, radius * z));
                colorData.push(vec4((x + 1) / 2, (y + 1) / 2, (z + 1) / 2, 1.0));
            }
        }

        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = latNumber * (longitudeBands + 1) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }
        return { vertices: vertexPositionData, indices: indexData, colors: colorData };
    };

    var object = build(1.0, 32, 32);
    return {
        create: function create(_ref) {
            var id = _ref.id;

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                flatIndices: new Uint16Array(object.indices),
                flatColors: flatten(object.colors)
            });
        }
    };
})();

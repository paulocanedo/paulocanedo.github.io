'use strict';

var Cylinder = (function () {
    var build = function build(radiusTop, radiusBottom, npoints) {
        var vertexPositionData = [],
            indexData = [],
            colorData = [];

        var angle = Math.PI * 2 / npoints;
        for (var a = 0; a < Math.PI * 2; a += angle) {
            var x = Math.cos(a) * radiusTop;
            var z = Math.sin(a) * radiusTop;

            vertexPositionData.push(vec3(x, 0.5, z));
            colorData.push((x + 1) / 2, 1.0, (z + 1) / 2, 1);
        }
        for (var a = 0; a < Math.PI * 2; a += angle) {
            var x = Math.cos(a) * radiusBottom;
            var z = Math.sin(a) * radiusBottom;

            vertexPositionData.push(vec3(x, -0.5, z));
            colorData.push((x + 1) / 2, 0.0, (z + 1) / 2, 1);
        }

        var half = vertexPositionData.length / 2;
        for (var i = 0; i < half - 1; i++) {
            indexData.push(i);
            indexData.push(i + 1);
            indexData.push(half + i);

            indexData.push(i + 1);
            indexData.push(half + i);
            indexData.push(half + i + 1);
        }
        indexData.push(half - 1, 0, vertexPositionData.length - 1, 0, vertexPositionData.length - 1, half);

        return { vertices: vertexPositionData, indices: indexData, colors: colorData };
    };

    var object = build(1.0, .5, 32);

    return {
        create: function create(_ref) {
            var id = _ref.id;

            return ObjectCreator.create({
                id: id,
                name: 'Cylinder',
                vertices: object.vertices,
                flatIndices: new Uint16Array(object.indices),
                flatColors: flatten(object.colors)
            });
        }
    };
})();

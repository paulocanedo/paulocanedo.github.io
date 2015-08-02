let Sphere = (() => {
    let build = (radius, latitudeBands, longitudeBands) => {
        let vertexPositionData = [], indexData = [];
        for (let latNumber=0; latNumber <= latitudeBands; latNumber++) {
            let theta = latNumber * Math.PI / latitudeBands;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (let longNumber=0; longNumber <= longitudeBands; longNumber++) {
                let phi = longNumber * 2 * Math.PI / longitudeBands;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);

                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;

                vertexPositionData.push(vec3(radius * x, radius * y, radius * z));
            }
        }

        for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }
        return {vertices: vertexPositionData, indices: indexData};
    };

    return {
        create(map) {
            let bands = 32;
            let info = build(1, bands, bands);
            let _vertices = info.vertices;
            let _indicesTriangles = info.indices;
            let _colors = _vertices.map(elem => {
                let length = _vertices.length;
                let color = vec4(
                    Math.abs(elem[0]),
                    Math.abs(elem[1]),
                    Math.abs(elem[2]),
                    1.0);
                return color;
            });

            return {
                get colors() { return _colors; },
                get vertices() { return _vertices; },
                get indices() { return _indicesTriangles; },
            };
        },
    };
})();

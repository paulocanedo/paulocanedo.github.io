let Cylinder = (() => {
    let build = (radiusTop, radiusBottom, npoints) => {
        let vertexPositionData = [], indexData = [];

        let angle = Math.PI * 2 / npoints;
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a) * radiusTop;
            let z = Math.sin(a) * radiusTop;

            vertexPositionData.push(vec3(x, 1.0, z));
        }
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a) * radiusBottom;
            let z = Math.sin(a) * radiusBottom;

            vertexPositionData.push(vec3(x, 0.0, z));
        }

        let half = vertexPositionData.length / 2;
        for(let i=0; i<half-1; i++) {
            indexData.push(i);
            indexData.push(i+1);
            indexData.push(half+i);

            indexData.push(i+1);
            indexData.push(half+i);
            indexData.push(half+i+1);
        }
        indexData.push(half-1,0,vertexPositionData.length-1,0,vertexPositionData.length-1,half);

        return {vertices: vertexPositionData, indices: indexData};
    };

    return {
        create({id, radiusTop, radiusBottom, bands}) {
            let info = build(radiusTop, radiusBottom, bands);

            let _id = id;
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
                get id() { return _id },
                get colors() { return _colors; },
                get vertices() { return _vertices; },
                get indices() { return _indicesTriangles; },
                toString() { return `Cylinder [${_id}]`; },

                translate(x, y, z) {
                    _vertices = geometry.translateObject(x, y, z, _vertices);
                }
            };
        },
    };
})();

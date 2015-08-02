let Cone = (() => {
    let build = (radius, npoints) => {
        let vertexPositionData = [], indexData = [];
        let angle = Math.PI * 2 / npoints;
        vertexPositionData.push(vec3(0.0, 1.0, 0.0));
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a) * radius;
            let z = Math.sin(a) * radius;

            vertexPositionData.push(vec3(x, 0.0, z));
        }

        indexData.push(0, vertexPositionData.length-1, 1);
        for(let i=1; i<vertexPositionData.length-1; i++) {
            indexData.push(0);
            indexData.push(i);
            indexData.push(i+1);
        }

        for(let i=1; i<vertexPositionData.length-1; i++) {
            indexData.push(i);
            indexData.push(i+1);
            indexData.push(vertexPositionData.length-i);
        }
        return {vertices: vertexPositionData, indices: indexData};
    };

    return {
        create(map) {
            let info = build(1, 32);
            let _vertices = info.vertices;
            let _indicesTriangles = info.indices;
            let _colors = _vertices.map(elem => {
                let length = _vertices.length;
                let color = vec4(
                    Math.abs(elem[0]),
                    Math.abs(elem[1]),
                    Math.abs(elem[2]),
                    1.0);
                // return vec4(0,0,1,1);
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

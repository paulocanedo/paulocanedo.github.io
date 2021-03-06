let Cone = (() => {
    let build = (radius, npoints) => {
        let vertexPositionData = [], indexData = [], colorData = [];
        let angle = Math.PI * 2 / npoints;

        colorData.push(vec4(0.0, 1.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0));
        vertexPositionData.push(vec3(0.0, -0.5, 0.0), vec3(0.0, 0.5, 0.0));
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a) * radius;
            let z = Math.sin(a) * radius;

            colorData.push(vec4(Math.abs(x), 0.0, Math.abs(z), 1.0));
            vertexPositionData.push(vec3(x, -0.5, z));
        }

        let length = vertexPositionData.length;
        for(let i=0; i<length-2; i++) {
            indexData.push(0);
            indexData.push(i+1);
            indexData.push(i+2);
        }
        indexData.push(0, length-1, 2);

        for(let i=1; i<length-1; i++) {
            indexData.push(1);
            indexData.push(i);
            indexData.push(i+1);
        }
        indexData.push(1, length-1, 2);
        return {vertices: vertexPositionData, indices: indexData, colors: colorData};
    };

    let object = build(1.0, 32);

    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Cone',
                vertices: object.vertices,
                flatIndices: new Uint16Array(object.indices),
                flatColors: flatten(object.colors)
            });
        }
    };

    // return {
    //     create({id, radius, bands}) {
    //         let info = build(radius, bands);
    //
    //         let _id = id;
    //         let _vertices = info.vertices;
    //         let _indicesTriangles = info.indices;
    //         let _colors = _vertices.map(elem => {
    //             let length = _vertices.length;
    //             let color = vec4(
    //                 Math.abs(elem[0]),
    //                 Math.abs(elem[1]),
    //                 Math.abs(elem[2]),
    //                 1.0);
    //             return color;
    //         });
    //
    //         return {
    //             get id() { return _id },
    //             get colors() { return _colors; },
    //             get vertices() { return _vertices; },
    //             get indices() { return _indicesTriangles; },
    //             toString() { return `Cone [${_id}]`; },
    //
    //             translate(x, y, z) {
    //                 _vertices = geometry.translateObject(x, y, z, _vertices);
    //             }
    //         };
    //     },
    // };
})();

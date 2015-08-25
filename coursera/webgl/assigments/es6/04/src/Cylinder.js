let Cylinder = (() => {
    let build = (radiusTop, radiusBottom, npoints) => {
        let vertexPositionData = [], indexData = [], normalData = [];

        let angle = Math.PI * 2 / npoints;
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a);
            let z = Math.sin(a);

            normalData.push(vec3(x, 0.5, z));
            vertexPositionData.push(vec3(x * radiusTop, 0.5, z * radiusTop));
        }
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a);
            let z = Math.sin(a);

            normalData.push(vec3(x, -0.5, z));
            vertexPositionData.push(vec3(x * radiusBottom, -0.5, z * radiusBottom));
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

        return {vertices: vertexPositionData, indices: indexData, normals: normalData};
    };

    let object = build(1.0, 1.0, 32);

    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Cylinder',
                vertices: object.vertices,
                normals: object.normals,
                flatIndices: new Uint16Array(object.indices),
                material: {
                    ambientColor: vec4(1.0, 0.0, 0.0, 1.0),
                    diffuseColor: vec4(1.0, 0.2, 0.0, 1.0),
                    specularColor: vec4(1.0, 0.2, 0.0, 1.0),
                    shininess: 100.0
                }
            });
        }
    };
})();

let Cone = (() => {
    let build = (radius, npoints) => {
        let vertexPositionData = [], indexData = [], normalData = [];
        let angle = Math.PI * 2 / npoints;

        normalData.push(vec3(0.0, -0.5, 0.0), vec3(0.0, 0.5, 0.0));
        vertexPositionData.push(vec3(0.0, -0.5, 0.0), vec3(0.0, 0.5, 0.0));
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a);
            let z = Math.sin(a);

            normalData.push(vec3(x, -0.5, z));
            vertexPositionData.push(vec3(radius * x, -0.5, radius * z));
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
        return {vertices: vertexPositionData, indices: indexData, normals: normalData};
    };

    let object = build(1.0, 32);

    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Cone',
                vertices: object.vertices,
                flatIndices: new Uint16Array(object.indices),
                flatNormals: flatten(object.normals),
                material: {
                    ambientColor: vec4(1.0, 0.0, 1.0, 1.0),
                    diffuseColor: vec4(0.0, 0.8, 1.0, 1.0),
                    specularColor: vec4(0.0, 0.8, 1.0, 1.0),
                    shininess: 200.0
                }
            });
        }
    };
})();

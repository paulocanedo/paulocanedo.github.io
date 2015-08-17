let Sphere = (() => {
    let build = (radius, latitudeBands, longitudeBands) => {
        let vertexPositionData = [], indexData = [], normalData = [];
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

                normalData.push(vec3(x, y, z));
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
        return {vertices: vertexPositionData, indices: indexData, normals: normalData};
    };

    let object = build(1.0, 32, 32);
    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                flatIndices: new Uint16Array(object.indices),
                flatNormals: flatten(object.normals),
                material: {
                    ambientColor: vec4(1.0, 0.0, 1.0, 1.0),
                    diffuseColor: vec4(1.0, 0.8, 0.0, 1.0),
                    specularColor: vec4(1.0, 0.8, 0.0, 1.0),
                    shininess: 100.0
                }
            });
        }
    };
})();

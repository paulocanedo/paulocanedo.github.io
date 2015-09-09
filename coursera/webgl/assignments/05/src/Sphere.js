let SphereLatLongTriangles = (() => {
    let build = (latitudeBands, longitudeBands) => {
        let vertexPositionData = [], indexData = [], normalData = [], texCoordsData = [];
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
                let u = 1 - longNumber / longitudeBands;
                let v = 1 - latNumber / latitudeBands;

                texCoordsData.push(vec2(u, v));
                vertexPositionData.push(vec3(x, y, z));
            }
        }

        let vdata = [], tdata = [];
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
          for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;

            let a = vertexPositionData[first];
            let b = vertexPositionData[second];
            let c = vertexPositionData[first + 1];
            let d = vertexPositionData[second + 1];

            vdata.push(a, b, c);
            vdata.push(b, d, c);
            tdata.push(vertexPositionData[first], vertexPositionData[second], vertexPositionData[first + 1],
                       vertexPositionData[second], vertexPositionData[second + 1], vertexPositionData[first + 1]);

            var t1 = subtract(b, a);
            var t2 = subtract(c, a);
            var normal = normalize(cross(t2, t1));
            normal = vec4(normal);
            normal[3] = 0.0;

            normalData.push(a, b, c);

            t1 = subtract(b, c);
            t2 = subtract(d, b);
            normal = normalize(cross(t2, t1));
            normal = vec4(normal);
            normal[3] = 0.0;

            normalData.push(b, d, c);
          }
        }

        return {vertices: vdata, indices: [], normals: normalData, texCoords: tdata};
    };

    let object = build(64, 64);
    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                normals: object.normals,
                flatTexCoords: flatten(object.texCoords),
                flatIndices: new Uint16Array(object.indices),
                material: {
                    ambientColor: vec4(1.0, 0.0, 1.0, 1.0),
                    diffuseColor: vec4(1.0, 0.8, 0.0, 1.0),
                    specularColor: vec4(1.0, 0.8, 0.0, 1.0),
                    shininess: 20.0
                }
            });
        }
    };
})();

let SphereLatLongIndexes = (() => {
    let build = (latitudeBands, longitudeBands) => {
        let vertexPositionData = [], indexData = [], normalData = [], texCoordsData = [];
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
                let u = 1 - longNumber / longitudeBands;
                let v = 1 - latNumber / latitudeBands;

                texCoordsData.push(vec2(u, v));
                normalData.push(vec3(x, y, z));
                vertexPositionData.push(vec3(x, y, z));
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
        return {vertices: vertexPositionData, indices: indexData, normals: normalData, texCoords: texCoordsData};
    };

    let object = build(64, 64);
    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                normals: object.normals,
                flatTexCoords: flatten(object.texCoords),
                flatIndices: new Uint16Array(object.indices),
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

// let Sphere = SphereTetrahedronSub;
// let Sphere = SphereLatLongTriangles;
let Sphere = SphereLatLongIndexes;
// let start = 0;
//
// start = window.performance.now();
// let s1 = SphereTetrahedronSub.create({id: 0});
// let t1 = window.performance.now() - start;
//
// start = window.performance.now();
// let s2 = SphereLatLongTriangles.create({id: 0});
// let t2 = window.performance.now() - start;
//
// start = window.performance.now();
// let s3 = SphereLatLongIndexes.create({id: 0});
// let t3 = window.performance.now() - start;
//
// console.log('SphereTetrahedronSub', s1.vertexCount, t1);
// console.log('SphereLatLongTriangles', s2.vertexCount, t2);
// console.log('SphereLatLongIndexes', s3.vertexCount, t3);

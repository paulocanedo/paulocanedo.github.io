let SphereTetrahedronSub = (() => {
    var va = vec4(0.0, 0.0, -1.0,1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333,1);

    let build = (nSubdivisions) => {
        let vertexPositionData = [], normalData = [];

        function triangle(a, b, c) {
             var t1 = subtract(b, a);
             var t2 = subtract(c, a);
             var normal = normalize(cross(t2, t1));
             normal = vec4(normal);
             normal[3]  = 0.0;

             normalData.push(normal);
             normalData.push(normal);
             normalData.push(normal);

             vertexPositionData.push(a);
             vertexPositionData.push(b);
             vertexPositionData.push(c);
        }

        function divideTriangle(a, b, c, count) {
            if ( count > 0 ) {
                var ab = mix( a, b, 0.5);
                var ac = mix( a, c, 0.5);
                var bc = mix( b, c, 0.5);

                ab = normalize(ab, true);
                ac = normalize(ac, true);
                bc = normalize(bc, true);

                divideTriangle( a, ab, ac, count - 1 );
                divideTriangle( ab, b, bc, count - 1 );
                divideTriangle( bc, c, ac, count - 1 );
                divideTriangle( ab, bc, ac, count - 1 );
            }
            else {
                triangle( a, b, c );
            }
        }

        function tetrahedron(a, b, c, d, n) {
            divideTriangle(a, b, c, n);
            divideTriangle(d, c, b, n);
            divideTriangle(a, d, b, n);
            divideTriangle(a, c, d, n);
        }

        tetrahedron(va, vb, vc, vd, nSubdivisions);
        return {vertices: vertexPositionData, indices: [], normals: normalData};
    };

    let object = build(5);
    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                normals: object.normals,
                flatIndices: new Uint16Array(object.indices),
                material: {
                    ambientColor: vec4(1.0, 0.0, 1.0, 1.0),
                    diffuseColor: vec4(1.0, 0.8, 0.0, 1.0),
                    specularColor: vec4(1.0, 0.8, 0.0, 1.0),
                    shininess: 200.0
                }
            });
        }
    };
})();

let SphereLatLongTriangles = (() => {
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

                vertexPositionData.push(vec3(radius * x, radius * y, radius * z));
            }
        }

        let vdata = [];
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
          for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;

            let a = vertexPositionData[first];
            let b = vertexPositionData[second];
            let c = vertexPositionData[first + 1];
            let d = vertexPositionData[second + 1];

            vdata.push(a);
            vdata.push(b);
            vdata.push(c);

            vdata.push(b);
            vdata.push(d);
            vdata.push(c);

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

        return {vertices: vdata, indices: [], normals: normalData};
    };

    let object = build(1.0, 64, 64);
    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                normals: object.normals,
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

    let object = build(1.0, 64, 64);
    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Sphere',
                vertices: object.vertices,
                normals: object.normals,
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
let Sphere = SphereLatLongTriangles;
// let Sphere = SphereLatLongIndexes;
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

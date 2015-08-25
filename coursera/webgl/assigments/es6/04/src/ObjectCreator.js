let ObjectCreator = (() => {
    return {
        create({id, vertices, flatIndices, normals, material, name}) {
            // its required store non flat vertices to compute transformations

            let translateMatrix  = translate(0, 0, 0);
            let scaleMatrix      = scalem(1, 1, 1);
            let rotationAxis     = [vec3(1, 0, 0), vec3(0,1,0), vec3(0,0,1)];
            let rotationMatrices = [rotate(0, rotationAxis[Axis.X]),
                                    rotate(0, rotationAxis[Axis.Y]),
                                    rotate(0, rotationAxis[Axis.Z])];
            let _rotateValues    = [0, 0, 0];

            let buffers = {initialized: false};
            let flatVertices = flatten(vertices);
            let flatNormals = flatten(normals);

            return {
                toString() { return `${name} [${id}]`; },

                get id() { return id },
                get translateValues() { return [translateMatrix[0][3], translateMatrix[1][3], translateMatrix[2][3]]; },
                get scaleValues() { return [scaleMatrix[0][0], scaleMatrix[1][1], scaleMatrix[2][2]]; },
                get rotateValues() { return _rotateValues; },

                translate({x, y, z}) {
                    if(x !== undefined) translateMatrix[0][3] = x;
                    if(y !== undefined) translateMatrix[1][3] = y;
                    if(z !== undefined) translateMatrix[2][3] = z;

                    this.compute();
                },

                scale({x, y, z}) {
                    if(x !== undefined) scaleMatrix[0][0] = x;
                    if(y !== undefined) scaleMatrix[1][1] = y;
                    if(z !== undefined) scaleMatrix[2][2] = z;

                    this.compute();
                },

                rotate({angle, axis}) {
                    rotationMatrices[axis] = rotate(angle, rotationAxis[axis]);
                    _rotateValues[axis] = angle;

                    this.compute();
                },

                compute() {
                    let matrix = mat4();
                    matrix = mult(    scaleMatrix, matrix);
                    matrix = mult(rotationMatrices[Axis.Z], matrix);
                    matrix = mult(rotationMatrices[Axis.Y], matrix);
                    matrix = mult(rotationMatrices[Axis.X], matrix);
                    matrix = mult(translateMatrix, matrix);
                    flatVertices = flatten(geometry.multMatrixVertices(matrix, vertices));
                    flatNormals  = flatten(geometry.multMatrixVertices(matrix, normals));
                },

                initBuffers(gl) {
                    if(buffers.initialized === false) {
                        buffers.normalId   = gl.createBuffer();
                        buffers.indiceId   = gl.createBuffer();
                        buffers.verticeId  = gl.createBuffer();

                        this.firstFlush(gl);
                        buffers.initialized = true;
                    }
                },

                firstFlush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatVertices, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, flatIndices, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatNormals, gl.DYNAMIC_DRAW);
                },

                flush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatVertices);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, flatIndices);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatNormals);
                },

                draw(gl, bufferInfo) {
                    let {vPosition, vNormal, light,
                         ambientProductLoc, diffuseProductLoc, specularProductLoc,
                         shininessLoc} = bufferInfo;

                    let ambientProduct = mult(light.ambientColor, material.ambientColor);
                    let diffuseProduct = mult(light.diffuseColor, material.diffuseColor);
                    let specularProduct = mult(light.specularColor, material.specularColor);

                    this.initBuffers(gl);
                    this.flush(gl);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vPosition);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalId);
                    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vNormal);

                    gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
                    gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
                    gl.uniform4fv(specularProductLoc, flatten(specularProduct));
                    gl.uniform1f(shininessLoc, material.shininess);

                    gl.drawElements(gl.TRIANGLES, flatIndices.length, gl.UNSIGNED_SHORT, 0);
                },

                delete(gl) {
                    if(buffers.initialized) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                        gl.bufferSubData(gl.ARRAY_BUFFER, 0, null);

                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, null);

                        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalId);
                        gl.bufferSubData(gl.ARRAY_BUFFER, 0, null);

                        gl.deleteBuffer(buffers.normalId);
                        gl.deleteBuffer(buffers.indiceId);
                        gl.deleteBuffer(buffers.verticeId);
                    }
                },

                toJSON() {
                    return {
                        name: name,
                        vertices: flatVertices,
                        normals: flatNormals,
                        indices: flatIndices
                    };
                }
            };
        },
    };
})();

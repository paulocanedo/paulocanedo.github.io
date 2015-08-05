let ObjectCreator = (() => {
    return {
        create({id, vertices, flatIndices, flatColors, name}) {
            // its required store non flat vertices to compute transformations

            let translateMatrix = translate(0, 0, 0);
            let scaleMatrix     = scalem(1, 1, 1);
            let xRotationMatrix = rotate(0, 1, 0, 0);
            let yRotationMatrix = rotate(0, 0, 1, 0);
            let zRotationMatrix = rotate(0, 0, 0, 1);

            let buffers = {initialized: false};
            let flatVertices = flatten(vertices);
            let _rotateValues = [0, 0, 0];

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

                    this.rebuild();
                },

                scale({x, y, z}) {
                    if(x !== undefined) scaleMatrix[0][0] = x;
                    if(y !== undefined) scaleMatrix[1][1] = y;
                    if(z !== undefined) scaleMatrix[2][2] = z;

                    this.rebuild();
                },

                rotate({angle, axis}) {
                    let theta = radians(angle);
                    let sinTheta = Math.sin(theta);
                    let cosTheta = Math.cos(theta);

                    switch (axis) {
                        case 0:
                            _rotateValues[0] = angle;
                            this.rotateX(sinTheta, cosTheta);
                            break;
                        case 1:
                            _rotateValues[1] = angle;
                            this.rotateY(sinTheta, cosTheta);
                            break;
                        case 2:
                            _rotateValues[2] = angle;
                            this.rotateZ(sinTheta, cosTheta);
                            break;
                        default:
                            throw Error(`Invalid axis rotation: ${axis}`);
                    }

                    this.rebuild();
                },

                rotateX(sinTheta, cosTheta) {
                    xRotationMatrix[1][1] =  cosTheta;
                    xRotationMatrix[1][2] = -sinTheta;
                    xRotationMatrix[2][1] =  sinTheta;
                    xRotationMatrix[2][2] =  cosTheta;
                },
                rotateY(sinTheta, cosTheta) {
                    xRotationMatrix[0][0] =  cosTheta;
                    xRotationMatrix[0][2] =  sinTheta;
                    xRotationMatrix[2][0] = -sinTheta;
                    xRotationMatrix[2][2] =  cosTheta;
                },
                rotateZ(sinTheta, cosTheta) {
                    xRotationMatrix[0][0] =  cosTheta;
                    xRotationMatrix[0][1] = -sinTheta;
                    xRotationMatrix[1][0] =  sinTheta;
                    xRotationMatrix[1][1] =  cosTheta;
                },

                rebuild() {
                    let matrix = mult(translateMatrix, scaleMatrix);
                    matrix = mult(xRotationMatrix, matrix);
                    matrix = mult(yRotationMatrix, matrix);
                    matrix = mult(zRotationMatrix, matrix);
                    flatVertices = flatten(geometry.multMatrixVertices(matrix, vertices));
                },

                initBuffers(gl) {
                    if(buffers.initialized === false) {
                        buffers.colorId   = gl.createBuffer();
                        buffers.indiceId  = gl.createBuffer();
                        buffers.verticeId = gl.createBuffer();

                        this.firstFlush(gl);
                        buffers.initialized = true;
                    }
                },

                firstFlush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatVertices, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, flatIndices, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatColors, gl.DYNAMIC_DRAW);
                },

                flush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatVertices);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, flatIndices);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatColors);
                },

                draw(gl, vPosition, vColor, wireframeLoc = null) {
                    this.initBuffers(gl);
                    this.flush(gl);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vPosition);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vColor);

                    gl.drawElements(gl.TRIANGLES, flatIndices.length, gl.UNSIGNED_SHORT, 0);

                    if(wireframeLoc) {
                        gl.uniform1i(wireframeLoc, 1);
                        gl.drawElements(gl.LINES, flatIndices.length, gl.UNSIGNED_SHORT, 0);
                    }
                }
            };
        },
    };
})();

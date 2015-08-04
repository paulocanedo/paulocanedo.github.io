// let _wireIndices = [3,2,1,0,4,7,3,7,6,2,6,5,1,0,4,5,4,7,6,2,3,0]; //LINE_STRIP

let Cube = (() => {
    let buildRect = (x, y, z, b, h) => {
        let b2 = b / 2;
        let h2 = h / 2;
        return [
            vec3(x - b2, y - h2, z),
            vec3(x - b2, y + h2, z),
            vec3(x + b2, y + h2, z),
            vec3(x + b2, y - h2, z),
        ];
    };

    let multiColor = [
       vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
       vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
       vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
       vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
       vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
       vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
       vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
       vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];

    let _indices     = [3,2,0,1,5,0,4,0,7,3,7,2,6,2,5,1,6,7,5,4]; //TRIANGLE_STRIP
    let _indicesTriangles = [ //TRIANGLES
        0,1,3,1,3,2,
        4,5,7,5,7,6,
        0,4,3,4,3,7,
        3,7,2,7,2,6,
        2,6,1,6,1,5,
        1,5,0,5,0,4
    ];

    return {
        create({id}) {
            let _id       = id;
            let _vertices = buildRect(0,0,0.5, 1, 1).concat(buildRect(0,0,-0.5, 1, 1));
            let _colors   = multiColor;
            let flushed   = false;

            let translateMatrix = translate(0, 0, 0);
            let scaleMatrix     = scalem(1, 1, 1);
            let rotationMatrix  = scalem(1, 1, 1);

            let buffers = {};

            buffers.colors   = flatten(_colors);
            buffers.vertices = flatten(_vertices);

            return {
                toString() { return `Cube [${_id}]`; },
                get id() { return _id },
                get colors() {
                    return buffers.colors;
                },
                get vertices() {
                    return buffers.vertices;
                },
                get indices() { return _indicesTriangles; },
                get translateValues() { return [translateMatrix[0][3], translateMatrix[1][3], translateMatrix[2][3]]; },
                get scaleValues() { return [scaleMatrix[0][0], scaleMatrix[1][1], scaleMatrix[2][2]]; },

                rebuild() {
                    let matrix = mult(translateMatrix, scaleMatrix);

                    buffers.colors = flatten(_colors);
                    buffers.vertices = flatten(geometry.multMatrixVertices(matrix, _vertices));

                    flushed = false;
                },

                translate(x, y, z) {
                    translateMatrix[0][3] = x;
                    translateMatrix[1][3] = y;
                    translateMatrix[2][3] = z;

                    this.rebuild();
                },

                scale(x, y, z) {
                    scaleMatrix[0][0] = x;
                    scaleMatrix[1][1] = y;
                    scaleMatrix[2][2] = z;
                    
                    this.rebuild();
                },

                draw(gl, vPosition, vColor, wireframeLoc = null) {
                    buffers.colorId   = buffers.colorId   || gl.createBuffer();
                    buffers.indiceId  = buffers.indiceId  || gl.createBuffer();
                    buffers.verticeId = buffers.verticeId || gl.createBuffer();

                    if(!flushed) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

                        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

                        flushed = true;
                    }

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vPosition);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vColor);

                    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

                    if(wireframeLoc) {
                        gl.uniform1i(wireframeLoc, 1);
                        gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
                    }
                }
            };
        },
    };
})();

"use strict";

var ObjectCreator = (function () {
    return {
        create: function create(_ref) {
            var id = _ref.id;
            var vertices = _ref.vertices;
            var flatIndices = _ref.flatIndices;
            var flatColors = _ref.flatColors;
            var name = _ref.name;

            // its required store non flat vertices to compute transformations

            var translateMatrix = translate(0, 0, 0);
            var scaleMatrix = scalem(1, 1, 1);
            var rotationAxis = [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)];
            var rotationMatrices = [rotate(0, rotationAxis[Axis.X]), rotate(0, rotationAxis[Axis.Y]), rotate(0, rotationAxis[Axis.Z])];
            var _rotateValues = [0, 0, 0];

            var buffers = { initialized: false };
            var flatVertices = flatten(vertices);

            return Object.defineProperties({
                toString: function toString() {
                    return name + " [" + id + "]";
                },

                translate: function translate(_ref2) {
                    var x = _ref2.x;
                    var y = _ref2.y;
                    var z = _ref2.z;

                    if (x !== undefined) translateMatrix[0][3] = x;
                    if (y !== undefined) translateMatrix[1][3] = y;
                    if (z !== undefined) translateMatrix[2][3] = z;

                    this.compute();
                },

                scale: function scale(_ref3) {
                    var x = _ref3.x;
                    var y = _ref3.y;
                    var z = _ref3.z;

                    if (x !== undefined) scaleMatrix[0][0] = x;
                    if (y !== undefined) scaleMatrix[1][1] = y;
                    if (z !== undefined) scaleMatrix[2][2] = z;

                    this.compute();
                },

                rotate: (function (_rotate) {
                    function rotate(_x) {
                        return _rotate.apply(this, arguments);
                    }

                    rotate.toString = function () {
                        return _rotate.toString();
                    };

                    return rotate;
                })(function (_ref4) {
                    var angle = _ref4.angle;
                    var axis = _ref4.axis;

                    rotationMatrices[axis] = rotate(angle, rotationAxis[axis]);
                    _rotateValues[axis] = angle;

                    this.compute();
                }),

                compute: function compute() {
                    var matrix = mat4();
                    matrix = mult(scaleMatrix, matrix);
                    matrix = mult(rotationMatrices[Axis.X], matrix);
                    matrix = mult(rotationMatrices[Axis.Y], matrix);
                    matrix = mult(rotationMatrices[Axis.Z], matrix);
                    matrix = mult(translateMatrix, matrix);
                    flatVertices = flatten(geometry.multMatrixVertices(matrix, vertices));
                },

                initBuffers: function initBuffers(gl) {
                    if (buffers.initialized === false) {
                        buffers.colorId = gl.createBuffer();
                        buffers.indiceId = gl.createBuffer();
                        buffers.verticeId = gl.createBuffer();

                        this.firstFlush(gl);
                        buffers.initialized = true;
                    }
                },

                firstFlush: function firstFlush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatVertices, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, flatIndices, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatColors, gl.DYNAMIC_DRAW);
                },

                flush: function flush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatVertices);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, flatIndices);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatColors);
                },

                draw: function draw(gl, bufferInfo, opts) {
                    var vPosition = bufferInfo.vPosition;
                    var vColor = bufferInfo.vColor;
                    var wireframeLoc = bufferInfo.wireframeLoc;
                    var solid = opts.solid;
                    var wireframe = opts.wireframe;

                    this.initBuffers(gl);
                    this.flush(gl);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vPosition);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorId);
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vColor);

                    if (solid) {
                        gl.uniform1i(wireframeLoc, 0);
                        gl.drawElements(gl.TRIANGLES, flatIndices.length, gl.UNSIGNED_SHORT, 0);
                    }

                    if (wireframe) {
                        gl.uniform1i(wireframeLoc, 1);
                        gl.drawElements(gl.LINES, flatIndices.length, gl.UNSIGNED_SHORT, 0);
                    }
                }
            }, {
                id: {
                    get: function get() {
                        return id;
                    },
                    configurable: true,
                    enumerable: true
                },
                translateValues: {
                    get: function get() {
                        return [translateMatrix[0][3], translateMatrix[1][3], translateMatrix[2][3]];
                    },
                    configurable: true,
                    enumerable: true
                },
                scaleValues: {
                    get: function get() {
                        return [scaleMatrix[0][0], scaleMatrix[1][1], scaleMatrix[2][2]];
                    },
                    configurable: true,
                    enumerable: true
                },
                rotateValues: {
                    get: function get() {
                        return _rotateValues;
                    },
                    configurable: true,
                    enumerable: true
                }
            });
        }
    };
})();

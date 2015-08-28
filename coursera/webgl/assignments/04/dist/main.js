"use strict";

var ShaderUtil = (function () {
    return {
        loadShader: function loadShader(gl, shader) {
            var shaderId = gl.createShader(shader.type);
            gl.shaderSource(shaderId, shader.content);
            gl.compileShader(shaderId);
            if (!gl.getShaderParameter(shaderId, gl.COMPILE_STATUS)) {
                throw Error("Vertex shader failed to compile. The error log is:\n                    <pre>" + gl.getShaderInfoLog(shaderId) + "</pre>");
            }
            return shaderId;
        },
        createPrograms: function createPrograms(gl, programs) {
            var _this = this;

            var result = [];

            programs.forEach(function (program) {
                var programId = gl.createProgram();
                gl.attachShader(programId, _this.loadShader(gl, program.vertexShader));
                gl.attachShader(programId, _this.loadShader(gl, program.fragmentShader));
                gl.linkProgram(programId);

                if (!gl.getProgramParameter(programId, gl.LINK_STATUS)) {
                    throw Error("Shader program failed to link.  The error log is:\n                        <pre>" + gl.getProgramInfoLog(program) + "</pre>");
                }

                result.push(programId);
            });

            return result;
        }
    };
})();
"use strict";

var ObjectCreator = (function () {
    return {
        create: function create(_ref) {
            var id = _ref.id;
            var vertices = _ref.vertices;
            var flatIndices = _ref.flatIndices;
            var normals = _ref.normals;
            var material = _ref.material;
            var name = _ref.name;

            // its required store non flat vertices to compute transformations

            var translateMatrix = translate(0, 0, 0);
            var scaleMatrix = scalem(1, 1, 1);
            var rotationAxis = [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)];
            var rotationMatrices = [rotate(0, rotationAxis[Axis.X]), rotate(0, rotationAxis[Axis.Y]), rotate(0, rotationAxis[Axis.Z])];
            var _rotateValues = [0, 0, 0];

            var buffers = { initialized: false };
            var flatVertices = flatten(vertices);
            var flatNormals = flatten(normals);

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
                    matrix = mult(rotationMatrices[Axis.Z], matrix);
                    matrix = mult(rotationMatrices[Axis.Y], matrix);
                    matrix = mult(rotationMatrices[Axis.X], matrix);
                    matrix = mult(translateMatrix, matrix);
                    flatVertices = flatten(geometry.multMatrixVertices(matrix, vertices));
                    flatNormals = flatten(geometry.multMatrixVertices(matrix, normals));
                },

                initBuffers: function initBuffers(gl) {
                    if (buffers.initialized === false) {
                        buffers.normalId = gl.createBuffer();
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

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalId);
                    gl.bufferData(gl.ARRAY_BUFFER, flatNormals, gl.DYNAMIC_DRAW);
                },

                flush: function flush(gl) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.verticeId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatVertices);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indiceId);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, flatIndices);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatNormals);
                },

                draw: function draw(gl, bufferInfo) {
                    var vPosition = bufferInfo.vPosition;
                    var vNormal = bufferInfo.vNormal;
                    var lights = bufferInfo.lights;
                    var ambientProductLoc = bufferInfo.ambientProductLoc;
                    var diffuseProductLoc = bufferInfo.diffuseProductLoc;
                    var specularProductLoc = bufferInfo.specularProductLoc;
                    var shininessLoc = bufferInfo.shininessLoc;

                    var lightAmbientColor = vec4();
                    var lightDiffuseColor = vec4();
                    var lightSpecularColor = vec4();
                    lights.forEach(function (light) {
                        for (var i = 0; i < light.ambientColor.length; i++) {
                            lightAmbientColor[i] += light.ambientColor[i] / 2.0;
                            lightDiffuseColor[i] += light.diffuseColor[i] / 2.0;
                            lightSpecularColor[i] += light.specularColor[i] / 2.0;
                        }
                    });

                    var ambientProduct = mult(lights.size === 0 ? vec4(0.1, 0.1, 0.1, 1.0) : lightAmbientColor, material.ambientColor);

                    var diffuseProduct = mult(lightDiffuseColor, material.diffuseColor);
                    var specularProduct = mult(lightSpecularColor, material.specularColor);

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

                    if (flatIndices.length > 0) {
                        gl.drawElements(gl.TRIANGLES, flatIndices.length, gl.UNSIGNED_SHORT, 0);
                    } else {
                        gl.drawArrays(gl.TRIANGLES, 0, flatVertices.length / 3);
                    }
                },

                "delete": function _delete(gl) {
                    if (buffers.initialized) {
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

                toJSON: function toJSON() {
                    return {
                        name: name,
                        vertices: flatVertices,
                        normals: flatNormals,
                        indices: flatIndices
                    };
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
                },
                ambientColor: {
                    get: function get() {
                        return material.ambientColor;
                    },
                    configurable: true,
                    enumerable: true
                },
                specularColor: {
                    get: function get() {
                        return material.specularColor;
                    },
                    configurable: true,
                    enumerable: true
                },
                diffuseColor: {
                    get: function get() {
                        return material.diffuseColor;
                    },
                    configurable: true,
                    enumerable: true
                },
                vertexCount: {
                    get: function get() {
                        return flatVertices.length / 3;
                    },
                    configurable: true,
                    enumerable: true
                }
            });
        }
    };
})();
'use strict';

var ObjectManager = (function () {
    var control = -1;
    var lights = new Set();
    var collection = new Map();
    var domObjects = document.getElementById('objects-list');

    var createDeleteButton = function createDeleteButton(object, parentNode) {
        var root = document.createElement('span');
        var deleteNode = document.createElement('i');
        deleteNode.className = 'fa fa-trash-o';

        root.className = 'badge delete-button';
        root.appendChild(deleteNode);
        root.addEventListener('click', function (evt) {
            ObjectManager.deleteObject(object);
            domObjects.removeChild(parentNode);
        });
        return root;
    };
    var createDescNode = function createDescNode(object) {
        var textNode = document.createTextNode('  ' + object.toString());
        return textNode;
    };

    return Object.defineProperties({

        buildObject: function buildObject(what) {
            var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var object = null;
            params.id = this.newUuid;
            params.radius |= 1;
            params.bands |= 32;

            switch (what) {
                case 'cube':
                    object = Cube.create(params);
                    break;
                case 'cylinder':
                    params.radiusTop |= params.radius;
                    params.radiusBottom |= params.radius;
                    object = Cylinder.create(params);
                    break;
                case 'cone':
                    object = Cone.create(params);
                    break;
                case 'sphere':
                    object = Sphere.create(params);
                    break;
                case 'light':
                    if (!params.position) params.position = vec4(0, 0, 0, 0);
                    if (!params.ambientColor) params.ambientColor = vec4(0.2, 0.2, 0.2, 1.0);
                    if (!params.diffuseColor) params.diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
                    if (!params.specularColor) params.specularColor = vec4(1.0, 1.0, 1.0, 1.0);
                    object = Light.create(params);

                    lights.add(object);
                    break;
                default:
                    throw Error('no object \'' + what + '\' available to build');
            }
            var domObject = this.newListItem(object);
            object.dom = domObject;
            domObjects.appendChild(domObject);

            collection.set(this.lastUuid, object);
            return object;
        },

        deleteObject: function deleteObject(object) {
            if (object) {
                object['delete']();
                lights['delete'](object);
                collection['delete'](object.id);
            }
        },

        find: function find(id) {
            id = parseInt(id);
            return collection.get(id);
        },

        newListItem: function newListItem(object) {
            var node = document.createElement('li');
            node.setAttribute('data-id', object.id);
            node.className = 'list-group-item no-selectable default-cursor';

            node.appendChild(createDeleteButton(object, node));
            node.appendChild(createDescNode(object));

            return node;
        }

    }, {
        lastUuid: {
            get: function get() {
                return control;
            },
            configurable: true,
            enumerable: true
        },
        newUuid: {
            get: function get() {
                return ++control;
            },
            configurable: true,
            enumerable: true
        },
        collection: {
            get: function get() {
                return collection;
            },
            configurable: true,
            enumerable: true
        },
        lights: {
            get: function get() {
                return lights;
            },
            configurable: true,
            enumerable: true
        },
        selected: {
            get: function get() {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = collection[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var elem = _step.value;

                        if (elem.dom.className.indexOf('active') >= 0) {
                            return elem;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator['return']) {
                            _iterator['return']();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return null;
            },
            configurable: true,
            enumerable: true
        }
    });
})();
'use strict';

var geometry = (function () {
    return {
        multMatriceVector: function multMatriceVector(matrice, vector) {
            var result = [];
            for (var i = 0; i < vector.length; i++) {
                var mline = matrice[i];

                var sum = 0;
                for (var j = 0; j < vector.length; j++) {
                    sum += mline[j] * vector[j];
                }
                result.push(sum);
            }
            return result;
        },
        multMatrixVertices: function multMatrixVertices(translateMatrix, vertices) {
            var result = [];
            for (var i = 0; i < vertices.length; i++) {
                result.push(geometry.multMatriceVector(translateMatrix, vec4(vertices[i], 1)).slice(0, 3));
            }
            return result;
        }
    };
})();

var Axis = (function () {
    return Object.defineProperties({

        toString: function toString(axis) {
            if (axis === Axis.X) {
                return 'x';
            } else if (axis === Axis.Y) {
                return 'y';
            } else if (axis === Axis.Z) {
                return 'z';
            } else if (axis === Axis.W) {
                return 'w';
            }
            throw Error('Invalid axis: ' + axis);
        }
    }, {
        X: {
            get: function get() {
                return 0;
            },
            configurable: true,
            enumerable: true
        },
        Y: {
            get: function get() {
                return 1;
            },
            configurable: true,
            enumerable: true
        },
        Z: {
            get: function get() {
                return 2;
            },
            configurable: true,
            enumerable: true
        },
        W: {
            get: function get() {
                return 3;
            },
            configurable: true,
            enumerable: true
        }
    });
})();
'use strict';

var Cube = (function () {
    var buildRect = function buildRect(x, y, z, b, h) {
        var b2 = b / 2;
        var h2 = h / 2;
        return [vec3(x - b2, y - h2, z), vec3(x - b2, y + h2, z), vec3(x + b2, y + h2, z), vec3(x + b2, y - h2, z)];
    };

    var multiColor = [vec4(1.0, 1.0, 1.0, 1.0), // black
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(1.0, 1.0, 1.0, 1.0), // white
    vec4(0.0, 1.0, 1.0, 1.0) // cyan
    ];

    var _indices = [3, 2, 0, 1, 5, 0, 4, 0, 7, 3, 7, 2, 6, 2, 5, 1, 6, 7, 5, 4]; //TRIANGLE_STRIP
    var _wireIndices = [3, 2, 1, 0, 4, 7, 3, 7, 6, 2, 6, 5, 1, 0, 4, 5, 4, 7, 6, 2, 3, 0]; //LINE_STRIP
    var _indicesTriangles = [//TRIANGLES
    0, 1, 3, 1, 3, 2, 4, 5, 7, 5, 7, 6, 0, 4, 3, 4, 3, 7, 3, 7, 2, 7, 2, 6, 2, 6, 1, 6, 1, 5, 1, 5, 0, 5, 0, 4];

    return {
        create: function create(_ref) {
            var id = _ref.id;

            return ObjectCreator.create({
                id: id,
                name: 'Cube',
                vertices: buildRect(0, 0, 0.5, 1, 1).concat(buildRect(0, 0, -0.5, 1, 1)),
                normals: buildRect(0, 0, 0.5, 1, 1).concat(buildRect(0, 0, -0.5, 1, 1)),
                flatIndices: new Uint16Array(_indicesTriangles),
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
'use strict';

var Cone = (function () {
    var build = function build(radius, npoints) {
        var vertexPositionData = [],
            indexData = [],
            normalData = [];
        var angle = Math.PI * 2 / npoints;

        normalData.push(vec3(0.0, -0.5, 0.0), vec3(0.0, 0.5, 0.0));
        vertexPositionData.push(vec3(0.0, -0.5, 0.0), vec3(0.0, 0.5, 0.0));
        for (var a = 0; a < Math.PI * 2; a += angle) {
            var x = Math.cos(a);
            var z = Math.sin(a);

            normalData.push(vec3(x, -0.5, z));
            vertexPositionData.push(vec3(radius * x, -0.5, radius * z));
        }

        var length = vertexPositionData.length;
        for (var i = 0; i < length - 2; i++) {
            indexData.push(0);
            indexData.push(i + 1);
            indexData.push(i + 2);
        }
        indexData.push(0, length - 1, 2);

        for (var i = 1; i < length - 1; i++) {
            indexData.push(1);
            indexData.push(i);
            indexData.push(i + 1);
        }
        indexData.push(1, length - 1, 2);
        return { vertices: vertexPositionData, indices: indexData, normals: normalData };
    };

    var object = build(1.0, 32);

    return {
        create: function create(_ref) {
            var id = _ref.id;

            return ObjectCreator.create({
                id: id,
                name: 'Cone',
                vertices: object.vertices,
                normals: object.normals,
                flatIndices: new Uint16Array(object.indices),
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
'use strict';

var Cylinder = (function () {
    var build = function build(radiusTop, radiusBottom, npoints) {
        var vertexPositionData = [],
            indexData = [],
            normalData = [];

        var angle = Math.PI * 2 / npoints;
        for (var a = 0; a < Math.PI * 2; a += angle) {
            var x = Math.cos(a);
            var z = Math.sin(a);

            normalData.push(vec3(x, 0.5, z));
            vertexPositionData.push(vec3(x * radiusTop, 0.5, z * radiusTop));
        }
        for (var a = 0; a < Math.PI * 2; a += angle) {
            var x = Math.cos(a);
            var z = Math.sin(a);

            normalData.push(vec3(x, -0.5, z));
            vertexPositionData.push(vec3(x * radiusBottom, -0.5, z * radiusBottom));
        }

        var half = vertexPositionData.length / 2;
        for (var i = 0; i < half - 1; i++) {
            indexData.push(i);
            indexData.push(i + 1);
            indexData.push(half + i);

            indexData.push(i + 1);
            indexData.push(half + i);
            indexData.push(half + i + 1);
        }
        indexData.push(half - 1, 0, vertexPositionData.length - 1, 0, vertexPositionData.length - 1, half);

        return { vertices: vertexPositionData, indices: indexData, normals: normalData };
    };

    var object = build(1.0, 1.0, 32);

    return {
        create: function create(_ref) {
            var id = _ref.id;

            return ObjectCreator.create({
                id: id,
                name: 'Cylinder',
                vertices: object.vertices,
                normals: object.normals,
                flatIndices: new Uint16Array(object.indices),
                material: {
                    ambientColor: vec4(0.7, 0.7, 0.0, 1.0),
                    diffuseColor: vec4(1.0, 0.2, 0.0, 1.0),
                    specularColor: vec4(1.0, 0.2, 0.0, 1.0),
                    shininess: 20.0
                }
            });
        }
    };
})();
'use strict';

var SphereTetrahedronSub = (function () {
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    var build = function build(nSubdivisions) {
        var vertexPositionData = [],
            normalData = [];

        function triangle(a, b, c) {
            var t1 = subtract(b, a);
            var t2 = subtract(c, a);
            var normal = normalize(cross(t2, t1));
            normal = vec4(normal);
            normal[3] = 0.0;

            normalData.push(normal);
            normalData.push(normal);
            normalData.push(normal);

            vertexPositionData.push(a);
            vertexPositionData.push(b);
            vertexPositionData.push(c);
        }

        function divideTriangle(a, b, c, count) {
            if (count > 0) {
                var ab = mix(a, b, 0.5);
                var ac = mix(a, c, 0.5);
                var bc = mix(b, c, 0.5);

                ab = normalize(ab, true);
                ac = normalize(ac, true);
                bc = normalize(bc, true);

                divideTriangle(a, ab, ac, count - 1);
                divideTriangle(ab, b, bc, count - 1);
                divideTriangle(bc, c, ac, count - 1);
                divideTriangle(ab, bc, ac, count - 1);
            } else {
                triangle(a, b, c);
            }
        }

        function tetrahedron(a, b, c, d, n) {
            divideTriangle(a, b, c, n);
            divideTriangle(d, c, b, n);
            divideTriangle(a, d, b, n);
            divideTriangle(a, c, d, n);
        }

        tetrahedron(va, vb, vc, vd, nSubdivisions);
        return { vertices: vertexPositionData, indices: [], normals: normalData };
    };

    var object = build(5);
    return {
        create: function create(_ref) {
            var id = _ref.id;

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

var SphereLatLongTriangles = (function () {
    var build = function build(radius, latitudeBands, longitudeBands) {
        var vertexPositionData = [],
            indexData = [],
            normalData = [];
        for (var _latNumber = 0; _latNumber <= latitudeBands; _latNumber++) {
            var theta = _latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var _longNumber = 0; _longNumber <= longitudeBands; _longNumber++) {
                var phi = _longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                vertexPositionData.push(vec3(radius * x, radius * y, radius * z));
            }
        }

        var vdata = [];
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = latNumber * (longitudeBands + 1) + longNumber;
                var second = first + longitudeBands + 1;

                var a = vertexPositionData[first];
                var b = vertexPositionData[second];
                var c = vertexPositionData[first + 1];
                var d = vertexPositionData[second + 1];

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

        return { vertices: vdata, indices: [], normals: normalData };
    };

    var object = build(1.0, 64, 64);
    return {
        create: function create(_ref2) {
            var id = _ref2.id;

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

var SphereLatLongIndexes = (function () {
    var build = function build(radius, latitudeBands, longitudeBands) {
        var vertexPositionData = [],
            indexData = [],
            normalData = [];
        for (var _latNumber2 = 0; _latNumber2 <= latitudeBands; _latNumber2++) {
            var theta = _latNumber2 * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var _longNumber2 = 0; _longNumber2 <= longitudeBands; _longNumber2++) {
                var phi = _longNumber2 * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                normalData.push(vec3(x, y, z));
                vertexPositionData.push(vec3(radius * x, radius * y, radius * z));
            }
        }

        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = latNumber * (longitudeBands + 1) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }
        return { vertices: vertexPositionData, indices: indexData, normals: normalData };
    };

    var object = build(1.0, 64, 64);
    return {
        create: function create(_ref3) {
            var id = _ref3.id;

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
var Sphere = SphereLatLongTriangles;
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
"use strict";

var Light = (function () {
    return {
        create: function create(_ref) {
            var id = _ref.id;
            var position = _ref.position;
            var ambientColor = _ref.ambientColor;
            var specularColor = _ref.specularColor;
            var diffuseColor = _ref.diffuseColor;

            return Object.defineProperties({
                toString: function toString() {
                    return "Light [" + id + "]";
                },

                translate: function translate(_ref2) {
                    var x = _ref2.x;
                    var y = _ref2.y;
                    var z = _ref2.z;

                    if (x) position[Axis.X] = x;
                    if (y) position[Axis.Y] = y;
                    if (z) position[Axis.Z] = z;
                },
                scale: function scale() {},
                rotate: function rotate() {},

                "delete": function _delete() {},
                draw: function draw() {}

            }, {
                id: {
                    get: function get() {
                        return id;
                    },
                    configurable: true,
                    enumerable: true
                },
                position: {
                    get: function get() {
                        return position;
                    },
                    set: function set(newPosition) {
                        position = newPosition;
                    },
                    configurable: true,
                    enumerable: true
                },
                ambientColor: {
                    get: function get() {
                        return ambientColor;
                    },
                    set: function set(newAmbientColor) {
                        ambientColor = newAmbientColor;
                    },
                    configurable: true,
                    enumerable: true
                },
                specularColor: {
                    get: function get() {
                        return specularColor;
                    },
                    set: function set(newSpecularColor) {
                        specularColor = newSpecularColor;
                    },
                    configurable: true,
                    enumerable: true
                },
                diffuseColor: {
                    get: function get() {
                        return diffuseColor;
                    },
                    set: function set(newDiffuseColor) {
                        diffuseColor = newDiffuseColor;
                    },
                    configurable: true,
                    enumerable: true
                },
                translateValues: {
                    get: function get() {
                        return position;
                    },
                    configurable: true,
                    enumerable: true
                },
                scaleValues: {
                    get: function get() {
                        return [0, 0, 0];
                    },
                    configurable: true,
                    enumerable: true
                },
                rotateValues: {
                    get: function get() {
                        return [0, 0, 0];
                    },
                    configurable: true,
                    enumerable: true
                },
                isLight: {
                    get: function get() {
                        return true;
                    },
                    configurable: true,
                    enumerable: true
                }
            });
        }
    };
})();
"use strict";

var dom_helper = (function () {
    return {
        getDocumentWidth: function getDocumentWidth() {
            return document.body.clientWidth;
        },
        getDocumentHeight: function getDocumentHeight() {
            return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
        },
        getFloatArray: function getFloatArray() {
            for (var _len = arguments.length, elemsId = Array(_len), _key = 0; _key < _len; _key++) {
                elemsId[_key] = arguments[_key];
            }

            return elemsId.map(function (index, elem) {
                return parseFloat(document.getElementById(index).value);
            });
        },
        querySelected: function querySelected(name) {
            var nodeList = document.getElementsByName(name);

            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                if (node.checked === true) return node;
            }
            return null;
        },
        addEventListener: function addEventListener(name, evtName, listener) {
            var nodeList = document.getElementsByName(name);

            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                node.addEventListener(evtName, listener);
            }
        },
        getClickPosition: function getClickPosition(event) {
            var target = event.target;
            var posX = event.offsetX ? event.offsetX : event.pageX - target.offsetLeft;
            var posY = event.offsetY ? event.offsetY : event.pageY - target.offsetTop;

            return vec2(posX, posY);
        },
        getSelectedFromList: function getSelectedFromList(list, attribute) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var elem = _step.value;

                    if (elem.className.indexOf('active') >= 0) {
                        return elem.getAttribute('data-' + attribute);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return null;
        },
        clearSelection: function clearSelection(list) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var elem = _step2.value;

                    elem.className = elem.className.replace('active', '').trim();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        },
        setActive: function setActive(element) {
            if (element.className.indexOf('active') < 0) {
                element.className += ' active';
            }
        }
    };
})();
'use strict';

var mouse_events = (function () {
    var mouse = {
        pressed: false,
        lastPosition: null
    };
    var theta = 0,
        phi = 0;

    var startTheta = 0,
        startPhi = 0;
    var startX = 0,
        startY = 0;
    var canvas = undefined;

    var objectsList = document.getElementById('objects-list');

    return {
        mousewheel: function mousewheel(evt) {
            var radius = drawing.zoom(evt.deltaY > 0);
            document.getElementById('zoomCtrl').value = radius;
        },
        mousedown: function mousedown(evt) {
            mouse.pressed = true;
            mouse.lastPosition = dom_helper.getClickPosition(evt);

            var selectedId = dom_helper.getSelectedFromList(objectsList.children, 'id');
            var object = ObjectManager.find(parseInt(selectedId));
            if (!object) return;

            if (evt.ctrlKey && evt.shiftKey) {
                startX = object.rotateValues[0];
                startY = object.rotateValues[1];
            } else if (evt.ctrlKey) {
                startX = object.translateValues[0];
                startY = object.translateValues[1];
            } else if (evt.shiftKey) {
                startX = object.scaleValues[0];
                startY = object.scaleValues[1];
            }
        },
        mousemove: function mousemove(evt) {
            if (mouse.pressed && mouse.lastPosition) {
                var current = dom_helper.getClickPosition(evt);
                var dx = mouse.lastPosition[0] - current[0];
                var dy = mouse.lastPosition[1] - current[1];

                var selectedId = dom_helper.getSelectedFromList(objectsList.children, 'id');
                var object = ObjectManager.find(parseInt(selectedId));
                if (!object) return;
                dx = startX + dx / canvas.width;
                dy = startY + dy / canvas.height;

                if (evt.ctrlKey && evt.shiftKey) {
                    // object.rotate({angle: dy, axis: Axis.X});
                    // object.rotate({angle: dx, axis: Axis.Y});
                } else if (evt.ctrlKey) {
                        object.translate({ x: -dx * 10, y: dy * 10 });
                    } else if (evt.shiftKey) {
                        object.scale({ x: dx, y: dy });
                    } else {
                        // phi = startPhi + dx;
                        // theta = startTheta + dy;
                        //
                        // drawing.setCamOrientation(radians(phi), radians(theta));
                    }
                application.updateTransformValues(object.id, dom_helper.querySelected('transformation'));
            }
        },
        mouseup: function mouseup(evt) {
            mouse.pressed = false;
            startTheta = theta;
            startPhi = phi;
        },
        install: function install(elem) {
            canvas = elem;

            canvas.addEventListener('mouseup', this.mouseup);
            canvas.addEventListener('mousedown', this.mousedown);
            canvas.addEventListener('mousemove', this.mousemove);
            canvas.addEventListener('wheel', this.mousewheel);
        }
    };
})();
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var drawing = (function () {
    var gl = undefined;
    var canvas = undefined;
    var programsAvailable = undefined,
        program = undefined;

    var cam = {
        radius: 10.0,
        near: -1, far: 1,
        theta: 0.0, phi: 0.0,
        fovy: 45.0, aspect: 1.0,
        at: vec3(0.0, 0.0, 0.0),
        up: vec3(0.0, 1.0, 0.0)
    };

    var modelViewMatrix = undefined,
        projectionMatrix = undefined;
    var modelViewMatrixLoc = undefined,
        projectionMatrixLoc = undefined;

    var bufferInfo = {};
    var worldRotation = vec3(0, 0, 0);
    var lightRotation = 0; //only on Y axis

    return Object.defineProperties({
        zoom: function zoom() {
            var zoomIn = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            var amount = zoomIn ? -1.0 : 1.0;
            cam.radius = Math.min(Math.max(4.0, cam.radius + amount), 50);
            return cam.radius;
        },
        setCamOrientation: function setCamOrientation(_ref) {
            var theta = _ref.theta;
            var phi = _ref.phi;

            if (theta) cam.theta = theta;
            if (phi) cam.phi = phi;
        },

        init: function init(canvasName, programs) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas);
            if (!gl) {
                alert("WebGL isn't available");
            }

            this.setDefaults(gl, programs);
            return canvas;
        },
        setDefaults: function setDefaults(gl, programs) {
            var devicePixelRatio = window.devicePixelRatio || 1;
            gl.canvas.width = dom_helper.getDocumentWidth() * devicePixelRatio;
            gl.canvas.height = dom_helper.getDocumentHeight() * devicePixelRatio;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(0, 0, 0, 1.0);

            programsAvailable = ShaderUtil.createPrograms(gl, programs);
            program = programsAvailable[0];
        },
        defineOptions: function defineOptions() {
            lightRotation = document.querySelector('#lightsMovingBtn.active') == null ? 0.0 : lightRotation + 2.0;
            if (document.getElementById('perFragOption').className.indexOf('active') >= 0) {
                program = programsAvailable[0];
            } else {
                program = programsAvailable[1];
            }

            var lightTypeValue = 0;
            if (document.getElementById('indeterminateLightOption').className.indexOf('active') >= 0) {
                lightTypeValue = 1;
            }
            ObjectManager.lights.forEach(function (light) {
                return light.position[3] = lightTypeValue;
            });
        },
        render: function render() {
            drawing.defineOptions();

            gl.useProgram(program);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            cam.aspect = gl.canvas.width / gl.canvas.height;

            var eye = vec3(cam.radius * Math.sin(cam.theta) * Math.cos(cam.phi), cam.radius * Math.sin(cam.theta) * Math.sin(cam.phi), cam.radius * Math.cos(cam.theta));

            modelViewMatrix = lookAt(eye, cam.at, cam.up);
            projectionMatrix = perspective(cam.fovy, cam.aspect, cam.near, cam.far);

            bufferInfo.vPosition = gl.getAttribLocation(program, "vPosition");
            bufferInfo.vNormal = gl.getAttribLocation(program, "vNormal");
            bufferInfo.ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
            bufferInfo.diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
            bufferInfo.specularProductLoc = gl.getUniformLocation(program, "specularProduct");
            bufferInfo.shininessLoc = gl.getUniformLocation(program, "shininess");

            gl.uniform3fv(gl.getUniformLocation(program, "worldRotation"), flatten(worldRotation));

            modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
            projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            var floatLights = new Float32Array(ObjectManager.lights.size * 4);
            var numberOfLights = 0;
            ObjectManager.lights.forEach(function (light) {
                floatLights[numberOfLights * 4 + 0] = light.position[0] * Math.sin(radians(lightRotation));
                floatLights[numberOfLights * 4 + 1] = light.position[1];
                floatLights[numberOfLights * 4 + 2] = light.position[2] * Math.cos(radians(lightRotation));
                floatLights[numberOfLights * 4 + 3] = light.position[3];

                numberOfLights++;
            });
            if (numberOfLights === 0) {
                floatLights = new Float32Array([0, 0, 0, 0]);
            }
            gl.uniform4fv(gl.getUniformLocation(program, 'lightsPositions'), floatLights);
            bufferInfo.lights = ObjectManager.lights;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = ObjectManager.collection[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _step$value = _slicedToArray(_step.value, 2);

                    var object = _step$value[1];

                    object.draw(gl, bufferInfo);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            requestAnimFrame(drawing.render);
        }
    }, {
        program: {
            set: function set(id) {
                if (id >= 0 && id < programsAvailable.length) {
                    program = programsAvailable[id];
                }
            },
            configurable: true,
            enumerable: true
        },
        eyeDistance: {
            set: function set(distance) {
                cam.radius = cam.radius = Math.min(Math.max(4.0, distance), 50);
            },
            configurable: true,
            enumerable: true
        }
    });
})();
"use strict";

var application = (function () {
    var transformX = document.getElementById('transformX');
    var transformY = document.getElementById('transformY');
    var transformZ = document.getElementById('transformZ');

    var objectsList = document.getElementById('objects-list');

    document.getElementById('zoomCtrl').addEventListener('input', function (evt) {
        return drawing.eyeDistance = 50 - evt.target.value;
    });
    document.getElementById('thetaCtrl').addEventListener('input', function (evt) {
        return drawing.setCamOrientation({ theta: evt.target.value });
    });
    document.getElementById('phiCtrl').addEventListener('input', function (evt) {
        return drawing.setCamOrientation({ phi: evt.target.value });
    });

    return {
        updateTransformValues: function updateTransformValues(selectedId, domElem) {
            var object = ObjectManager.find(selectedId);
            if (object) {
                var values = null,
                    min = -5,
                    max = 5;
                var transformation = domElem.value;
                if (transformation === 'translate') {
                    values = object.translateValues;
                } else if (transformation === 'scale') {
                    values = object.scaleValues;
                } else if (transformation === 'rotate') {
                    values = object.rotateValues;
                    min = 0;max = 360;
                }
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = document.querySelectorAll('.transformer')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var elem = _step.value;

                        elem.min = object.isLight === true ? -25.0 : min;
                        elem.max = object.isLight === true ? 25.0 : max;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator['return']) {
                            _iterator['return']();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                var acolor = object.ambientColor.slice(0, 3).map(function (elem) {
                    return parseInt(elem * 255);
                });
                var dcolor = object.diffuseColor.slice(0, 3).map(function (elem) {
                    return parseInt(elem * 255);
                });
                var scolor = object.specularColor.slice(0, 3).map(function (elem) {
                    return parseInt(elem * 255);
                });

                document.getElementById('propertiesLabel').innerHTML = object + ' - Properties';
                document.getElementById('ambientColorBtn').style.backgroundColor = 'rgb(' + acolor.join(',') + ')';
                document.getElementById('diffuseColorBtn').style.backgroundColor = 'rgb(' + dcolor.join(',') + ')';
                document.getElementById('specularColorBtn').style.backgroundColor = 'rgb(' + scolor.join(',') + ')';
                transformX.value = values[Axis.X];
                transformY.value = values[Axis.Y];
                transformZ.value = values[Axis.Z];

                if (object.isLight) {
                    $('#scaleTransform').addClass('disabled');
                    $('#rotateTransform').addClass('disabled');
                } else {
                    $('#scaleTransform').removeClass('disabled');
                    $('#rotateTransform').removeClass('disabled');
                }
            }
        },
        main: function main(canvasId, shaders) {
            var canvas = drawing.init(canvasId, shaders);

            var installList = function installList(evt) {
                if (evt.target.tagName !== 'LI') return;

                if (evt.target.className.indexOf('active') < 0) {
                    dom_helper.clearSelection(evt.target.parentNode.children);
                }
                dom_helper.setActive(evt.target);
            };
            objectsList.addEventListener('click', installList);
            objectsList.addEventListener('click', function (evt) {
                return application.updateTransformValues(evt.target.getAttribute('data-id'), dom_helper.querySelected('transformation'));
            });

            var tbuttons = document.querySelectorAll("#translateTransform,#scaleTransform,#rotateTransform");
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = tbuttons[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var button = _step2.value;

                    button.addEventListener('click', function (evt) {
                        if (evt.target.className.indexOf('disabled') < 0) {
                            application.updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'), evt.target.children[0]);
                        }
                    });
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            var transform = function transform(value, axis) {
                var selectedId = dom_helper.getSelectedFromList(objectsList.children, 'id');
                var object = ObjectManager.find(selectedId);
                if (!object) return;

                var what = dom_helper.querySelected('transformation').value;
                var params = {};
                var fnTransform = null;
                if (what === 'translate') {
                    object.fnTransform = object.translate;
                } else if (what === 'scale') {
                    object.fnTransform = object.scale;
                } else if (what === 'rotate') {
                    object.fnTransform = object.rotate;
                    params.angle = value;
                    params.axis = axis;
                }

                params[Axis.toString(axis)] = value;
                object.fnTransform(params);
            };

            transformX.addEventListener('input', function (evt) {
                return transform(parseFloat(evt.target.value), 0);
            });
            transformY.addEventListener('input', function (evt) {
                return transform(parseFloat(evt.target.value), 1);
            });
            transformZ.addEventListener('input', function (evt) {
                return transform(parseFloat(evt.target.value), 2);
            });

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = document.querySelectorAll('.add-object-btn')[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var btn = _step3.value;

                    btn.addEventListener('click', function (evt) {
                        var what = evt.target.getAttribute('data-value');
                        if (what === 'light' && ObjectManager.lights.size >= 4) {
                            alert('Sorry, application doesnt support more than 4 lights');
                            return;
                        }
                        var object = ObjectManager.buildObject(what);

                        dom_helper.clearSelection(objectsList.children);

                        dom_helper.setActive(object.dom);
                        object.dom.scrollIntoView();
                        application.updateTransformValues(object.id, dom_helper.querySelected('transformation'));
                    });
                }

                //temp
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                        _iterator3['return']();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            var object = ObjectManager.buildObject('sphere');
            object.translate({ x: 3.0 });
            object = ObjectManager.buildObject('sphere');
            object.translate({ x: -3.0 });
            object = ObjectManager.buildObject('cylinder');
            object.translate({ y: -2.0 });
            object = ObjectManager.buildObject('cylinder');
            object.translate({ y: 2.0 });
            object.rotate({ angle: 60, axis: Axis.X });
            object = ObjectManager.buildObject('cone');
            ObjectManager.buildObject('light', { position: [-10, 10, -10, 0.0] });
            ObjectManager.buildObject('light', { position: [10, 10, -10, 0.0] });
            ObjectManager.buildObject('light', { position: [-10, -10, -10, 0.0] });
            ObjectManager.buildObject('light', { position: [10, -10, -10, 0.0] });
            // dom_helper.setActive(object.dom);
            //------------------------------------------------

            drawing.render();
        }
    };
})();

window.addEventListener('load', function () {
    var programs = [];
    var count = 0;

    programs.push({
        vertexShader: {
            source: 'shaders/fragment_lighting.vs.glsl?', type: WebGLRenderingContext.VERTEX_SHADER, content: 0
        },
        fragmentShader: {
            source: 'shaders/fragment_lighting.fs.glsl?', type: WebGLRenderingContext.FRAGMENT_SHADER, content: 0
        }
    });
    programs.push({
        vertexShader: {
            source: 'shaders/vertex_lighting.vs.glsl?', type: WebGLRenderingContext.VERTEX_SHADER, content: 0
        },
        fragmentShader: {
            source: 'shaders/vertex_lighting.fs.glsl?', type: WebGLRenderingContext.FRAGMENT_SHADER, content: 0
        }
    });

    var loadAjaxContent = function loadAjaxContent(shader) {
        var request = new XMLHttpRequest();
        request.onload = function () {
            shader.content = request.responseText;
            if ((shader.source, ++count >= programs.length * 2)) {
                application.main('gl-canvas', programs);
            }
        };

        // setTimeout(() => {
        request.open("get", shader.source, true);
        request.send();
        // }, i * 5000);
    };

    for (var i = 0; i < programs.length; i++) {
        var program = programs[i];
        var vs = program.vertexShader;
        var fs = program.fragmentShader;

        loadAjaxContent(vs);
        loadAjaxContent(fs);
    }
});
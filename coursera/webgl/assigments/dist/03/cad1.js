"use strict";

var drawing = (function () {
    var gl = undefined;
    var canvas = undefined;
    var program = undefined;

    var objects = [];

    var solid = document.getElementById('solidId');
    var wireframe = document.getElementById('wireframeId');
    var solidWire = document.getElementById('solidWireId');

    var _world = (function () {
        var _rotation = vec3(0, 0, 0);

        return Object.defineProperties({}, {
            thetaX: {
                get: function get() {
                    return _rotation[Axis.X];
                },
                set: function set(rx_) {
                    _rotation[Axis.X] = parseInt(rx_);
                },
                configurable: true,
                enumerable: true
            },
            thetaY: {
                get: function get() {
                    return _rotation[Axis.Y];
                },
                set: function set(ry_) {
                    _rotation[Axis.Y] = parseInt(ry_);
                },
                configurable: true,
                enumerable: true
            },
            thetaZ: {
                get: function get() {
                    return _rotation[Axis.Z];
                },
                set: function set(rz_) {
                    _rotation[Axis.Z] = parseInt(rz_);
                },
                configurable: true,
                enumerable: true
            },
            rotationMatrix: {
                get: function get() {
                    return _rotation;
                },
                configurable: true,
                enumerable: true
            }
        });
    })();

    return Object.defineProperties({
        init: function init(canvasName) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas);
            if (!gl) {
                alert("WebGL isn't available");
            }

            this.setDefaults(gl);
            return canvas;
        },
        setDefaults: function setDefaults(gl) {
            var width = document.querySelector('.content').clientWidth;
            var height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);

            gl.canvas.width = width;
            gl.canvas.height = height;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            program = initShaders(gl, "vertex-shader", "fragment-shader");
        },
        append: function append(object) {
            objects.push(object);
        },
        render: function render() {
            gl.useProgram(program);

            var vPosition = gl.getAttribLocation(program, "vPosition");
            var vColor = gl.getAttribLocation(program, "vColor");
            var wireframeLoc = gl.getUniformLocation(program, 'wireframe');
            var projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

            var projectionMatrix = perspective(radians(90), canvas.width / canvas.height, -180, 180);
            var worldRotationLoc = gl.getUniformLocation(program, 'worldRotation');

            var bufferInfo = {};
            var opts = { solid: solid.checked || solidWire.checked, wireframe: wireframe.checked || solidWire.checked };

            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(ortho(-8, 8, -8, 8, -8, 8)));
            gl.uniform3fv(worldRotationLoc, drawing.world.rotationMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            bufferInfo.vPosition = vPosition;
            bufferInfo.vColor = vColor;
            bufferInfo.wireframeLoc = wireframeLoc;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = objects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var object = _step.value;

                    object.draw(gl, bufferInfo, opts);
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
        world: {
            get: function get() {
                return _world;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

var application = (function () {
    var canvas = drawing.init("gl-canvas");
    var transformX = document.getElementById('transformX');
    var transformY = document.getElementById('transformY');
    var transformZ = document.getElementById('transformZ');

    var objectsList = document.getElementById('objects-list');
    var addObjectButton = document.getElementById('addObjectButton');
    var addObjectModal = document.getElementById('addObjectModal');

    var dismissModal = document.getElementById('dismissModal');

    addObjectButton.addEventListener('click', function (evt) {
        addObjectModal.style.display = 'block';
    });
    dismissModal.addEventListener('click', function (evt) {
        addObjectModal.style.display = 'none';
    });

    var mouse = { pressed: false, lastPosition: null, startRotationX: 0, startRotationY: 0 };

    return {
        main: function main() {
            canvas.addEventListener('mousedown', application.mousedown);
            canvas.addEventListener('mousemove', application.mousemove);
            canvas.addEventListener('mouseup', application.mouseup);

            var installList = function installList(evt) {
                if (evt.target.tagName !== 'LI') return;

                if (evt.target.className.indexOf('active') < 0) {
                    dom_helper.clearSelection(evt.target.parentNode.children);
                }
                evt.target.className = 'active';
            };
            var updateTransformValues = function updateTransformValues(selectedId) {
                var object = ObjectManager.find(selectedId);
                if (object) {
                    var values = null;
                    var what = dom_helper.querySelected('transformation').value;
                    if (what === 'translate') {
                        values = object.translateValues;
                    } else if (what === 'scale') {
                        values = object.scaleValues;
                    } else if (what === 'rotate') {
                        values = object.rotateValues;
                    }

                    transformX.value = values[Axis.X];
                    transformY.value = values[Axis.Y];
                    transformZ.value = values[Axis.Z];
                }
            };

            objectsList.addEventListener('click', installList);
            objectsList.addEventListener('click', function (evt) {
                return updateTransformValues(evt.target.getAttribute('data-id'));
            });
            document.getElementById('translateTransform').addEventListener('change', function (evt) {
                return updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'));
            });
            document.getElementById('scaleTransform').addEventListener('change', function (evt) {
                return updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'));
            });
            document.getElementById('rotationTransform').addEventListener('change', function (evt) {
                return updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'));
            });

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

            var newObjectDom = document.getElementById('new-object');
            newObjectDom.addEventListener('click', function (evt) {
                var what = evt.target.getAttribute('data-value');
                var object = ObjectManager.buildObject(what);

                drawing.append(object);
                dom_helper.clearSelection(objectsList.children);

                object.dom.className = 'active';
                object.dom.scrollIntoView();
                updateTransformValues(object.id);
                addObjectModal.style.display = 'none';
            });

            drawing.render();
        },
        mousedown: function mousedown(evt) {
            mouse.pressed = true;
            mouse.lastPosition = dom_helper.getClickPosition(evt);
            mouse.startRotationY = drawing.world.thetaY;
            mouse.startRotationX = drawing.world.thetaX;
        },
        mousemove: function mousemove(evt) {
            if (mouse.pressed && mouse.lastPosition) {
                var current = dom_helper.getClickPosition(evt);
                var dx = mouse.lastPosition[0] - current[0];
                var dy = mouse.lastPosition[1] - current[1];

                drawing.world.thetaY = mouse.startRotationY + 360 * dx / canvas.height;
                drawing.world.thetaX = mouse.startRotationX + 360 * dy / canvas.width;
            }
        },
        mouseup: function mouseup(evt) {
            mouse.pressed = false;
            mouse.lastPosition = null;
            mouse.startRotationY = 0;
            mouse.startRotationX = 0;
        }
    };
})();

window.addEventListener('load', application.main);

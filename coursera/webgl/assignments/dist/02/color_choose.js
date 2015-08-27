"use strict";

var drawing_color = (function () {
    var gl = undefined;
    var canvas = undefined;
    var program = undefined;
    var vertices = [];

    var mousePressed = false;
    var lastPosition = null;

    function getClickPosition(event) {
        var target = event.target;
        var posX = event.offsetX ? event.offsetX : event.pageX - target.offsetLeft;
        var posY = event.offsetY ? event.offsetY : event.pageY - target.offsetTop;

        return { x: posX, y: posY };
    }

    return Object.defineProperties({
        init: function init(canvasName) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas, { preserveDrawingBuffer: true });
            if (!gl) {
                alert("WebGL isn't available");
            }

            this.setDefaults();

            canvas.addEventListener('mouseup', this.mouseUp);
            canvas.addEventListener('mousedown', this.mouseDown);
            canvas.addEventListener('mousemove', this.mouseMove);
        },
        setDefaults: function setDefaults() {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);

            program = initShaders(gl, "vs-choose-color", "fs-choose-color");
        },
        mouseUp: function mouseUp(event) {
            var bounds = getClickPosition(event);
            var pixels = new Uint8Array(4 * Uint8Array.BYTES_PER_ELEMENT);
            gl.readPixels(bounds.x, canvas.height - bounds.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            var r = pixels[0],
                g = pixels[1],
                b = pixels[2];
            var fr = (r / 255.0).toFixed(2),
                fg = (g / 255.0).toFixed(2),
                fb = (b / 255.0).toFixed(2);

            var colorButton = document.getElementById('chooseColorButton');
            colorButton.style.background = "rgb(" + r + "," + g + "," + b + ")";
            colorButton.value = "rgb(" + fr + "," + fg + "," + fb + ")";

            var rgb = [pixels[0] / 255, pixels[1] / 255, pixels[2] / 255];
            application_color.color = rgb;
            colorButton.style.color = rgb[0] * rgb[1] * rgb[2] > 0.0001 ? 'black' : 'white';

            drawing.redraw();
        },
        mouseDown: function mouseDown(event) {},
        mouseMove: function mouseMove(event) {},
        upload: function upload() {
            gl.useProgram(program);

            // Load the data into the GPU
            var bufferId = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

            // Associate out shader variables with our data buffer
            var vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            var colors = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0];

            var cBufferId = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

            var vColor = gl.getAttribLocation(program, "vColor");
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);
        },

        pushVertex: function pushVertex(vertex) {
            var c = geometry.screenToUnitaryCoords({ x: vertex[0], y: vertex[1], w: canvas.width, h: canvas.height });
            vertices.push(c);
        },
        pushVertices: function pushVertices(vertices_) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = vertices_[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var v = _step.value;

                    var c = geometry.screenToUnitaryCoords({ x: v[0], y: v[1], w: canvas.width, h: canvas.height });
                    vertices.push(c);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator["return"]) {
                        _iterator["return"]();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        },
        clear: function clear() {
            vertices = [];
        },
        render: function render() {
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
        }
    }, {
        width: {
            get: function get() {
                return canvas.width;
            },
            configurable: true,
            enumerable: true
        },
        height: {
            get: function get() {
                return canvas.height;
            },
            configurable: true,
            enumerable: true
        },
        polygon: {
            set: function set(newPolygon) {
                vertices = newPolygon;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

var application_color = (function () {
    drawing_color.init("gl-canvas-color");
    var w = drawing_color.width;
    var h = drawing_color.height;
    var currentColor = [0, 0, 0];

    var path = [vec2(0, 0), vec2(0, h), vec2(w / 3, 0), vec2(w / 3, h), vec2(2 * w / 3, 0), vec2(2 * w / 3, h), vec2(w, 0), vec2(w, h)];

    return Object.defineProperties({
        main: function main() {
            drawing_color.clear();
            drawing_color.pushVertices(path);

            drawing_color.upload();
            drawing_color.render();
        }
    }, {
        color: {
            get: function get() {
                return currentColor;
            },
            set: function set(c) {
                currentColor = c;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

window.addEventListener('load', application_color.main);
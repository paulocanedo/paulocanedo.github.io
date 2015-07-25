"use strict";

var dom_helper = (function () {
    return {
        querySelected: function querySelected(name) {
            var nodeList = document.getElementsByName(name);

            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                if (node.checked) return node;
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
        }
    };
})();

var geometry = (function () {
    return {
        screenToUnitaryCoords: function screenToUnitaryCoords(bounds) {
            var cx = -1 + 2 * bounds.x / bounds.w;
            var cy = -1 + 2 * (bounds.h - bounds.y) / bounds.h;

            return vec2(cx, cy);
        },
        degree: function degree(value) {
            return value * 180 / Math.PI;
        },
        radians: function radians(value) {
            return value / 180.0 * Math.PI;
        },
        slope: function slope(x1, y1, x2, y2) {
            return (y2 - y1) / (x2 - x1);
        },
        perpendicularSlope: function perpendicularSlope(x1, y1, x2, y2) {
            return -(y2 - y1) / (x2 - x1);
        },
        perpendicularPoint: function perpendicularPoint(x, y, distance, pslp) {
            var inverse = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

            var b = inverse ? Math.PI : 0;

            var newX = x + distance * Math.sin(Math.atan(pslp) + b);
            var newY = y + distance * Math.cos(Math.atan(pslp) + b);

            return vec2(newX, newY);
        },
        perpendicularSegment: function perpendicularSegment(x1, y1, x2, y2, distance) {
            var inverse = arguments.length <= 5 || arguments[5] === undefined ? false : arguments[5];

            var pslp = this.perpendicularSlope(x1, y1, x2, y2);
            var p1 = this.perpendicularPoint(x1, y1, distance, pslp, inverse);
            var p2 = this.perpendicularPoint(x2, y2, distance, pslp, inverse);

            return [p1, p2];
        }
    };
})();

var drawing = (function () {
    var gl = undefined;
    var canvas = undefined;
    var program = undefined;

    var vertices = [];
    var colors = [];
    var _minInterpolateDistance = 1.0;

    var line_thick = (function () {
        var path = [];

        return {
            addVertex: function addVertex(vertex, color, lineWidth) {
                path.push(vertex);

                if (path.length > 1) {
                    var i = path.length - 1;
                    var start = path[i - 1];
                    var end = path[i];
                    var segment = geometry.perpendicularSegment(start[0], start[1], end[0], end[1], lineWidth / 2, false);
                    var segmentI = geometry.perpendicularSegment(start[0], start[1], end[0], end[1], lineWidth / 2, true);

                    vertices.push(drawing.toUnitaryCoords(segment[0]), drawing.toUnitaryCoords(segmentI[0]), drawing.toUnitaryCoords(segment[1]), drawing.toUnitaryCoords(segmentI[1]));
                    colors.push(color, color, color, color);
                }
            },
            distanceFromLastVertex: function distanceFromLastVertex(vertex) {
                if (path.length > 1) {
                    var lvertex = path[path.length - 1];
                    var dx = lvertex[0] - vertex[0];
                    var dy = lvertex[1] - vertex[1];

                    return Math.sqrt(dx * dx + dy * dy);
                }

                return Number.MAX_SAFE_INTEGER;
            }
        };
    })();

    return Object.defineProperties({
        init: function init(canvasName) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas);
            if (!gl) {
                alert("WebGL isn't available");
            }

            this.setDefaults();
            return canvas;
        },
        setDefaults: function setDefaults() {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            program = initShaders(gl, "vertex-shader", "fragment-shader");
        },
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

            var cBufferId = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

            var vColor = gl.getAttribLocation(program, "vColor");
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);
        },
        addToCurrentBrush: function addToCurrentBrush(vertex) {
            var color = arguments.length <= 1 || arguments[1] === undefined ? [0, 0, 0] : arguments[1];
            var lineWidth = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

            if (line_thick.distanceFromLastVertex(vertex) < _minInterpolateDistance) {
                return false;
            }

            line_thick.addVertex(vertex, color, lineWidth);
            return true;
        },
        newBrush: function newBrush(vertex) {
            var color = arguments.length <= 1 || arguments[1] === undefined ? [0, 0, 0] : arguments[1];
            var lineWidth = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

            if (vertices.length < 4) {
                return false;
            }

            var x = vertex[0],
                y = vertex[1];
            console.log(x, y);

            vertices.push(vertices[vertices.length - 1], vertices[vertices.length - 1], this.toUnitaryCoords(x, y), this.toUnitaryCoords(x, y));
            colors.push(color, color, color, color);
            return true;
        },
        toUnitaryCoords: function toUnitaryCoords(coord) {
            return geometry.screenToUnitaryCoords({ x: coord[0], y: coord[1], w: canvas.width, h: canvas.height });
        },
        clear: function clear() {
            vertices = [];
        },
        redraw: function redraw() {
            drawing.upload();
            drawing.render();
        },
        render: function render() {
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
        }
    }, {
        minInterpolateDistance: {
            get: function get() {
                return _minInterpolateDistance;
            },
            set: function set(min) {
                _minInterpolateDistance = min;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

var application = (function () {
    var canvas = drawing.init("gl-canvas");
    var mousePressed = false;

    var lineWidthCtrl = document.getElementById('lineWidthCtrl');
    var minInterpolateDistanceCtrl = document.getElementById('minInterpolateDistanceCtrl');
    drawing.minInterpolateDistance = parseInt(minInterpolateDistanceCtrl.value);

    return {
        main: function main() {
            canvas.addEventListener('mouseup', application.mouseUp);
            canvas.addEventListener('mousedown', application.mouseDown);
            canvas.addEventListener('mousemove', application.mouseMove);

            minInterpolateDistanceCtrl.addEventListener('change', function (evt) {
                return drawing.minInterpolateDistance = parseInt(minInterpolateDistanceCtrl.value);
            });
        },
        mouseUp: function mouseUp(event) {
            mousePressed = false;
            requestAnimFrame(drawing.redraw);
        },
        mouseDown: function mouseDown(event) {
            var mousePos = dom_helper.getClickPosition(event);
            drawing.addToCurrentBrush(mousePos, application_color.color, 0);
            mousePressed = true;
        },
        mouseMove: function mouseMove(event) {
            var mousePos = dom_helper.getClickPosition(event);
            if (mousePressed) {
                if (drawing.addToCurrentBrush(mousePos, application_color.color, parseInt(lineWidthCtrl.value))) {
                    requestAnimFrame(drawing.redraw);
                }
            }
        }
    };
})();

window.addEventListener('load', application.main);
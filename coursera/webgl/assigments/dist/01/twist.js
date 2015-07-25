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
        }
    };
})();

var geometry = (function () {
    var FULL_CIRCLE = 2 * Math.PI;
    var lineIntersection = function lineIntersection(k, l, m, n) {
        var A1 = l[1] - k[1];
        var B1 = k[0] - l[0];
        var C1 = A1 * k[0] + B1 * k[1];

        var A2 = n[1] - m[1];
        var B2 = m[0] - n[0];
        var C2 = A2 * m[0] + B2 * m[1];

        var det = A1 * B2 - A2 * B1;
        if (det == 0.0) {
            return null;
        }

        var x = (B2 * C1 - B1 * C2) / det;
        var y = (A1 * C2 - A2 * C1) / det;

        return vec2(x, y);
    };

    return {
        buildPolygonRegular: function buildPolygonRegular(x, y, radius, npoints) {
            var output = [];
            var angle = FULL_CIRCLE / npoints;
            for (var a = 0; a < FULL_CIRCLE; a += angle) {
                var sx = x + Math.cos(a) * radius;
                var sy = y + Math.sin(a) * radius;

                output.push(vec2(sx, sy));
            }
            return output;
        },
        buildStar: function buildStar(x, y, radius) {
            var pentagon = this.buildPolygonRegular(x, y, radius, 5);
            var p0 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[4]);
            var p1 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[3]);
            var p2 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[1]);
            var p3 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[0]);
            var p4 = lineIntersection(pentagon[0], pentagon[3], pentagon[1], pentagon[4]);
            // let p1 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[3]);
            // let p2 = lineIntersection(pentagon[1], pentagon[3], pentagon[2], pentagon[4]);
            // let p3 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[0]);
            // let p4 = lineIntersection(pentagon[3], pentagon[0], pentagon[4], pentagon[1]);
            // let p5 = lineIntersection(pentagon[4], pentagon[1], pentagon[0], pentagon[2]);

            var output = [];
            output.push(pentagon[0], p0, p4, pentagon[1], p0, p1, pentagon[2], p1, p2, pentagon[3], p2, p3, pentagon[4], p3, p4
            // pentagon[1], pentagon[5], p1,
            // pentagon[1], pentagon[4], p2,
            // pentagon[2], pentagon[0], p3
            );

            return output;
        },
        twistPoint2d: function twistPoint2d(angle, point) {
            var x = point[0];
            var y = point[1];
            var distance = Math.sqrt(x * x + y * y);

            var xp = x * Math.cos(distance * angle) - y * Math.sin(distance * angle);
            var yp = x * Math.sin(distance * angle) + y * Math.cos(distance * angle);

            return vec2(xp, yp);
        },
        twistPolygon2d: function twistPolygon2d(angle, polygon) {
            var output = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = polygon[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var point = _step.value;

                    var newPoint = this.twistPoint2d(angle, point);
                    output.push(newPoint);
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

            ;

            return output;
        },
        tesselationTriangle: function tesselationTriangle(a, b, c, count) {
            var output = [];
            var divide = function divide(a, b, c, count) {
                if (count === 0) {
                    output.push(a, b, c);
                    return;
                }

                var ab = mix(a, b, 0.5);
                var ac = mix(a, c, 0.5);
                var bc = mix(b, c, 0.5);

                count--;
                divide(a, ab, ac, count, output);
                divide(c, ac, bc, count, output);
                divide(b, ab, bc, count, output);
                divide(ab, bc, ac, count, output);
            };

            divide(a, b, c, count);
            return output;
        }
    };
})();

var drawing = (function () {
    var gl;
    var canvas;
    var vertices = [];

    return Object.defineProperties({
        init: function init(canvasName) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas);
            if (!gl) {
                alert("WebGL isn't available");
            }

            this.setDefaults();
        },
        setDefaults: function setDefaults() {
            this.wireframe = false;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        },
        upload: function upload() {
            //  Load shaders and initialize attribute buffers
            var program = initShaders(gl, "vertex-shader", "fragment-shader");
            gl.useProgram(program);

            // Load the data into the GPU
            var bufferId = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

            // Associate out shader variables with our data buffer
            var vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
        },
        makeTriangle: function makeTriangle(a, b, c) {
            vertices.push(a, b, c);
        },
        makeQuad: function makeQuad(a, b, c, d) {
            vertices.push(a, b, d, b, c, d);
        },
        makeTessTriangles: function makeTessTriangles(a, b, c, count) {
            vertices = vertices.concat(geometry.tesselationTriangle(a, b, c, count));
        },
        makeTessQuad: function makeTessQuad(a, b, c, d, count) {
            vertices = vertices.concat(geometry.tesselationTriangle(a, b, d, count));
            vertices = vertices.concat(geometry.tesselationTriangle(b, c, d, count));
        },
        twist: function twist(angleDegree) {
            var angle = radians(angleDegree);
            vertices = geometry.twistPolygon2d(angle, vertices, vertices);
        },
        clear: function clear() {
            vertices = [];
        },
        render: function render() {
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (this.wireframe) {
                for (var i = 0; i < vertices.length; i += 3) {
                    gl.drawArrays(gl.LINE_LOOP, i, 3);
                }
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
            }
        }
    }, {
        wireframe: {
            get: function get() {
                return this._wireframe;
            },
            set: function set(wireframe) {
                this._wireframe = wireframe;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

var application = (function () {
    var redraw = function redraw(evt) {
        var angleDegree = angleCtrl.value;
        var tessSteps = tessStepsCtrl.value;
        var shape = dom_helper.querySelected('shape').value;

        drawing.clear();
        drawing.wireframe = dom_helper.querySelected('fill_style').value === 'wireframe';

        switch (shape) {
            case 'quad':
                drawing.makeTessQuad(vec2(-0.5, -0.5), vec2(-0.5, 0.5), vec2(0.5, 0.5), vec2(0.5, -0.5), tessSteps);
                break;

            case 'star':
                var star = geometry.buildStar(0, 0, 0.5);

                // drawing.makeTriangle(star[0], star[1], star[2]);
                // drawing.makeTriangle(star[3], star[4], star[5]);
                // drawing.makeTriangle(star[6], star[7], star[8]);
                // drawing.makeTriangle(star[9], star[10], star[11]);
                // drawing.makeTriangle(star[12], star[13], star[14]);
                //
                // drawing.makeTriangle(star[1], star[2], star[7]);
                // drawing.makeTriangle(star[2], star[7], star[8]);
                // drawing.makeTriangle(star[8], star[11], star[14]);

                drawing.makeTessTriangles(star[0], star[1], star[2], tessSteps);
                drawing.makeTessTriangles(star[3], star[4], star[5], tessSteps);
                drawing.makeTessTriangles(star[6], star[7], star[8], tessSteps);
                drawing.makeTessTriangles(star[9], star[10], star[11], tessSteps);
                drawing.makeTessTriangles(star[12], star[13], star[14], tessSteps);

                drawing.makeTessTriangles(star[1], star[2], star[7], tessSteps);
                drawing.makeTessTriangles(star[2], star[7], star[8], tessSteps);
                drawing.makeTessTriangles(star[8], star[11], star[14], tessSteps);

                break;

            default:
                //triangle
                drawing.makeTessTriangles(vec2(-0.5, -0.5), vec2(0.0, 0.5), vec2(0.5, -0.5), tessSteps);
        }

        drawing.twist(angleDegree);
        drawing.upload();
        drawing.render();
    };

    return {
        main: function main() {
            var angleCtrl = document.getElementById('angleCtrl');
            var tessStepsCtrl = document.getElementById('tessStepsCtrl');
            var nodeList1 = document.getElementsByName('fill_style');
            var nodeList2 = document.getElementsByName('shape');

            angleCtrl.addEventListener('change', redraw);
            tessStepsCtrl.addEventListener('change', redraw);

            for (var i = 0; i < nodeList1.length; i++) {
                var node = nodeList1[i];
                node.addEventListener('change', function (evt) {
                    if (evt.target.checked) redraw();
                });
            }
            for (var i = 0; i < nodeList2.length; i++) {
                var node = nodeList2[i];
                node.addEventListener('change', function (evt) {
                    if (evt.target.checked) redraw();
                });
            }

            drawing.init("gl-canvas");
            redraw();
        }
    };
})();

window.addEventListener('load', application.main);
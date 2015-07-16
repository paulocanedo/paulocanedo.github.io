"use strict";

var dom_helper = (() => {
    return {
        querySelected(name) {
            let nodeList = document.getElementsByName(name);

            for(let node of nodeList) {
                if(node.checked) return node;
            }
            return null;
        }
    };
})();

var polygon = (() => {
    const FULL_CIRCLE = 2 * Math.PI;
    let lineIntersection = (k, l, m, n) => {
        let A1 = l[1] - k[1];
        let B1 = k[0] - l[0];
        let C1 = A1 * k[0] + B1 * k[1];

        let A2 = n[1] - m[1];
        let B2 = m[0] - n[0];
        let C2 = A2 * m[0] + B2 * m[1];

        let det = A1 * B2 - A2 * B1;
        if (det == 0.0) {
            return null;
        }

        let x = (B2 * C1 - B1 * C2) / det;
        let y = (A1 * C2 - A2 * C1) / det;

        return vec2(x, y);
    };

    return {
        buildRegular(x, y, radius, npoints) {
            let output = [];
            let angle = FULL_CIRCLE / npoints;
            for(let a = 0; a < FULL_CIRCLE; a += angle) {
                let sx = x + Math.cos(a) * radius;
                let sy = y + Math.sin(a) * radius;

                output.push(vec2(sx, sy));
            }
            return output;
        },
        buildStar(x, y, radius) {
            let pentagon = this.buildRegular(x, y, radius, 5);
            let p1 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[3]);
            let p2 = lineIntersection(pentagon[1], pentagon[3], pentagon[2], pentagon[4]);
            let p3 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[0]);

            let output = [];
            output.push(
                pentagon[0], pentagon[3], p1,
                pentagon[1], pentagon[4], p2,
                pentagon[2], pentagon[0], p3
            );

            return output;
        },
    };
})();

var twist = (() => {
    return {
        point2d(angle, point) {
            var x = point[0];
            var y = point[1];
            var distance = Math.sqrt((x * x) + (y * y));

            var xp = x * Math.cos(distance * angle) - y * Math.sin(distance * angle);
            var yp = x * Math.sin(distance * angle) + y * Math.cos(distance * angle);

            return vec2(xp, yp);
        },
        polygon2d(angle, polygon) {
            let output = [];
            for(let point of polygon) {
                let newPoint = this.point2d(angle, point);
                output.push(newPoint);
            };

            return output;
        }
    };
})();

var tesselation = (() => {
    return {
        triangle(a, b, c, count) {
            var output = [];
            var divide = (a, b, c, count) => {
                if(count === 0) {
                    output.push(a, b, c);
                    return;
                }

                let ab = mix(a, b, 0.5);
                let ac = mix(a, c, 0.5);
                let bc = mix(b, c, 0.5);

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

var drawing = (() => {
    var gl;
    var canvas;
    var vertices = [];

    return {
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults();
        },
        setDefaults() {
            this.wireframe = false;
            gl.viewport( 0, 0, canvas.width, canvas.height );
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        },
        upload() {
            //  Load shaders and initialize attribute buffers
            var program = initShaders( gl, "vertex-shader", "fragment-shader" );
            gl.useProgram( program );

            // Load the data into the GPU
            var bufferId = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

            // Associate out shader variables with our data buffer
            var vPosition = gl.getAttribLocation( program, "vPosition" );
            gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );
        },
        makeTriangle(a, b, c) {
            vertices.push(a, b, c);
        },
        makeQuad(a, b, c, d) {
            vertices.push(a, b, d, b, c, d);
        },
        makeTessTriangles(a, b, c, count) {
            vertices = tesselation.triangle(a, b, c, count);
        },
        makeTessQuad(a, b, c, d, count) {
            vertices = vertices.concat(tesselation.triangle(a, b, d, count));
            vertices = vertices.concat(tesselation.triangle(b, c, d, count));
        },
        makePolygon(polygon, count = 1) {
            let a1 = polygon[0];
            let a2 = polygon[1];
            let a3 = polygon[2];
            let a4 = polygon[3];
            let a5 = polygon[4];
            let a6 = polygon[5];
            let a7 = polygon[6];
            let a8 = polygon[7];
            let a9 = polygon[8];
            vertices.push(a1, a2, a3);
            vertices.push(a4, a5, a6);
            vertices.push(a7, a8, a9);

            // vertices = vertices.concat(tesselation.triangle(a1, a2, a3, count));
            // vertices = vertices.concat(tesselation.triangle(a4, a5, a6, count));
            // vertices = vertices.concat(tesselation.triangle(a7, a8, a9, count));
        },
        twist(angleDegree) {
            let angle = radians(angleDegree);
            vertices = twist.polygon2d(angle, vertices, vertices);
        },
        clear() {
            vertices = [];
        },
        render() {
            gl.clear( gl.COLOR_BUFFER_BIT );

            if(this.wireframe) {
                for(let i = 0; i < vertices.length; i += 3) {
                    gl.drawArrays(gl.LINE_LOOP, i, 3);
                }
            } else {
                gl.drawArrays( gl.TRIANGLES, 0, vertices.length );
            }

        },
        get wireframe() { return this._wireframe; },
        set wireframe(wireframe) { this._wireframe = wireframe; }
    };
})();

var application = (() => {
    return {
        main() {
            var redraw = evt => {
                let angleDegree = angleCtrl.value;
                let tessSteps = tessStepsCtrl.value;
                let shape = dom_helper.querySelected('shape').value;

                drawing.clear();
                drawing.wireframe = dom_helper.querySelected('fill_style').value === 'wireframe';

                switch (shape) {
                    case 'quad':
                        drawing.makeTessQuad(
                            vec2(-0.5, -0.5),
                            vec2(-0.5,  0.5),
                            vec2( 0.5,  0.5),
                            vec2( 0.5, -0.5),
                            tessSteps
                        );
                        break;

                    case 'star':
                        let star = polygon.buildStar(0, 0, 0.5);
                        drawing.makePolygon(star, tessSteps);
                        break;

                    default: //triangle
                        drawing.makeTessTriangles(
                            vec2(-0.5, -0.5),
                            vec2( 0.0,  0.5),
                            vec2( 0.5, -0.5),
                            tessSteps
                        );
                }




                drawing.twist(angleDegree);
                drawing.upload();
                drawing.render();
            };

            var angleCtrl = document.getElementById('angleCtrl');
            var tessStepsCtrl = document.getElementById('tessStepsCtrl');
            angleCtrl.addEventListener('change', redraw);
            tessStepsCtrl.addEventListener('change', redraw);
            for(let node of document.getElementsByName('fill_style')) {
                node.addEventListener('change', evt => {
                    if(evt.target.checked) redraw();
                });
            }
            for(let node of document.getElementsByName('shape')) {
                node.addEventListener('change', evt => {
                    if(evt.target.checked) redraw();
                });
            }

            drawing.init("gl-canvas");
            redraw();
        }
    };
})();

window.addEventListener('load', application.main);

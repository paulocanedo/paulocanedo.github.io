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

var geometry = (() => {
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
        buildPolygonRegular(x, y, radius, npoints) {
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
            let pentagon = this.buildPolygonRegular(x, y, radius, 5);
            let p0 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[4]);
            let p1 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[3]);
            let p2 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[1]);
            let p3 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[0]);
            let p4 = lineIntersection(pentagon[0], pentagon[3], pentagon[1], pentagon[4]);
            // let p1 = lineIntersection(pentagon[0], pentagon[2], pentagon[1], pentagon[3]);
            // let p2 = lineIntersection(pentagon[1], pentagon[3], pentagon[2], pentagon[4]);
            // let p3 = lineIntersection(pentagon[2], pentagon[4], pentagon[3], pentagon[0]);
            // let p4 = lineIntersection(pentagon[3], pentagon[0], pentagon[4], pentagon[1]);
            // let p5 = lineIntersection(pentagon[4], pentagon[1], pentagon[0], pentagon[2]);

            let output = [];
            output.push(
                pentagon[0], p0, p4,
                pentagon[1], p0, p1,
                pentagon[2], p1, p2,
                pentagon[3], p2, p3,
                pentagon[4], p3, p4
                // pentagon[1], pentagon[5], p1,
                // pentagon[1], pentagon[4], p2,
                // pentagon[2], pentagon[0], p3
            );

            return output;
        },
        twistPoint2d(angle, point) {
            var x = point[0];
            var y = point[1];
            var distance = Math.sqrt((x * x) + (y * y));

            var xp = x * Math.cos(distance * angle) - y * Math.sin(distance * angle);
            var yp = x * Math.sin(distance * angle) + y * Math.cos(distance * angle);

            return vec2(xp, yp);
        },
        twistPolygon2d(angle, polygon) {
            let output = [];
            for(let point of polygon) {
                let newPoint = this.twistPoint2d(angle, point);
                output.push(newPoint);
            };

            return output;
        },
        tesselationTriangle(a, b, c, count) {
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
            vertices = vertices.concat(geometry.tesselationTriangle(a, b, c, count));
        },
        makeTessQuad(a, b, c, d, count) {
            vertices = vertices.concat(geometry.tesselationTriangle(a, b, d, count));
            vertices = vertices.concat(geometry.tesselationTriangle(b, c, d, count));
        },
        twist(angleDegree) {
            let angle = radians(angleDegree);
            vertices = geometry.twistPolygon2d(angle, vertices, vertices);
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
                let star = geometry.buildStar(0, 0, 0.5);

                // drawing.makeTriangle(star[0], star[1], star[2]);
                // drawing.makeTriangle(star[3], star[4], star[5]);
                // drawing.makeTriangle(star[6], star[7], star[8]);
                // drawing.makeTriangle(star[9], star[10], star[11]);
                // drawing.makeTriangle(star[12], star[13], star[14]);
                //
                // drawing.makeTriangle(star[1], star[2], star[7]);
                // drawing.makeTriangle(star[2], star[7], star[8]);
                // drawing.makeTriangle(star[8], star[11], star[14]);

                drawing.makeTessTriangles( star[0],  star[1],  star[2], tessSteps);
                drawing.makeTessTriangles( star[3],  star[4],  star[5], tessSteps);
                drawing.makeTessTriangles( star[6],  star[7],  star[8], tessSteps);
                drawing.makeTessTriangles( star[9], star[10], star[11], tessSteps);
                drawing.makeTessTriangles(star[12], star[13], star[14], tessSteps);

                drawing.makeTessTriangles(star[1],  star[2],  star[7], tessSteps);
                drawing.makeTessTriangles(star[2],  star[7],  star[8], tessSteps);
                drawing.makeTessTriangles(star[8], star[11], star[14], tessSteps);

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

    return {
        main() {
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

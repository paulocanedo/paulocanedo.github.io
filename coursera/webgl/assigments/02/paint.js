"use strict";

let LineJoin = (() => {
    return {
        get BEVELED() { return 0; },
        get MITER()   { return 1; },
        get ROUND()   { return 2; }
    }
})();

var dom_helper = (function () {
    return {
        querySelected(name) {
            let nodeList = document.getElementsByName(name);

            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                if (node.checked) return node;
            }
            return null;
        },
        addEventListener(name, evtName, listener) {
            let nodeList = document.getElementsByName(name);

            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                node.addEventListener(evtName, listener);
            }
        },
        getClickPosition(event) {
            let target = event.target;
            let posX = event.offsetX ? (event.offsetX) : event.pageX - target.offsetLeft;
            let posY = event.offsetY ? (event.offsetY) : event.pageY - target.offsetTop;

            return vec2(posX, posY);
        }
    };
})();

let geometry = (() => {
    return {
        lineIntersection(k, l, m, n) {
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
        },
        segmentIntersection(k, l, m, n) {
            let x1 = k[0];
            let y1 = k[1];
            let x2 = l[0];
            let y2 = l[1];
            let x3 = m[0];
            let y3 = m[1];
            let x4 = n[0];
            let y4 = n[1];

            let a1, a2, b1, b2, c1, c2;
            let r1, r2 , r3, r4;
            let denom, offset, num;
            let x, y;

            // Compute a1, b1, c1, where line joining points 1 and 2
            // is "a1 x + b1 y + c1 = 0".
            a1 = y2 - y1;
            b1 = x1 - x2;
            c1 = (x2 * y1) - (x1 * y2);

            // Compute r3 and r4.
            r3 = ((a1 * x3) + (b1 * y3) + c1);
            r4 = ((a1 * x4) + (b1 * y4) + c1);

            // Check signs of r3 and r4. If both point 3 and point 4 lie on
            // same side of line 1, the line segments do not intersect.
            if ((r3 != 0) && (r4 != 0) && this.same_sign(r3, r4)){
                return null;
            }

            // Compute a2, b2, c2
            a2 = y4 - y3;
            b2 = x3 - x4;
            c2 = (x4 * y3) - (x3 * y4);

            // Compute r1 and r2
            r1 = (a2 * x1) + (b2 * y1) + c2;
            r2 = (a2 * x2) + (b2 * y2) + c2;

            // Check signs of r1 and r2. If both point 1 and point 2 lie
            // on same side of second line segment, the line segments do
            // not intersect.
            if ((r1 != 0) && (r2 != 0) && (this.same_sign(r1, r2))){
                return null;
            }

            //Line segments intersect: compute intersection point.
            denom = (a1 * b2) - (a2 * b1);

            if (denom === 0) {
                return null;
            }

            if (denom < 0){
                offset = -denom / 2;
            }
            else {
                offset = denom / 2 ;
            }

            // The denom/2 is to get rounding instead of truncating. It
            // is added or subtracted to the numerator, depending upon the
            // sign of the numerator.
            num = (b1 * c2) - (b2 * c1);
            if (num < 0){
                x = (num - offset) / denom;
            } else {
                x = (num + offset) / denom;
            }

            num = (a2 * c1) - (a1 * c2);
            if (num < 0){
                y = ( num - offset) / denom;
            } else {
                y = (num + offset) / denom;
            }

            // lines_intersect
            return vec2(x, y);
        },
        same_sign(a, b){
            return (( a * b) >= 0);
        },
        screenToUnitaryCoords(bounds) {
            let cx = -1 + 2 * bounds.x / bounds.w;
            let cy = -1 + 2 * (bounds.h - bounds.y) / bounds.h;

            return vec2(cx, cy);
        },
        degree(value) {
            return value * 180 / Math.PI;
        },
        radians(value) {
            return value / 180.0 * Math.PI;
        },
        slope(x1, y1, x2, y2) {
            return (y2 -y1) / (x2 -x1);
        },
        perpendicularSlope(x1, y1, x2, y2) {
            return -(y2 - y1) / (x2 - x1);
        },
        perpendicularPoint(x, y, distance, pslp, inverse = false) {
            let b = inverse ? Math.PI : 0;

            let newX = x + (distance * Math.sin(Math.atan(pslp) + b));
            let newY = y + (distance * Math.cos(Math.atan(pslp) + b));

            return vec2(newX, newY);
        },
        perpendicularSegment(x1, y1, x2, y2, distance, inverse = false) {
            let pslp = this.perpendicularSlope(x1, y1, x2, y2);
            let p1 = this.perpendicularPoint(x1, y1, distance, pslp, inverse);
            let p2 = this.perpendicularPoint(x2, y2, distance, pslp, inverse);

            return [p1, p2];
        },
        tesselateLine(path, distance, lineJoin = LineJoin.BEVELED) {
            let result = [];

            for(let i=1; i<path.length; i++) {
                let start    = path[i-1];
                let end      = path[i];
                let segment  = this.perpendicularSegment(start[0], start[1], end[0], end[1], distance, false);
                let segmentI = this.perpendicularSegment(start[0], start[1], end[0], end[1], distance, true);

                if(i > 1) {
                    switch(lineJoin) {
                        case LineJoin.MITER:
                            let lastSegmentsStart = (i - 2) * 4;
                            let intersection = this.lineIntersection(
                                result[lastSegmentsStart+0], result[lastSegmentsStart+2],
                                segment[0], segment[1]
                            );
                            if(intersection) {
                                result[lastSegmentsStart+2] = intersection;
                            }

                            let intersectionI = this.lineIntersection(
                                result[lastSegmentsStart+1], result[lastSegmentsStart+3],
                                segmentI[0], segmentI[1]
                            );
                            if(intersectionI) {
                                result[lastSegmentsStart+3] = intersectionI;
                            }
                            break;
                        default:
                    }
                }

                result.push(segment[0], segmentI[0], segment[1], segmentI[1]);
            }

            return result;
        }
    }
})();

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let allRects = [];
    let vertices = [];
    let colors = [];
    let currentPath = {lineWidth: 1.0, lineJoin: LineJoin.MITER, path: []};

    allRects.push(vertices);

    return {
        set lineWidth(lw) { currentPath.lineWidth = lw; },
        get lineWidth()  { return lineWidth; },
        set lineJoin(lj) { currentPath.lineJoin = lj; },
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults();
            return canvas;
        },
        setDefaults() {
            gl.viewport( 0, 0, canvas.width, canvas.height );
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            program = initShaders( gl, "vertex-shader", "fragment-shader" );
        },
        upload() {
            gl.useProgram( program );

            // Load the data into the GPU
            let bufferId = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

            // Associate out shader variables with our data buffer
            let vPosition = gl.getAttribLocation( program, "vPosition" );
            gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );

            let cBufferId = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

            let vColor = gl.getAttribLocation( program, "vColor" );
            gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );
        },
        addToCurrentPath(vertex) {
            let path = currentPath.path;
            path.push(vertex);
        },
        addToCurrentBrush(vertex, color = [0, 0, 0], lineWidth = 1) {
            if(vertices.length > 4) {
                let lastX = (vertices[vertices.length-1][0] + vertices[vertices.length-4][0]) / 2.0;
                let lastY = (vertices[vertices.length-2][1] + vertices[vertices.length-3][1]) / 2.0;

                let dx = lastX - vertex[0], dy = lastY - vertex[1];
                let distance = Math.sqrt(dx * dx + dy * dy);

                if(distance < 2) {
                    return false;
                }
            }

            let x = vertex[0], y = vertex[1];
            vertices.push(
                this.toUnitaryCoords(vec2(x - lineWidth / 2.0, y - lineWidth / 2.0)),
                this.toUnitaryCoords(vec2(x - lineWidth / 2.0, y + lineWidth / 2.0)),
                this.toUnitaryCoords(vec2(x + lineWidth / 2.0, y - lineWidth / 2.0)),
                this.toUnitaryCoords(vec2(x + lineWidth / 2.0, y + lineWidth / 2.0))
            );
            colors.push(color, color, color, color);
            return true;
        },
        newBrush(vertex, color = [0, 0, 0], lineWidth = 1) {
            if(vertices.length < 4) {
                return false;
            }

            let x = vertex[0], y = vertex[1];
            vertices.push(
                vertices[vertices.length-1],
                vertices[vertices.length-1],
                this.toUnitaryCoords(x, y),
                this.toUnitaryCoords(x, y)
            );
            colors.push(color, color, color, color);
            return true;
        },
        toUnitaryCoords(coord) {
            return geometry.screenToUnitaryCoords({x: coord[0], y: coord[1], w: canvas.width, h: canvas.height});
        },
        clear() {
            vertices = [];
        },
        // build() {
            // if(currentPath.length <= 1) {
            //     return;
            // }
            // let {lineWidth, lineJoin, path} = currentPath;
            //
            // this.pushVertices(geometry.tesselateLine(path, lineWidth, lineJoin));
        // },
        redraw() {
            this.upload();
            this.render();
        },
        render() {
            gl.clear( gl.COLOR_BUFFER_BIT );

            gl.drawArrays( gl.TRIANGLE_STRIP, 0, vertices.length );
        }
    };
})();

let application = (() => {
    let canvas = drawing.init("gl-canvas");
    let mousePressed = false;
    let lastPosition = null;

    let lineWidthCtrl = document.getElementById('lineWidthCtrl');

    return {
        main() {
            canvas.addEventListener('mouseup', application.mouseUp);
            canvas.addEventListener('mousedown', application.mouseDown);
            canvas.addEventListener('mousemove', application.mouseMove);

            drawing.lineWidth = lineWidthCtrl.value;
            drawing.lineJoin = parseInt(dom_helper.querySelected('line_join').value);

            lineWidthCtrl.addEventListener('input', evt => {
                drawing.lineWidth = lineWidthCtrl.value;
                drawing.redraw();
            } );

            dom_helper.addEventListener('line_join', 'change', evt => {
                if(evt.target.checked) {
                    drawing.lineJoin = parseInt(evt.target.value);
                    drawing.redraw();
                }
            });
        },
        mouseUp(event) {
            mousePressed = false;
            let mousePos = dom_helper.getClickPosition(event);
            // lastPosition = null;
            //
            // drawing.addToCurrentPath(mousePos);

            drawing.newBrush(mousePos, application_color.color, parseInt(lineWidthCtrl.value));
            drawing.redraw();
        },
        mouseDown(event) {
            mousePressed = true;
        },
        mouseMove(event) {
            let mousePos = dom_helper.getClickPosition(event);
            if(mousePressed) {
                if(drawing.addToCurrentBrush(mousePos, application_color.color, parseInt(lineWidthCtrl.value))) {
                    drawing.redraw();
                }
            }
        },
    };
})();

window.addEventListener('load', application.main);

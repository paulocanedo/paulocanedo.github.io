"use strict";

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
    }
})();

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let vertices = [];
    let colors = [];
    let _minInterpolateDistance = 1.0;

    let line_thick = (() => {
      let path = [];

      return {
        addVertex(vertex, color, lineWidth) {
          path.push(vertex);

          if(path.length > 1) {
              let i        = path.length-1;
              let start    = path[i-1];
              let end      = path[i];
              let segment  = geometry.perpendicularSegment(start[0], start[1], end[0], end[1], lineWidth/2, false);
              let segmentI = geometry.perpendicularSegment(start[0], start[1], end[0], end[1], lineWidth/2, true);

              vertices.push(
                drawing.toUnitaryCoords(segment[0]),
                drawing.toUnitaryCoords(segmentI[0]),
                drawing.toUnitaryCoords(segment[1]),
                drawing.toUnitaryCoords(segmentI[1])
              );
              colors.push(color, color, color, color);
          }
        },
        distanceFromLastVertex(vertex) {
          if(path.length > 1) {
              let lvertex = path[path.length-1];
              let dx = lvertex[0] - vertex[0];
              let dy = lvertex[1] - vertex[1];

              return Math.sqrt(dx * dx + dy * dy);
          }

          return Number.MAX_SAFE_INTEGER;
        }
      }
    })();

    return {
        get minInterpolateDistance() { return _minInterpolateDistance; },
        set minInterpolateDistance(min) { _minInterpolateDistance = min; },
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
        addToCurrentBrush(vertex, color = [0, 0, 0], lineWidth = 1) {
            if(line_thick.distanceFromLastVertex(vertex) < _minInterpolateDistance) {
                return false;
            }

            line_thick.addVertex(vertex, color, lineWidth);
            return true;
        },
        newBrush(vertex, color = [0, 0, 0], lineWidth = 1) {
            if(vertices.length < 4) {
                return false;
            }

            let x = vertex[0], y = vertex[1];
            console.log(x, y);

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
        redraw() {
            drawing.upload();
            drawing.render();
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

    let lineWidthCtrl = document.getElementById('lineWidthCtrl');
    let minInterpolateDistanceCtrl = document.getElementById('minInterpolateDistanceCtrl');
    drawing.minInterpolateDistance = parseInt(minInterpolateDistanceCtrl.value);

    return {
        main() {
            canvas.addEventListener('mouseup', application.mouseUp);
            canvas.addEventListener('mousedown', application.mouseDown);
            canvas.addEventListener('mousemove', application.mouseMove);

            minInterpolateDistanceCtrl.addEventListener('change',
              evt => drawing.minInterpolateDistance = parseInt(minInterpolateDistanceCtrl.value));
        },
        mouseUp(event) {
            mousePressed = false;
            requestAnimFrame(drawing.redraw);
        },
        mouseDown(event) {
            let mousePos = dom_helper.getClickPosition(event);
            drawing.addToCurrentBrush(mousePos, application_color.color, 0);
            mousePressed = true;
        },
        mouseMove(event) {
            let mousePos = dom_helper.getClickPosition(event);
            if(mousePressed) {
                if(drawing.addToCurrentBrush(mousePos, application_color.color, parseInt(lineWidthCtrl.value))) {
                  requestAnimFrame(drawing.redraw);
                }
            }
        },
    };
})();

window.addEventListener('load', application.main);

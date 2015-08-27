"use strict";

let drawing_color = (() => {
    let gl;
    let canvas;
    let program;
    let vertices = [];

    let mousePressed = false;
    let lastPosition = null;

    function getClickPosition(event) {
        let target = event.target;
        let posX = event.offsetX ? (event.offsetX) : event.pageX - target.offsetLeft;
        let posY = event.offsetY ? (event.offsetY) : event.pageY - target.offsetTop;

        return {x: posX, y: posY};
    }

    return {
        get width() {return canvas.width;},
        get height() {return canvas.height;},
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas, {preserveDrawingBuffer: true} );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults();

            canvas.addEventListener('mouseup', this.mouseUp);
            canvas.addEventListener('mousedown', this.mouseDown);
            canvas.addEventListener('mousemove', this.mouseMove);
        },
        setDefaults() {
            gl.viewport( 0, 0, canvas.width, canvas.height );
            gl.clearColor(0, 0, 0, 0);

            program = initShaders( gl, "vs-choose-color", "fs-choose-color" );
        },
        mouseUp(event) {
            let bounds = getClickPosition(event);
            let pixels = new Uint8Array(4 * Uint8Array.BYTES_PER_ELEMENT);
            gl.readPixels(bounds.x, canvas.height - bounds.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            let r  = pixels[0], g  = pixels[1], b  = pixels[2];
            let fr = (r/255.0).toFixed(2), fg = (g/255.0).toFixed(2), fb = (b/255.0).toFixed(2);

            let colorButton = document.getElementById('chooseColorButton');
            colorButton.style.background = `rgb(${r},${g},${b})`;
            colorButton.value = `rgb(${fr},${fg},${fb})`;

            let rgb = [pixels[0] / 255, pixels[1] / 255, pixels[2] / 255];
            application_color.color = rgb;
            colorButton.style.color = rgb[0] * rgb[1] * rgb[2] > 0.0001 ? 'black' : 'white';

            drawing.redraw();
        },
        mouseDown(event) {
        },
        mouseMove(event) {
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

            let colors = [
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
            ];

            let cBufferId = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, cBufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

            let vColor = gl.getAttribLocation( program, "vColor" );
            gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );
        },
        set polygon(newPolygon) {
            vertices = newPolygon;
        },
        pushVertex(vertex) {
            vertices.push(vertex);
        },
        pushVertices(vertices_) {
            for(let v of vertices_) {
                vertices.push(v);
            }
        },
        clear() {
            vertices = [];
        },
        render() {
            gl.clear( gl.COLOR_BUFFER_BIT );

            let dimensionLoc = gl.getUniformLocation( program, 'dimension' );
            gl.uniform2f( dimensionLoc, canvas.width, canvas.height);

            gl.drawArrays( gl.TRIANGLE_STRIP, 0, vertices.length );
        }
    };
})();

let application_color = (() => {
    drawing_color.init("gl-canvas-color");
    let w = drawing_color.width;
    let h = drawing_color.height;
    let currentColor = [0, 0, 0];

    let path = [
        vec2(       0, 0),
        vec2(       0, h),
        vec2(     w/3, 0),
        vec2(     w/3, h),
        vec2( 2 * w/3, 0),
        vec2( 2 * w/3, h),
        vec2(       w, 0),
        vec2(       w, h),
    ];

    return {
        main() {
            drawing_color.clear();
            drawing_color.pushVertices(path);

            drawing_color.upload();
            drawing_color.render();
        },
        get color() { return currentColor; },
        set color(c) { currentColor = c; }
    };
})();

window.addEventListener('load', application_color.main);

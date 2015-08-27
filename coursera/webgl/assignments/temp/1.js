"use strict";

var drawing = (() => {
    var gl;
    var canvas;
    var program;
    var vertices = [];

    var theta = 0.0;
    var uTheta;

    var lastTime = window.performance.now();
    var fpsLabel = document.getElementById("fpsLabel");

    return {
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults();
        },
        setDefaults() {
            gl.viewport( 0, 0, canvas.width, canvas.height );
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        },
        upload() {
            //  Load shaders and initialize attribute buffers
            program = initShaders( gl, "vertex-shader", "fragment-shader" );
            gl.useProgram( program );

            // Load the data into the GPU
            var bufferId = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

            // Associate out shader variables with our data buffer
            var vPosition = gl.getAttribLocation( program, "vPosition" );
            gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );

            var colors = [
                0.0, 0.7, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.7, 1.0
            ];

            var bufferId = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

            var vColor = gl.getAttribLocation( program, "vColor" );
            gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );

            uTheta = gl.getUniformLocation( program, "uTheta" )
        },
        set polygon(newPolygon) {
            vertices = newPolygon;
        },
        clear() {
            vertices = [];
        },
        render() {
            gl.clear( gl.COLOR_BUFFER_BIT );

            theta += 0.1;
            gl.uniform1f(uTheta, theta);

            gl.drawArrays( gl.TRIANGLE_STRIP, 0, vertices.length );

            // var t2 = window.performance.now();
            // var fps = Math.round(1000 / (t2 - lastTime) + 0.5);
            // lastTime = t2;
            // fpsLabel.innerHTML = '' + fps;
            
            requestAnimFrame(drawing.render);
            // setTimeout(() => requestAnimFrame(drawing.render), 1);
        }
    };
})();

var application = (() => {
    return {
        main() {
            drawing.init("gl-canvas");

            drawing.polygon = [
                vec2( 0.0,  1.0),
                vec2( 1.0,  0.0),
                vec2(-1.0,  0.0),
                vec2( 0.0, -1.0)
            ];

            drawing.upload();
            drawing.render();
        }
    };
})();

window.addEventListener('load', application.main);

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = new Set();

    let solid     = document.getElementById('solidId');
    let wireframe = document.getElementById('wireframeId');
    let solidWire = document.getElementById('solidWireId');

    let cam = {
        radius: 10.0,
        near:  -1,    far:    1,
        theta:  0.0,  phi:    0.0,
        fovy:   45.0, aspect: 1.0,
        at:     vec3(0.0, 0.0, 0.0),
        up:     vec3(0.0, 1.0, 0.0)
    };

    let modelViewMatrix, projectionMatrix;
    let modelViewMatrixLoc, projectionMatrixLoc;

    let bufferInfo = {};
    let opts = {};

    return {
        zoom(zoomIn = true) {
            let amount = zoomIn ? -1.0 : 1.0;
            cam.radius = Math.min(Math.max(4.0, cam.radius + amount), 50);
            return cam.radius;
        },
        setCamOrientation(theta, phi) {
            cam.theta = theta;
            cam.phi = phi;
        },
        set eyeDistance(distance) {
            cam.radius = cam.radius = Math.min(Math.max(4.0, distance), 50);
        },
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults(gl);
            return canvas;
        },
        setDefaults(gl) {
            gl.canvas.width = dom_helper.getDocumentWidth();
            gl.canvas.height = dom_helper.getDocumentHeight();

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(0, 0, 0, 1.0);

            program = initShaders(gl, "vertex-shader", "fragment-shader" );
        },
        exportJson() {
            let output = [];
            for(let elem of objects) {
                output.push(elem);
            }
            return JSON.stringify(output, null, 2);
        },
        append(object) {
            objects.add(object);
        },
        remove(object) {
            objects.delete(object);
            object.delete(gl);
        },
        render() {
            gl.useProgram( program );

            cam.aspect = gl.canvas.width / gl.canvas.height;
            opts = {solid: solid.checked || solidWire.checked, wireframe: wireframe.checked || solidWire.checked};

            let eye = vec3(
                cam.radius*Math.sin(cam.theta)*Math.cos(cam.phi),
                cam.radius*Math.sin(cam.theta)*Math.sin(cam.phi),
                cam.radius*Math.cos(cam.theta));

            modelViewMatrix  = lookAt(eye, cam.at , cam.up);
            projectionMatrix = perspective(cam.fovy, cam.aspect, cam.near, cam.far);

            bufferInfo.vPosition = gl.getAttribLocation(program, "vPosition");
            bufferInfo.vColor = gl.getAttribLocation(program, "vColor");
            bufferInfo.wireframeLoc = gl.getUniformLocation(program, 'wireframe');
            bufferInfo.objSelectedLoc = gl.getUniformLocation(program, 'objSelected');
            modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
            projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            for(let object of objects) {
                opts.selected = object.dom.className.indexOf('active') >= 0;
                object.draw(gl, bufferInfo, opts);
            }
            requestAnimFrame(drawing.render);
        }
    };
})();

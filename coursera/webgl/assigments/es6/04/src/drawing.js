let drawing = (() => {
    let gl;
    let canvas;
    let program;

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
    bufferInfo.light = {
        position: vec4(0.0, 0.0, 0.0, 0.0),
        ambientColor:  vec4(0.2, 0.2, 0.2, 1.0),
        diffuseColor:  vec4(1.0, 1.0, 1.0, 1.0),
        specularColor: vec4(1.0, 1.0, 1.0, 1.0),
    };

    let worldRotation = vec3(0,0,0);

    return {
        zoom(zoomIn = true) {
            let amount = zoomIn ? -1.0 : 1.0;
            cam.radius = Math.min(Math.max(4.0, cam.radius + amount), 50);
            return cam.radius;
        },
        setCamOrientation({theta, phi}) {
            if(theta) cam.theta = theta;
            if(phi) cam.phi = phi;
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
            // gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clearColor(0, 0, 0, 1.0);

            program = initShaders(gl, "vertex-shader", "fragment-shader" );
        },
        render() {
            gl.useProgram( program );
            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            cam.aspect = gl.canvas.width / gl.canvas.height;

            let eye = vec3(
                cam.radius*Math.sin(cam.theta)*Math.cos(cam.phi),
                cam.radius*Math.sin(cam.theta)*Math.sin(cam.phi),
                cam.radius*Math.cos(cam.theta));

            modelViewMatrix  = lookAt(eye, cam.at , cam.up);
            projectionMatrix = perspective(cam.fovy, cam.aspect, cam.near, cam.far);

            bufferInfo.vPosition = gl.getAttribLocation(program, "vPosition");
            bufferInfo.vNormal = gl.getAttribLocation(program, "vNormal");
            bufferInfo.ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
            bufferInfo.diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
            bufferInfo.specularProductLoc = gl.getUniformLocation(program, "specularProduct");
            bufferInfo.shininessLoc = gl.getUniformLocation(program, "shininess");

            // worldRotation[Axis.Y] += 2.0;
            gl.uniform3fv(gl.getUniformLocation(program, "worldRotation"), flatten(worldRotation));

            modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
            projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            let numberOfLights = 0;
            ObjectManager.lights.forEach(light => {
                let lightLoc = gl.getUniformLocation(program, `lightsPositions[${numberOfLights}]`);
                gl.uniform4fv(lightLoc, flatten(light.position));

                numberOfLights++;
            });

            for(let [, object] of ObjectManager.collection) {
                object.draw(gl, bufferInfo);
            }
            requestAnimFrame(drawing.render);
        }
    };
})();
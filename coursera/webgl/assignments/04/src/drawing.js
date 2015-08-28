let drawing = (() => {
    let gl;
    let canvas;
    let programsAvailable, program;

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
    let worldRotation = vec3(0,0,0);
    let lightRotation = 0; //only on Y axis

    return {
        set program(id) {
            if(id >= 0 && id < programsAvailable.length) {
                program = programsAvailable[id];
            }
        },
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
        init(canvasName, programs) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas);
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults(gl, programs);
            return canvas;
        },
        setDefaults(gl, programs) {
            let devicePixelRatio = window.devicePixelRatio || 1;
            gl.canvas.width = dom_helper.getDocumentWidth() * devicePixelRatio;
            gl.canvas.height = dom_helper.getDocumentHeight() * devicePixelRatio;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(0, 0, 0, 1.0);

            programsAvailable = ShaderUtil.createPrograms(gl, programs);
            program = programsAvailable[0];
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

            gl.uniform3fv(gl.getUniformLocation(program, "worldRotation"), flatten(worldRotation));

            modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
            projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

            lightRotation = document.querySelector('#lightsMovingBtn.active') == null ? 0.0 : lightRotation + 2.0;
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

            let floatLights = new Float32Array(ObjectManager.lights.size * 4);
            let numberOfLights = 0;
            ObjectManager.lights.forEach(light => {
                floatLights[numberOfLights * 4 + 0] = light.position[0] * Math.sin(radians(lightRotation));
                floatLights[numberOfLights * 4 + 1] = light.position[1];
                floatLights[numberOfLights * 4 + 2] = light.position[2] * Math.cos(radians(lightRotation));
                floatLights[numberOfLights * 4 + 3] = light.position[3];

                numberOfLights++;
            });
            if(numberOfLights === 0) {
                floatLights = new Float32Array([0,0,0,0]);
            }
            gl.uniform4fv(gl.getUniformLocation(program, 'lightsPositions'), floatLights);
            bufferInfo.lights = ObjectManager.lights;

            for(let [, object] of ObjectManager.collection) {
                object.draw(gl, bufferInfo);
            }
            requestAnimFrame(drawing.render);
        }
    };
})();

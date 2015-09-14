let drawing = (() => {
    let gl;
    let canvas;
    let programsAvailable;

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

    let selectionFB;
    let bufferInfo = {};
    bufferInfo.textures = {};
    let worldRotation = vec3(0,0,0);
    let lightRotation = 0; //only on Y axis

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
        init(canvasName, programs) {
            canvas = document.getElementById(canvasName);

            gl = WebGLUtils.setupWebGL(canvas);
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults(gl, programs);
            this.allocateTextures(gl);
            return canvas;
        },
        allocateTextures(gl) {
            let loadTexture = (id, ref) => {
                gl.bindTexture(gl.TEXTURE_2D, id);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, ref);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            };

            bufferInfo.textures.world = gl.createTexture();
            bufferInfo.textures.soccerBall = gl.createTexture();
            bufferInfo.textures.webcam = gl.createTexture();

            loadTexture(bufferInfo.textures.webcam, document.getElementById('textureElem3'));
            loadTexture(bufferInfo.textures.soccerBall, document.getElementById('textureElem2'));
            loadTexture(bufferInfo.textures.world, document.getElementById('textureElem1'));
        },
        setDefaults(gl, programs) {
            let devicePixelRatio = window.devicePixelRatio || 1;
            gl.canvas.width = dom_helper.getDocumentWidth() * devicePixelRatio;
            gl.canvas.height = dom_helper.getDocumentHeight() * devicePixelRatio;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            programsAvailable = ShaderUtil.createPrograms(gl, programs);
            selectionFB = gl.createFramebuffer();
        },
        render() {
            let program = programsAvailable[0];
            gl.useProgram(program);
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
            bufferInfo.vTexCoord = gl.getAttribLocation(program, "vTexCoord");
            bufferInfo.ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
            bufferInfo.diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
            bufferInfo.specularProductLoc = gl.getUniformLocation(program, "specularProduct");
            bufferInfo.shininessLoc = gl.getUniformLocation(program, "shininess");

            gl.uniform3fv(gl.getUniformLocation(program, "worldRotation"), flatten(worldRotation));

            modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
            projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

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


            let texture = gl.createTexture();
            gl.bindFramebuffer(gl.FRAMEBUFFER, selectionFB);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            //framebuffer render to grab selection
            for(let [, object] of ObjectManager.collection) {
                gl.uniform1i(gl.getUniformLocation(program, 'indexColorSelection'), object.id+100);
                object.draw(gl, bufferInfo);
            }

            let color = new Uint8Array(4);
            gl.readPixels(840, 477, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

            // console.log(color);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            gl.uniform1i(gl.getUniformLocation(program, 'indexColorSelection'), 0);
            for(let [, object] of ObjectManager.collection) {
                object.draw(gl, bufferInfo);
            }
            requestAnimFrame(drawing.render);
        }
    };
})();

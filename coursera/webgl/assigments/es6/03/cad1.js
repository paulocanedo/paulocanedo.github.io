"use strict";

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = [];

    let bufferInfo = {
        colors: { bufferId: -1, values: []},
        indices: { bufferId: -1, values: []},
        vertices: { bufferId: -1, values: []},
    };

    let _world = (() => {
        let _rotation = vec3(0,0,0);

        return {
            get thetaX() { return _rotation[0]; },
            get thetaY() { return _rotation[1]; },
            get thetaZ() { return _rotation[2]; },
            set thetaX(rx_) { _rotation[0] = rx_; },
            set thetaY(ry_) { _rotation[1] = ry_; },
            set thetaZ(rz_) { _rotation[2] = rz_; },
            get rotationMatrix() { return _rotation; }
        }
    })();

    return {
        get world() { return _world; },
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

            bufferInfo.colors.bufferId = gl.createBuffer();
            bufferInfo.indices.bufferId = gl.createBuffer();
            bufferInfo.vertices.bufferId = gl.createBuffer();
        },
        append(object) {
            objects.push(object);
            bufferInfo.colors.values = bufferInfo.colors.values.concat(object.colors);
            bufferInfo.indices.values = bufferInfo.indices.values.concat(object.indices);
            bufferInfo.vertices.values = bufferInfo.vertices.values.concat(object.vertices);

            let flush = true;
            if(flush) {
                gl.bindBuffer( gl.ARRAY_BUFFER, bufferInfo.vertices.bufferId );
                gl.bufferData( gl.ARRAY_BUFFER, flatten(bufferInfo.vertices.values), gl.STATIC_DRAW );

                gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices.bufferId );
                gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bufferInfo.indices.values), gl.STATIC_DRAW );

                gl.bindBuffer( gl.ARRAY_BUFFER, bufferInfo.colors.bufferId );
                gl.bufferData( gl.ARRAY_BUFFER, flatten(bufferInfo.colors.values), gl.STATIC_DRAW );
            }

        },
        render() {
            gl.useProgram( program );

            let vPosition = gl.getAttribLocation( program, "vPosition" );
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferInfo.vertices.bufferId );
            gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );

            let vColor = gl.getAttribLocation( program, "vColor" );
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferInfo.colors.bufferId );
            gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );

            let worldRotationLoc = gl.getUniformLocation(program, 'worldRotation');
            gl.uniform3fv(worldRotationLoc, drawing.world.rotationMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            let wireframeLoc = gl.getUniformLocation(program, 'wireframe');
            gl.uniform1i(wireframeLoc, 0);
            // gl.drawElements( gl.TRIANGLE_FAN, bufferInfo.indices.values.length, gl.UNSIGNED_SHORT, 0 );
            // gl.drawElements( gl.TRIANGLE_STRIP, bufferInfo.indices.values.length, gl.UNSIGNED_SHORT, 0 );
            gl.drawElements( gl.TRIANGLES, bufferInfo.indices.values.length, gl.UNSIGNED_SHORT, 0 );
            gl.uniform1i(wireframeLoc, 1);
            gl.drawElements( gl.LINES, bufferInfo.indices.values.length, gl.UNSIGNED_SHORT, 0 );
        }
    };
})();

let application = (() => {
    let canvas = drawing.init("gl-canvas");
    let worldRotationXCtrl = document.getElementById('worldRotationXCtrl');
    let worldRotationYCtrl = document.getElementById('worldRotationYCtrl');
    let worldRotationZCtrl = document.getElementById('worldRotationZCtrl');

    drawing.world.thetaX = worldRotationXCtrl.value;
    drawing.world.thetaY = worldRotationYCtrl.value;
    drawing.world.thetaZ = worldRotationZCtrl.value;

    return {
        main() {
            let cube1   = Cube.create();
            let sphere1 = Sphere.create();
            let cone1 = Cone.create();
            let cylinder1 = Cylinder.create();

            drawing.append(cylinder1);
            // drawing.append(cone1);
            // drawing.append(sphere1);
            // drawing.append(cube1);

            drawing.render();

            worldRotationXCtrl.addEventListener('input', evt => {
                drawing.world.thetaX = evt.target.value;
                requestAnimFrame(drawing.render);
            });
            worldRotationYCtrl.addEventListener('input', evt => {
                drawing.world.thetaY = evt.target.value;
                requestAnimFrame(drawing.render);
            });
            worldRotationZCtrl.addEventListener('input', evt => {
                drawing.world.thetaZ = evt.target.value;
                requestAnimFrame(drawing.render);
            });
        }
    };
})();

window.addEventListener('load', application.main);

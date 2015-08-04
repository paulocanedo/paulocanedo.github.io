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
            set thetaX(rx_) { _rotation[0] = parseInt(rx_); },
            set thetaY(ry_) { _rotation[1] = parseInt(ry_); },
            set thetaZ(rz_) { _rotation[2] = parseInt(rz_); },
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
            this.appendObject(object);
            objects.push(object);
            this.upload();
        },
        appendObject(object) {
            bufferInfo.colors.values = bufferInfo.colors.values.concat(object.colors);
            let vlength = bufferInfo.vertices.values.length;
            for(let indice of object.indices) {
                bufferInfo.indices.values.push(vlength + indice);
            }
            for(let vertice of object.vertices) {
                bufferInfo.vertices.values.push(vertice);
            }
        },
        rebuild() {
            bufferInfo.colors.values = [];
            bufferInfo.indices.values = [];
            bufferInfo.vertices.values = [];

            for(let object of objects) {
                this.appendObject(object);
            }
            this.upload();
        },
        upload() {
            gl.bindBuffer( gl.ARRAY_BUFFER, bufferInfo.vertices.bufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(bufferInfo.vertices.values), gl.STATIC_DRAW );

            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices.bufferId );
            gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bufferInfo.indices.values), gl.STATIC_DRAW );

            gl.bindBuffer( gl.ARRAY_BUFFER, bufferInfo.colors.bufferId );
            gl.bufferData( gl.ARRAY_BUFFER, flatten(bufferInfo.colors.values), gl.STATIC_DRAW );
        },
        render() {
            gl.useProgram( program );

            // let radius = 200;
            // let theta = radians(parseInt(document.getElementById('worldRotationXCtrl').value));
            // let phi   = radians(parseInt(document.getElementById('worldRotationYCtrl').value));
            let modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
            let projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');
            //
            // var eye = vec3( radius*Math.sin(theta)*Math.cos(phi),
            //                 radius*Math.sin(theta)*Math.sin(phi),
            //                 radius*Math.cos(theta));

            const at = vec3(0.0, 0.0, 0.0);
            const up = vec3(0.0, 1.0, 0.0);

            var modelViewMatrix = lookAt( [100, 250, 200], at, up );
            // var modelViewMatrix = lookAt( eye, at, up );
            var projectionMatrix = perspective(radians(90), canvas.width / canvas.height, -180, 180);
            // var projectionMatrix = ortho( -2, 2, -2, 2, -2, 2 );
            // var projectionMatrix = ortho( left, right, bottom, ytop, near, far );

            gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
            // gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

            gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(ortho(-8, 8, -8, 8, -8, 8)) );

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
    let transformX = document.getElementById('transformX');
    let transformY = document.getElementById('transformY');
    let transformZ = document.getElementById('transformZ');

    let mouse = {pressed: false, lastPosition: null, startRotationX: 0, startRotationY: 0};

    return {
        mousedown(evt) {
            mouse.pressed = true;
            mouse.lastPosition = dom_helper.getClickPosition(evt);
            mouse.startRotationY = drawing.world.thetaY;
            mouse.startRotationX = drawing.world.thetaX;
        },
        mousemove(evt) {
            if(mouse.pressed && mouse.lastPosition) {
                let current = dom_helper.getClickPosition(evt);
                let dx = mouse.lastPosition[0] - current[0];
                let dy = mouse.lastPosition[1] - current[1];

                drawing.world.thetaY = mouse.startRotationY + 360 * dx / canvas.height;
                drawing.world.thetaX = mouse.startRotationX + 360 * dy / canvas.width;
            }
            requestAnimFrame(drawing.render);
        },
        mouseup(evt) {
            mouse.pressed = false;
            mouse.lastPosition = null;
            mouse.startRotationY = 0;
            mouse.startRotationX = 0;
        },
        main() {
            canvas.addEventListener('mousedown', application.mousedown);
            canvas.addEventListener('mousemove', application.mousemove);
            canvas.addEventListener('mouseup', application.mouseup);

            transformX.addEventListener('change', evt => {
                let value = parseInt(evt.target.value);
                ObjectManager.find(0).translate(value, 0, 0);
                drawing.rebuild();
                requestAnimFrame(drawing.render);
            });

            // let cube1   = ObjectManager.buildObject('cube');
            // let sphere1 = ObjectManager.buildObject('sphere');
            // let sphere2 = ObjectManager.buildObject('sphere');
            // let cone1 = ObjectManager.buildObject('cone');
            // let cone2 = ObjectManager.buildObject('cone');
            // let cylinder1 = ObjectManager.buildObject('cylinder');
            // let cylinder2 = ObjectManager.buildObject('cylinder');
            //
            // cone1.translate(-5, 5, 0);
            // cone2.translate(5, -5, 0);
            // cylinder1.translate(5, 0, 0);
            // cylinder2.translate(5, 5, 0);
            // sphere1.translate(-5, 0, 0);
            // sphere2.translate(-5, -5, 0);
            // cube1.translate(0, 0, 2);
            // // cube3.translate(5, 5, 0);
            //
            // drawing.append(cube1);
            // drawing.append(sphere1);
            // drawing.append(sphere2);
            // drawing.append(cylinder1);
            // drawing.append(cylinder2);
            // drawing.append(cone1);
            // drawing.append(cone2);
            drawing.append(ObjectManager.buildObject('cube'));

            drawing.render();
        }
    };
})();

window.addEventListener('load', application.main);

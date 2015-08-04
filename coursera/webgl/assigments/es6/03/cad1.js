"use strict";

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = [];

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
        },
        append(object) {
            objects.push(object);
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
            let worldRotationLoc = gl.getUniformLocation(program, 'worldRotation');
            gl.uniform3fv(worldRotationLoc, drawing.world.rotationMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            let vPosition = gl.getAttribLocation(program, "vPosition");
            let vColor = gl.getAttribLocation(program, "vColor");
            let wireframeLoc = gl.getUniformLocation(program, 'wireframe');

            gl.uniform1i(wireframeLoc, 0);
            for(let object of objects) {
                object.draw(gl, vPosition, vColor);
            }

            for(let object of objects) {
                object.draw(gl, vPosition, vColor, wireframeLoc);
            }
            requestAnimFrame(drawing.render);
        }
    };
})();

let application = (() => {
    let canvas = drawing.init("gl-canvas");
    let transformX = document.getElementById('transformX');
    let transformY = document.getElementById('transformY');
    let transformZ = document.getElementById('transformZ');

    let objectsList = document.getElementById('objects-list');
    let modeCtrl    = document.getElementById('mode');

    let mouse = {pressed: false, lastPosition: null, startRotationX: 0, startRotationY: 0};

    return {
        main() {
            canvas.addEventListener('mousedown', application.mousedown);
            canvas.addEventListener('mousemove', application.mousemove);
            canvas.addEventListener('mouseup', application.mouseup);

            let installList = evt => {
                if(evt.target.className.indexOf('active') < 0 ) {
                    dom_helper.clearSelection(evt.target.parentNode.children);
                }
                evt.target.className = 'active';
            };
            modeCtrl.addEventListener('click', installList);
            objectsList.addEventListener('click', installList);
            objectsList.addEventListener('click', evt => {
                let selectedId = parseInt(dom_helper.getSelectedFromList(objectsList.children, 'id'));
                let object = ObjectManager.find(selectedId);
                if(object) {
                    let values = null;
                    let what = dom_helper.querySelected('transformation').value;
                    if(what === 'translate') {
                        values = object.translateValues;
                    } else if(what === 'scale') {
                        values = object.scaleValues;
                    }

                    transformX.value = values[0];
                    transformY.value = values[1];
                    transformZ.value = values[2];
                }
            });

            transformX.addEventListener('input', evt => {
                let value = parseFloat(evt.target.value);
                let selectedId = parseInt(dom_helper.getSelectedFromList(objectsList.children, 'id'));
                let object = ObjectManager.find(selectedId);

                if(object) {
                    object.translate(value, 0, 0);
                }
            });

            // let cube1   = ObjectManager.buildObject('cube');
            // let sphere1 = ObjectManager.buildObject('sphere');
            // let sphere2 = ObjectManager.buildObject('sphere');
            // let cone1 = ObjectManager.buildObject('cone');
            // let cone2 = ObjectManager.buildObject('cone');
            // let cylinder1 = ObjectManager.buildObject('cylinder');
            // let cylinder2 = ObjectManager.buildObject('cylinder');

            drawing.append(ObjectManager.buildObject('cube'));

            drawing.render();
        },
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
        },
        mouseup(evt) {
            mouse.pressed = false;
            mouse.lastPosition = null;
            mouse.startRotationY = 0;
            mouse.startRotationX = 0;
        },
    };
})();

window.addEventListener('load', application.main);

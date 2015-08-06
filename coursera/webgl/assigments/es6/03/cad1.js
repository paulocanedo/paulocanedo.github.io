"use strict";

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = [];

    let solid     = document.getElementById('solidId');
    let wireframe = document.getElementById('wireframeId');
    let solidWire = document.getElementById('solidWireId');

    let _world = (() => {
        let _rotation = vec3(0,0,0);

        return {
            get thetaX() { return _rotation[Axis.X]; },
            get thetaY() { return _rotation[Axis.Y]; },
            get thetaZ() { return _rotation[Axis.Z]; },
            set thetaX(rx_) { _rotation[Axis.X] = parseInt(rx_); },
            set thetaY(ry_) { _rotation[Axis.Y] = parseInt(ry_); },
            set thetaZ(rz_) { _rotation[Axis.Z] = parseInt(rz_); },
            get rotationMatrix() { return _rotation; }
        }
    })();

    return {
        get world() { return _world; },
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults(gl);
            return canvas;
        },
        setDefaults(gl) {
            let width  = document.querySelector('.content').clientWidth;
            let height = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );

            gl.canvas.width = width;
            gl.canvas.height = height;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            program = initShaders(gl, "vertex-shader", "fragment-shader" );
        },
        append(object) {
            objects.push(object);
        },
        render() {
            gl.useProgram( program );

            let vPosition = gl.getAttribLocation(program, "vPosition");
            let vColor = gl.getAttribLocation(program, "vColor");
            let wireframeLoc = gl.getUniformLocation(program, 'wireframe');
            let projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');

            let projectionMatrix = perspective(radians(90), canvas.width / canvas.height, -180, 180);
            let worldRotationLoc = gl.getUniformLocation(program, 'worldRotation');

            let bufferInfo = {};
            let opts = {solid: solid.checked || solidWire.checked, wireframe: wireframe.checked || solidWire.checked};

            gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(ortho(-8, 8, -8, 8, -8, 8)) );
            gl.uniform3fv(worldRotationLoc, drawing.world.rotationMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            bufferInfo.vPosition = vPosition;
            bufferInfo.vColor = vColor;
            bufferInfo.wireframeLoc = wireframeLoc;

            for(let object of objects) {
                object.draw(gl, bufferInfo, opts);
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
    let addObjectButton = document.getElementById('addObjectButton');
    let addObjectModal  = document.getElementById('addObjectModal');

    let dismissModal = document.getElementById('dismissModal');

    addObjectButton.addEventListener('click', evt => {
        addObjectModal.style.display = 'block';
    });
    dismissModal.addEventListener('click', evt => {
        addObjectModal.style.display = 'none';
    });

    let mouse = {pressed: false, lastPosition: null, startRotationX: 0, startRotationY: 0};

    return {
        main() {
            canvas.addEventListener('mousedown', application.mousedown);
            canvas.addEventListener('mousemove', application.mousemove);
            canvas.addEventListener('mouseup', application.mouseup);

            let installList = evt => {
                if(evt.target.tagName !== 'LI') return;

                if(evt.target.className.indexOf('active') < 0 ) {
                    dom_helper.clearSelection(evt.target.parentNode.children);
                }
                evt.target.className = 'active';
            };
            let updateTransformValues = selectedId => {
                let object = ObjectManager.find(selectedId);
                if(object) {
                    let values = null;
                    let what = dom_helper.querySelected('transformation').value;
                    if(what === 'translate') {
                        values = object.translateValues;
                    } else if(what === 'scale') {
                        values = object.scaleValues;
                    } else if(what === 'rotate') {
                        values = object.rotateValues;
                    }

                    transformX.value = values[Axis.X];
                    transformY.value = values[Axis.Y];
                    transformZ.value = values[Axis.Z];
                }
            };

            objectsList.addEventListener('click', installList);
            objectsList.addEventListener('click', evt => updateTransformValues(evt.target.getAttribute('data-id')));
            document.getElementById('translateTransform').addEventListener('change',
                evt => updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id')));
            document.getElementById('scaleTransform').addEventListener('change',
                evt => updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id')));
            document.getElementById('rotationTransform').addEventListener('change',
                evt => updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id')));

            let transform = (value, axis) => {
                let selectedId = dom_helper.getSelectedFromList(objectsList.children, 'id');
                let object = ObjectManager.find(selectedId);
                if(!object) return;

                let what = dom_helper.querySelected('transformation').value;
                let params = {};
                let fnTransform = null;
                if(what === 'translate') {
                    object.fnTransform = object.translate;
                } else if(what === 'scale') {
                    object.fnTransform = object.scale;
                } else if(what === 'rotate') {
                    object.fnTransform = object.rotate;
                    params.angle = value;
                    params.axis = axis;
                }

                params[Axis.toString(axis)] = value;
                object.fnTransform(params);
            };

            transformX.addEventListener('input', evt => transform(parseFloat(evt.target.value), 0));
            transformY.addEventListener('input', evt => transform(parseFloat(evt.target.value), 1));
            transformZ.addEventListener('input', evt => transform(parseFloat(evt.target.value), 2));

            let newObjectDom = document.getElementById('new-object');
            newObjectDom.addEventListener('click', evt => {
                let what = evt.target.getAttribute('data-value');
                let object = ObjectManager.buildObject(what);

                drawing.append(object);
                dom_helper.clearSelection(objectsList.children);

                object.dom.className = 'active';
                object.dom.scrollIntoView();
                updateTransformValues(object.id);
                addObjectModal.style.display = 'none';
            });

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

"use strict";

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = [];

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
        append(object) {
            objects.push(object);
        },
        render() {
            gl.useProgram( program );

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

let application = (() => {
    let canvas = drawing.init("gl-canvas");
    let transformX = document.getElementById('transformX');
    let transformY = document.getElementById('transformY');
    let transformZ = document.getElementById('transformZ');

    let objectsList = document.getElementById('objects-list');

    document.getElementById('zoomCtrl').addEventListener('input', evt => drawing.eyeDistance = (50 - evt.target.value));

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
                dom_helper.setActive(evt.target);
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
            document.getElementById('rotateTransform').addEventListener('change',
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

            for(let btn of document.querySelectorAll('.add-object-btn')) {
                btn.addEventListener('click', evt => {
                    let what = evt.target.getAttribute('data-value');
                    let object = ObjectManager.buildObject(what);

                    drawing.append(object);
                    dom_helper.clearSelection(objectsList.children);

                    dom_helper.setActive(object.dom);
                    object.dom.scrollIntoView();
                    updateTransformValues(object.id);
                });
            }

            drawing.render();
        },
    };
})();

window.addEventListener('load', application.main);

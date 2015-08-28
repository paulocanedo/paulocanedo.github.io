"use strict";

let application = (() => {
    let transformX = document.getElementById('transformX');
    let transformY = document.getElementById('transformY');
    let transformZ = document.getElementById('transformZ');

    let objectsList = document.getElementById('objects-list');

    document.getElementById('zoomCtrl').addEventListener('input', evt => drawing.eyeDistance = (50 - evt.target.value));
    document.getElementById('thetaCtrl').addEventListener('input', evt => drawing.setCamOrientation({theta: evt.target.value}));
    document.getElementById('phiCtrl').addEventListener('input', evt => drawing.setCamOrientation({phi: evt.target.value}));

    return {
        updateTransformValues(selectedId, domElem) {
            let object = ObjectManager.find(selectedId);
            if(object) {
                let values = null, min = -5, max = 5;
                let transformation = domElem.value;
                if(transformation === 'translate') {
                    values = object.translateValues;
                } else if(transformation === 'scale') {
                    values = object.scaleValues;
                } else if(transformation === 'rotate') {
                    values = object.rotateValues;
                    min = 0; max = 360;
                }
                for(let elem of document.querySelectorAll('.transformer')) {
                    elem.min = object.isLight === true ? -25.0 : min;
                    elem.max = object.isLight === true ?  25.0 : max;
                }

                let acolor = object.ambientColor.slice(0, 3).map(elem => parseInt(elem * 255));
                let dcolor = object.diffuseColor.slice(0, 3).map(elem => parseInt(elem * 255));
                let scolor = object.specularColor.slice(0, 3).map(elem => parseInt(elem * 255));

                document.getElementById('propertiesLabel').innerHTML = `${object} - Properties`;
                document.getElementById('ambientColorBtn').style.backgroundColor = `rgb(${acolor.join(',')})`;
                document.getElementById('diffuseColorBtn').style.backgroundColor = `rgb(${dcolor.join(',')})`;
                document.getElementById('specularColorBtn').style.backgroundColor = `rgb(${scolor.join(',')})`;
                transformX.value = values[Axis.X];
                transformY.value = values[Axis.Y];
                transformZ.value = values[Axis.Z];

                if(object.isLight) {
                    $('#scaleTransform').addClass('disabled');
                    $('#rotateTransform').addClass('disabled');
                } else {
                    $('#scaleTransform').removeClass('disabled');
                    $('#rotateTransform').removeClass('disabled');
                }
            }
        },
        main(canvasId, shaders) {
            let canvas = drawing.init(canvasId, shaders);

            let installList = evt => {
                if(evt.target.tagName !== 'LI') return;

                if(evt.target.className.indexOf('active') < 0 ) {
                    dom_helper.clearSelection(evt.target.parentNode.children);
                }
                dom_helper.setActive(evt.target);
            };
            objectsList.addEventListener('click', installList);
            objectsList.addEventListener('click',
                evt => application.updateTransformValues(evt.target.getAttribute('data-id'), dom_helper.querySelected('transformation')));

            let tbuttons = document.querySelectorAll("#translateTransform,#scaleTransform,#rotateTransform");
            for(let button of tbuttons) {
                button.addEventListener('click', evt => {
                    if(evt.target.className.indexOf('disabled') < 0) {
                        application.updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'), evt.target.children[0]);
                    }
                });
            }

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
                    if(what === 'light' && ObjectManager.lights.size >= 4) {
                        alert('Sorry, application doesnt support more than 4 lights');
                        return;
                    }
                    let object = ObjectManager.buildObject(what);

                    dom_helper.clearSelection(objectsList.children);

                    dom_helper.setActive(object.dom);
                    object.dom.scrollIntoView();
                    application.updateTransformValues(object.id, dom_helper.querySelected('transformation'));
                });
            }

            //temp
            let object = ObjectManager.buildObject('sphere');
            object.translate({x: 3.0});
            object = ObjectManager.buildObject('sphere');
            object.translate({x: -3.0});
            object = ObjectManager.buildObject('cylinder');
            object.translate({y: -2.0});
            object = ObjectManager.buildObject('cylinder');
            object.translate({y: 2.0});
            object.rotate({angle: 60, axis: Axis.X});
            object = ObjectManager.buildObject('cone');
            ObjectManager.buildObject('light', { position: [-10,  10, -10, 0.0] });
            ObjectManager.buildObject('light', { position: [ 10,  10, -10, 0.0] });
            ObjectManager.buildObject('light', { position: [-10, -10, -10, 0.0] });
            ObjectManager.buildObject('light', { position: [ 10, -10, -10, 0.0] });
            // dom_helper.setActive(object.dom);
            //------------------------------------------------

            drawing.render();
        },
    };
})();

window.addEventListener('load', () => {
    let programs = [];
    let count = 0;

    programs.push({
        vertexShader: {
            source: 'shaders/fragment_lighting.vs.glsl?', type: WebGLRenderingContext.VERTEX_SHADER, content: 0
        },
        fragmentShader: {
            source: 'shaders/fragment_lighting.fs.glsl?', type: WebGLRenderingContext.FRAGMENT_SHADER, content: 0
        }
    });
    programs.push({
        vertexShader: {
            source: 'shaders/vertex_lighting.vs.glsl?', type: WebGLRenderingContext.VERTEX_SHADER, content: 0
        },
        fragmentShader: {
            source: 'shaders/vertex_lighting.fs.glsl?', type: WebGLRenderingContext.FRAGMENT_SHADER, content: 0
        }
    });

    let loadAjaxContent = (shader) => {
        let request = new XMLHttpRequest();
        request.onload = () => {
            shader.content = request.responseText;
            if(shader.source, ++count >= programs.length * 2) {
                application.main('gl-canvas', programs);
            }
        };

        // setTimeout(() => {
        request.open("get", shader.source, true);
        request.send();
        // }, i * 5000);
    };

    for(let i=0; i<programs.length; i++) {
        let program = programs[i];
        let vs = program.vertexShader;
        let fs = program.fragmentShader;

        loadAjaxContent(vs);
        loadAjaxContent(fs);
    }
});

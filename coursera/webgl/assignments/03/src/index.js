"use strict";

let application = (() => {
    let canvas = drawing.init("gl-canvas");
    let transformX = document.getElementById('transformX');
    let transformY = document.getElementById('transformY');
    let transformZ = document.getElementById('transformZ');

    let objectsList = document.getElementById('objects-list');

    document.getElementById('zoomCtrl').addEventListener('input', evt => drawing.eyeDistance = (50 - evt.target.value));
    document.getElementById('jsonBtn').addEventListener('click', evt => {
        let dom = document.getElementById('json-output');
        dom.innerHTML = '';
        dom.appendChild(document.createTextNode(drawing.exportJson()));
    });

    return {
        updateTransformValues(selectedId, domElem) {
            let object = ObjectManager.find(selectedId);
            if(object) {
                let values = null;
                let transformation = domElem.value;
                if(transformation === 'translate') {
                    values = object.translateValues;
                } else if(transformation === 'scale') {
                    values = object.scaleValues;
                } else if(transformation === 'rotate') {
                    values = object.rotateValues;
                }

                transformX.value = values[Axis.X];
                transformY.value = values[Axis.Y];
                transformZ.value = values[Axis.Z];
            }
        },
        main() {
            mouse_events.install(canvas);

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

            document.getElementById('translateTransform').addEventListener('click',
                evt => application.updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'), evt.target.children[0]));
            document.getElementById('scaleTransform').addEventListener('click',
                evt => application.updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'), evt.target.children[0]));
            document.getElementById('rotateTransform').addEventListener('click',
                evt => application.updateTransformValues(dom_helper.getSelectedFromList(objectsList.children, 'id'), evt.target.children[0]));

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
                    application.updateTransformValues(object.id, dom_helper.querySelected('transformation'));
                });
            }

            drawing.render();
        },
    };
})();

window.addEventListener('load', application.main);

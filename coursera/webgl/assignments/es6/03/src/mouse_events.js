let mouse_events = (() => {
    let mouse = {
        pressed: false,
        lastPosition: null,
    };
    let theta = 0, phi = 0;

    let startTheta = 0, startPhi = 0;
    let startX = 0, startY = 0;
    let canvas;

    let objectsList = document.getElementById('objects-list');

    return {
        mousewheel(evt) {
            let radius = drawing.zoom(evt.deltaY > 0);
            document.getElementById('zoomCtrl').value = radius;
        },
        mousedown(evt) {
            mouse.pressed = true;
            mouse.lastPosition = dom_helper.getClickPosition(evt);

            let selectedId = dom_helper.getSelectedFromList(objectsList.children, 'id');
            let object = ObjectManager.find(parseInt(selectedId));
            if(!object) return;

            if(evt.ctrlKey && evt.shiftKey) {
                startX = object.rotateValues[0];
                startY = object.rotateValues[1];
            } else if(evt.ctrlKey) {
                startX = object.translateValues[0];
                startY = object.translateValues[1];
            } else if(evt.shiftKey) {
                startX = object.scaleValues[0];
                startY = object.scaleValues[1];
            }
        },
        mousemove(evt) {
            if(mouse.pressed && mouse.lastPosition) {
                let current = dom_helper.getClickPosition(evt);
                let dx = mouse.lastPosition[0] - current[0];
                let dy = mouse.lastPosition[1] - current[1];

                let selectedId = dom_helper.getSelectedFromList(objectsList.children, 'id');
                let object = ObjectManager.find(parseInt(selectedId));
                if(!object) return;
                dx =  startX + dx / canvas.width;
                dy =  startY + dy / canvas.height;

                if(evt.ctrlKey && evt.shiftKey) {
                    // object.rotate({angle: dy, axis: Axis.X});
                    // object.rotate({angle: dx, axis: Axis.Y});
                } else if(evt.ctrlKey) {
                    object.translate({x: -dx*10, y: dy*10});
                } else if(evt.shiftKey) {
                    object.scale({x: dx, y: dy});
                } else {
                    // phi = startPhi + dx;
                    // theta = startTheta + dy;
                    //
                    // drawing.setCamOrientation(radians(phi), radians(theta));
                }
                application.updateTransformValues(object.id, dom_helper.querySelected('transformation'));
            }
        },
        mouseup(evt) {
            mouse.pressed = false;
            startTheta = theta;
            startPhi = phi;
        },
        install(elem) {
            canvas = elem;

            canvas.addEventListener('mouseup',   this.mouseup);
            canvas.addEventListener('mousedown', this.mousedown);
            canvas.addEventListener('mousemove', this.mousemove);
            canvas.addEventListener('wheel', this.mousewheel);
        }
    }
})();

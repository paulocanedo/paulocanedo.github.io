"use strict";

var dom_helper = (function () {
    return {
        querySelected(name) {
            let nodeList = document.getElementsByName(name);

            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                if (node.checked) return node;
            }
            return null;
        },
        addEventListener(name, evtName, listener) {
            let nodeList = document.getElementsByName(name);

            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                node.addEventListener(evtName, listener);
            }
        },
        getClickPosition(event) {
            let target = event.target;
            let posX = event.offsetX ? (event.offsetX) : event.pageX - target.offsetLeft;
            let posY = event.offsetY ? (event.offsetY) : event.pageY - target.offsetTop;

            return vec2(posX, posY);
        }
    };
})();
"use strict";

var dom_helper = (function () {
    return {
        getDocumentWidth() {
            return document.body.clientWidth;
        },
        getDocumentHeight() {
            return Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
        },
        querySelected(name) {
            let nodeList = document.getElementsByName(name);

            for (let i = 0; i < nodeList.length; i++) {
                let node = nodeList[i];
                if (node.checked === true) return node;
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
        },
        getSelectedFromList(list, attribute) {
            for(let elem of list) {
                if(elem.className.indexOf('active') >= 0) {
                    return elem.getAttribute(`data-${attribute}`);
                }
            }
            return null;
        },
        clearSelection(list) {
            for(let elem of list) {
                elem.className = elem.className.replace('active', '').trim();
            }
        },
        setActive(element) {
            if(element.className.indexOf('active') < 0) {
                element.className += ' active';
            }
        }
    };
})();

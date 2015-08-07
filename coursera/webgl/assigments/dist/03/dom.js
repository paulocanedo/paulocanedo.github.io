"use strict";

var dom_helper = (function () {
    return {
        querySelected: function querySelected(name) {
            var nodeList = document.getElementsByName(name);

            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                if (node.checked) return node;
            }
            return null;
        },
        addEventListener: function addEventListener(name, evtName, listener) {
            var nodeList = document.getElementsByName(name);

            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                node.addEventListener(evtName, listener);
            }
        },
        getClickPosition: function getClickPosition(event) {
            var target = event.target;
            var posX = event.offsetX ? event.offsetX : event.pageX - target.offsetLeft;
            var posY = event.offsetY ? event.offsetY : event.pageY - target.offsetTop;

            return vec2(posX, posY);
        },
        getSelectedFromList: function getSelectedFromList(list, attribute) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var elem = _step.value;

                    if (elem.className.indexOf('active') >= 0) {
                        return elem.getAttribute('data-' + attribute);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return null;
        },
        clearSelection: function clearSelection(list) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var elem = _step2.value;

                    elem.className = '';
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    };
})();

'use strict';

var ObjectManager = (function () {
    var control = -1;
    var collection = [];
    var domObjects = document.getElementById('objects-list');

    return Object.defineProperties({

        buildObject: function buildObject(what) {
            var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var object = null;
            params.id = this.newUuid;
            params.radius |= 1;
            params.bands |= 32;

            switch (what) {
                case 'cube':
                    object = Cube.create(params);
                    break;
                case 'cylinder':
                    params.radiusTop |= params.radius;
                    params.radiusBottom |= params.radius;
                    object = Cylinder.create(params);
                    break;
                case 'cone':
                    object = Cone.create(params);
                    break;
                case 'sphere':
                    object = Sphere.create(params);
                    break;
                default:
                    throw Error('no object \'' + what + '\' available to build');
            }
            var domObject = this.newListItem(object);
            object.dom = domObject;
            domObjects.appendChild(domObject);
            return collection[this.lastUuid] = object;
        },

        find: function find(id) {
            id = parseInt(id);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = collection[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var object = _step.value;

                    if (object.id === id) return object;
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

        newListItem: function newListItem(object) {
            var node = document.createElement('li');
            var textNode = document.createTextNode(object.toString());

            node.setAttribute('data-id', object.id);
            node.appendChild(textNode);

            return node;
        }
    }, {
        lastUuid: {
            get: function get() {
                return control;
            },
            configurable: true,
            enumerable: true
        },
        newUuid: {
            get: function get() {
                return ++control;
            },
            configurable: true,
            enumerable: true
        },
        getCollection: {
            get: function get() {
                return collection;
            },
            configurable: true,
            enumerable: true
        }
    });
})();

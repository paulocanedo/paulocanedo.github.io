let ObjectManager = (() => {
    let control = -1;
    let collection = [];
    let domObjects = document.getElementById('objects-list');

    return {
        get lastUuid() { return control; },
        get newUuid() { return ++control; },
        get getCollection() { return collection; },

        buildObject(what, params = {}) {
            let object = null;
            params.id = this.newUuid;
            params.radius |= 1;
            params.bands  |= 32;

            switch (what) {
                case 'cube':
                    object = Cube.create(params);
                    break;
                case 'cylinder':
                    params.radiusTop    |= params.radius;
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
                    throw Error(`no object '${what}' available to build`);
            }
            let domObject = this.newListItem(object);
            object.dom = domObject;
            domObjects.appendChild(domObject);
            return collection[this.lastUuid] = object;
        },

        find(id) {
            id = parseInt(id);
            for(let object of collection) {
                if(object.id === id) return object;
            }
            return null;
        },

        newListItem(object) {
            let node = document.createElement('li');
            let textNode = document.createTextNode(object.toString());

            node.setAttribute('data-id', object.id);
            node.appendChild(textNode);
            return node;
        }
    }
})();

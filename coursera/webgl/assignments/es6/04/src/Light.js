let Light = (() => {
    return {
        create({id, position, ambientColor, specularColor, diffuseColor}) {
            return {
                toString() {
                    return `Light [${id}]`;
                },

                get id() { return id; },
                get position() { return position; },
                get ambientColor() { return ambientColor; },
                get specularColor() { return specularColor; },
                get diffuseColor() { return diffuseColor; },

                set position(newPosition) { position = newPosition; },
                set ambientColor(newAmbientColor) { ambientColor = newAmbientColor; },
                set specularColor(newSpecularColor) { specularColor = newSpecularColor; },
                set diffuseColor(newDiffuseColor) { diffuseColor = newDiffuseColor; },

                translate({x, y, z}) {
                    if(x) position[Axis.X] = x;
                    if(y) position[Axis.Y] = y;
                    if(z) position[Axis.Z] = z;
                },
                scale() { },
                rotate() { },

                get translateValues() { return position; },
                get scaleValues() { return [0,0,0]; },
                get rotateValues() { return [0,0,0]; },

                get isLight() { return true; },
                delete() {},
                draw() {},

            };
        }
    };
})();

let geometry = (() => {
    return {
        multMatriceVector(matrice, vector) {
            let result = [];
            for(let i=0; i<vector.length; i++) {
                let mline = matrice[i];

                let sum = 0;
                for(let j=0; j<vector.length; j++) {
                    sum += mline[j] * vector[j];
                }
                result.push(sum);
            }
            return result;
        },
        multMatrixVertices(translateMatrix, vertices) {
            let result = [];
            for(let i=0; i<vertices.length; i++) {
                result.push(geometry.multMatriceVector(translateMatrix, vec4(vertices[i], 1)).slice(0, 3));
            }
            return result;
        }
    }
})();

let Axis = (() => {
    return {
        get X() { return 0; },
        get Y() { return 1; },
        get Z() { return 2; },
        get W() { return 3; },

        toString(axis) {
            if(axis === Axis.X) {
                return 'x';
            } else if(axis === Axis.Y) {
                return 'y';
            } else if(axis === Axis.Z) {
                return 'z';
            } else if(axis === Axis.W) {
                return 'w';
            }
            throw Error(`Invalid axis: ${axis}`);
        }
    }
})();

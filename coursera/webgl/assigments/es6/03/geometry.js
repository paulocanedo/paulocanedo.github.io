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
        translateObject(x, y, z, vertices) {
            let tm = translate(x,y,z);
            for(let i=0; i<vertices.length; i++) {
                vertices[i] = geometry.multMatriceVector(tm, vec4(vertices[i], 1)).slice(0, 3);
            }
            return vertices;
        }
    }
})();

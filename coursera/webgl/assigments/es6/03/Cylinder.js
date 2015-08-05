let Cylinder = (() => {
    let build = (radiusTop, radiusBottom, npoints) => {
        let vertexPositionData = [], indexData = [], colorData = [];

        let angle = Math.PI * 2 / npoints;
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a) * radiusTop;
            let z = Math.sin(a) * radiusTop;

            vertexPositionData.push(vec3(x, 0.5, z));
            colorData.push(x, 1.0, z, 1);
        }
        for(let a = 0; a < Math.PI * 2; a += angle) {
            let x = Math.cos(a) * radiusBottom;
            let z = Math.sin(a) * radiusBottom;

            vertexPositionData.push(vec3(x, -0.5, z));
            colorData.push(x, 0.0, z, 1);
        }

        let half = vertexPositionData.length / 2;
        for(let i=0; i<half-1; i++) {
            indexData.push(i);
            indexData.push(i+1);
            indexData.push(half+i);

            indexData.push(i+1);
            indexData.push(half+i);
            indexData.push(half+i+1);
        }
        indexData.push(half-1,0,vertexPositionData.length-1,0,vertexPositionData.length-1,half);

        return {vertices: vertexPositionData, indices: indexData, colors: colorData};
    };

    let object = build(1.0, .5, 32);

    return {
        create({id}) {

            return ObjectCreator.create({
                id: id,
                name: 'Cylinder',
                vertices: object.vertices,
                flatIndices: new Uint16Array(object.indices),
                flatColors: flatten(object.colors)
            });
        }
    };
})();

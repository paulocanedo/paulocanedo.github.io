let Cube = (() => {
    let buildRect = (x, y, z, b, h) => {
        let b2 = b / 2;
        let h2 = h / 2;
        return [
            vec3(x - b2, y - h2, z),
            vec3(x - b2, y + h2, z),
            vec3(x + b2, y + h2, z),
            vec3(x + b2, y - h2, z),
        ];
    };

    let multiColor = [
       vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
       vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
       vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
       vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
       vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
       vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
       vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
       vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];

    let _indices     = [3,2,0,1,5,0,4,0,7,3,7,2,6,2,5,1,6,7,5,4]; //TRIANGLE_STRIP
    let _indicesTriangles = [ //TRIANGLES
        0,1,3,1,3,2,
        4,5,7,5,7,6,
        0,4,3,4,3,7,
        3,7,2,7,2,6,
        2,6,1,6,1,5,
        1,5,0,5,0,4
    ];

    return {
        create(map) {
            let _vertices    = buildRect(0,0,0.5, 1, 1).concat(buildRect(0,0,-0.5, 1, 1));
            // let _wireIndices = [3,2,1,0,4,7,3,7,6,2,6,5,1,0,4,5,4,7,6,2,3,0]; //LINE_STRIP
            let _colors = multiColor;

            return {
                get colors() { return _colors; },
                get vertices() { return _vertices; },
                get indices() { return _indicesTriangles; },

                set colors(c) { setColor(c); }
            };
        },
    };
})();

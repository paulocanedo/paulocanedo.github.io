"use strict";

//latitude  -> 0 < theta < Math.PI
//longitude -> 0 < phi   < Math.PI * 2
let calc = (r, theta, phi) => {
    let senPhi = Math.sin(phi);
    let cosPhi = Math.cos(phi);
    let senTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);
    let x0 = 0, y0 = 0, z0 = 0;

    let x = x0 + r * senTheta * cosPhi;
    let y = y0 + r * senTheta * senPhi;
    let z = z0 + r * cosTheta;

    return vec3(x, y, z);
};

let buildSphere = (radius, xSteps, ySteps) => {
    let result = [];
    for(let b=0; b<ySteps; b++) {
        for(let a=0; a<ySteps; a++) {
            let u = b / ySteps;
            let v = a / xSteps;
            let theta = u * Math.PI;
            let phi   = v * Math.PI * 2;

            result.push(calc(radius, theta, phi));
        }
    }
    return result;
}

let geometry = (() => {
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
    let baseAndTopCube = buildRect(0,0,0.5, 1, 1).concat(buildRect(0,0,-0.5, 1, 1));
    let cubeIndices = [
        0,1,3,1,3,2,
        4,5,7,5,7,6,
        0,4,3,4,3,7,
        3,7,2,7,2,6,
        2,6,1,6,1,5,
        1,5,0,5,0,4
    ];

    return {
        buildCube() {
            let result = [];
            for(let i=0; i<cubeIndices.length; i++) {
                result.push(baseAndTopCube[cubeIndices[i]]);
            }
            return result;
        },
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
        }

    }
})();

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = [];
    let uploaded = false;

    let buffer = {
        colors: { bufferId: -1, values: []},
        vertices: { bufferId: -1, values: []},
    };

    let projection = flatten(ortho( -4, 4, -4, 4, -4, 4 ));
    let _world = (() => {
        let _rotMatrix = vec3(0,0,0);

        return {
            get thetaX() { return _rotMatrix[0]; },
            get thetaY() { return _rotMatrix[1]; },
            get thetaZ() { return _rotMatrix[2]; },
            set thetaX(rx) { _rotMatrix[0] = rx; },
            set thetaY(ry) { _rotMatrix[1] = ry; },
            set thetaZ(rz) { _rotMatrix[2] = rz; },
            get rotationMatrix() { return _rotMatrix; }
        }
    })();

    return {
        get world() { return _world; },
        init(canvasName) {
            canvas = document.getElementById( canvasName );

            gl = WebGLUtils.setupWebGL( canvas );
            if ( !gl ) { alert( "WebGL isn't available" ); }

            this.setDefaults();
            return canvas;
        },
        setDefaults() {
            gl.viewport( 0, 0, canvas.width, canvas.height );
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            program = initShaders( gl, "vertex-shader", "fragment-shader" );

            buffer.colors.bufferId = gl.createBuffer();
            buffer.vertices.bufferId = gl.createBuffer();
        },
        append(...aobject) {
            // for(let object of aobject) {
            //     objects.push(object);
            //
            //     for(let color of object.colors) {
            //         buffer.colors.values.push(color);
            //     }
            //     for(let vertex of object.vertices) {
            //         buffer.vertices.values.push(vertex);
            //     }
            // }

            uploaded = false;
        },
        upload() {
            // if(modified) {
            //     buffer.colors.values = [];
            //     buffer.vertices.values = [];
            //     for(let object of objects) {
            //         buffer.colors.values = buffer.colors.values.concat(object.colors);
            //         buffer.vertices.values = buffer.vertices.values.concat(object.vertices);
            //     }
            // }

            if(!uploaded) {
                gl.bindBuffer( gl.ARRAY_BUFFER, buffer.vertices.bufferId );
                gl.bufferData( gl.ARRAY_BUFFER, flatten(buffer.vertices.values), gl.STATIC_DRAW );

                gl.bindBuffer( gl.ARRAY_BUFFER, buffer.colors.bufferId );
                gl.bufferData( gl.ARRAY_BUFFER, flatten(buffer.colors.values), gl.STATIC_DRAW );
            }

            uploaded = true;
        },
        render() {
            let sphere = buildSphere(1, 4, 4);
            buffer.colors.values = Array(4 * 4).fill(vec4(0,0,1,1));
            buffer.vertices.values = sphere;
            drawing.upload();

            gl.useProgram( program );

            let vPosition = gl.getAttribLocation( program, "vPosition" );
            gl.bindBuffer( gl.ARRAY_BUFFER, buffer.vertices.bufferId );
            gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );

            let vColor = gl.getAttribLocation( program, "vColor" );
            gl.bindBuffer( gl.ARRAY_BUFFER, buffer.colors.bufferId );
            gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );

            let worldRotationLoc = gl.getUniformLocation(program, 'worldRotation');
            gl.uniform3fv(worldRotationLoc, drawing.world.rotationMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            let projectionLoc = gl.getUniformLocation( program, 'projection' );
            gl.uniformMatrix4fv( projectionLoc, false, projection );

            let isWireframeLoc = gl.getUniformLocation( program, 'isWireframe' );
            gl.uniform1i( isWireframeLoc, 0 );
            gl.drawArrays( gl.TRIANGLES, 0, buffer.vertices.values.length );

            let wireframe = true;
            if(wireframe) {
                gl.uniform1i( isWireframeLoc, 1 );
                gl.drawArrays( gl.LINES, 0, buffer.vertices.values.length );
            }

            requestAnimFrame(drawing.render);
        }
    };
})();

let Cube = (() => {
    let multiColorValues = [
       vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
       vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
       vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
       vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
       vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
       vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
       vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
       vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];

    return {
        create(map) {
            map |= {};

            let _vertices = geometry.buildCube();
            let _colors = [];
            let _modified = false;
            let setColor = (color) => {
                _colors = _colors.concat(Array(6).fill(vec4(1,0,0,1)));
                _colors = _colors.concat(Array(6).fill(vec4(0,1,0,1)));
                _colors = _colors.concat(Array(6).fill(vec4(0,0,1,1)));
                _colors = _colors.concat(Array(6).fill(vec4(0,1,1,1)));
                _colors = _colors.concat(Array(6).fill(vec4(1,1,0,1)));
                _colors = _colors.concat(Array(6).fill(vec4(1,0,1,1)));
            };
            setColor(map.color);

            return {
                get colors() { return _colors; },
                set colors(c) { setColor(c); },
                get vertices() { return _vertices; },
                get modified() { return _modified; },
                set modified(m) { _modified = m; },
                translate(x, y, z) {
                    let tm = translate(x,y,z);
                    for(let i=0; i<_vertices.length; i++) {
                        _vertices[i] = geometry.multMatriceVector(tm, vec4(_vertices[i], 1)).slice(0, 3);
                    }
                    _modified = true;
                },
            };
        },
    };
})();

let application = (() => {
    let canvas = drawing.init("gl-canvas");
    let worldRotationXCtrl = document.getElementById('worldRotationXCtrl');
    let worldRotationYCtrl = document.getElementById('worldRotationYCtrl');
    let worldRotationZCtrl = document.getElementById('worldRotationZCtrl');

    drawing.world.thetaX = worldRotationXCtrl.value;
    drawing.world.thetaY = worldRotationYCtrl.value;
    drawing.world.thetaZ = worldRotationZCtrl.value;

    return {
        main() {
            let cube1 = Cube.create();
            let cube2 = Cube.create();
            let cube3 = Cube.create();

            cube1.translate( 1, 2, 1);
            cube2.translate(-1, 2, 0);
            cube3.translate(-1, -2, 0);
            drawing.append(cube1, cube2, cube3);
            drawing.render();

            worldRotationXCtrl.addEventListener('input', evt => {
                drawing.world.thetaX = evt.target.value;
                // requestAnimFrame(drawing.render);
            });
            worldRotationYCtrl.addEventListener('input', evt => {
                drawing.world.thetaY = evt.target.value;
                // requestAnimFrame(drawing.render);
            });
            worldRotationZCtrl.addEventListener('input', evt => {
                drawing.world.thetaZ = evt.target.value;
                // requestAnimFrame(drawing.render);
            });
        }
    };
})();

// let sphere = buildSphere(10, 4, 4);
// console.log(sphere.length);

window.addEventListener('load', application.main);

"use strict";

let geometry = (() => {
    return {
        screenToUnitaryCoords(bounds) {
            let cx = -1 + 2 * bounds.x / bounds.w;
            let cy = -1 + 2 * (bounds.h - bounds.y) / bounds.h;

            return vec2(cx, cy);
        },
        buildRect(x, y, z, b, h) {
            let b2 = b / 2;
            let h2 = h / 2;
            return [
                vec3(x - b2, y - h2, z),
                vec3(x - b2, y + h2, z),
                vec3(x + b2, y + h2, z),
                vec3(x + b2, y - h2, z),
            ];
        },
    }
})();

let drawing = (() => {
    let gl;
    let canvas;
    let program;

    let objects = [];

    let solid = {
        colors: { bufferId: -1, values: []},
        indices: { bufferId: -1, values: []},
        vertices: { bufferId: -1, values: []},
    };
    let wireframe = {
        colors: { bufferId: -1, values: []},
        indices: { bufferId: -1, values: []},
        vertices: { bufferId: -1, values: []},
    };

    let _world = (() => {
        let rx = 0, ry = 0, rz = 0;

        return {
            get thetaX() { return rx; },
            get thetaY() { return ry; },
            get thetaZ() { return rz; },
            set thetaX(rx_) { rx = rx_; },
            set thetaY(ry_) { ry = ry_; },
            set thetaZ(rz_) { rz = rz_; },
            get rotationMatrix() { return vec3(this.thetaX, this.thetaY, this.thetaZ); }
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

            wireframe.colors.bufferId = gl.createBuffer();
            wireframe.indices.bufferId = gl.createBuffer();
            wireframe.vertices.bufferId = gl.createBuffer();
        },
        append(object) {
            objects.push(object);
            wireframe.colors.values = wireframe.colors.values.concat(object.colors);
            wireframe.indices.values = wireframe.indices.values.concat(object.indices);
            wireframe.vertices.values = wireframe.vertices.values.concat(object.vertices);

            let flush = true;
            if(flush) {
                gl.bindBuffer( gl.ARRAY_BUFFER, wireframe.vertices.bufferId );
                gl.bufferData( gl.ARRAY_BUFFER, flatten(wireframe.vertices.values), gl.STATIC_DRAW );

                // gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, wireframe.indices.bufferId );
                // gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(wireframe.indices.values), gl.STATIC_DRAW );

                gl.bindBuffer( gl.ARRAY_BUFFER, wireframe.colors.bufferId );
                gl.bufferData( gl.ARRAY_BUFFER, flatten(wireframe.colors.values), gl.STATIC_DRAW );

                console.log(wireframe.vertices.values);
                console.log(wireframe.colors.values);
            }

        },
        render() {
            gl.useProgram( program );

            let vPosition = gl.getAttribLocation( program, "vPosition" );
            gl.bindBuffer( gl.ARRAY_BUFFER, wireframe.vertices.bufferId );
            gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vPosition );

            let vColor = gl.getAttribLocation( program, "vColor" );
            gl.bindBuffer( gl.ARRAY_BUFFER, wireframe.colors.bufferId );
            gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( vColor );

            let worldRotationLoc = gl.getUniformLocation(program, 'worldRotation');
            gl.uniform3fv(worldRotationLoc, drawing.world.rotationMatrix);

            gl.enable(gl.DEPTH_TEST);
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            gl.drawArrays( gl.TRIANGLES, 0, 36 );
            // gl.drawElements( gl.LINE_STRIP, wireframe.indices.values.length, gl.UNSIGNED_BYTE, 0 );
        }
    };
})();

let Cube = (() => {
    let _vertices = geometry.buildRect(0,0,0.5, 1, 1).concat(geometry.buildRect(0,0,-0.5, 1, 1));
    let _wireIndices = [3,2,1,0,4,7,3,7,6,2,6,5,1,0,4,5,4,7,6,2,3,0]; //LINE_STRIP
    let _indices     = [3,2,0,1,5,0,4,0,7,3,7,2,6,2,5,1,6,7,5,4]; //TRIANGLE_STRIP

    let a = [
        0,1,3,1,3,2,
        4,5,7,5,7,6,
        0,4,3,4,3,7,
        3,7,2,7,2,6,
        2,6,1,6,1,5,
        1,5,0,5,0,4
    ];

    let triangleVertices = [];
    for(let i=0; i<a.length; i++) {
        let idx = a[i];
        triangleVertices.push(_vertices[idx]);
    }

    _vertices = triangleVertices;


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

    return {
        create(map) {
            let _objVertices = _vertices;
            let _isWireframe = map.isWireframe === true;
            let _colors = [];
            let setColor = (color) => {
                if(_isWireframe) {
                    _colors = Array(36).fill(vec4(0,0,1,1));
                } else {
                    _colors = _colors.concat(Array(6).fill(vec4(1,0,0,1)));
                    _colors = _colors.concat(Array(6).fill(vec4(0,1,0,1)));
                    _colors = _colors.concat(Array(6).fill(vec4(0,0,1,1)));
                    _colors = _colors.concat(Array(6).fill(vec4(0,1,1,1)));
                    _colors = _colors.concat(Array(6).fill(vec4(1,1,0,1)));
                    _colors = _colors.concat(Array(6).fill(vec4(1,0,1,1)));
                }
                // _colors = _isWireframe ? Array(Cube.numberOfVertices).fill(color) : multiColor;
            };
            setColor(map.color);

            return {
                get isWireframe() { return _isWireframe; },
                get colors() { return _colors; },
                get vertices() { return _objVertices; },
                get indices() { return (_isWireframe ? _wireIndices : _indices); },

                set colors(c) { setColor(c); }
            };
        },
        get numberOfIndices() { return _indices.length; },
        get numberOfVertices() { return _vertices.length; },
        get numberOfVerticesWireframe() { return _wireIndices.length; },
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
            let cube1 = Cube.create({
                color: vec4(0.0, 0.0, 1.0, 1.0),
                isWireframe: false
            });
            drawing.append(cube1);

            drawing.render();

            worldRotationXCtrl.addEventListener('input', evt => {
                drawing.world.thetaX = evt.target.value;
                requestAnimFrame(drawing.render);
            });
            worldRotationYCtrl.addEventListener('input', evt => {
                drawing.world.thetaY = evt.target.value;
                requestAnimFrame(drawing.render);
            });
            worldRotationZCtrl.addEventListener('input', evt => {
                drawing.world.thetaZ = evt.target.value;
                requestAnimFrame(drawing.render);
            });
        }
    };
})();

window.addEventListener('load', application.main);

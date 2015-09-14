precision mediump float;

const int MAX_LIGHTS = 4;

uniform int indexColorSelection;

uniform sampler2D texture1;

varying vec2 fTexCoord;
varying vec3 L[MAX_LIGHTS];
varying vec3 N;
varying vec3 E;
varying float attenuation[MAX_LIGHTS];

uniform vec4 ambientProduct, diffuseProduct, specularProduct;
uniform float shininess;

const float offset = 1.0 / 300.0;

void main()
{
    if(indexColorSelection > 0) {
        gl_FragColor = vec4(0.0, 0.0, float(indexColorSelection) / 255.0, 1.0);
        return;
    }

    vec4 ambient = ambientProduct;

    vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);

    for(int i=0; i<MAX_LIGHTS; i++) {
        vec3 Li = L[i];
        vec3 H  = normalize(Li+E);

        float Kd = max(dot(Li, N), 0.0);
        diffuse += Kd * diffuseProduct * attenuation[i];

        float Ks  = pow(max(dot(N, H), 0.0), shininess);
        specular += Ks * specularProduct * attenuation[i];

        if( dot(Li, N) < 0.0 ) {
            specular = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }

    vec2 offsets[9];
    // (
        offsets[0] = vec2(-offset, offset),  // top-left
        offsets[1] = vec2(0.0,    offset),  // top-center
        offsets[2] = vec2(offset,  offset),  // top-right
        offsets[3] = vec2(-offset, 0.0),    // center-left
        offsets[4] = vec2(0.0,    0.0),    // center-center
        offsets[5] = vec2(offset,  0.0),    // center-right
        offsets[6] = vec2(-offset, -offset), // bottom-left
        offsets[7] = vec2(0.0,    -offset), // bottom-center
        offsets[8] = vec2(offset,  -offset);  // bottom-right
    // );

    float kernel[9];
    kernel[0] = 1.0; kernel[1] = 1.0; kernel[2] = 1.0;
    kernel[3] = 1.0; kernel[4] = -8.0; kernel[5] = 1.0;
    kernel[6] = 1.0; kernel[7] = 1.0; kernel[8] = 1.0;
    // kernel[0] = -1.0; kernel[1] = -1.0; kernel[2] = -1.0;
    // kernel[3] = -1.0; kernel[4] =  9.0; kernel[5] = -1.0;
    // kernel[6] = -1.0; kernel[7] = -1.0; kernel[8] = -1.0;

    vec3 sampleTex[9];
    for(int i = 0; i < 9; i++) {
        sampleTex[i] = vec3(texture2D(texture1, fTexCoord.st + offsets[i]));
    }

    vec3 col;
    for(int i = 0; i < 9; i++)
        col += sampleTex[i] * kernel[i];


    //blur
    // vec4 sum = vec4(0.0);
    // for (int x = -4; x <= 4; x++)
    //     for (int y = -4; y <= 4; y++)
    //         sum += texture2D(texture1,
    //             vec2(fTexCoord.x + float(x) * blurSizeH, fTexCoord.y + float(y) * blurSizeV)) / 81.0;
    //endblur

    vec4 color = texture2D(texture1, fTexCoord);

    // gl_FragCoord = gl_FragCoord + vec4(N, 0.0) * 2.0;
    // gl_PointCoord = gl_PointCoord + vec4(N, 0.0) * 2.0;
    // gl_Position = gl_Position + N * 2.0;
    // gl_FragColor = color + vec4((diffuse + specular).rgb, 1.0);


    // gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0);
    // gl_FragColor = vec4(col, 1.0);
    gl_FragColor = vec4((color + diffuse + specular).rgb, 1.0);
    // gl_FragColor = ambient;

}

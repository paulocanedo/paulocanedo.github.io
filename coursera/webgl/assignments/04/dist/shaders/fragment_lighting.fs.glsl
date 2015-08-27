precision mediump float;

const int MAX_LIGHTS = 8;

varying vec3 L[MAX_LIGHTS];
varying vec3 N;
varying vec3 E;
varying float attenuation[MAX_LIGHTS];

uniform vec4 ambientProduct, diffuseProduct, specularProduct;
uniform float shininess;

void main()
{
    // Compute terms in the illumination equation
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
    // gl_FragColor = ambient;
    gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0);

}

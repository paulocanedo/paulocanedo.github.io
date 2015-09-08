const int MAX_LIGHTS = 4;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec4 fColor;

uniform vec3 worldRotation;
uniform vec4 lightsPositions[MAX_LIGHTS];

uniform vec4 ambientProduct, diffuseProduct, specularProduct;
uniform float shininess;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main()
{
    // vec3 angles = radians(worldRotation);
    // vec3 c = cos(angles);
    // vec3 s = sin(angles);
    // mat4 rx = mat4(1.0,  0.0, 0.0, 0.0, 0.0,  c.x, s.x, 0.0, 0.0, -s.x, c.x, 0.0, 0.0,  0.0, 0.0, 1.0);
    // mat4 ry = mat4(c.y, 0.0, -s.y, 0.0, 0.0, 1.0,  0.0, 0.0, s.y, 0.0,  c.y, 0.0, 0.0, 0.0,  0.0, 1.0);
    // mat4 rz = mat4(c.z, -s.z, 0.0, 0.0, s.z,  c.z, 0.0, 0.0, 0.0,  0.0, 1.0, 0.0, 0.0,  0.0, 0.0, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    // gl_Position = projectionMatrix * modelViewMatrix * rx * ry * rz * vPosition;
    vec4 ambient = ambientProduct;
    vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);

    vec3 pos = -(modelViewMatrix * vPosition).xyz;

    vec3 N = normalize(modelViewMatrix * vec4(vNormal, 0.0)).xyz;
    vec3 E = normalize( -pos );
    for(int i=0; i<MAX_LIGHTS; i++) {
        vec3 light = lightsPositions[i].xyz;
        vec3 L;

        if(lightsPositions[i].w == 0.0) L = normalize(light);
        else L = normalize(light - pos);

        vec3 H  = normalize(L+E);

        float Kd = max(dot(L, N), 0.0);
        diffuse += Kd*diffuseProduct;

        float Ks  = pow( max(dot(N, H), 0.0), shininess );
        specular += Ks * specularProduct;

        if(dot(L, N) < 0.0 ) {
            specular = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }
    fColor = vec4((ambient + diffuse + specular).rgb, 1.0);
}

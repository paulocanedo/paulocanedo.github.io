const int MAX_LIGHTS = 4;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 L[MAX_LIGHTS];
varying vec3 N;
varying vec3 E;
varying float attenuation[MAX_LIGHTS];

uniform vec3 worldRotation;
uniform vec4 lightsPositions[MAX_LIGHTS];

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


    vec3 pos = -(modelViewMatrix * vPosition).xyz;
    E = normalize( -pos );
    N = normalize(modelViewMatrix * vec4(vNormal, 0.0)).xyz;
    for(int i=0; i<MAX_LIGHTS; i++) {
        vec3 light = lightsPositions[i].xyz;

        if(lightsPositions[i].w == 0.0) L[i] = normalize(light);
        else L[i] = normalize(light - pos);

        float distanceToLight = length(light - pos);
        attenuation[i] = 1.0 / (1.0 + 0.001 * pow(distanceToLight, 2.0));
    }

    // gl_Position = projectionMatrix * modelViewMatrix * rx * ry * rz * vPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}

const int MAX_LIGHTS = 4;

attribute vec4 vPosition;
attribute vec3 vNormal;
attribute vec2 vTexCoord;

varying vec2 fTexCoord;
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

    fTexCoord = vTexCoord;
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}

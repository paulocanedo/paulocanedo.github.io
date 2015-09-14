precision mediump float;

uniform vec3 selectionColor;

void main()
{
    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    // gl_FragColor = vec4(selectionColor.rgb, 1.0);
}

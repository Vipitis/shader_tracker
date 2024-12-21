void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord - .5/iResolution.xy)/iResolution.y;

    vec3 col = getRed(fract(iTime));
    col += green;
    // Output to screen
    fragColor = vec4(col,1.0);
}
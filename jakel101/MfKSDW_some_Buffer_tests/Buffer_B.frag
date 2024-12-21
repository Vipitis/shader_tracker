void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 col0 = texture(iChannel0,uv);
    vec4 col1 = texture(iChannel1,uv);
    fragColor = mix(col0, col1, sin(iTime));
}
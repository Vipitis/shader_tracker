// Apache 2.0 not patents [*|*]

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 c0 = texture(iChannel0, uv);
    vec4 c1 = texture(iChannel1, uv);
    fragColor = vec4(mix(c0.rgb, c1.rgb, step(0.5, uv.x)), 1.0);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    vec2 uv_f = uv * 2.;
    vec4 col = texture(iChannel0, uv_f);

    // Output to screen
    fragColor = col;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 c0 = texture(iChannel0, uv); 
    c0 += fract(iTime + uv.y) - 0.5;
    vec4 c1 = texture(iChannel1, uv); //self
    c1 += fract(iTime - uv.y) - 0.5;
    fragColor = vec4(mix(c0.rgb, c1.rgb, step(0.75, uv.x)), 1.0);
}
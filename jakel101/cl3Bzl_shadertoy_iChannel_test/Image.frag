void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    
    vec4 c0 = texture(iChannel0, uv/(1.0+sin(iTime)));
    vec4 c1 = texture(iChannel1, uv/(1.0+sin(-iTime)));
    
    fragColor = mix(c0,c1,0.5);
}
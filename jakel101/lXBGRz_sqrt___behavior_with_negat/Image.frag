void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;

    vec3 col = vec3(0.0);
    
    col += float(sqrt(uv.x) > uv.y);
    
    fragColor = vec4(col,1.0);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;


    float y = 4.0 * uv.y;
    vec3 col = vec3(0.0);
    col.r += pow(uv.x, y);
    col.g += pow(abs(uv.x), y);
    col.b += pow(max(0.0, uv.x), y);
    
    fragColor = vec4(col,1.0);
}
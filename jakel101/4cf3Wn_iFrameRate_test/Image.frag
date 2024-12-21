// see https://www.shadertoy.com/view/lsKGWV for a possible explanation

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    vec3 col = vec3(0.0);
    // 1.0/iTimeDelta at the top
    col += (float((1.0/iTimeDelta) / 255.0 >= uv.x) * float(uv.y>=0.5));
    // iFrameRate at the bottom
    col += float(iFrameRate/ 255.0 >= uv.x) * float(uv.y<=0.5);
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
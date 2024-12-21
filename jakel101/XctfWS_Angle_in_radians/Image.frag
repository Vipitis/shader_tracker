# define PI 3.141592
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv from -1..1
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec3 col;
    
    // crosshair
    col.r = smoothstep(fwidth(uv.y), 0.0, min(abs(uv.x),abs(uv.y)));
    
    // angle value in radians 0..1
    float val = mod(atan(uv.x, uv.y), PI*2.0);
    col.g += val/(PI*2.0);
    
    // visualizing section
    float sec = fract(iTime);
    col.b = smoothstep(sec, sec-fwidth(uv.y), col.g);
    
    fragColor = vec4(col,1.0);
}
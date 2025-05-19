#define PI 3.14192


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    uv *= 3.0;
    uv.x += asin(fract(uv.y-0.5)+0.5)*(1.0/PI);
    
    // TODO: uv per shape, not per square.
    // +vec2(0.0, smoothstep(0.0, 1.0, fract(uv.x))))
    vec2 cellUV = fract(uv);
    vec2 cellID = floor(uv);
    
    // checkerboard trick
    float check = clamp(0.0, 1.0, 
        (mod(cellID.y, 2.0) + mod(cellID.x, 2.0))) 
     - ((mod(cellID.y, 2.0) * mod(cellID.x, 2.0)));
    
    vec3 col = vec3(cellUV, 0.0);//, check);
    fragColor = vec4(col,1.0);
}
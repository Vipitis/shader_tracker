#define PI 3.14159265



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    // scale or zoom
    uv *= 8.5;
    
    vec3 bg_col = vec3(0.85,0.2,0.05); //orange brick color?
    
    float thickness = 0.05;
    float vert_lines = smoothstep(0.0, thickness, sin((uv.x*2.0*PI+sign(sin(uv.y*PI))*PI/2.0))-1.0+thickness);
    float horizontal_lines = smoothstep(0.0, thickness, cos(uv.y*2.0*PI)-1.0+thickness);
    
    vec3 fill_col = vec3(0.41, 0.56, 0.65); // grey color
    
    vec3 col = mix(bg_col, fill_col, max(vert_lines, horizontal_lines));
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
#define PI 3.14

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // Time varying pixel color
    vec3 white = vec3(1.,1.,1.);
    
    vec3 col = .5 * white;
    
    float x = floor(sin(8.0 * PI * uv.x));
    float y = floor(sin(8.0 * PI * uv.y));
    
    col += (x);
    col -= y;
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
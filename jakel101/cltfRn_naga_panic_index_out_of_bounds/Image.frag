#define MIX2(c) mix(c, c, 0.5)

const vec2 blank = MIX2(vec2(0.0,1.0));
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    
    vec2 col = MIX2(uv);
    
    fragColor = vec4(col,0.5,1.0);
}

// Apache 2.0 no Patents _^-^_

// Image pass just used for displaying right now...
// maybe I will do stuff like color palettes or something.
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 values = texture(iChannel0, uv);
    if (uv.x > 0.5) {
        values.xy = values.xy*0.5;
    }    
    fragColor = vec4(values.yxz,1.0); //swaped rg to look better
}
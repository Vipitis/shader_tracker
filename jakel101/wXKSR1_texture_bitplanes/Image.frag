void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 2)
    vec2 uv = fragCoord/iResolution.xy;
    uv*= 2.0;
    int channel = int(uv.x)*2 + int(uv.y);
    uv = fract(uv);    
    vec4 tex = texture(iChannel0, uv);
    // wrange the texture back int uint8 representation
    int val = int(tex[channel]*255.0);
    
    int bit = (iFrame/30)%8; // lower this 30 to make your eyes hurt!
    val = (val >> bit) & 1;
    
    // as val is either 0 or 1 we don't need to scale up again to 255
    vec4 col = vec4(val);
    fragColor = vec4(col);
}
// Buffer A read the music and holds a ringbuffer past.


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;    
    ivec2 st = ivec2(fragCoord);
    // buffer length is essentially iResolution.y
    
    vec4 samp = vec4(0.0);    
    if (st.x > 0) {
        // previous state, shifted by 1
        samp = texelFetch(iChannel0, st-ivec2(1,0), 0);
        
        
        // as an alternative, you can use this 2nd line here to get smoothing for free
        // as the texture is sampled with linear.
        //samp = texture(iChannel0, uv-vec2(1.0/iResolution.y, 0.0));        
    }
    else {
        // new value in .r and .b
        samp.x = texelFetch(iChannel1, ivec2(st.y, 0), 0).x;
        samp.y = 0.2 * texelFetch(iChannel1, ivec2(st.y, 1), 0).x;
    }
    
    // just to have something in the channel since it's also used to calculate height!
    samp.z = 1.0 - uv.x;    
    fragColor = vec4(samp);
}
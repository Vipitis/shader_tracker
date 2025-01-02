// Buffer A does the "animation"
// basic idea is to avoid any kind of integration and just use time to expand
// and we hide the infinity by creating new "particles" as dots in the center
// we might draw something on top of that in a different pass.

//TODO: fake "stars"?

# define TAU 6.283185
float sdCircle(vec2 pos, float radius){
    return length(pos) - radius;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;    
    float beat_wf = texelFetch(iChannel1, ivec2(1,0), 0).r; // the sample point might need to be changed 
    
    vec4 col = vec4(0.02); // init color
    col.a = 0.0; // do we need alpha compositing here?
    
    float speed = 0.998 - (0.008*beat_wf); // this number is influenced every frame by the sampled music    
    vec2 st = uv-vec2(0.5);// texture sampling coordinates have to be moved than scaled
    st *= speed;// -(length(st)*0.02); // positively or negatively warp space on the edges?
    st += vec2(0.5);  // and finally moved again        
    vec4 bg_scaled = texture(iChannel0, st);
    
    vec2 center_uv = uv - vec2(0.5); // +sin(iTime)*0.1); // if you move this it get's really trippy
    center_uv.x = abs(center_uv.x); // mirror horizontally
    float phi = mod(atan(center_uv.x, center_uv.y), TAU)/TAU*2.0; // these are pseudo polar coordinates
    float fft = texelFetch(iChannel1, ivec2(int(phi*512.0),1), 0).x;
    
    float shape_dist = sdCircle(center_uv, 0.2*fft);
    float shape = smoothstep(0.008, 0.0, shape_dist); // the first value has a strong impact
    
    vec3 rainbow = vec3(sin(iTime + TAU*vec3(0.0, 0.33, 0.66))); // approximate TAU thirds for RGB rotation
    
    col = mix(col, vec4(rainbow,1.0), shape); // basically set the alpha
    col.rgb = mix(bg_scaled.rgb, col.rgb, col.a);
    
    fragColor = vec4(col);
}
// this buffer basically just shows a fake 3D datacube
// by shifting the previous frame over and then reading the next state!

// TODO: maybe do this in pixels instead?
#define SHIFT vec2(0.005, 0.002)

vec4 init(vec2 uv){

    return vec4(0.0);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    
    vec2 new_st = (uv*2.0) -1.0;
    float new_mask = float(new_st.x > 0.0 || new_st.y > 0.0);
    
    vec2 prev_st = uv - SHIFT;        
    vec4 prev = texture(iChannel1, prev_st);    
        
    if (prev_st.x < 0.0 || prev.st.y < 0.0) {
        prev = vec4(0.0); // avoid the wrapping to the left
    }
    if (prev_st.x < 0.5 && prev_st.y < 0.5){
        // sorta a fake shadow?
        prev *= clamp(length(max(abs(uv.x-0.25), abs(uv.y-0.25)))+0.5, 0.0, 1.0);
    }
    prev *= 0.99; // darker everything too
    vec4 next = texture(iChannel0, new_st);
    // TODO abs or shift or something to get all values in the visible range!
    // for display we want to see it
    // next = abs(next); // too much symmetry
    // next += 0.5; // no black?
    next = clamp(next, vec4(0.0), vec4(1.0)); // maybe scale instead with some exp function or similar
    
    // TODO: make black transparent here?
    vec4 col = mix(next, prev, new_mask);

    
    // Output to screen
    fragColor = vec4(col);
}
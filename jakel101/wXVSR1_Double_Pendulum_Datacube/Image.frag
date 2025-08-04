// Apache 2.0 no patents | ($)~~o~~($) |
// imporvements and remixes welcome!

// image pass lets you see the datacube and then pick any parallel timeline
// use the mouse and click to view a specific timeline (whole screen)

// previously derived in https://www.shadertoy.com/view/wc33WX
float sdLineSegment(vec2 p, vec2 a, vec2 b) {
    float d;    
    float h = clamp(dot(p-a, b-a)/(length(b-a)*length(b-a)), 0.0, 1.0);
    vec2 q = mix(a, b, h);    
    d = length(p-q);
    return d;
}

float sdBall(vec2 pos, float rad){
    return length(pos) - rad;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    vec2 cube_st = uv; // sampling coords we need for the whole screen
    uv *= 2.0;
    vec2 cube_uv = uv;
    uv -= 1.0;
    vec2 m = iMouse.xy/iResolution.xy;
    m *= 2.0;
    m -= 1.0;

    ivec2 st = ivec2(iMouse.xy); //TODO remap to lineup with the front of the cube!
    vec4 state = texelFetch(iChannel0, st, 0);
    
    // sanity checks!
    // m = Cartesian2Polar(m); // Polar2Cartesian
    // m = Polar2Cartesian(m.x, m.y); // Polar2Cartesian
    
    // sorta the background?
    vec4 cube = texture(iChannel1, cube_st);
    vec4 full = texture(iChannel0, cube_st); // this one for fullscreen!    
    
    vec3 col = mix(full, cube, clamp(-cos(iTime*0.3)*5.0, 0.0, 1.0)).rgb; // since .a channel also has information it might be worth looking at that too!
    
    // TODO these scale is not the same as used for the simulation, but should be proportional
    vec2 inner_pos = Polar2Cartesian(state.x, 0.45);
    vec2 outer_pos = inner_pos - Polar2Cartesian(state.z, -0.45); // why minus here?
        
    // TODO make pixel width analytically correct!
    float pixel_width = 0.002;
    
    // TODO maybe make a draw func? void( inout bg, in fg, in mask)
    float selector_dist = sdBall(uv - m, 0.02); // TODO what happens outside the area?
    col = mix(col, vec3(0.8, 0.8, 0.4), smoothstep(pixel_width, -pixel_width, selector_dist));
    float innter_rod = sdLineSegment(uv, vec2(0.0, 0.0), inner_pos);
    col = mix(col, vec3(0.4, 0.4, 0.1), smoothstep(pixel_width, -pixel_width, innter_rod-0.01));
    float outer_rod = sdLineSegment(uv, inner_pos, outer_pos);
    col = mix(col, vec3(0.6, 0.6, 0.1), smoothstep(pixel_width, -pixel_width, outer_rod-0.01));
    float pendulum = sdBall(uv - outer_pos, 0.02);
    col = mix(col, vec3(1.0, 1.0, 0.1), smoothstep(pixel_width, -pixel_width, pendulum));
    // Output to screen
    
    
    float angle = atan(uv.x, uv.y);
    float dist = length(uv)*2.0;
    //col = vec3((angle/(PI*2.0))+ 0.5, 0.0, 0.0);
    
    fragColor = vec4(col, 1.0);
}
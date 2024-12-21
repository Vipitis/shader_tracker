// no additional license restrictions, would love to learn about your projects!

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from -1 to 1 in the center square)
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    
    
    // set all pixels to grey
    vec3 col = vec3(0.23);
    
    // slanted blue box on the left
    float thickness = 0.02;
    float slant = -0.25;
    
    float width = iMouse.x/iResolution.x;
    if (iMouse.x<=0.0) {width = 0.3;};
    float height = iMouse.y/iResolution.y;
    if (iMouse.y<=0.0) {height = 0.5;};
    vec2 wug_pos = vec2(-0.4, 0.0);
    
    
    float b = smoothstep(width+thickness,width,abs(uv.x-wug_pos.x+(uv.y*slant)));
    b *= smoothstep(height+thickness,height,abs(uv.y-wug_pos.y));
    
    col.b += b;
    
    //joke: eye
    vec2 eye_pos = vec2(wug_pos.x + 0.6*width, wug_pos.y + 0.7*height);
    float w = 1.0-smoothstep(0.0, thickness, length(uv-eye_pos)- thickness);
    col += vec3(w);
    
    //legs
    float leg_length = height*0.4;
    float leg_slant = sin(iTime) * 0.6;
    //y component first
    float wug_bottom = wug_pos.y-(height);
    float l = smoothstep(wug_bottom+thickness, wug_bottom, uv.y-wug_pos.y);
    l *= smoothstep(wug_bottom-leg_length, wug_bottom-leg_length+thickness, uv.y-wug_pos.y);
    // x components
    float l_1 = smoothstep(thickness,0.0,abs(uv.x-wug_pos.x+(uv.y*(slant+leg_slant))));
    float l_2 = smoothstep(thickness,0.0,abs(uv.x-wug_pos.x+(uv.y*(slant-leg_slant))));
    l *= (l_1 + l_2); // combine to legs
    col -= l;
    
    //feet
    float feet_length = leg_length * width;
    float leg_end = wug_bottom-leg_length;
    float f = smoothstep(leg_end+thickness, leg_end, uv.y-wug_pos.y);
    f *= smoothstep(leg_end-thickness, leg_end, uv.y-wug_pos.y);
    vec2 f_1_pos = vec2(uv.x-wug_pos.x+(uv.y*(slant+leg_slant)), leg_end);
    vec2 f_2_pos = vec2(uv.x-wug_pos.x+(uv.y*(slant-leg_slant)), leg_end);
    float f_1 = smoothstep(leg_length+thickness,leg_length,abs(f_1_pos.x-0.15)+feet_length);
    float f_2 = smoothstep(leg_length+thickness,leg_length,abs(f_2_pos.x-0.15)+feet_length);
    f *= (f_1 + f_2);
    col -= f;
    
    
    
    //add red circle on top
    float d = length(uv-eye_pos);
    d -= sin(iTime*2.5)*0.03;
    d = smoothstep(4.0*thickness, 0.0, d);
    col.r += d;

    // Output to screen (add alpha)
    fragColor = vec4(col,1.0);
}
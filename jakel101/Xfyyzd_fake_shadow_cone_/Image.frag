// Apache 2.0 no patents
float sdCircle(vec2 pos, float rad){
    return (length(pos) - rad);
}

float sdPlane2D(vec2 pos, vec2 norm, float b){
    // line is orthogonal to the normal vector with offset b
    // b != length(norm) to allow for lines through the origin of different rotations
    // distance to that divider, negative for one side, positive for the other
    vec2 ortho = normalize(norm);
    return dot(ortho, pos)-b;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/min(iResolution.x, iResolution.y);
    vec2 mou = (2.0 * iMouse.xy - iResolution.xy)/min(iResolution.x, iResolution.y);
    
    // positions
    float ground_height = -0.1 - 0.2*sign(uv.x); // not exact
    float ball_size = 0.1;
    vec2 ball_pos = (0.8*vec2(sin(iTime), -cos(iTime)));
    if (sign(iMouse.z) > 0.0){
        ball_pos = mou;
    }
    float ball_dist = sdCircle(uv - ball_pos, ball_size);
    float floor_dist = sdPlane2D(uv,vec2(0.0, -1.0), -ground_height);

    // shadow via a 2nd circle, based on globals - not ideal
    float ball_height = max(0.0, ball_pos.y - ground_height);
    vec2 shadow_pos = ball_pos;
    shadow_pos.y = min(shadow_pos.y - ball_size, -1.0 * (shadow_pos.y + ball_size - ground_height) + ground_height);
    float shadow_dist = sdCircle(uv - shadow_pos, ball_size + sqrt(ball_height+1.0)-1.0);

    // object masks
    float floor_mask = smoothstep(0.0, 0.01, floor_dist+abs(0.03*sin(uv.x*150.0)));
    float ball_mask = smoothstep(0.0, 0.01, -ball_dist);
    float shadow_mask = smoothstep(0.0,  0.01 +ball_height, -shadow_dist);
    
    // colors/textures
    vec3 col = vec3(0.05, 0.3, 0.6*(1.5+uv.y)); // "sky" / background
    vec3 floor_col = vec3(0.3, 0.65+0.2*abs(uv.x), 0.2);
    vec3 ball_col = vec3(0.9, 0.2, 0.3);
    
    // color mixing
    col = mix(col, floor_col, floor_mask);
    col += -0.5 * shadow_mask * floor_mask; // adds shadow just to the floor here?
    col = mix(col, ball_col, ball_mask);

    fragColor = vec4(col,1.0);
}
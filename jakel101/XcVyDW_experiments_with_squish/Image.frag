// Apache 2.0
// no patents :^


float sdCircle(vec2 pos, float rad){
    return (length(pos) - rad);
}


float sdFloor(vec2 pos, float height){
    // normal?
    // return normalize(vec2(0.0, 1.0));
    return pos.y - height;
}

// a more general variant would take a direction vector as input
// such as the normal of the collision? and then squish in the perpedicular of that
float sdSquish(vec2 pos, float mag, float rad){
    // squished space transform?
    mag = 1.0 - mag;
    vec2 st = vec2(pos.x*mag, pos.y/mag);
    float ball = sdCircle(st, rad);
    return ball;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/min(iResolution.x, iResolution.y);
    vec2 mou = (iMouse.xy * 2.0 - iResolution.xy)/min(iResolution.x, iResolution.y);

    vec2 ball_pos = 0.6*vec2(sin(iTime), cos(iTime));
    float ball_size = 0.1;
    if (sign(iMouse.z) > 0.0){
        ball_pos = mou;
    }
    float floor_height = -0.35 + sin(uv.x*30.0)*0.005; //remove the sin to get a difference experience
    vec2 squish_pos = ball_pos;
    
    // this should probably not be constant and contain some part of uv.y to make the
    // squish less uniform.
    float squish_depth = max(0.0,floor_height-ball_pos.y+ball_size);
    if (squish_depth > 0.0) {
        squish_pos.y = floor_height + (ball_size*(1.0 - squish_depth));
    }
    
    float ball_dist = sdCircle(uv - ball_pos, ball_size);
    float floor_dist = sdFloor(uv, floor_height);
    float squish_dist = sdSquish(uv - squish_pos, squish_depth, 0.1);
    
    
    // having some fun with the textures
    vec3 col = vec3(0.01);
    col += max(0.0,.1-fract(abs(uv.x*2.5)));
    col += max(0.0,.1-fract(abs(uv.y*2.5))); //background lines
    vec3 ball_col = vec3(0.1, 0.1+abs(cos(ball_dist*80.0)), 0.3);
    vec3 floor_col = normalize(vec3(0.1+0.05*abs(sin(uv.x*2.0)+smoothstep(0.01, 0.4,(cos(uv.y*4.0)))), min(0.3,uv.y-1.5*floor_height), 0.05));
    vec3 squish_col = vec3(0.05, 0.2, squish_depth);
    
    // color mixing with lazy alpha belnding
    col = mix(col, floor_col, smoothstep(0.01, .0, floor_dist));
    col = mix(col, ball_col, smoothstep(0.01, 0.0, ball_dist)*0.8);
    col = mix(col, squish_col, smoothstep(0.01, .0, squish_dist)*0.9);

    fragColor = vec4(col,1.0);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/iResolution.y;
    int val = 128;
    
    // first bitshift then addition
    if (uv.x > 0.0 && uv.y > 0.0) { //top right
        val = val << 2;
        val = val + 254;
    }    
    // here addition clearly happens first
    else if (uv.x > 0.0 && uv.y < 0.0) { // bot right
        val = val << (2 + 254);
    }
    
    // this is the questionable bit
    else if (uv.x < 0.0 && uv.y < 0.0) { // bot left
        val = val << 2 + 254;
    }
    
    // here it's first shift and then addtion
    else if (uv.x < 0.0 && uv.y > 0.0) { //top left
        val = (val << 2) + 254;
    }
    
    vec3 col = vec3(float(val)/2048.0);
    fragColor = vec4(col,1.0);
}
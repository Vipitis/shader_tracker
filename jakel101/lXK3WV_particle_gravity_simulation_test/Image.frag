// Apache 2.0 license for this Shader :)

// the main Image pass loads information from the Buffers
// then draws particles to the canvas

float sdCircle(vec2 pos, float r){
    return length(pos) - r;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv is set to the center
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    // scale it a little so we can see the bounds
    uv *= SCALE;
    
    vec4 data = texture(iChannel0, uv);
    
    vec2 p = data.xy;
    vec2 vel = data.zw;
    float ball = sdCircle(uv - p, RADIUS);
    
    vec3 col = vec3(ball < 0.0, vec2(0.2));
    
    // ouside area, with indicator bars
    if (abs(uv.x) > WIDTH ) {
        col.rgb = vec3(0.0);
        col.g = float(uv.y > 0.0 && uv.y < vel.y*(SCALE+1.0));
        col.r = float(uv.y < 0.0 && uv.y > vel.y*(SCALE+1.0));
        
    }   
    if (abs(uv.y) > HEIGHT) {
        col.rgb = vec3(0.0);
        col.g = float(uv.x > 0.0 && uv.x < vel.x*(SCALE+1.0));
        col.r = float(uv.x < 0.0 && uv.x > vel.x*(SCALE+1.0));
    }
    
    
    fragColor = vec4(col,1.0);
}
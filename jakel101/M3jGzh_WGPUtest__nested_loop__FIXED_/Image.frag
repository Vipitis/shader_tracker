float checkerboard(vec2 uv, float cells){
    uv *= cells/2.0;
    float rows = float(mod(uv.y, 1.0) <= 0.5);
    float cols = float(mod(uv.x, 1.0) <= 0.5);
    return float(rows == cols);
}

vec2 working(vec2 uv, float steps){
    float red = 0.0;
    float green = 0.0;
    int x;
    int y;
    for (x = 1; x <= 3; x++){
        // 1 + 2 + 3 = 6
        green += float(x);
        for (y = 1; y <= 3; y++){
            // 1+1+1 + 2+2+2 + 3+3+3 = 18?
            red += float(x);
        }
    }
    red = red / steps;
    green = green / steps;
    
    return vec2(red<uv.x, green<uv.y);
}

vec2 broken(vec2 uv, float steps){
    float red = 0.0;
    float green = 0.0;
    for (int x = 1; x <= 3; x++){
        // 1 + 2 + 3 = 6
        green += float(x);
        for (int y = 1; y <= 3; y++){
            // 1+1+1 + 2+2+2 + 3+3+3 = 18?
            red += float(x);
        }
    }
    red = red / steps;
    green = green / steps;
    
    return vec2(red<uv.x, green<uv.y);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float steps = 25.0;
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = vec3(checkerboard(uv,steps)) * 0.7;

    vec2 nested_result = mix(working(uv, steps), broken(uv, steps), iMouse.x/iResolution.x);
    col.rg += nested_result.rg;
    
    fragColor = vec4(col,1.0);
}
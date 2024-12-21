#define PHI 1.6180339887

// pseudo random? not great one....
float hash21(in vec2 ab){
    float a = ab.x - 0.006;
    float b = ab.y + 0.1;
    float h = mod(PHI, -45.4/a) * mod(PHI, -b*0.03);
    h *= 9123.512;
    return fract(dot(vec2(a,b),fract(vec2(h,a+b))*586.512));
}


// value noise ~ sorta
float noise2(in vec2 ab){
    
    vec2 i = floor(ab);
    vec2 f = fract(ab);
    
    vec2 f2 = smoothstep(0.0, 1.0, f); //
    
    // corners in 2D
    // c3 - c2
    //  |    |
    // c0 - c1
    float c0 = hash21(i);
    float c1 = hash21(i+vec2(1.0,0.0));
    float c2 = hash21(i+vec2(1.0,1.0));
    float c3 = hash21(i+vec2(0.0,1.0));
    
    // reconstruct with interpolation
    float r = mix( mix(c0, c1, f2.x),
                   mix(c3, c2, f2.x), f2.y);
    return r;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // really naive directional blur
    vec2 m = iMouse.xy;
    if ((iMouse.x<=0.0)||(iMouse.y<=0.0)){m.x=400.0,m.y=420.0;};
    float dist = m.y/10.0;
    float scale = m.x;
    
    float steps = max(10.0,dist*3.0);
    vec3 col = vec3(0);
    for (float i = 0.0; i <= steps; i++){
        vec2 offset = vec2((i/steps)*dist); 
        offset *= vec2(sin(iTime*0.1), cos(iTime*0.1)); // animate direction by time?
        col += noise2((uv*scale)-offset+10.4)/steps;
    }
    
    // Output to screen
    fragColor = vec4(vec3(col),1.0);
}
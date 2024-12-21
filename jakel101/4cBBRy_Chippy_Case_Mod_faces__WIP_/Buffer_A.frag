void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    uv -= .5;
    uv *= 2.0;
    vec2 m = iMouse.xy/iResolution.xy;
    m -= .5;
    m *= 2.0;
    
    // eyes follow the mouse a bit 
    float eyes = length(vec2(abs(uv.x - 0.1*m.x) -0.4, (uv.y - 0.1*m.y) -0.2)) - 0.15; // last part is size
    // TODO pupil
    eyes = smoothstep(0.0, 0.02, eyes);
    
    
    // todo wavy or something
    float edges = 1.0 - smoothstep(0.0, 0.02, length(uv) - 1.);
    
    //todo freckles
    
    float mouth = 0.0;
    
    //TODO: webcam?
    vec4 c0 = texture(iChannel0, fragCoord/iResolution.xy);
    
    float face = 1.0;
    face *= eyes;
    face *= edges;
    fragColor = vec4(vec3(face),1.0);
}
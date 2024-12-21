//Confirm API working!

float sdCheckmark(vec2 p, float s, float t)
{
    vec2 b = vec2(0.1*s, -.5*s);
    float s1 = udSegment(p, vec2(-.4*s, -0.1*s), b);
    float s2 = udSegment(p, b, vec2(.7*s, 0.5*s));
    return min(s1, s2)-t;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.x;
    vec2 m = (2.0*iMouse.xy - iResolution.xy)/iResolution.x;
    
    float sep = clamp(2.4*sin(iTime),-0.5, 0.5);
    float scale = 0.6;
    float thick = smoothstep(0.1, 1.1, (1.0 - length(uv-m))) * 0.06;
    vec2 checkpos = uv - vec2(-sep,0.0);
    vec2 crospos = uv - vec2(sep,0.0);
    
    float checkmark = sdCheckmark(checkpos, scale, thick);
    float cros = sdCross(crospos, scale, thick);
    
    vec2 ncatuv = fragCoord/iChannelResolution[0].xy;
    vec4 ncat = texture(iChannel0, ncatuv);
    
    vec3 col = vec3(0.0);
    col.r += 1.0 - smoothstep(0.0, 0.02, cros);
    col.g += 1.0 - smoothstep(0.0, 0.02, checkmark);
    col += ncat.rgb * ncat.a;
    
    fragColor = vec4(col, 1.0);
}
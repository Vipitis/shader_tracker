// Apache 2.0 no patents [!__!] 
// this is meant as a effects pass (image pass)
// where it reads some background and make it look sorta broken
// improvements and remixes welcome!

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    vec2 mouse_start = abs(iMouse.zw)/iResolution.xy;
    vec2 mouse_end = iMouse.xy/iResolution.xy;
    
    // default values for before you touch mouse first time!
    if (iMouse.x == 0.0 && iMouse.z == 0.0){
        mouse_start = vec2(0.2);
        mouse_end = vec2(0.2);
    }
    
    // to capture the background, we distor the uv a bit for extra fun
    // disorted uv along the vertical axis
    vec2 distoriton = uv;
    
    // this one moves but has glitchy edges
    float fuzzy = clamp(tan(iTime*iDate.w),-0.3, 0.1);
    float strength_mask = 1.0 -clamp(abs(uv.y*2.0 - mouse_end.y-0.3)*(fuzzy+3.0), 0.0, 1.0);
    float offset = exp(sin(distoriton.y*30000.0*iTime))*max(-0.3, cos(iTime*0.33)*4.0);
    distoriton.y += offset*strength_mask;
    
    // this goes negative or positive a few times but stays at 0 most of the time...
    float sporadic = min(sin(mod(iTime, 3.4)), 0.0) - min(cos(mod(iTime*.3, 1.6)), 0.0)*sign(cos(iTime*3.0));
    
    distoriton.x += (0.5-uv.y)*sign(sporadic)*0.1;
    vec3 good = texture(iChannel0, distoriton).rgb; // TODO: different name


    // broken area
    vec3 bad = vec3(1.0) - good;
    bad = normalize(bad);
    bad -= fract(uv.x * 73.8 + sin(iTime*0.04-uv.x*914.0035))* 10.0; // pseudo hash that looks good enough right now
    //bad = max(vec3(0.0), bad);
    bad.b *= 64.0;
    bad.g *= uv.x*mouse_end.x;
    bad.b += (tan((mouse_start.y - uv.y)*1.0));
    
    bad = clamp(bad, vec3(0.0), vec3(1.0));

    
    //bad = normalize(bad);
    // todo additional distortions, streaks etc    
    vec3 bad2 = vec3(1.0 - bad);
    bad2 = pow(bad2, good*0.2);    
    bad2 -= fract(uv.y * 73.8 + sin(iTime*0.04-uv.y*914.0035))* 10.0;
    bad2 *= cross(vec3(mouse_start.xy, sign(cos(iTime*0.8))), normalize(vec3(sin(iTime*0.3),uv.yx)));
    
    bad2 = clamp(bad2, vec3(0.0), vec3(1.0));    


    // simple polynomals, offset by the mouse positions. Have a root in 0.0... could be more dynamic
    // TODO: more dynamic?
    
    //abs(x)*(x*0.1 -1)*0.2
    float f1 = abs((uv.x-mouse_start.x))*((uv.x-mouse_start.x)*1.5 -1.0)*0.2+mouse_start.y;
    f1 += fuzzy*0.03*abs(mouse_end.x);
    //float f1 = 0.12*((uv.x-mouse_start.x)-2.0)*-(pow(((uv.x-mouse_start.x)-2.0),3.0)+9.0)-0.24+mouse_start.y;
    float f2 = abs((uv.y-mouse_end.y))*((uv.y-mouse_end.y)*1.2 -1.0)*0.2+mouse_end.x;
    f2 += fract(sin(40.0 +uv.y*mouse_start.y*523.3))*0.002; // cheap "cracked edge"
    //float f2 = 3.0*((uv.y-mouse_end.y) * -(uv.y-mouse_end.y)) *(0.84*uv.y-mouse_end.y) + mouse_end.x;    
    
    float mask1 = float((f1 > uv.y));
    float mask2 = float((f2 > uv.x));       
    
    vec3 col = good;
    col = mix(col, bad, mask1);
    col = mix(col, bad2, mask2);
    col = mix(col, bad+bad2, mask1*mask2); // awful overlap?
    // Output to screen
    fragColor = vec4(vec3((col)),1.0);
}
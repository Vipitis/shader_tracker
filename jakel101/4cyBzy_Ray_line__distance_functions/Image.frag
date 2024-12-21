# define PI 3.141592
float udRay(vec2 pos, float ang){    
    ang *= PI*2.0; // from radians to TAU%    
    vec2 dir = vec2(sin(ang), cos(ang)); // vector along the ray
    return length(pos - dir*max(dot(pos,dir), 0.0));    
}

//TODO: signed distance to easily know which side you are on?
float sdRay(vec2 pos, float ang){
    float dist = udRay(pos, ang);
    // extract this logic?
    ang *= PI*2.0;
    vec2 ortho = vec2(cos(ang), -sin(ang));
    return dist * sign(dot(pos, ortho));
}

//TODO: with normals, is this signed?
vec3 gdRay(vec2 pos, float ang){
    // extract again
    float dist = sdRay(pos, ang);
    ang *= PI*2.0;
    vec2 ortho = vec2(cos(ang), -sin(ang));
    float sgn = sign(dot(pos, ortho));
    
    vec2 norm = ortho*sgn; // just init, not sure yet
    
    // just pointing away from the origin behind the ray?
    vec2 dir = vec2(sin(ang), cos(ang));
    if (dot(pos, dir) < 0.0) norm = pos;    
    return vec3(dist, normalize(norm));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 mou = (2.0*iMouse.xy-iResolution.xy)/iResolution.y;

    float line_size = fwidth(uv.y)*1.5;    
    vec3 col = vec3(0.02);

    // selection to show just one of them at a time changes every 2 seconds.
    float sel = floor(mod(iTime*0.5, 3.0));

    float u_ray = udRay(uv, iTime);
    if (sel != 0.0) u_ray = 1.0; // hide this one easily.
    vec3 u_col = vec3(0.7, 0.2, 0.4);
    col = mix(col, u_col, clamp(clamp(-cos(u_ray*100.0), 0.0, 1.0) * (1.0 - (u_ray*2.0)), 0.0, 1.0));
    col.r = mix(col.r, 1.0, smoothstep(line_size, 0.0, u_ray));

    float s_ray = sdRay(uv, iTime);
    if (sel != 1.0) s_ray = 1.0; // hide this one easily.
    vec3 s_col = vec3(0.2, 0.8, float(s_ray < 0.0)*0.4 + 0.2);
    col = mix(col, s_col, clamp(clamp(-cos(s_ray*100.0), 0.0, 1.0) * (1.0 - (abs(s_ray)*2.0)), 0.0, 1.0));
    col.g = mix(col.g, 1.0, smoothstep(line_size, 0.0, abs(s_ray)));
    
    vec3 g_ray = gdRay(uv, iTime);
    if (sel != 2.0) g_ray.x = 1.0; //TODO: how to hide this one?    
    col.gb = mix(col.gb, g_ray.gb, float(sel == 2.0));
    col.b = mix(col.b, 1.0, smoothstep(line_size, 0.0, abs(g_ray.x)));

    // little crosshair
    col += smoothstep(line_size, 0.0, abs(uv.x));
    col += smoothstep(line_size, 0.0, abs(uv.y));
    fragColor = vec4(col,1.0);
}
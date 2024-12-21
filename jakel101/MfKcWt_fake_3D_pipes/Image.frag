#define PI 3.141592
#define SCALE 4.0

// gradient distance (distance + norm) for a Ray.
// .x is signed distance
// .yz is normals
// ang in radians
vec3 gdRay(vec2 pos, float ang){
    ang *= PI*2.0;
    vec2 dir = vec2(sin(ang), cos(ang));
    vec2 norm = pos - dir * max(dot(pos, dir), 0.);
    float dist = length(norm);
    return vec3(dist * sign(dot(pos, vec2(dir.y, -dir.x))), norm / dist);
}


// pipe tile
// pos is the local area of this tile from 0..1
// start is a angle of where the pipe begins 0..1
// stop is also an angle of where the pipe stops.
// also outputs an alpha channel either 0 or 1
vec4 pipe_tile(vec2 pos, float start, float stop, vec3 light_angle){
    // reshape each tile to be -1..1 again centered
    vec2 uv = 2.0*pos - vec2(1.0);
    uv *= 2.0;
    
    vec3 g_start = gdRay(uv, start);
    vec3 g_stop = gdRay(uv, stop);
    float dist = min(abs(g_start.x), abs(g_stop.x));
    if (dist > 1.0) return vec4(0.0);
    // min based on distance, maybe a smoother idea?
    vec2 normals = (abs(g_start).x < abs(g_stop).x)?g_start.yz:g_stop.yz;
    // normals = mix(g_start.yz,g_stop.yz,0.5+max(abs(g_start).x,1.0)-max(abs(g_stop).x,1.0));
    
    // hemisphere via just distance.
    float height = sqrt(1.0-dist*dist);    
    // normals need to be denormalized by distance and the normalized together with height
    vec3 norm = normalize(vec3(normals*dist, height));
    
    
    float light_intensity = max(0.0,dot(normalize(light_angle), norm));
    vec3 col = vec3(0.1, 0.2, 0.8); // blue pipe
    col = mix(col, vec3(0.8, 0.2, 0.4), float(abs(g_start.x)==abs(g_stop.x))); // red part buggy overlap
    col = mix(col, vec3(0.1, 0.9, 0.3), float(abs(g_start.x)<abs(g_stop.x))); // green part
    col *= light_intensity;
    
    vec3 ambient = vec3(0.05);
    return vec4(vec3(col + col*ambient), 1.0); // todo alpha based on the expression above?
}

// simple version to use as a reference?
vec4 ball_tile(vec2 pos, vec3 light_angle){
    //shift tile space to be -1..0 again
    vec2 uv = 2.0*pos - vec2(1.0);
    uv *= 2.0;
    float ball_dist = length(uv) -1.0;
    
    vec3 height = vec3(sqrt(1.0-pow(uv.x,2.0) - pow(uv.y, 2.0)));
    vec3 norm = vec3(uv.x, uv.y, height);
    
    float light_intensity = max(0.0,dot(normalize(light_angle), norm));
    vec3 col = vec3(0.15, 0.25, 0.9);
    vec3 ambient = vec3(0.05);
    
    return vec4(vec3(col*light_intensity + col*ambient), 1.0)*step(0.0, -ball_dist);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // the uv is centered
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/min(iResolution.x, iResolution.y);
    vec2 mou = (2.0 * iMouse.xy - iResolution.xy)/min(iResolution.x, iResolution.y);
    uv *= (SCALE/2.0);
    mou *= (SCALE/2.0);
    int tileID = int(floor(uv.x + SCALE/2.0) + floor(uv.y + SCALE/2.0) * SCALE);
    
    // per tile
    vec3 light_angle = vec3(mou-floor(uv)-vec2(0.5), (sin(iTime)+1.0));
    
    vec3 col = vec3(0.05);
    vec4 pipes = vec4(0.0);
    vec2 tile_angle = vec2(floor(float(tileID)/SCALE)*float(1.0/(SCALE*2.0)),fract(float(tileID)/SCALE)*0.5+0.5);
    //tile_angle.x += 0.2*iTime;
    pipes += pipe_tile(fract(uv), tile_angle.x, tile_angle.y, light_angle);
        
    col = mix(col, pipes.rgb, pipes.a);
    if (abs(uv.x) >= SCALE/2.0) col = ball_tile(fract(uv), light_angle).rgb; //col = vec3(0.0);
    
    
    fragColor = vec4(vec3(col),1.0);
}
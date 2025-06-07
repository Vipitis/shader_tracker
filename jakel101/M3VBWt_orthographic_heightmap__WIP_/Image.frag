// APache 2.0 no patents \_%_/
# define PI 3.141592653
# define HEIGHT_SCALE 0.4

// resolution of the sampled area
# define CELLS ivec2(iChannelResolution[0].xy)

// unsure yet where to bring this!
# define SUN normalize(vec3(3.0, 4.0, 2.0))
//normalize(vec3(sin(iDate.w), cos(iTime), 0.25))


ivec2 worldToCell(vec3 p) {
    
    // move world space again
    p += 1.0;
    p *= 0.5;
    ivec2 st = ivec2((p.xy*vec2(CELLS.xy)));
    // TODO: find an actual solution to the edge cases!
    st = min(st, CELLS -1);
    return st;
}

vec2 cellToWorld(ivec2 current_cell,  vec2 dirs){
    // gives the rear plane of a cell, based on dirs?
    // TODO: can we avoid this magic epsilon number?
    // 
    vec2 p = vec2(current_cell);    
    p -= min(vec2(0.0),dirs); // the "step"?
    
    // scale and shift    
    p /= vec2(CELLS);
    p *= 2.0;
    p -= 1.0;
    //p = min(p, vec2(1.0));
    return p;
    
}

vec4 AABB(vec3 center, vec3 extend, vec3 ro, vec3 rd){        
    // miss is found by checking rear_hit > front_hit
    // .zw contains information about the entry/exit 1: +x, -1: -x, 2: +y, -2: -y, 3: +z, -3: -z??
    // you can do norm[abs(int(box_hit.z))-1] = sign(box_hit.z);
    
    // extend goes both ways! (size)
    vec3 front = center + sign(-rd)*extend; 
    vec3 rear = center + sign(rd)*extend; 
    
    //now distance those 6 planes:
    vec3 front_dist = (front-ro)/rd;
    vec3 rear_dist = (rear-ro)/rd;
    
    // TODO: turn into massive if/else if/else blocks for the direction info? (is there argmax?)
    float front_hit;//= max(max(front_dist.x, front_dist.y), front_dist.z); // front
    float front_dir;
    if (front_dist.x > front_dist.y && front_dist.x > front_dist.z){
        front_hit = front_dist.x;
        front_dir = 1.0 * sign(rd.x);
    }
    else if (front_dist.y > front_dist.x && front_dist.y > front_dist.z) {
        front_hit = front_dist.y;
        front_dir = 2.0 * sign(rd.y);
    }
    else {
        front_hit = front_dist.z;
        front_dir = 3.0 * sign(rd.z);
    }
    
    float rear_hit;// = min(min(rear_dist.x, rear_dist.y), rear_dist.z);
    float rear_dir;
    if (rear_dist.x < rear_dist.y && rear_dist.x < rear_dist.z){
        rear_hit = rear_dist.x;
        rear_dir = 1.0 * sign(rd.x);
    }
    else if (rear_dist.y < rear_dist.x && rear_dist.y < rear_dist.z) {
        rear_hit = rear_dist.y;
        rear_dir = 2.0 * sign(rd.y);
    }
    else {
        rear_hit = rear_dist.z;
        rear_dir = 3.0 * sign(rd.z);
    }
    
    vec4 res = vec4(front_hit, rear_hit, front_dir, rear_dir);    
    return res;
}

vec4 pillar_hits(ivec2 cell, float height, vec3 ro, vec3 rd){
    // returns the front and rear distance
    // if both values are negative it's a miss
    
    
    // let's move the pillar into world space by having it's center + extends    
    vec3 extend = vec3(1.0/vec2(CELLS), height*0.5);
    vec3 p = vec3(cell.xy, height*0.5);    
    p.xy *= extend.xy; 
    p.xy *= 2.0;
    p.xy -= 1.0 - extend.xy; // not quite the offset?
    // TODO: redo this math when less asleep...
    vec4 res = AABB(p, extend, ro, rd);
    return res;
}


vec4 sampleHeight(ivec2 cell){
    // to allow for more complex math to determine height
    // .rgb should just return the texture color or some modification of it
    //cell.x = (cell.x + iFrame) % int(iChannelResolution[0].x); // fun texture scroll
    vec4 tex = texelFetch(iChannel0, cell, 0);
    vec4 res;
    res.a = (tex.a + tex.r + tex.g)/3.0;
    res.rgb = tex.rgb; // * res.a // to make it more of a "height" map?
    //res.rgb = vec3(0.5);
    res.a *= HEIGHT_SCALE;
    return res;
}

vec4 raycast(vec3 ro, vec3 rd){
    // cast the ray untill there is a hit or we exit the box
    // "any hit" shader?
    // returns tex + dist
    
    vec4 box_hit = AABB(vec3(0.0, 0.0, HEIGHT_SCALE*0.5), vec3(1.0, 1.0, HEIGHT_SCALE*0.5), ro, rd);
    
    // miss or "inside" -.- TODO: got to figure out a better  check with normals maybe!
    if (box_hit.x > box_hit.y){
        // likely sample round here
        return vec4(vec3(0.2), -box_hit.y);
    }
    
    vec3 entry;
    entry = ro + rd*(max(-0.001, box_hit.x)); // should be start "inside" the box
    ivec2 current_cell = worldToCell(entry); // TODO: this one is problematic!
    int i;
    int max_depth = (CELLS.x + CELLS.y)+2; // could also be min!
    for (i = 0; i < max_depth; i++){        
        if (current_cell.x < 0 || current_cell.x >= CELLS.x ||
            current_cell.y < 0 || current_cell.y >= CELLS.y) {
            // we marched far enough are are "outside the box" now!
            return vec4(vec3(0.4), -abs(box_hit.y));
        }        
        vec4 tex = sampleHeight(current_cell);
        vec4 hit = pillar_hits(current_cell, tex.a, ro, rd);
        
        
        
        if (hit.x <= hit.y){
            // "any hit" (side/top)
            //return vec4(vec2(current_cell).xyxy/10.0);
            return vec4(tex.rgb, abs(hit.x));
        }
        else if (hit.x < 0.0) {
            // we are somehow "inside" the pillar
            return vec4(vec3(0.6), -1.0);
        }
        
        
        // even in a miss, the rear still is useful
        vec3 exit = ro + (rd * hit.y);
        if (exit.z > HEIGHT_SCALE){
            //sky exit?
            return vec4(0.98, 0.821, 0.75, -abs(box_hit.y));
        }
        
        vec3 exit_norm = vec3(0.0);
        exit_norm[abs(int(hit.w))-1] = sign(hit.w);
        
        if (abs(exit_norm.z) > 0.0){
            //basically this is a "top" exit, we aren't stepping further anymore. (on the shadow dir)
            // TODO: think about what this means!
            //return vec4(0.98, 0.821, 0.75, abs(box_hit.y));
        }
        
        // the step?
        current_cell += ivec2(exit_norm.xy);        
    }
    //return vec4(vec2(current_cell)/vec2(CELLS), 0.0, 0.0);
    // defualt "miss"? -> like we exit the box?
    return vec4(vec3(1.0), -abs(box_hit.y));

}

float shadow(vec3 ro, vec3 rd){
    // return the amount of shadowed?
    // we are now marching upwards from some hit
    // ro is essentially the point we started from
    // rd is the sun angle
    vec4 res = raycast(ro, normalize(rd));
    //return res.a;
    if (res.a < 0.0){// || (ro + rd*res.a).z >= HEIGHT_SCALE){
        // likely means outside the box/ground!
        return 0.0;
    }    
    else {
        return 0.5;
    }
}

vec4 sampleGround(vec3 ro, vec3 rd){
    // for any ray that misses the heightmap
    float ground_height = 0.0;
    float ground_dist = (ground_height-ro.z)/rd.z;
    vec3 ground_hit = ro + (rd * ground_dist);
    
    vec3 col = vec3(fract(ground_hit.xy), -ground_dist);
    return vec4(col, ground_dist);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv normalized to [-1..1] for height with more width
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 mo = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
    
    // for when it's just idling...   
    float azimuth = iTime*0.15 + mo.x;
    float altitude = 0.7+cos(iTime*0.4)*0.15;      
    if (sign(iMouse.z) > 0.0){
        // orbiting camera setup
        azimuth = PI*mo.x;
        altitude = 0.5*PI*clamp(mo.y+1.0, -0.01, 0.99); // maybe just positive?
    }
    
    // make sure you don't look "below"
    altitude = clamp(altitude, HEIGHT_SCALE, PI);
    
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));    
    // the camera is always looking "at" the origin
    vec3 look_dir = vec3(0.0, 0.0, HEIGHT_SCALE*0.5) - camera_pos;
    
    camera_pos += look_dir * -5.0; // moving the camera "back" to avoid occlusions?
    // two vectors orthogonal to this camera direction (tagents?)    
    //vec3 look_u = camera_pos + vec3(-sin(azimuth), cos(azimuth), 0.0);
    //vec3 look_v = camera_pos + vec3(sin(altitude)*-cos(azimuth), sin(altitude)*-sin(azimuth), cos(altitude));    
    
    // turns out analytically these aren't correct. so using cross instead -.-
    vec3 look_u = normalize(cross(vec3(0.0, 0.0, -1.0), look_dir));
    vec3 look_v = normalize(cross(camera_pos, look_u)); // is this faster?
    // camera plane(origin of each pixel) -> barycentric?
    
    // orthographic zoom just makes the sensor smaller
    float zoom = clamp(1.0 + cos(iTime*0.3), 0.05, 1.5);
    vec3 camera_plane = camera_pos + (look_u*uv.x)*zoom + (look_v*uv.y)*zoom; // wider fov = larger "sensor"    
        
    
    // actual stuff happening:
    vec4 res = raycast(camera_plane, look_dir);
    if (res.a < 0.0) {
        res = sampleGround(camera_plane, look_dir);
    }
    vec3 hit = camera_plane + (look_dir*res.a);
    vec3 ref = raycast(hit, SUN).rgb;
    
    float shadow_amt = shadow(hit, SUN);
    
    vec3 col = res.rgb - shadow_amt;    
    
    
    fragColor = vec4(vec3(col),1.0);
}
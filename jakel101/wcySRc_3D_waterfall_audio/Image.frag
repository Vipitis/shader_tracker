// Apache 2.0 no patents \_%_/

/* Image pass presents the texture calculated in Buffer A 
* this is adapted from my heightmap shader:
* https://www.shadertoy.com/view/M3VBWt
* pretty much in progress but this is one of the ideas I have had!
* feedback/improvements welcome here or on the original.
*/


# define PI 3.141592653
# define HEIGHT_SCALE 0.4

// resolution of the sampled area limit Y to some number smaller than iResolution.y to change the "speed"
# define CELLS ivec2(iChannelResolution[0].x, min(iChannelResolution[0].y,512.0))

// unsure yet where to bring this!
# define SUN normalize(vec3(sin(iDate.w*0.5), cos(iTime), HEIGHT_SCALE*1.5))
// normalize(vec3(3.0, -5.0, 2.0))

// in progress!
// horizontal FOV, if you use negative values the camera will be orthographic!
# define FOV 90.0

ivec2 worldToCell(vec3 p) {
    
    // move world space again
    p += 1.0;
    p *= 0.5;
    ivec2 st = ivec2((p.xy*vec2(CELLS.xy)));
    // TODO: find an actual solution to the edge cases!
    st = min(st, CELLS -1);
    return st;
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
    // in case of ro being inside the box, the front_dir normal still needs to point away from center.
    front_dir *= sign(front_hit); 
    
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
    res.a = (tex.r + tex.g + tex.b)/3.0;
    res.rgb = tex.rgb; // * res.a; // to make it more of a "height" map?
    //res.rgb = vec3(0.5);
    //res.a = tex.a; // use existing height data?
    res.a *= HEIGHT_SCALE;
    return res;
}

vec4 raycast(vec3 ro, vec3 rd){
    // cast the ray untill there is a hit or we exit the box
    // "any hit" shader?
    // returns tex + dist, negative dist means a "miss"
    vec4 box_hit = AABB(vec3(0.0, 0.0, HEIGHT_SCALE*0.5), vec3(1.0, 1.0, HEIGHT_SCALE*0.5), ro, rd);
    
    // miss or "inside" -.- TODO: got to figure out a better  check with normals maybe!
    vec3 entry_norm = vec3(0.0);
    entry_norm[abs(int(box_hit.z))-1] = sign(box_hit.z);
    if ((box_hit.x > box_hit.y)){// && dot(rd, entry_norm) >= 0.0){
        // if we "MISS" the whole box (not inside).
        //return vec4(entry_norm+vec3(0.5)*1.1, -1.0);
        return vec4(vec3(0.2), -abs(box_hit.y));
    }
    else if (box_hit.x < 0.0){
        ro += rd* 0.0002; // so we avoid being "inside" a pillar early?
        // we are inside because the entry is behind the ro!
        //return vec4(vec3(rd), -1.0);
        //return vec4(vec3(ro), -1.0);
        //return vec4(entry_norm+vec3(0.5), 1.0);
        //return vec4(vec3(0.2, 0.0, 0.8), -abs(box_hit.y));
    }
    
    //return vec4(vec3(0.6), 1.0);
    
    vec3 entry;
    entry = ro + rd*(box_hit.x); // should be start "inside" the box
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
        
        vec3 entry_norm = vec3(0.0);
        entry_norm[abs(int(hit.z))-1] = sign(hit.z);
        
        
        vec3 exit = ro + (rd * hit.y);
        vec3 exit_norm = vec3(0.0);
        exit_norm[abs(int(hit.w))-1] = sign(hit.w);                
        
        if (hit.x < 0.0 && hit.y < 0.0) {
            // the current cell is "behind" us, we basically miss
            
            //return vec4(vec2(current_cell).xyx/10.0, -abs(hit.x));
            //return vec4(vec3(hit.y)+0.5, -1.0);
            //return vec4(exit, -1.0);
            //return vec4(entry, -1.0);
            //return vec4(vec3(0.6), -1.0);
            //return vec4(hit);
            //return vec4(exit_norm+vec3(0.5), 1.0);            
            //continue; // jumps ahead in the loop!
        }
        else if ((hit.x <= hit.y) && (dot(rd, entry_norm) >= 0.0)){
            // "any hit" (side/top)
            //return vec4(vec2(current_cell).xyx/10.0, abs(hit.x));
            //return vec4(vec3(hit.x), abs(hit.x));
            
            // do a little bit of light sim by doing diffuse "block of chalk"
            vec3 col = tex.rgb;
            
            // half the phong diffuse
            // TODO: assume some base "emissive" quality to all pillars (or scaled with some value?)
            // needs better hit model and shader to accumulate over a few traces.
            col *= (2.0*dot(entry_norm, -SUN)) + 0.2; // "ambient"/emission term
            
            return vec4(col, abs(hit.x));
        }        
        
        if (abs(exit_norm.z) > 0.0){
            //basically this is a "top" exit, we aren't stepping further anymore. (on the shadow dir)
            // TODO: think about what this means!
            //return vec4(0.98, 0.821, 0.75, -abs(box_hit.y));
        }
        
        // the step
        ivec2 next_cell = current_cell + ivec2(exit_norm.xy);
        if (next_cell == current_cell){
            // in this case we do another raycast - but without any Z component
            // so the vector is sideways and points to a new cell!
            hit = pillar_hits(current_cell, 1.0, ro, normalize(vec3(rd.xy, 0.0)));
            exit_norm = vec3(0.0); // has to be reset
            exit_norm[abs(int(hit.w))-1] = sign(hit.w);
            
            next_cell += ivec2(exit_norm.xy);
        }
        // for next iteration
        current_cell = next_cell;
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
        return 1.0;
    }    
    else {
        return 0.5;
    }
}

float checkerboard(vec2 check_uv, float cells){
    check_uv *= cells/2.0;
    float rows = float(mod(check_uv.y, 1.0) <= 0.5);
    float cols = float(mod(check_uv.x, 1.0) <= 0.5);
    return float(rows == cols);
}


vec4 sampleGround(vec3 ro, vec3 rd){
    // for any ray that misses the heightmap
    float ground_height = 0.0;
    float ground_dist = (ground_height-ro.z)/rd.z;
    if (ground_dist < 0.0) {
        // essentially sky hit instead?
        // just some random skybox right now... could be improved of course!
        return vec4(0.98, 0.79, 0.12, ground_dist)*exp(dot(SUN, rd));
    }
    
    vec3 ground_hit = ro + (rd * ground_dist);
        
    float val = checkerboard(ground_hit.xy, 8.0)* 0.1;
    val += 0.45;
    //val *= 2.0 - length(abs(ground_hit));
    
    // fake sun angle spotlight... TODO actual angle and normal calculation!
    val *= 2.5 - min(2.3, length((-SUN-ground_hit)));//,vec3(0.0,0.0,1.0));
    
    vec3 col = vec3(val);
    return vec4(col, ground_dist);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv normalized to [-1..1] for height with more width
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 mo = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
    
    //fragColor = texture(iChannel0, uv);
    //return;
    
    // for when it's just idling...   
    float azimuth = iTime*0.15 + mo.x; // keeps a bit of residue of the mouse!
    float altitude = 0.7+cos(iTime*0.4)*0.15;      
    if (sign(iMouse.z) > 0.0){
        // orbiting camera setup
        azimuth = PI*mo.x;
        altitude = 0.5*PI*clamp(mo.y+1.0, -0.01, 0.99); // maybe just positive?
    }
    
    // make sure you don't look "below"
    altitude = clamp(altitude, HEIGHT_SCALE, PI);
    
    // a unit length orbit!
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));    
    // the camera is always looking "at" the origin or half way above it
    vec3 look_dir = normalize(vec3(0.0, 0.0, HEIGHT_SCALE*0.5) - camera_pos);
    
    //camera_pos += look_dir * -1.0; // moving the camera "back" to avoid occlusions?
    // two vectors orthogonal to this camera direction (tagents?)    
    //vec3 look_u = camera_pos + vec3(-sin(azimuth), cos(azimuth), 0.0);
    //vec3 look_v = camera_pos + vec3(sin(altitude)*-cos(azimuth), sin(altitude)*-sin(azimuth), cos(altitude));    
    
    // turns out analytically these aren't correct. so using cross instead -.-
    vec3 look_u = normalize(cross(vec3(0.0, 0.0, -1.0), look_dir));
    vec3 look_v = normalize(cross(camera_pos, look_u)); // is this faster?
    // camera plane(origin of each pixel) -> barycentric?
    
    
    
    // orthographic zoom just makes the sensor smaller
    float zoom = clamp(1.0 + cos(iTime*0.3)*0.3, 0.05, 1.5);
    vec3 camera_plane = camera_pos + (look_u*uv.x)*zoom + (look_v*uv.y)*zoom; // wider fov = larger "sensor"    
    
    if (FOV > 0.0){
        // for perspective camera we move the actual ro further back?
        // TODO the actual calculation for h fov and make the plane be at the camera_pos not infront of it!
        camera_plane = camera_pos - look_dir; // now 2 units away from the center?
        look_dir += look_u*uv.x + look_v*uv.y;
        look_dir = normalize(look_dir);
    }
    
    // actual stuff happening:
    vec4 res = raycast(camera_plane, look_dir);
    if (res.a < 0.0) {
        res = sampleGround(camera_plane, look_dir);
    }
    vec3 hit = camera_plane + (look_dir*res.a);
    vec4 ref = raycast(hit, SUN).rgba; //reflection (the full shadow)    
    ref.rgb *= 1.0 - step(0.0, ref.a); // this makes misses black?
    
    float shadow_amt = shadow(hit, SUN);
    
    vec3 col = res.rgb * shadow_amt;
    
    // TODO: better "shadow" value via actually colored shadow??
    // vec3 col2 = res.rgb + ref.rgb*0.3;    
    // col = vec3(uv.x > 0.0 ? col.rgb : col2.rgb);
    
    fragColor = vec4(vec3(col),1.0);
}
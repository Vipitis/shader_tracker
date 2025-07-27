// Apache 2.0 no patents /^§^\

// Image pass implemented as my heightmap pathtracing project: https://www.shadertoy.com/view/M3VBWt
// with a couple tweaks to make it work for this example :)

// SOME BUGS: (or todos)
// the raycast doesn't work "upwards" as expected. so camera stays outside and orbiting
// clouds are composited ontop and don't care for order or distance (so they 
// clouds have a strong moire pattern because traversal abbrpuptly begins at the top plane

# define PI 3.141592653
// tweaked with 0.4 in mind others could look wonky...
# define HEIGHT_SCALE 0.5

// this is square but still depends on the canvas resolution!
# define CELLS ivec2(min(512.0,min(iChannelResolution[0].x, iChannelResolution[0].y)))

// unsure yet where to bring this!
# define SUN normalize(vec3(sin(iDate.w*0.05), cos(iTime*0.2), HEIGHT_SCALE*1.5))
// normalize(vec3(3.0, -5.0, 2.0))

// horizontal FOV, if you use negative values the camera will be orthographic!
// examples:
// FOV -1.0 for orthographic (sensor size)
// FOV 90.0 for perspective wide
// FOV 45.0 for perspective narower
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
    
    vec3 extend = vec3(1.0/vec2(CELLS), abs(height)*0.5);
    vec3 p = vec3(cell.xy, abs(height)*0.5);    
    p.xy *= extend.xy; 
    p.xy *= 2.0;
    p.xy -= 1.0 - extend.xy; // not quite the offset?
    //extend.z = extend.y; // make them cubes?
    
    // for the case of clouds the box is at the top?
    if (height < 0.0){
        p.z = HEIGHT_SCALE*(1.0-abs(height*0.5));
    }    
    
    // TODO: redo this math when less asleep...
    vec4 res = AABB(p, extend, ro, rd);
    return res;
}


vec3 terrain_palette(float h){
    // return a specific color based on height. 
    // I manaually draw the RGB curves in a curve editor tool I have for thermal imaging
    // then crafted functions in graphtoy to minic their paths and put it here
    
    // offsets
    float h_r = h - 0.52;
    float h_g = h - 0.4;
    float h_b = h - 0.15;
    // cubic polynomials
    float r = (6.0*pow(h_r,3.0) + 0.1*pow(h_r,2.0) + 0.0*h_r +0.3);
    float g = (6.0*pow(h_g,3.0) + 0.1*pow(h_g,2.0) + -1.0*h_g +0.3);
    float b = (4.0*pow(h_b,3.0) + 0.1*pow(h_b,2.0) + -2.0*h_b +0.3);
    
    //vec3(0.267, 0.133, 0.001); // ~#442200
    vec3 col = vec3(r,g,b);
    col = clamp(col, vec3(0.0), vec3(1.0)); // ensure no negative or overbright colors!
    return col;
}

vec4 sampleHeight(ivec2 cell){
    // to allow for more complex math to determine height
    // .rgb should just return the texture color or some modification of it
    //cell.x = (cell.x + iFrame) % int(iChannelResolution[0].x); // fun texture scroll
    vec4 tex = texelFetch(iChannel0, cell, 0);
    vec4 res;
    res.a = tex.r; // our height data is in this channel
    res.rgb = terrain_palette(res.a*1.5-0.2); // move it a round a bit so the pallete looks okay...
    
    // could also just be a constant here!
    if (tex.b > 0.0){
        // cheap solid water in amount of water per pillar...
        // TODO semi transparen/reflective water?
        // the simulation is in the Buffer pass, we just reconstruct the height for rendering here
        res.a += tex.b;
        res.rgb = mix(vec3(0.2, 0.5, 0.8), vec3(0.1, 0.1, 0.9), tex.b*20.0); // little color for water "depth"
    }
    res.a *= HEIGHT_SCALE;
    return res;
}
// this could be joined into the function above.
float sampleClouds(ivec2 cell){
    // idea is to read the texture data in a specific channel for cloud height/density?
    // this needs to be implemented in my function down below as an alternative hit.
    vec4 tex = texelFetch(iChannel0, cell, 0);        
    float res = tex.g; // this channel has "cloud" terrain
    // maybe we clamp it or something to have no clouds?
    res -= 0.55; // negative values become clouds that show up.
    return res;    
}

vec4 raycast(vec3 ro, vec3 rd, inout float cloud_acc){
    // cast the ray untill there is a hit or we exit the box
    // "any hit" shader?
    // returns tex + dist, negative dist means a "miss"
    // the inout for clouds sums up it's distance and depth of clouds.
    vec4 box_hit = AABB(vec3(0.0, 0.0, HEIGHT_SCALE*0.5), vec3(1.0, 1.0, HEIGHT_SCALE*0.5), ro, rd);
    cloud_acc = 0.0;
    
    //return ro.rgbb;
    
    // miss or "inside" -.- TODO: got to figure out a better  check with normals maybe!
    vec3 entry_norm = vec3(0.0);
    entry_norm[abs(int(box_hit.z))-1] = sign(box_hit.z);
    vec3 entry;
    entry = ro + rd*(box_hit.x); // should be start "inside" the box
    
    
    //return vec4(entry_norm+vec3(0.5), 1.0);
    if ((box_hit.x > box_hit.y)){// && dot(rd, entry_norm) >= 0.0){ //  && box_hit.y > 0.0 //? none of these is exactly correct
        // if we "MISS" the whole box (not inside).
        //return vec4(entry_norm+vec3(0.5)*1.1, -1.0);
        return vec4(vec3(0.2, 0.8, 0.0), -abs(box_hit.y));
    }   
    else if (box_hit.y > 0.0){
        //ro += rd* 0.0002; // so we avoid being "inside" a pillar early?
        // we are inside because the entry is behind the ro!
        //return vec4(vec3(rd), -1.0);
        //return vec4(vec3(ro), -1.0);
        //return vec4(entry, -1.0);
        //return vec4(entry_norm+vec3(0.5), 1.0);
        //return vec4(vec3(0.2, 0.0, 0.8), -abs(box_hit.y));
        //entry = ro; // if we are "inside" the entry should just be ro!
    }
    
    //return vec4(vec3(0.6), 1.0);
    
    //return entry.rgbb;
    
    ivec2 current_cell = worldToCell(entry); // TODO: this one is problematic!
    int i;
    ivec2 max_cells = CELLS - min(current_cell, CELLS-current_cell);
    int max_depth = (max_cells.x + max_cells.y)+2; // could also be min!
    for (i = 0; i < max_depth; i++){        
        if (current_cell.x < 0 || current_cell.x >= CELLS.x ||
            current_cell.y < 0 || current_cell.y >= CELLS.y){
            // we marched far enough are are "outside the box" now!
            return vec4(vec3(0.4), -abs(box_hit.y));
        }        
        // so let's look for clouds first!
        float cloud_depth = sampleClouds(current_cell);        
        if (cloud_depth < 0.){ // cand adjust how "many" clouds here!
            // only if there is a cloud we even consider this
            vec4 cloud_hit = pillar_hits(current_cell, (cloud_depth*0.2), ro, rd);
            if ((cloud_hit.x <= cloud_hit.y)){
                
                // we scale the cloud by how much of it we traversed plus the inverse dpeth (~= color)?
                cloud_acc += (1.0 - cloud_depth)*(cloud_hit.y - cloud_hit.x);
                
                //return vec4(vec3((1.0 - cloud_depth)), 0.0*abs(cloud_hit.x));
            }
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
        
        if (hit.y >= box_hit.y){
            return vec4(vec3(0.8), -abs(exit.y));
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
    cloud_acc = 0.0; // janky hack - I still need to figure out why this even reaches!
    return vec4(vec3(1,0,0), -abs(box_hit.y));

}

// more like a bad shadowmap
float shadow(vec3 ro, vec3 rd){
    // return the amount of shadowed?
    // we are now marching upwards from some hit
    // ro is essentially the point we started from
    // rd is the sun angle
    float cloud_term;
    vec4 res = raycast(ro, normalize(rd), cloud_term);
    //return res.a;
    if (res.a < 0.0){// || (ro + rd*res.a).z >= HEIGHT_SCALE){
        // likely means outside the box/ground!
        // so think like "skylight"        
        cloud_term = clamp(1.0-exp(-cloud_term*15.0), 0.0, 1.0);
        // full sunlight        
        return 1.0 -cloud_term;
    }    
    else {
        return 0.0;
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
    // TODO: rename to sample skybox maybe? as the ground is sorta part of that...
    float ground_height = 0.0;
    float ground_dist = (ground_height-ro.z)/rd.z;
    if (ground_dist < 0.0) {
        // essentially sky hit instead?
        // just some random skybox right now... could be improved of course!
        vec3 col = vec3(0.98, 0.79, 0.12)*exp(dot(SUN, rd));        
        col = clamp(col, vec3(0.0), vec3(1.0));
        return vec4(col, 30.0); // some random distance that is positive!
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
    float azimuth = iTime*0.1 + mo.x; // keeps a bit of residue of the mouse!
    float altitude = 0.7+cos(iTime*0.25)*0.35;      
    if (sign(iMouse.z) > 0.0){
        // orbiting camera setup
        azimuth = PI*mo.x;
        altitude = 0.5*PI*clamp(mo.y+1.0, -0.01, 0.99); // maybe just positive?
    }
    
    // make sure you don't look "below"
    altitude = clamp(altitude, HEIGHT_SCALE*0.5, PI);
    
    // a unit length orbit!
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));               
    // the camera is always looking "at" the origin or half way above it
    vec3 look_dir = normalize(vec3(0.0, 0.0, HEIGHT_SCALE*0.5) - camera_pos);
    
    
    // TODO moving the camera in and out over time??
    camera_pos += look_dir * -0.1; // moving the camera "back" to avoid occlusions?
    // two vectors orthogonal to this camera direction (tagents?)    
    //vec3 look_u = camera_pos + vec3(-sin(azimuth), cos(azimuth), 0.0);
    //vec3 look_v = camera_pos + vec3(sin(altitude)*-cos(azimuth), sin(altitude)*-sin(azimuth), cos(altitude));    

    
    // turns out analytically these aren't correct. so using cross instead -.-
    vec3 look_u = normalize(cross(vec3(0.0, 0.0, -1.0), look_dir));
    vec3 look_v = normalize(cross(camera_pos, look_u)); // is this faster?
    // camera plane(origin of each pixel) -> barycentric?
    
    vec3 camera_plane;
    vec3 ray_dir;
    vec3 ray_origin;
                        
    if (FOV > 0.0){
        // assume a pinhole camera.
        // FOV is the horizontal fov, the given focal length becomes:
        // the 1.0 is the sensor height.
        float focal_length = 1.0/tan(radians(FOV*0.5));
        
        // the ro
        camera_plane = camera_pos - (look_dir*focal_length) + ((look_u*uv.x) + (look_v*uv.y))*-1.0; // inverted here to see upright
        ray_origin = camera_pos;
        
        // the rd
        ray_dir = camera_pos-camera_plane;
        ray_dir = normalize(ray_dir);        
    }
    
    else {
        // negative FOV values are interpreted as a sensor size for a orthographic camera!
        // horizontal sensor size, -1 would be something sensible... everything else is far away
        float sensor_size = FOV*0.5*-1.0;
        camera_plane = camera_pos + ((look_u*uv.x)+(look_v*uv.y))*sensor_size; // wider fov = larger "sensor"
        ray_dir = look_dir;
        ray_origin = camera_plane;
    }
    
    // actual stuff happening:
    float cloud_sum = 0.0;
    vec4 res = raycast(ray_origin, ray_dir, cloud_sum);
    // fragColor = vec4(vec3(res.rgb),1.0);
    //return; // early debug exit
    if (res.a < 0.0) {
        // we missed the initial terrain
        res = sampleGround(ray_origin, ray_dir);
        
        // TODO: the skybox hit returns a negative distance, so we need to handle that
        //res.a = abs(res.a);
    }
    vec3 hit = ray_origin + (ray_dir*res.a);
            
    
    float shadow_cloud; // unused?
    vec4 ref = raycast(hit, SUN, shadow_cloud).rgba; //reflection (the full shadow)    
    ref.rgb *= 1.0 - step(0.0, ref.a); // this makes misses black?
    // ref.rgb *= 1.0-exp(-shadow_cloud*15.0); // more "realistic" cloud shadow?
    
    float shadow_amt = shadow(hit, SUN);
    // actually more light amount -.-
    // so we add and "ambient" base like here
    vec3 col = res.rgb * max(0.3, shadow_amt);
    
    // bad approximation of "beers law"?
    float cloud_term = clamp(1.0-exp(-cloud_sum*15.0), 0.0, 1.0);
    // additive/premultiplied merge here... could be wrong because not linear?
    // transmittance isn't color - but that's the closest I have right here.
    vec3 cloud_col = vec3(0.9*cloud_term); // so people are more happy about the premultiplication???
    col = mix(col, cloud_col, cloud_term);
    
    // TODO: better "shadow" value via actually colored shadow??
    // vec3 col2 = res.rgb + ref.rgb*0.3;    
    // col = vec3(uv.x > 0.0 ? col.rgb : col2.rgb);
    
    fragColor = vec4(vec3(col),1.0);
}
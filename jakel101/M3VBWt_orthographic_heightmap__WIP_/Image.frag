// APache 2.0 no patents \_%_/
# define PI 3.141592653
# define HEIGHT_SCALE 0.4

ivec2 worldToCell(vec3 p, ivec2 cells) {
    // from the sampleTexture function above
    
    p += 1.0;
    p *= 0.5;
    ivec2 st = ivec2((p.xy*vec2(cells.xy)));
    // TODO: find an actual solution to the edge cases!
    st = min(st, cells -1);
    return st;
}

vec2 cellToWorld(ivec2 current_cell, ivec2 cells, vec2 dirs){
    // gives the rear plane of a cell, based on dirs?
    // TODO: can we avoid this magic epsilon number?
    // 
    vec2 p = vec2(current_cell);    
    p -= min(vec2(0.0),dirs); // the "step"?
    
    // scale and shift    
    p /= vec2(cells);    
    p *= 2.0;
    p -= 1.0;
    //p = min(p, vec2(1.0));
    return p;
    
}

vec4 sampleHeight(ivec2 cell){
    // to allow for more complex math to determine height
    // .rgb should just return the texture color or some modification of it
    
    vec4 tex = texelFetch(iChannel0, cell, 0);
    vec4 res;
    res.a = (tex.a + tex.r + tex.g)/3.0;
    res.rgb = tex.rgb; // * res.a // to make it more of a "height" map?
    //res.rgb = vec3(0.5);
    res.a *= HEIGHT_SCALE; //TODO: global height scale?
    return res;
}

vec3 sampleGround(vec3 ro, vec3 rd){
    // for any ray that misses the heightmap
    float ground_height = 0.0;
    float ground_dist = (ground_height-ro.z)/rd.z;
    vec3 ground_hit = ro + rd * ground_dist;
    
    vec3 col = vec3(fract(ground_hit.xy), ground_dist);
    
    // temporary test
    vec3 sun_angle = normalize(vec3(0.8, 0.7, 0.5));
    // simple cast to a plane at x=1 (for now)
    vec3 sun_dist = (vec3(sign(sun_angle.xy)*-1.0, 1.0)-ground_hit)/sun_angle;
    float closest = max(sun_dist.x, sun_dist.y);
    vec3 edge_intersect = ground_hit + sun_angle * closest;
    float shadow = .8;
    float edge_height = sampleHeight(worldToCell(edge_intersect, ivec2(iChannelResolution[0].xy))).a;
    if (edge_intersect.z < edge_height && abs(max(edge_intersect.x, edge_intersect.y)) < 1.0) {
        shadow = 0.2;
    }
    // if this is negative we missed the whole block
    if (closest < 0.0) shadow = 0.8;
    
    col.rgb *= shadow;
    return col;
}

float shadow(vec3 ro, vec3 rd, ivec2 cells){
    // return the amount of shadowed?
    // we are now marching upwards from some hit
    // ro is essentially the point we started from
    // rd is the sun angle        
    
    vec2 dirs = sign(rd.xy) * -1.0;
    if (dirs.x == 0.0 || dirs.y == 0.0) (dirs = vec2(1)); // avoid 0.0
    
    vec3 hit = ro;
    int i;
    for(i=0; i <(cells.x+cells.y)*2; i++){
        if (min(hit.x, hit.y) < -1.0) return float(0.0);
        if (max(hit.x, hit.y) > 1.0) return float(0.0);
        ivec2 current_cell = worldToCell(hit, cells);          
        
        
        vec3 rear_walls = vec3(cellToWorld(current_cell, cells, dirs), 1.0); 
        
        vec4 tex = sampleHeight(current_cell);
        
        vec3 far_dist = (rear_walls-hit)/rd;
        
        
        //TODO: the side hit on the first seems to be wrong height...
        // side hit -> full shadow
        if (tex.a > hit.z && i>=1) return float(0.2);
        //if (i >= 5) return tex.aaa;
        
        // top hit -> looking at sun
        if (far_dist.z < max(far_dist.x, far_dist.y)) return float(0.0);
        // now side hit or miss
        
        //advance the ray to closest edge
        vec3 next_hit = hit + rd*min(far_dist.x, far_dist.y);
        if (hit == next_hit) {
            next_hit = hit + rd*0.001;
        }                
        hit = next_hit;
    }    
    // don't know yet...
    return float(0.9);

}


vec3 march (vec3 ro, vec3 rd, ivec2 cells){
    // the idea is to march the ray to the next cell boundry.
    // sample the texture and check height
    // if the intersection ray is above the height, we missed this block
    // if the intersection is below 0, we are outside the texture (return black)
    // if the intersection is below the height, we hit the side (return some color?)
    // issues: which side are we facing? (get this from rd?)    
    vec3 sun_angle = normalize(vec3(0.8, 0.7, 0.5));
    vec3 entry_point;
    float t; //distance of current ray
    // essentially which of the direcitons we are looking along x and y axis
    vec2 dirs = sign(rd.xy) * -1.0;
    if (dirs.x == 0.0 || dirs.y == 0.0) (dirs = vec2(1)); // avoid 0.0
    vec3 d = ((1.0 * vec3(dirs, 1.0)) - ro) /rd; // distance to top, and near planes x/y
    // if the distance to top is longest, we hit the other two front planes above the upper edge
    if (d.z > d.x && d.z > d.y) {
        t = d.z;
        entry_point = ro + d.z*rd;        
        // make sure this is grid alinged! (stair step function?
        //entry_point.xy = floor(vec2(0.5) + entry_point.xy*vec2(cells.xy)*0.5)/(vec2(cells.xy)*0.5);
        
        // far miss? (we already know it's not hitting the front
        if (abs(entry_point.x) > 1.0 || abs(entry_point.y) > 1.0) return sampleGround(ro, rd); vec3(0.1);
        //return vec3(0.2, 0.2, 1.0); // DEBUG: we enter the top   
        //return (entry_point);        
    }
    // if we hit the x plane before the y plane - we entry at the y plane
    else if (d.x < d.y) {
        t = d.y;
        entry_point = ro + d.y*rd;
        if (abs(entry_point.x) > 1.0) return sampleGround(ro, rd); //vec3(0.2, 0.1, 0.1); // far miss on the side
        //return vec3(0.2, 1.0, 0.2); // DEBUG: we enter the Y side
    }
    else {// we hit the y plane first and are entrying through the x plane
        t = d.x;
        entry_point = ro + d.x*rd;
        if (abs(entry_point.y) > 1.0) return sampleGround(ro, rd); //vec3(0.1, 0.2, 0.1); // far miss on the side
        //return vec3(1.0, 0.2, 0.2); //DEBUG we enter the X side
    }    
    // TODO: the above is like a AABB, it can easily be simplified I suspect.
    
    
    // near ground hit
    //return entry_point;
    if (entry_point.z < 0.0) return sampleGround(ro, rd); //vec3(0.5);
    
    //return entry_point;
    vec3 front_hit = entry_point; // initialize as 1 to not hit the top on the first plane
    
    float l = 0.00; // light for the side angle
    // new loop develops here  - what is the reasonable max?
    for (int i = 0; i<(cells.x+cells.y)*2; i++){
        ivec2 current_cell = worldToCell(front_hit, cells.xy);
        
        // rear miss -> end reached?
        if (min(front_hit.x, front_hit.y) < -1.0) return sampleGround(ro, rd); //vec3(0.05*float(i)); // miss neg
        if (max(front_hit.x, front_hit.y) > 1.0) return sampleGround(ro, rd); //vec3(0.1*float(i));// miss pos
        
        vec4 tex = sampleHeight(current_cell);        
        // hit side?
        if (front_hit.z < tex.a) {
            vec3 sun_angle = normalize(vec3(0.8, 0.7, 0.5));
            float shadow = shadow(front_hit, sun_angle, cells);
            return vec3(tex.rgb) - shadow; 
        }
        
        // return tex.rgb; // debug
        
        // hit top, hit right, hit left, miss?
        // distances to the rear planes .z can be ignored ?=?        
        // where we actually march to the "next" far - wall.
        
        vec2 far_walls = cellToWorld(current_cell, cells, dirs);
        
        
        // exit if we are the far wall, likely means we hit the end!
        //if (far_walls.x == front_hit.x || far_walls.y == front_hit.y) return sampleGround(ro, rd);
        
        
        // distance to next far walls
        vec3 rear_d = (vec3(far_walls.xy, tex.a) - ro)/rd;
        //return abs(vec3((rear_d.xyz))*0.5);
        
        // the min distance is the nearest wall, we step until there!
        vec3 rear_hit = ro + rd*min(rear_d.x, rear_d.y); //t;        
        // return rear_hit;
        
        // hit top?
        if (tex.a > rear_hit.z) {            
            vec3 hit_top = ro + rd*rear_d.z;
            float shadow = shadow(hit_top, sun_angle, cells);
            return vec3(tex.rgb) - shadow;            
        }
        
        if (front_hit == rear_hit) {
        // if we didn't actually advance, we should nudge here and hope for the best!
            
            // TODO: analytical value for this using acos(rd.z)??
            rear_hit += rd*0.0001;
        }
        front_hit = rear_hit; // keep track for the next iteration
        //return vec3(0.01);
    }
    //return sampleGround(ro, rd); // but we shouldn't get here!
    return vec3(0.8); // percision issues where we ended the loop -.-
    
    
}


//TODO: sun angle and showdow casting (from the hit towards the sun...)?

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
    
    //camera_pos += look_dir * -5.0; // moving the camera "back" to avoid occlusions?
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
        
    vec3 col = march(camera_plane, look_dir, ivec2(iChannelResolution[0].xy)); // use iChannelResolution[0]?
    
    
    
    fragColor = vec4(vec3(col),1.0);
}
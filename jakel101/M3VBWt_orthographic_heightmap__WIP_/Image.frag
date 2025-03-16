// APache 2.0 no patents \_%_/
# define PI 3.141592653

vec4 RayPlaneIntersection(vec3 ro, vec3 rd, vec3 norm, float b){
    // rayOrigin, rayDirection, normal of the plane and bias distance along that normal.
    // t < 0 means a miss? (kinda impossible in the orthographic setup)
    // t returns the total distance to that plane
    // can hit from either side!!!
    rd = normalize(rd); //redundant!
    float t = -1.0;
    t = dot((norm*b)-ro,norm)/dot(rd,norm);
    vec3 p = ro+rd*t;
    return vec4(p,t);
}

vec2 cubeHit(vec3 ro, vec3 rd, float width, float height){
    //TODO: return side (1=top, 2=left, 3=right) and distance to a cuube
    // side=0 means miss?
    
    // idea: 3 planes and they intersect at the top near corner.
    //we take the furtherst distance as our
    // normals for these
    vec3 top = vec3(0,0,1);
    vec3 sx = vec3(1,0,0);
    vec3 sy = vec3(0,1,0);    
    //force rd+ro to be the nearest? (maybe using sign(rd))
    vec4 top_h = RayPlaneIntersection(ro, rd, top, height);
    vec4 sx_h = RayPlaneIntersection(ro, rd, sx, width);
    vec4 sy_h = RayPlaneIntersection(ro, rd, sy, width);
    // we shouldn't get any misses... maybe edge on or something?
    
    
    // actually we need to test all 6 planes (or use abs?)
    // and by the order of intersections we know which face hit or if it's a miss...
    // will build a paper model to write down the matrix.
    
    float t = -1.0;
    vec4 hit;
    int side = 0;
    //shitty argmax
    if (top_h.w > t) {hit = top_h; side=1;} //redundant?
    else if (sx_h.w > hit.w) {hit = sx_h; side=2;}
    else if (sy_h.w > hit.w) {hit = sy_h; side=3;}
    // now t is the furthest hit distance
    t = hit.w;
    // but it still could be a miss...?
    if (hit.z == 1.0 || abs(hit.x-0.001) > width || abs(hit.y) > width) {side=0; t= -1.0;};    
    
    return vec2(side, t);
}


vec4 sampleTexture(vec3 p, ivec3 cells) {
    // transforms the world space 3D to a texture location 2D and runs a texel fetch for that voxel
    // maps this into the cube of -1..1, -1..1, 0..1?
    //returns 0 otherwise
    
    // move p back into 0..1
    p += 1.0;
    p *= 0.5;
    
    // sampling coordinates by element multiplication. BE CAREFUL WIHT float() constructors -.-
    ivec2 st = ivec2(floor(p.xy*vec2(cells.xy)));
    // exit ouside the area
    if (st.x < 0 || st.y < 0 || st.x >= cells.x || st.y >= cells.y) return vec4(0);
    vec4 res = texelFetch(iChannel0, st, 0);
    //return vec4(st, 0.0,0.0);
    
    return res;
}

ivec2 worldToCell(vec3 p, ivec2 cells) {
    // from the sampleTexture function above
    
    p += 1.0;
    p *= 0.5;    
    ivec2 st = ivec2(floor(p.xy*vec2(cells.xy)));
    return st;
}

vec3 march (vec3 ro, vec3 rd, ivec2 cells){
    // the idea is to march the ray to the next cell boundry.
    // sample the texture and check height
    // if the intersection ray is above the height, we missed this block
    // if the intersection is below 0, we are outside the texture (return black)
    // if the intersection is below the height, we hit the side (return some color?)
    // issues: which side are we facing? (get this from rd?)    
    
    vec3 entry_point;
    float t; //distance of current ray
    // essentially which of the direcitons we are looking along x and y axis
    vec2 dirs = sign(rd.xy) * -1.0;
    vec3 d = ((1.0 * vec3(dirs, 1.0)) - ro) /rd; // distance to top, and near planes x/y
    // if the distance to top is longest, we hit the other two front planes above the upper edge
    if (d.z > d.x && d.z > d.y) {
        t = d.z;
        entry_point = ro + d.z*rd;        
        // far miss? (we already know it's not hitting the front
        if (abs(entry_point.x) > 1.0 || abs(entry_point.y) > 1.0) return vec3(0.1);        
        //return vec3(0.2, 0.2, 1.0); // DEBUG: we enter the top
    }
    // if we hit the x plane before the y plane - we entry at the y plane
    else if (d.x < d.y) {
        t = d.y;
        entry_point = ro + d.y*rd;
        if (abs(entry_point.x) > 1.0) return vec3(0.2, 0.1, 0.1); // far miss on the side
        //return vec3(0.2, 1.0, 0.2); // DEBUG: we enter the Y side
    }
    else {// we hit the y plane first and are entrying through the x plane
        t = d.x;
        entry_point = ro + d.x*rd;
        if (abs(entry_point.y) > 1.0) return vec3(0.1, 0.2, 0.1); // far miss on the side
        //return vec3(1.0, 0.2, 0.2); //DEBUG we enter the X side
    }    
    // TODO: the above is like a AABB, it can easily be simplified I suspect.
    
    
    // near ground hit
    //return entry_point;
    if (entry_point.z < 0.0) return vec3(0.5);
        
    vec3 front_hit = entry_point; // initialize as 1 to not hit the top on the first plane
    
    float cell_size = 2.0/(float(cells.x)); // kinda constant?
    
    ivec2 current_cell = worldToCell(front_hit, cells.xy);
    vec4 tex = texelFetch(iChannel0, current_cell, 0);
    // return tex.rgb; // debug
    // hit top, hit right, hit left, miss?
    // distances to the rear planes .z can be ignored ?=?
    vec3 rear_wall = vec3(front_hit.xy + cell_size*dirs, tex.z);
    vec3 rear_d = (rear_wall - ro) /rd;
    if (rear_d.x < rear_d.y) {// rear on the x plane got hit first
        return vec3(tex);
    }
    return (rear_d);
    
    int x_plane; // we will for loop here
    float plane_depth = 2.0/(float(cells.x)); // cells is the number of points in the -1 .. 1 domain?
    for (x_plane = 0; x_plane <= cells.x; x_plane ++){
        float plane_x = float(x_plane)*cell_size -1.0 ;
        // test1: intersection with the x=1 plane
        // ro + t*rd = h | - ro
        // t*rd = h - ro | /rd
        // t = (h - ro)/rd (all in vec3!)
        float t = (plane_x - ro.x)/rd.x; // distance where the ray intersects plane
        if (t < -1.0) return vec3(0); // hit is behind the camera -> black

        // essentially the rear hit now.
        vec3 h = ro + t * rd; // world space position of the hit/intersection
        if (h.z < -0.0) return vec3(cos(h.z*10.0)*0.3); // below the plane -> near black
        //if ((abs(h.x) > 1.1)) return vec3(0.3); // ouside the area

        // sample height at current position
        vec4 tex = sampleTexture(h, ivec3(cells, 0));
        
        if (front_hit.z < tex.z) return vec3(tex.r, 0.0, 0.0); // we have hit the side      
        // the ray is "above" the front hit        
        if (tex.z > h.z) return vec3(0.0, 0.0, tex.b); // we have hit the top        
        // the ray is above this column
        
        // TODO: hit the other side?

        // keep track of this hit as the front for the next iteration
        front_hit = h;
    }
    
    // todo: y plane?
    // it could be a while loop where we check which planes we intersect
    // and then decide where to go next based on the rear hit?
    // (top down view)
    // I guess there only ever are two intersections: front and rear
    //  ---
    // |   /
    // |  /|   ->   x_plane +1 (or -1) because we hit the side
    // | / |
    //  /--
    
    
    
    return vec3(0.8);
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv normalized to [-1..1] for height with more width
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 mo = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
    // orbiting camera setup
    float azimuth = PI*mo.x;
    float altitude = 0.5*PI*clamp(mo.y, -0.01, 1.0); // maybe just positive?
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));    
    // the camera is always looking "at" the origin
    vec3 look_dir = vec3(0.0, 0.0, -0.0) - camera_pos;
    //camera_pos += look_dir * -1.0; // moving the camera "back" to avoid occlusions?
    // two vectors orthogonal to this camera direction (tagents?)
    vec3 look_u = camera_pos + vec3(-sin(azimuth), cos(azimuth), 0.0);
    vec3 look_v = normalize(cross(camera_pos, look_u)); // is this faster?
    //vec3 look_v = camera_pos + vec3(sin(altitude)*-cos(azimuth), sin(altitude)*-sin(azimuth), cos(altitude));    
    // camera plane(origin of each pixel) -> barycentric?
    vec3 camera_plane = camera_pos + (look_u*uv.x)*1.0 + (look_v*uv.y)*1.5; // wider fov = larger "sensor"

    vec4 ground_plane = RayPlaneIntersection(camera_plane, look_dir, vec3(0,0,1),0.0);    
    
    vec3 col = vec3(step(0.0,uv),0.01);
        
    vec2 bbox = cubeHit(camera_plane, look_dir, 0.4, 0.1);        
    col = sampleTexture(ground_plane.rgb, ivec3(64,32,0)).rgb;    
    
    //col.r = (bbox.x/4.0);
    //col.b = (bbox.y);
    
    
    col = march(camera_plane, look_dir, ivec2(8,8)); // use iChannelResolution[0]?
    
    fragColor = vec4(vec3(col),1.0);
}
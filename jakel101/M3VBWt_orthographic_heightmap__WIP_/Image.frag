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
    vec4 res = texelFetch(iChannel0, st,0);
    //return vec4(st, 0.0,0.0);
    
    return res;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv normalized to [-1..1] for height with more width
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 mo = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
    // orbiting camera setup
    float azimuth = PI*mo.x;
    float altitude = 0.5*PI*clamp(-0.0, 1.0,mo.y); // maybe just positive?
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));    
    // the camera is always looking "at" the origin
    vec3 look_dir = vec3(0.0, 0.0, -0.0) -camera_pos;
    //camera_pos += look_dir * -2.0; // moving the camera "back" to avoid occlusions?
    // two vectors orthogonal to this camera direction (tagents?)
    vec3 look_u = camera_pos + vec3(-sin(azimuth), cos(azimuth), 0.0);
    vec3 look_v = normalize(cross(camera_pos, look_u)); // is this faster?
    //vec3 look_v = camera_pos + vec3(sin(altitude)*-cos(azimuth), sin(altitude)*-sin(azimuth), cos(altitude));    
    // camera plane(origin of each pixel) -> barycentric?
    vec3 camera_plane = camera_pos + (look_u*uv.x) + (look_v*uv.y);

    vec4 ground_plane = RayPlaneIntersection(camera_plane, look_dir, vec3(0,0,1),0.0);    
    
    vec3 col = vec3(step(0.0,uv),0.01);
        
    vec2 bbox = cubeHit(camera_plane, look_dir, 0.4, 0.1);        
    col = sampleTexture(ground_plane.rgb, ivec3(64,32,0)).rgb;    
    
    //col.r = (bbox.x/4.0);
    //col.b = (bbox.y);
    
    fragColor = vec4(vec3(col),1.0);
}
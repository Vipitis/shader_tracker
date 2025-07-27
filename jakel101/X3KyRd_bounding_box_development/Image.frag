// Apache 2.0 no patent (O)-(O)
// working out: https://www.desmos.com/3d/dfrawfz5oy
// improved: https://www.desmos.com/3d/loyr0cvm2c
// done:? https://www.desmos.com/3d/bewjnaugsh
# define PI 3.141592654


// TODO: struct sphere with .pos and .size maybe?
vec4 RaySphereIntersection(vec3 ro, vec3 rd, vec3 sphere_center, float radius){
    // find the depth of intersection?
    
    float h = dot(rd, ro); // get this distance to the center (projection depth?)
    h = 1.0; // why is the above incorrect?
    // point we trace towards center... plane paralle to the camera but at the position of the sphere
    vec3 p = ro + (normalize(rd)*h);
    float dist = length(p-sphere_center); // in the parallel plane
    
    // now get actual hit?
    // need to find the exact h... which in this case is
    vec3 o1 = cross(rd,p);
    vec3 o2 = cross(rd, o1);
    //TODO: this needs a min/clamp for undefined behavior. 
    float height = max(0.0,sqrt((radius - pow(length(o1),2.0) - pow(length(o2),2.0))));
    
    // TODO: this needs to actual depth with h?
    float h2 = (h - height);
    vec3 p2 = ro + (normalize(rd) * h2);

    vec3 norm = normalize(p2 - sphere_center);
    
    // this is a miss essentially?
    if (height <= 0.0) {
        return vec4(-1.0);
    }
    //norm = vec3(height);      
    
    return vec4(vec3(norm), height); // negative values means no hit!
}

// in progress:
vec4 RayCubeIntersection(vec3 ro, vec3 rd, vec3 size){
    // returns normals and depth    
    // let's just assumme there cube is next at the center and perfectly oriented
    // AABB = axis aligned bounding box!    
    
    // distances to all six faces
    vec3 h_pos = (size-ro)/rd;
    vec3 h_neg = (-size-ro)/rd;
    
    // near and far sides
    vec3 h_near = min(h_pos, h_neg);
    vec3 h_far = max(h_pos, h_neg);
    
    // near and far intersection points
    float t_near = max(h_near.x,max(h_near.y,h_near.z));
    float t_far = min(h_far.x,min(h_far.y,h_far.z));
    
    // the position we actually hit.
    vec3 p = ro + normalize(rd)*t_near;
    
    if (t_near > t_far ) return vec4(-1.); // miss
    
    // TODO: actual normals?
    vec3 norm;
    if (p.z >= size.z-0.0001) norm = vec3(0,0,1);
    if (abs(p.y) >= size.y-0.0001) norm = vec3(0,1,0);
    if (abs(p.x) >= size.x-0.0001) norm = vec3(1,0,0);
    return vec4(norm, t_near);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
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
    // TODO: redo this whole section as a matrix.
    
    
    vec3 col = vec3(0.05);    
    
    vec3 p = camera_plane; //ray origin
    vec4 res; //.rgb = normal, .w = distance//intersection
    
    res = RaySphereIntersection(p, look_dir, vec3(0.0, -0.0, 0.0), 0.5);
    if (res.w < 1.0) res = RayCubeIntersection(p, look_dir, vec3(0.5));
    
    fragColor = res;    
    return;
    
    //col = camera_plane;
    
    //col.xy = uv;
    //col.rgb = pow(col.rgb, vec3(1.0/2.2)); // gamma correction?
    fragColor = vec4(col*0.5,1.0);
}
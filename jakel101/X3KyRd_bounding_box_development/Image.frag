// Apache 2.0 no patent (O)-(O)
// working out: https://www.desmos.com/3d/dfrawfz5oy
// improved: https://www.desmos.com/3d/loyr0cvm2c
// done:? https://www.desmos.com/3d/bewjnaugsh
# define PI 3.141592654
# define FOV 90.0

struct Ray{
    vec3 origin;
    vec3 dir;
    vec3 inv_dir; // for speedup?
};

struct BoxHit{
    bool hit;
    bool inside;
    vec3 entry;
    vec3 exit;
    vec3 entry_norm;
    vec3 exit_norm;
    float entry_dist;
    float exit_dist;
};

// sorta reference: https://tavianator.com/2022/ray_box_boundary.html
BoxHit AABB(vec3 center, vec3 size, Ray ray){
    BoxHit res;
        
    vec3 pos = center + size;
    vec3 neg = center - size;
    
    vec3 pos_dist = (pos-ray.origin) * ray.inv_dir;
    vec3 neg_dist = (neg-ray.origin) * ray.inv_dir;
    
    vec3 min_dist = min(pos_dist, neg_dist);
    vec3 max_dist = max(pos_dist, neg_dist);
    
    res.entry_dist = max(max(min_dist.x, min_dist.y), min_dist.z);
    res.exit_dist = min(min(max_dist.x, max_dist.y), max_dist.z);
    
    // essentially methods?
    res.hit = res.entry_dist < res.exit_dist && res.exit_dist > 0.0;
    res.inside = res.entry_dist < 0.0; // entry behind us
    
    res.entry = ray.origin + ray.dir*res.entry_dist;
    res.exit = ray.origin + ray.dir*res.exit_dist;
    
    // normals point away from the center
    res.entry_norm = -sign(ray.dir) * vec3(greaterThanEqual(min_dist, vec3(res.entry_dist)));
    res.exit_norm = sign(ray.dir) * vec3(lessThanEqual(max_dist, vec3(res.exit_dist)));
    
    return res;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv normalized to [-1..1] for height with more width
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 mo = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
    
    //fragColor = texture(iChannel0, uv);
    //return;
    
    // for when it's just idling...   
    float azimuth = iTime*0.3 + mo.x; // keeps a bit of residue of the mouse!
    float altitude = cos(iTime*0.5)*0.35;      
    if (sign(iMouse.z) > 0.0){
        // orbiting camera setup
        azimuth = PI*mo.x;
        altitude = 0.5*PI*clamp(mo.y, -0.85, 0.99); // maybe just positive?
    }
    
    // make sure you don't look "below"
    altitude = clamp(altitude, -PI, PI);
    
    // a unit length orbit!
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));               
    // the camera is always looking "at" the origin or half way above it
    vec3 look_dir = normalize(vec3(0.0, 0.0, 0.0) - camera_pos);
    
    
    // TODO moving the camera in and out over time??
    camera_pos += look_dir * -0.0; // moving the camera "back" to avoid occlusions?
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
    
    
    Ray camera = Ray(ray_origin, ray_dir, 1.0/ray_dir);
    BoxHit res = AABB(vec3(0.0, sin(iTime*0.2), 0.0), vec3(0.5), camera);
    
    vec3 col = vec3(0.05);
    
    if (res.hit) {
        col = res.entry_norm + vec3(0.5);
        if (res.inside) {
            //col = vec3(0.5);
            col = res.exit_norm + vec3(0.5);
        }
    }
    else {
        //col = res.exit_norm + vec3(0.5);
    }
    
    fragColor = vec4(col, 1.0);
    
}
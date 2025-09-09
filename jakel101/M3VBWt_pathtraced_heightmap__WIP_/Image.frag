// Apache 2.0 no patents \_%_/

/* Image pass shader to draw a texture/buffer/input as a heightmap
* with some pathtracing as pillars of pixels.
* Meant to be used in multiple projects and therefore
* easily configurable at the top with a few macros
*
* selflink: https://www.shadertoy.com/view/M3VBWt
* other projects using this shader/framework: https://www.shadertoy.com/playlist/mX2cD3
* 
* work in progress:
* todo(ideas):
* - monte carlo light simulation
* - pysics simulation
* - ball/area lights
* - infinite/LOD tiles?
* - DDA like traversal
* - cleanup as usual
* feedback/improvements welcome here.
*/


# define PI 3.141592653
# define HEIGHT_SCALE 0.5

# define CELLS ivec2(iChannelResolution[0].x, iChannelResolution[0].y)
//# define CELLS ivec2(3)

// unsure yet where to bring this!
# define SUN normalize(vec3(sin(iDate.w*0.5), cos(iTime), HEIGHT_SCALE*1.5))
// normalize(vec3(3.0, -5.0, 2.0))

// horizontal FOV, if you use negative values the camera will be orthographic!
// examples:
// FOV -1.0 for orthographic (sensor size)
// FOV 90.0 for perspective wide
// FOV 45.0 for perspective narower
# define FOV 90.0

// how far "behind" the camera is behind the arcball
# define CAMERA_DIST -0.65

# define BALL_SIZE 0.25

// TODO one variable to change between sampled and direct light
// 0 -> directional light
// 1 -> point light
// 2 -> MIS? (one light, one sampled?)
// 3+ -> bounces//samples?
# define BOUNCES 4
# define SAMPLES 8

struct Material{
    vec3 col; // ground color (or texture?)
    float emissivity; //emitted light in some unit?
    float roughness; // invers reflectivity, sorta
    float translucency; // something like 1.0 for glass and 0.0 for solids? -> rays split/sample/refract??
    float IOR; // index of refraction
};

// edit these here to change the look and feel!
Material chalk = Material(vec3(1.0),           0.0,  0.65,  0.0, 1.3);
Material ground = Material(vec3(0.5),          0.0,  0.25,  0.0, 0.0);
Material sky = Material(vec3(0.02, 0.3, 0.85), 1.0,  0.90,  0.0, 0.0);
Material glass = Material(vec3(1.0),           0.0,  0.02,  0.9, 1.5);


ivec2 worldToCell(vec3 p) {
    // move world space again
    p += 1.0;
    p *= 0.5;
    ivec2 st = ivec2((p.xy*vec2(CELLS.xy)));
    // TODO: find an actual solution to the edge cases!
    st = min(st, CELLS -1);
    return st;
}

struct Ray{
    vec3 origin;
    vec3 dir;
    vec3 inv_dir; // for speedup?
};

// helper constructor
Ray newRay(vec3 ro, vec3 rd){
    return Ray(ro, rd, 1.0/rd);
}


struct IntersectionInfo{
    bool hit;
    // rest illdefined for a miss
    bool inside;
    vec3 entry;
    vec3 exit;
    vec3 entry_norm;
    vec3 exit_norm;
    float entry_dist;
    float exit_dist;
};

// sorta reference: https://tavianator.com/2022/ray_box_boundary.html
IntersectionInfo AABB(vec3 center, vec3 size, Ray ray){
    IntersectionInfo res;

    vec3 pos = center + size;
    vec3 neg = center - size;

    vec3 pos_dist = (pos-ray.origin) * ray.inv_dir;
    vec3 neg_dist = (neg-ray.origin) * ray.inv_dir;

    vec3 min_dist = min(pos_dist, neg_dist);
    vec3 max_dist = max(pos_dist, neg_dist);

    res.entry_dist = max(max(min_dist.x, min_dist.y), min_dist.z);
    res.exit_dist = min(min(max_dist.x, max_dist.y), max_dist.z);

    // normals point away from the center
    res.entry_norm = -sign(ray.dir) * vec3(greaterThanEqual(min_dist, vec3(res.entry_dist)));
    res.exit_norm = sign(ray.dir) * vec3(lessThanEqual(max_dist, vec3(res.exit_dist)));

    // essentially methods?
    res.entry = ray.origin + ray.dir*res.entry_dist;
    res.exit = ray.origin + ray.dir*res.exit_dist;

    res.hit = res.entry_dist < res.exit_dist && res.exit_dist > 0.0;
    res.inside = res.entry_dist < 0.0; // entry behind us

    return res;
}

// with help from: https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection.html
IntersectionInfo Sphere(vec3 center, float radius, Ray ray){
    IntersectionInfo res;
    vec3 local = ray.origin - center;
        
    float a = dot(ray.dir, ray.dir);
    float b = 2.0* dot(ray.dir, local);
    float c = dot(local, local) - pow(radius,2.0);
        
    float discriminant = pow(b,2.0) - 4.0*a*c;
    
    res.hit = discriminant >= 0.0;
    
    float t0 = (-b + sqrt(discriminant))/ (2.0*a);
    float t1 = (-b - sqrt(discriminant))/ (2.0*a);

    res.entry_dist = min(t0, t1);
    res.exit_dist = max(t0, t1);
    
    if (res.entry_dist < 0.0 && res.exit_dist < 0.0){
        res.hit = false;
    }

    res.entry = ray.origin + ray.dir * res.entry_dist;
    res.exit = ray.origin + ray.dir * res.exit_dist;

    res.entry_norm = normalize(res.entry - center);
    res.exit_norm = normalize(res.exit - center);
    
    res.inside = res.entry_dist < 0.0 && res.exit_dist > 0.0; // entry behind us

    return res;
}


IntersectionInfo pillar_hits(ivec2 cell, float height, Ray ray){
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
    IntersectionInfo res = AABB(p, extend, ray);
    return res;
}


vec4 sampleHeight(ivec2 cell){
    // to allow for more complex math to determine height
    // .rgb should just return the texture color or some modification of it
    //cell.x = (cell.x + iFrame) % int(iChannelResolution[0].x); // fun texture scroll
    vec4 tex = texelFetch(iChannel0, cell, 0);
    vec4 res;
    res.a = tex.r + tex.g + tex.b; // we do height by a sum of the color for now
    res.a *= 0.33;
    res.rgb = tex.rgb; // simply copy the color as the "texture" for now
    
    // res.a = tex.a; // debug/use existing height data.
    res.a *= HEIGHT_SCALE;
    return res;
}

// from: https://www.shadertoy.com/view/7l3yRn
vec2 get_random_numbers(inout uvec2 seed) {
    // This is PCG2D: https://jcgt.org/published/0009/03/02/
    seed = 1664525u * seed + 1013904223u;
    seed.x += 1664525u * seed.y;
    seed.y += 1664525u * seed.x;
    seed ^= (seed >> 16u);
    seed.x += 1664525u * seed.y;
    seed.y += 1664525u * seed.x;
    seed ^= (seed >> 16u);
    // Convert to float. The constant here is 2^-32.
    return vec2(seed) * 2.32830643654e-10;
}

// also from above
// TODO collaplse into one function!
// Given uniform random numbers u_0, u_1 in [0,1)^2, this function returns a
// uniformly distributed point on the unit sphere (i.e. a random direction)
// (omega)
vec3 sample_sphere(vec2 random_numbers) {
    float z = 2.0 * random_numbers[1] - 1.0;
    float phi = 2.0 * PI * random_numbers[0];
    float x = cos(phi) * sqrt(1.0 - z * z);
    float y = sin(phi) * sqrt(1.0 - z * z);
    return vec3(x, y, z);
}


// Like sample_sphere() but only samples the hemisphere where the dot product
// with the given normal (n) is >= 0
vec3 sample_hemisphere(vec2 random_numbers, vec3 normal) {
    vec3 direction = sample_sphere(random_numbers);
    if (dot(normal, direction) < 0.0)
        direction -= 2.0 * dot(normal, direction) * normal;
    return direction;
}


struct RaycastInfo{
    bool hit; // if negative, the rest is undefined.
    float dist; // hit_info.entry_dist redundant?
    //ivec2 cell; //current_cell?
    IntersectionInfo hit_info; //has the entry norm etc.
    vec3 col; // TODO: replace with material
    //Ray ray; //just as a reference?
};


RaycastInfo raycast(Ray ray){
    // cast the ray untill there is a hit or we exit the box
    // "any hit" shader?
    RaycastInfo result;
    
    IntersectionInfo box = AABB(vec3(0.0, 0.0, HEIGHT_SCALE*0.5), vec3(1.0, 1.0, HEIGHT_SCALE*0.5), ray);

    vec3 entry = box.entry;

    if (!box.hit){
        // if we "MISS" the whole box (not inside?).
        result.hit = false;
        return result;
        
    }
    // everything below here is inside the box
    if (box.inside){
        // if we are "inside" the entry should just be ro!
        entry = ray.origin; // maybe problems with distance caluclations at the end?
    }
    
    ivec2 current_cell = worldToCell(entry); // TODO: this one is problematic!
    int i;
    ivec2 max_cells = CELLS - min(current_cell, CELLS-current_cell);
    int max_depth = (max_cells.x + max_cells.y)+2; // could also be min!
    for (i = 0; i < max_depth; i++){
        if (current_cell.x < 0 || current_cell.x >= CELLS.x ||
            current_cell.y < 0 || current_cell.y >= CELLS.y){
            // we marched far enough are are "outside the box" now!
            result.hit = false;            
            return result;
        }

        vec4 tex = sampleHeight(current_cell);
        IntersectionInfo pillar = pillar_hits(current_cell, tex.a, ray);

        if (pillar.hit) {
            // "any hit" (side/top/bot) -> loop ends here
            // do a little bit of light sim by doing diffuse "block of chalk"
            vec3 col = tex.rgb;
            // TODO materail decision here?
            result.hit = true;
            result.hit_info = pillar;
            result.dist = pillar.entry_dist;
            result.col = col;
            return result;            
        }

        // check if our exit distance larger than the box, means we should be at the final pillar...
        if (pillar.exit_dist >= box.exit_dist){
            result.hit = false;
            return result; // do we ever get here?
        }

        // the step
        // TODO: DDA style decision
        ivec2 next_cell = current_cell + ivec2(pillar.exit_norm.xy);
        if (next_cell == current_cell){
            // in this case we do another raycast - but without any Z component
            // so the vector is sideways and points to a new cell!
            vec3 flat_rd = vec3(ray.dir.xy, 0.0);
            Ray flat_ray = Ray(ray.origin, flat_rd, 1.0/flat_rd);

            IntersectionInfo grid = pillar_hits(current_cell, 1.0, flat_ray);
            next_cell += ivec2(grid.exit_norm.xy); // TODO check if this norm is correct!
        }
        // for next iteration
        current_cell = next_cell;
    }
    
    result.hit = false;
    return result;
}

// more like a bad shadowmap
// idea for the future: precompute the horizon per pixel: https://youtu.be/LluCbGdi-RM
float directional_light(Ray sun_ray, vec3 normal){
    // return the amount of shadowed?
    // we are now marching upwards from some hit
    // ro is essentially the point we started from
    // rd is the sun angle
    RaycastInfo res = raycast(sun_ray);
    //return res.a;
    
    //TODO: intensity/color?
    
    float amt = 1.0;
    
    
    if (!res.hit){// || (ro + rd*res.a).z >= HEIGHT_SCALE){
        // miss means full sunlight!
        amt = max(0.0, dot(sun_ray.dir, normal));
    }
    else {
        // TODO: use distance?
        amt = 0.1; // additional ambient light from here?
    }
    return amt;
}

// struct for lights? colored light?
float point_light(vec3 start, vec3 light_pos, float light_intensity, vec3 normal){
    float amount;
    
    vec3 light_dir = normalize(light_pos - start);
    float light_dist = distance(start, light_pos);
    // Ray(hit+0.001*SUN, SUN, 1.0/SUN);
    Ray light_cast = Ray(start + 0.001*light_dir, light_dir, 1.0/light_dir);
    RaycastInfo res = raycast(light_cast);
    
    if (!res.hit || res.dist > light_dist) {
        // either we miss geometry or we hit gometry behind the light
        amount = inversesqrt(light_dist)* light_intensity;
        amount *= max(0.0, dot(normal, light_dir));
    }
    else {
        // hit an intersection before the light, so don't see the light!
        amount = 0.0;        
    }
    
    // TODO still needs dot normal!
    return amount;
}



// copied from https://www.shadertoy.com/view/M3jGzh
float checkerboard(vec2 check_uv, float cells){
    check_uv *= cells/2.0;
    float rows = float(mod(check_uv.y, 1.0) <= 0.5);
    float cols = float(mod(check_uv.x, 1.0) <= 0.5);
    return float(rows == cols);
}

struct HitInfo{
    Material mat;
    float dist;
    vec3 norm;
    vec3 pos;
    bool inside; // for doing glass rays!
};


HitInfo sampleGround(vec3 ro, vec3 rd){
    HitInfo res;
    // TODO: rename to sample skybox maybe? as the ground is sorta part of that...
    float ground_height = 0.0;
    float ground_dist = (ground_height-ro.z)/rd.z;
    // TODO: use the actual sphere for the "skybox"
    if (ground_dist < 0.0 ||ground_dist > 10.0) {
        // essentially sky hit instead?
        // just some random skybox right now... could be improved of course!
        vec3 col = vec3(0.23, 0.59, 0.92)*exp(dot(SUN, rd)-0.8);
        col = clamp(col, vec3(0.0), vec3(1.0));
        
        res.mat = sky;
        
        res.mat.col = col; // no longer matches with "sky" - so gotta change the above maybe?
        
        res.dist = 10.0;
        res.pos = ro + rd*res.dist;
        res.mat.emissivity *= clamp(smoothstep(res.dist - 8.1, res.dist- 3.0, res.pos.z), 0.0, 1.0);
        res.norm = -rd;
        return res; // some random distance that is positive!
    }

    vec3 ground_hit = ro + (rd * ground_dist);

    float val = checkerboard(ground_hit.xy, 8.0)* 0.25;
    val += 0.45;
    //val *= 2.0 - length(abs(ground_hit));

    // fake sun angle spotlight... TODO actual angle and normal calculation!
    //val *= 2.5 - min(2.3, length((-SUN-ground_hit)));//,vec3(0.0,0.0,1.0));

    vec3 col = vec3(val);
    res.mat = ground;
    res.mat.col = col;
    res.dist = ground_dist;
    res.pos = ground_hit;
    res.norm = vec3(0.0, 0.0, 1.0);
    return res;
}

// TODO for montecarlo we need an external loop around this!
HitInfo scene(Ray camera){
    HitInfo res;
    
    // terrain
    RaycastInfo terrain = raycast(camera);

    // ball
    IntersectionInfo ball = Sphere(SUN, BALL_SIZE, camera);

    // five cases: just terrain hit, ball hit, both miss, both hit terrain closer, both hit ball closer
    // idea: get all hits, then calculate closest (sorted?) and then return that. if none return background
    // TODO: redo logic (dynamic arrays?)

    if (terrain.hit && (!ball.hit || terrain.dist < ball.entry_dist)) {
        // terrain infront of the ball
        res.mat = chalk;
        res.mat.col = terrain.col; // TODO: material construction
        res.norm = terrain.hit_info.entry_norm;
        res.pos = terrain.hit_info.entry;
        res.inside = terrain.hit_info.inside;
        if (res.inside) {
            res.norm = terrain.hit_info.exit_norm;
            res.pos = terrain.hit_info.exit;
        }
        
    } else if (ball.hit) {
        // ball infront of the terrain
        res.mat = glass; // TODO: glass material?
        res.norm = ball.entry_norm;
        res.pos = ball.entry;        
        res.inside = ball.inside;
        if (res.inside) {
            res.norm = ball.exit_norm;
            res.pos = ball.exit;
        }
        
    } else {
        res = sampleGround(camera.origin, camera.dir);
    }
    

    return res;
}

// follow ? https://www.shadertoy.com/view/7l3yRn
struct RayRadiance{
    vec3 radiance;
    vec3 throughput_weight;
};

// reading: https://www.pbr-book.org/4ed/Radiometry,_Spectra,_and_Color/Surface_Reflection
// further: https://www.pbr-book.org/4ed/Reflection_Models
// watching maybe: https://youtu.be/wA1KVZ1eOuA
vec3 brsf(in vec3 rd, in HitInfo hit, inout vec3 next_dir, inout uvec2 seed){
    // returns the outgoing radiance?
    // as well as the next ray direction. (inout)
    
    Material mat = hit.mat;
    vec3 norm = hit.norm;
    // naive reflection model
    vec3 perfect_reflection = reflect(rd, norm);
    next_dir = mix(perfect_reflection, next_dir, mat.roughness);
    
    //native transmission model

    vec2 randoms = get_random_numbers(seed);
    if (randoms.x < mat.translucency) {
        float IOR = hit.inside ? mat.IOR : 1.0/mat.IOR;
        vec3 reflect_norm = hit.inside ? norm : -norm;
        vec3 perfect_refraction = refract(rd, -reflect_norm, IOR);
        next_dir = mix(perfect_refraction, -next_dir, mat.roughness);
        //next_dir = perfect_refraction;
        norm = reflect_norm;
    }

    vec3 outgoing = mat.col * 2.0 * max(0.0, dot(norm, next_dir));
    return outgoing;
}



// factored out to function so the seed changes correctly due to inout -.-
vec3 get_ray_radiance(HitInfo first_hit, Ray camera, inout uvec2 seed){
    //after get_ray_radiance in https://www.shadertoy.com/view/7l3yRn

    // because the first_hit is shared between samples, we can skip the traversal a few times
    vec3 radiance = vec3(first_hit.mat.emissivity);
    vec3 next_dir = sample_hemisphere(get_random_numbers(seed), first_hit.norm);
    vec3 outgoing_radiance = brsf(camera.dir, first_hit, next_dir, seed);
    vec3 throughput_weight = outgoing_radiance;
    
    Ray bounce = newRay(first_hit.pos+0.0001*next_dir, next_dir);

    int i;
    for(i=0; i<BOUNCES; i++){
        HitInfo hit = scene(bounce);
        radiance += throughput_weight * hit.mat.emissivity;
        // TODO: technically we could exit here early?
        // random first and then mutated below
        next_dir = sample_hemisphere(get_random_numbers(seed), hit.norm);        
        outgoing_radiance = brsf(bounce.dir, hit, next_dir, seed);
        
        throughput_weight *= outgoing_radiance;
        if (lessThanEqual(throughput_weight,vec3(0.0))==bvec3(true)) break; // TODO benchmark if this even works as a speedup
        //if (length(throughput_weight) <= 0.0) break; // version which I don't belive in...
        bounce = newRay(hit.pos+0.0001*next_dir, next_dir);
    }

    return radiance;
}



// TODO: calucalte the light from that brdf too? HitInfo2 -> RayRadiance, next_dir
// multiple importance sampling? following: https://lisyarus.github.io/blog/posts/multiple-importance-sampling.html
// idea being we sample the direct light or direction light once, and then do one random sample. weight them 50/50?
// TODO: call scene below and loop it?
// 1. cast scene, 2. accumulate light, 3. get next dir, LOOP
// add a MAX_bounces or SPP var at the top.



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv normalized to [-1..1] for height with more width
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 mo = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
    
    
    uvec2 seed = uvec2(fragCoord) ^ uvec2(iFrame << 16);

    //fragColor = texture(iChannel0, uv);
    //return;

    // for when it's just idling...
    float azimuth = -1.9+iTime*0.1 + mo.x; // keeps a bit of residue of the mouse!
    float altitude = 0.7+cos(1.5+iTime*0.25)*0.35;
    if (sign(iMouse.z) > 0.0){
        // orbiting camera setup
        azimuth = PI*mo.x;
        altitude = 0.5*PI*clamp(mo.y+1.0, -0.01, 0.99); // maybe just positive?
    }

    // make sure you don't look "below"
    altitude = clamp(altitude, HEIGHT_SCALE*0.2, PI);

    // a unit length orbit!
    vec3 camera_pos = vec3(
        cos(azimuth)*cos(altitude),
        sin(azimuth)*cos(altitude),
        sin(altitude));
    // the camera is always looking "at" the origin or half way above it
    vec3 look_dir = normalize(vec3(0.0, 0.0, HEIGHT_SCALE*0.5) - camera_pos);


    // TODO moving the camera in and out over time??
    camera_pos += look_dir * CAMERA_DIST; // moving the camera "back" to avoid occlusions?
    // two vectors orthogonal to this camera direction (tagents?)
    //vec3 look_u = camera_pos + vec3(-sin(azimuth), cos(azimuth), 0.0);
    //vec3 look_v = camera_pos + vec3(sin(altitude)*-cos(azimuth), sin(altitude)*-sin(azimuth), cos(altitude));


    // turns out analytically these aren't correct. so using cross instead -.-
    vec3 look_u = normalize(cross(look_dir, vec3(0.0, 0.0, 1.0)));
    vec3 look_v = normalize(cross(look_u, look_dir)); // is this faster?
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

    // todo extract to a function
    // Ray in -> material/normal out?
    // caluclate and aggregate light throughput?
    // new ray direction based on sampled material/refraction?

    Ray camera = newRay(ray_origin, ray_dir);
    vec3 out_col = vec3(0.0);
    
    // primary rays happen here once per frame!
    HitInfo first_hit = scene(camera);
        
    int j;
    for(j=0; j<SAMPLES; ++j){
        vec3 rad = get_ray_radiance(first_hit, camera, seed);
        out_col += rad;
    }
    // average color over all samples
    out_col /= float(SAMPLES);
    
    // TODO gamma correction?
    fragColor = vec4(out_col, 1.0);
}
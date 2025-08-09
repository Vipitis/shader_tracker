// Apache 2.0 no patents \_%_/

/* Image pass presents the texture calculated in Buffer A 
* this is adapted from my heightmap shader:
* https://www.shadertoy.com/view/M3VBWt
* pretty much in progress but this is one of the ideas I have had!
* feedback/improvements welcome here or on the original.
*/


# define PI 3.141592653
# define HEIGHT_SCALE 0.5

// resolution of the sampled area limit Y to some number smaller than iResolution.y to change the "speed"
# define CELLS ivec2(iChannelResolution[0].x, min(iChannelResolution[0].y,512.0))

// unsure yet where to bring this!
# define SUN normalize(vec3(sin(iDate.w*0.5), cos(iTime), HEIGHT_SCALE*1.5))
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

struct Ray{
    vec3 origin;
    vec3 dir;
    vec3 inv_dir; // for speedup?
};

struct HitInfo{
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
HitInfo AABB(vec3 center, vec3 size, Ray ray){
    HitInfo res;

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


HitInfo pillar_hits(ivec2 cell, float height, Ray ray){
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
    HitInfo res = AABB(p, extend, ray);
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


vec4 raycast(Ray ray){
    // cast the ray untill there is a hit or we exit the box
    // "any hit" shader?
    // returns tex + dist, negative dist means a "miss"
    // the inout for clouds sums up it's distance and depth of clouds.
    HitInfo box = AABB(vec3(0.0, 0.0, HEIGHT_SCALE*0.5), vec3(1.0, 1.0, HEIGHT_SCALE*0.5), ray);

    vec3 entry = box.entry;

    if (!box.hit){
        // if we "MISS" the whole box (not inside?).

        return vec4(vec3(0.2, 0.8, 0.0), -abs(box.exit_dist));
    }
    // everything below here is inside the box
    if (box.inside){
        // if we are "inside" the entry should just be ro!
        entry = ray.origin; // maybe problems with distance caluclations at the end?
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
            return vec4(vec3(0.4), -abs(box.exit_dist));
        }

        vec4 tex = sampleHeight(current_cell);
        HitInfo pillar = pillar_hits(current_cell, tex.a, ray);

        if (pillar.hit) {
            // "any hit" (side/top/bot) -> loop ends here
            // do a little bit of light sim by doing diffuse "block of chalk"
            vec3 col = tex.rgb;
            // half the phong diffuse
            // TODO: assume some base "emissive" quality to all pillars (or scaled with some value?)
            // needs better hit model and shader to accumulate over a few traces.
            // TODO: should one of them be negative?
            col *= (2.0*max(0.0, dot(pillar.entry_norm, SUN)))+0.2; // where does the 2.0 factor came from?
            return vec4(col, abs(pillar.entry_dist));
        }

        // check if our exit distance larger than the box, means we should be at the final pillar...
        if (pillar.exit_dist >= box.exit_dist){
            return vec4(vec3(0.8), -abs(pillar.exit_dist));
        }

        // the step
        ivec2 next_cell = current_cell + ivec2(pillar.exit_norm.xy);
        if (next_cell == current_cell){
            // in this case we do another raycast - but without any Z component
            // so the vector is sideways and points to a new cell!
            vec3 flat_rd = vec3(ray.dir.xy, 0.0);
            Ray flat_ray = Ray(ray.origin, flat_rd, 1.0/flat_rd);

            HitInfo grid = pillar_hits(current_cell, 1.0, flat_ray);
            next_cell += ivec2(grid.exit_norm.xy); // TODO check if this norm is correct!
        }
        // for next iteration
        current_cell = next_cell;
    }
    //return vec4(vec2(current_cell)/vec2(CELLS), 0.0, 0.0);
    // defualt "miss"? -> like we exit the box?

    return vec4(vec3(1,0,0), -abs(box.exit_dist));

}

// more like a bad shadowmap
// idea for the future: precompute the horizon per pixel: https://youtu.be/LluCbGdi-RM
float shadow(Ray sun_ray){
    // return the amount of shadowed?
    // we are now marching upwards from some hit
    // ro is essentially the point we started from
    // rd is the sun angle
    vec4 res = raycast(sun_ray);
    //return res.a;
    if (res.a < 0.0){// || (ro + rd*res.a).z >= HEIGHT_SCALE){
        return 1.0; // miss means full sunlight!
    }
    else {
        // TODO: use distance?
        return 0.5; // additional ambient light from here?
    }
}

// copied from https://www.shadertoy.com/view/M3jGzh
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
        vec3 col = vec3(0.23, 0.59, 0.92)*exp(dot(SUN, rd)-0.8);
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
    camera_pos += look_dir * -0.75; // moving the camera "back" to avoid occlusions?
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

    // actual stuff happening:
    vec4 res = raycast(camera);
    // fragColor = vec4(vec3(res.rgb),1.0);
    //return; // early debug exit
    if (res.a < 0.0) {
        // we missed the initial terrain
        res = sampleGround(ray_origin, ray_dir);

        // TODO: the skybox hit returns a negative distance, so we need to handle that
        //res.a = abs(res.a);
    }
    vec3 hit = ray_origin + (ray_dir*res.a);

    // ro is a bit offset to reduce start intersections that are noisey ... want a better solution one day.
    Ray sun_check = Ray(hit+0.001*SUN, SUN, 1.0/SUN);

    vec4 ref = raycast(sun_check).rgba; //reflection (the full shadow)
    ref.rgb *= 1.0 - step(0.0, ref.a); // this makes misses black?
    // ref.rgb *= 1.0-exp(-shadow_cloud*15.0); // more "realistic" cloud shadow?

    float shadow_amt = shadow(sun_check);
    // actually more light amount -.-
    // so we add and "ambient" base like here
    vec3 col = res.rgb * max(0.6, shadow_amt);


    // distance fog? I don't like it so it's commented out
    // float dist_fog = transmittance(res.a *0.015);
    // vec3 fog_col = vec3(0.4, 0.5, 0.9);
    // col = mix(col, fog_col, 1.0-dist_fog);

    // TODO: better "shadow" value via actually colored shadow??
    // vec3 col2 = res.rgb + ref.rgb*0.3;
    // col = vec3(uv.x > 0.0 ? col.rgb : col2.rgb);

    fragColor = vec4(vec3(col),1.0);
}
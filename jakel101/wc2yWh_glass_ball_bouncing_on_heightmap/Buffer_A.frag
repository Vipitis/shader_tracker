//buffer pass does the physics simulation!
// lots of todo to find here!


# define SUBSTEPS 32
# define GRAVITY -9.8 * HEIGHT_SCALE

vec4 init(vec2 uv){
    //return vec4(uv.x, uv.y, 0.5, 1.0);
    vec4 tex = texture(iChannel1, uv/vec2(CELLS));
    vec4 h = 0.5+ sin(tex*6.0 + 0.6*iTime+vec4(uv.x,uv.y,1,0)) * 0.5;
    // TODO add dt here
    return h;
}


// TODO: can't put in common as the sampler is requied - will break wgpu -.-
vec4 sampleHeight(ivec2 cell){
    vec4 tex = texelFetch(iChannel0, cell, 0); // TODO: skip resample
    vec4 res;
    res.a = tex.r + tex.g + tex.b; // we do height by a sum of the color for now
    res.a *= 0.33;
    res.rgb = tex.rgb; // simply copy the color as the "texture" for now
    
    // res.a = tex.a; // debug/use existing height data.
    res.a *= HEIGHT_SCALE;
    return res;
}

// TODO: fix the bounces and rewatch https://youtu.be/j84zJ06wnVA
void animate(float dt, in vec3 pos, in vec3 vel, out vec3 new_pos, out vec3 new_vel){    
    new_vel = vel;
    new_vel.z += GRAVITY *dt;
    new_pos = pos + new_vel *dt;
    
    // basic bouce on the ground:
    // TODO check the one pillar on the contact point my mapping uv back to texture I guess.
    float height = sampleHeight(worldToCell(pos)).a;
    if ((new_pos.z - RADIUS) < height) {
        // TODO restitution
        new_pos.z = pos.z; // TODO don't stop here
        new_vel.z *= -1.0;
    }
    
    // sides at 1.0 and -1.0 in all directions
    // TODO bvec here?
    // probably scale by the overshoot...
    if ((abs(new_pos.x) + RADIUS) > 1.0) {
        float error = (abs(new_pos.x) + RADIUS) - 1.0;
        new_vel.x *= -1.0;
        
        new_pos.x += new_vel.x*error;        
    }
    if ((abs(new_pos.y) + RADIUS) > 1.0) {
        new_pos.y = pos.y;
        new_vel.y *= -1.0;
    }
    
    // TODO check all pillars below the ball!
    // how to do a sideways bounce?
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // todo not to the limited 64x64 scale of the world -.-
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    
    if (fragCoord.x > 65.0 || fragCoord.y > 65.0){
        discard;
    }
    
    ivec2 st = ivec2(fragCoord);
    // since we need to store at least 6 values, we mask them with bools here
    // TODO maybe macros?
    ivec2 POS_MEM = ivec2(0,0);
    ivec2 VEL_MEM = ivec2(0,1);
    bool STORE_POS = (st == POS_MEM) ? true : false;
    bool STORE_VEL = (st == VEL_MEM) ? true : false;
    
    vec3 pos = texelFetch(iChannel0, POS_MEM, 0).xyz;
    vec3 vel = texelFetch(iChannel0, VEL_MEM, 0).xyz;    
    
    vec4 col = vec4(0.0);   
    if (iFrame < 2){
        col = init(vec2(st)/64.0);
        pos = vec3(0.0, 0.0, 1.0);
        vel = vec3(1.6, 0.5, 0.1);
    }
    // if (!STORE_POS || !STORE_VEL)
    else{
        col = init(vec2(st));
        //discard;        
    }
    
    vec3 new_pos = pos;
    vec3 new_vel = vel;
    
    float dt = iTimeDelta/float(SUBSTEPS);    
    // TODO extract to function
    int i;
    for (i =0; i < SUBSTEPS; i++){
        animate(dt, pos, vel, new_pos, new_vel);
        pos = new_pos;
        vel = new_vel;
    }        
    
    
    // write only the relavent part?
    col.rgb = STORE_POS ? new_pos : col.rgb;
    col.rgb = STORE_VEL ? new_vel : col.rgb;
    fragColor = col;
}
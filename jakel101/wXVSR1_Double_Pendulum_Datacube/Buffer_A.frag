// this buffer does the physics simulation
// outputs are as follows
// .x position of the inner pendulum
// .y rotational speed of the inner pendulum
// .z position of the outer pendulum (in half rotations from the bottom) left/clockwise is negative
// .w rotational speed of the outer pendulum clockwise is negative

// substeps still scale the same time, but should be more "accurate" but results in why more noise too
// energy is kept longer, breaks on really high numbers like > 110 or something :/
#define SUBSTEPS 32
// this can be changed to make it go "faster"
#define GRAVITY -9.8

vec4 init(vec2 uv) {
    // this let's you set the initial conditions in relation to screenspace, so play around here and have fun
    // requiers you to rewind time!
    vec4 vals;
    
    vals.xz = uv; // rotation position
    vals.yw = vec2(0.0); // start with 0 momentum!
    //vals.xz = vec2(1.0); // start at the top
    
    // vals.x = 0.0; //for testing the outer part is just hanging
    vals.yw = uv.yx*6.1; // add a lot of momentum!
    
    
    //vals.wy = uv*0.01; // really close initial conditions (start athe the top)
    
    vals.y *= -1.0; // little flip so the default mouse position looks more interesting!
    return vals;
}

// not used, left over from development!
void simulate_single(inout vec2 pos, inout vec2 vel, float dt){
    // assume the mass is 1!
    vel.y += GRAVITY *dt;
    
    vec2 new_pos = pos + vel * dt;
    // constraints
    
    // assume length is 1 and fixed to the origin
    float error = 1.0 - length(new_pos);
    vec2 corr = new_pos * -1.0 * error;

    new_pos -= corr;

    vec2 next_vel = (new_pos - pos) / dt;

    // outputs
    pos = new_pos;
    vel = next_vel;
}


void simulate_double(float dt, inout vec2 pos_i, inout vec2 vel_i, inout vec2 pos_o, inout vec2 vel_o){
    // reference: https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/06-pendulumShort.html MIT licnesed
    vec2 new_pos_i;
    vec2 new_vel_i;
    vec2 new_pos_o;
    vec2 new_vel_o;
    
    // step 1 apply gravity
    vel_i.y += GRAVITY *dt;
    vel_o.y += GRAVITY *dt;
    new_pos_i = pos_i + vel_i * dt;
    new_pos_o = pos_o + vel_o * dt;
    
    // step 2 constraints:
    // assume masses and lengths is 1
    // inner is fixed to 0,0 and outer is attached to inner    
    vec2 delta = new_pos_o - new_pos_i;
    float error_o = 1.0 - length(delta);
    vec2 corr_i = error_o * -0.5 * delta; // 0.5 is the inverse mass
    vec2 corr_o = error_o * -0.5 * delta;    
    new_pos_i += corr_i; // one adds and one subtracts.. to move them towards their targets
    new_pos_o -= corr_o;
    
    // TODO: is this order correct?
    float error_i = 1.0 - length(new_pos_i);
    corr_i = new_pos_i * -1.0 * error_i;
    new_pos_i -= corr_i;
    
    
    // step3 derive new velocities
    new_vel_i = (new_pos_i - pos_i) /dt;
    new_vel_o = (new_pos_o - pos_o) /dt;
        
    
    //return not needed but we use inouts
    pos_i = new_pos_i;
    vel_i = new_vel_i;
    pos_o = new_pos_o;
    vel_o = new_vel_o;
}

// lets first try a single pendulumn!
vec2 single(float a, float v){
    // reference: https://youtu.be/XPZEeS70zzU

    // returns them as polar again?
    vec2 new;
    vec2 pos = Polar2Cartesian(a, 1.0);
    vec2 orth = Polar2Cartesian(a + 0.5, 1.0); // just an orthogonal vector we then scale
    vec2 vel = orth*v;
    
    int i;
    float dt = (iTimeDelta/float(SUBSTEPS));
    for (i=0; i<SUBSTEPS; i++){
        simulate_single(pos, vel, dt);
    }    
    vec2 new_pos = pos;
    vec2 new_vel = vel;
    
    // reproject to polar coordinates:    
    new.x = Cartesian2Polar(new_pos).x;
    
    vec2 next_orth = Polar2Cartesian(new.x + 0.5, 1.0);
    new.y = length(new_vel)*sign(dot(new_vel,next_orth));
    new.y = dot(new_vel, next_orth);
    return new;
}

vec4 double_pendulum(vec4 state){
    // decode positions and velocities
    float lenght_i = 1.0;
    float length_o = 1.0;
    //TODO where do we put the lengths?
    float angle_i = state.x;
    float momentum_i = state.y;                
    vec2 pos_i = Polar2Cartesian(angle_i, lenght_i);
    vec2 vel_i = Polar2Cartesian(angle_i+0.5, 1.0)*momentum_i;
    
    float angle_o = state.z;
    float momentum_o = state.w;
    vec2 pos_o = Polar2Cartesian(angle_o, length_o);
    pos_o = pos_i + pos_o; // because the polar coordinates were centered.
    vec2 vel_o = Polar2Cartesian(angle_o+0.5, 1.0)*momentum_o;
    vel_o = vel_i + vel_o;
    
    int i;
    float dt = (iTimeDelta/float(SUBSTEPS));
    for (i=0; i<SUBSTEPS; i++){
        // sanity check here
        //simulate_single(pos_i, vel_i, dt);
        //simulate_single(pos_o, vel_o, dt);
        simulate_double(dt, pos_i, vel_i, pos_o, vel_o);
    }
    
    // reproject to polar coordinates:
    vec2 next_i;
    next_i.x = Cartesian2Polar(pos_i).x;
    vec2 orth_i = Polar2Cartesian(next_i.x+0.5, 1.0);
    next_i.y = length(vel_i)*sign(dot(vel_i,orth_i));
    next_i.y = dot(vel_i, orth_i);
    
    vec2 next_o;
    vec2 pos_o_rel = pos_o - pos_i; // we only store the relative position and motion of the outer pendulum
    next_o.x = Cartesian2Polar(pos_o_rel).x;
    vec2 orth_o = Polar2Cartesian(next_o.x+0.5, 1.0);
    vec2 vel_o_rel = vel_o - vel_i;
    next_o.y = length(vel_o_rel)*sign(dot(vel_o_rel,orth_o));
    next_o.y = dot(vel_o_rel, orth_o);
    
    // fix the one element for testing
    //next_i = vec2(0.0, 0.0);
    //next_o = vec2(0.0, 0.0);
    vec4 new_state = vec4(next_i, next_o);
    return new_state;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from -1..1)
    vec2 uv = fragCoord/iResolution.xy;
    uv *= 2.0;
    uv -= 1.0;
    
    ivec2 st = ivec2(fragCoord);
    vec4 prev = texelFetch(iChannel0, st, 0);
    if (iFrame < 2) { // maybe a fix for resizing here too?
        prev = init(uv);        
    }
    //vec4 next = single(prev.x, prev.y).xyxy;
    vec4 next = double_pendulum(prev);
    //next.zw = vec2(0.0,0.0);
    //next = simulate(prev.xy, prev.zw, iTimeDelta);
    
       
    vec4 col = vec4(next);
    
    fragColor = vec4(col);
}
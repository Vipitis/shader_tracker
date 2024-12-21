// the Buffer A pass holds information about each particle
// the Red and Green channels are X and Y coordinates
// the Blue and Alpha channels are X and Y velocity
// you first load the previous buffer and then do a simulation step.
// Buffer A gets rendered before Image.


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv is set to the center
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
    vec2 m = (2.0*iMouse.xy - iResolution.xy)/iResolution.y;
        
    // load previous state
    vec4 data = texture(iChannel0, uv);    
    vec2 pos = data.xy;
    vec2 vel = data.zw;
    
    // on initialization, add a bit of sideways motion and start top left
    if (iFrame == 0) {
        vel.x += 0.5;
        pos.x += -WIDTH + RADIUS * 2.0;
        pos.y += HEIGHT - RADIUS * 2.0;
    }
    
    //mouse attractor, with a factor, only active when mouse is held down
    vel += (m-pos) * ATTRACT * max(0.0,sign(iMouse.z));   
    
    // add gravity
    vel.y -= GRAVITY * (pos.y+1.0);
    
        
    // move to next position
    vec2 new_pos = pos + vel * iTimeDelta * SIM_SPEED;

    
    // simple collision and reflection
    if (abs(new_pos.x) + RADIUS >= WIDTH) {
        vel.x *= -BOUNCE;
        new_pos.x = pos.x;// + (abs(new_pos).x-WIDTH)*vel.x;
        
    }
    if (abs(new_pos.y) + RADIUS >= HEIGHT) {
        vel.y *= -BOUNCE;
        new_pos.y = pos.y;// + (abs(new_pos).y-WIDTH)*vel.y;
        vel.x *= 0.99; //friction
    }
    
    

    fragColor = vec4(new_pos, vel);
}
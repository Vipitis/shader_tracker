// Buffer A contains the data, the pass makes the calucaltions
// setting up the iChannel0 input (=Buffer A) with nearest and repeat is important!


//extremely fun parameter to experiment with
//try numbers smaller than 1 as well!
# define INERTIA 1.12

vec4 init(vec2 uv){
    // load some shape from texture for the initial distribution?
    vec4 txt = texture(iChannel1, uv);
    //return txt;
    //txt = vec4(length(uv-vec2(0.5))); // simple pattern for a test
    //return vec4(vec2(0.01), txt.b, 0.0); //very low initial velocity?
    float init_dens = 0.5;
    
    return vec4(txt.rg-vec2(0.5), init_dens, 0.0);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    // load something simple?
    // TODO: draw with the mouse also an option?
    if (iFrame <= 2) {
        fragColor = init(uv);
        return;
    }
    
    // load the data
    vec4 prev = texelFetch(iChannel0,ivec2(fragCoord), 0);
    // unpack components
    vec2 vel = prev.xy;
    float density = prev.z; //(blue)
    //prev.w; // currently unused?
    
    
    // idea: density accumulates (gravity?)
    // but we only look at the near pixel neighbors
    // density gets removed or added based on density of direct neighbors
    // only if, and proportional to the direction they are pointing at me
    
    float next_d = density;
    next_d *= 1.0 - clamp(0.0, INERTIA, length(vel)); // this much "moves away"
    vec2 next_vel = vel; // keep track (start with current I guess).
    float largest_d = 0.0;
    for(int i = -1; i<2; i++){
        // i is x neighborhood?
        // j is y neighborhood!
        // we start at bottom left!
        for(int j = -1; j<2; j++){            
            if (i==0 && j==0){
                continue;
            }
            // ensure it wraps around!
            ivec2 sample_st = ivec2(fragCoord)+ivec2(i,j);
            sample_st.x = int(mod(float(sample_st.x),iResolution.x));
            sample_st.y = int(mod(float(sample_st.y),iResolution.y));
            vec4 neighbor = texelFetch(iChannel0, sample_st, 0);
            
            // n_prefix for neighbor ::
            float n_d = max(0.0,neighbor.z); //this shouldn't ever be negative anyway!!
            vec2 n_v = neighbor.xy;
            
            // 8 neighbors, with the following normalized vectors
            // (-0.5, 0.5)  (0.0, 1.0)  (0.5, 0.5)
            // (-1.0, 0.0)  [ our pov]  (1.0, 0.0) 
            // (-0.5,-0.5)  (0.0,-1.0)  (0.5,-0.5)
            // normalized might actually be 1/sqrt(2)
            vec2 n_dir = normalize(vec2(i, j)); //direction towards that neighbor
            // maybe the corners need to be sqrt(2) length? (it's normalized anyway)
            //if (i*j > 0) n_d /= sqrt(2.0);
            
            next_d += max(0.0, dot(n_dir, normalize(n_v))) * n_d; //accumulating neighboring densities here. inverting n_d should be done?!?! 
            // next vel is weighted sum of neighbors density and direction.
            next_vel += n_dir * (n_d * 0.125);
            
        }        
    }
    
    //next_vel *= 0.99999; //slow down over time to avoid acceleration?        
    
    
    fragColor = vec4(next_vel, clamp(0.0, 20.0, next_d), 0.0);
}
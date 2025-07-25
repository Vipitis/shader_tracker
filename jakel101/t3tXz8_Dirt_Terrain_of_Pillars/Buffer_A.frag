// for the terrain map I combined a bunch of existing and tutorial level snippets

// water simulation controls:
// SPACE - toggle all simulaion on/off :: default:on
// E - Erosion simulation toggle on/off :: default:off
// R - Rain for low clouds toggle on/off :: defualt:on


// from https://www.shadertoy.com/view/XlGcRh
uvec2 pcg2d(uvec2 v)
{
    v = v * 1664525u + 1013904223u;

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v>>16u);

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v>>16u);

    return v;
}

// wraps the bitconversion and just accessses half the values
float hash21(in vec2 a){
    uvec2 b = uvec2(floatBitsToUint(a.x), floatBitsToUint(a.y));
    uvec2 c = pcg2d(b);
    float r = float(c.x)/float(-1u); // seems to work I guess... but don't we lose a lot of data??
    // fract(uintBitsToFloat(c.x)) // this one causes issues due to NaN or something, results in black spots in the noise
    return r;
}

// TODO to make the clouds more accurate, this should actually be a slice of 3D noise we rotate through
float noise(in vec2 a){
   // perlin 2D noise
   vec2 i = floor(a);
   vec2 f = fract(a);
   
   // four corners
   float bl = hash21(i + vec2(0.0, 0.0));
   float br = hash21(i + vec2(1.0, 0.0));
   float tl = hash21(i + vec2(0.0, 1.0));
   float tr = hash21(i + vec2(1.0, 1.0));
   
   vec2 s = smoothstep(0.0, 1.0, f);
   
   
   return mix( mix(bl, br, s.x),
               mix(tl, tr, s.x), s.y);
}

// via https://thebookofshaders.com/13/
float fbm(in vec2 p){
    
    // parameters
    int octaves = 8;
    float l = 2.0;
    float g = 0.5;
    
    // initial values
    float a = 0.5;
    float f = 1.0;
    float res = 0.0;
    for(int i = 0; i < octaves; i++){
        res += a * noise(p*f);
        f *= l;
        a *= g;
        
    }
    return res;
    
}

vec4 init_terrain(vec2 uv, float time_seed){
    // initialize the terrain?

    vec4 start;
    // we don't do anything interesting here :(
    float height = fbm(uv*3.0+vec2(time_seed*0.2));    
    // let's have some fun!
    float clouds = fbm(uv*4.0+vec2(-time_seed*0.1));
    
    // water as an amount, not a height.
    float water = max(0.0, 0.3-height);

    // alpha channel currently not used...
    start = vec4(vec3(height, clouds, water),1.0);
    return start;
}

// idea... look at the the neighbords and then check if water exists in the highest point.
// step the water down (by full amount) or based on the gradient?
vec2 simulate_water(ivec2 pos){
    // do we get the clouds to know where it rains?
    vec4 old = texelFetch(iChannel0, pos, 0); // these could be passed in?                
    float old_water = old.z;  
    float old_height = old.x;
    
    float evaporation = iTimeDelta*(max(0.0,((3.5*old_height)-0.3)));        
    old_water *= (1.0-evaporation);
    
    
    float water_level = old_height + old_water;
    float water_change = 0.0; // the amount "added" or removed
    float height_change = 0.0; 
    
    // rain, toggle with R
    float rain_toggle = 1.0 - texelFetch(iChannel1, ivec2(82, 2), 0).x;   
    if (old.y < 0.2) {
        // could be based on cloud thickness, maybe even drain the clouds?
        water_change += iTimeDelta*0.1*rain_toggle;
    }   
    
    // REDO with a loop
    ivec2 neighbors[4] = ivec2[4] (ivec2(1,0), ivec2(-1,0), ivec2(0,1), ivec2(0,-1));
    int i;
    for (i=0; i<neighbors.length(); i++){        
        vec4 n = texelFetch(iChannel0, pos+neighbors[i], 0);
        float n_level = n.x + n.z;
        float water_diff = n_level - water_level;        
        water_change += clamp(water_diff, -old_water, n.z);
    }
    
    water_change /= float(neighbors.length()); // does this need to be normalized?
    
    
    // erosion demo: toggle with E
    float erotion_toggle = texelFetch(iChannel1, ivec2(69, 2), 0).x;   
    height_change = -water_change*0.2*erotion_toggle; // erosion like this?
    
    
    return vec2(old_height + height_change, old_water + water_change);
}




void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/iResolution.y;
    ivec2 st = ivec2(fragCoord);
    
    if (fragCoord.x > iResolution.y){
        // will break on protrait aspect ratio -.-
        discard; // throw away the threads that are outside the simulation area
    }
        
    //TODO terrain can still move if we offset the sample coords!
    vec4 prev = texelFetch(iChannel0, st, 0);
    if (iFrame < 1 || prev.x <= 0.0){ // hack for resizing? -> still messes up uv scaling...
        prev = init_terrain(uv, 0.0);
    }
    else {
        // let's have some fun!
        float clouds = fbm(uv*4.0+vec2(-iTime*0.3));

        prev.y = clouds;
        // press spacebar to toggle water sim (rain, gravity and evaporation) on/off... stars on on.
        if (texelFetch(iChannel1, ivec2(32, 2), 0).x<0.5){
            prev.xz = simulate_water(st);
        }
    }
    
    
    
    // clouds = uv.y; //ramp for testing
    // the blue channel might be water... (and we could animate/simulate it here!)
    //fragColor = vec4(vec3(height, clouds, water),1.0);
    
    fragColor = prev;
}
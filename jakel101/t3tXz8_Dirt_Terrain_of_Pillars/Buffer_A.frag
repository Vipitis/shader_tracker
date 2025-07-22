// for the terrain map I combined a bunch of existing and tutorial level snippets


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


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/iResolution.y;
    
    // we don't do anything interesting here :(
    float height = fbm(uv*6.0+vec2(iTime*0.5));
    
    // let's have some fun!
    float clouds = fbm(uv*3.0+vec2(-iTime*0.1));
    // clouds = uv.y; //ramp for testing
    
    fragColor = vec4(vec3(height, clouds, 0.0),1.0);
}
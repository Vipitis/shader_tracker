// Apache 2.0 license, no patents :^
// ideas of what could be done with shadercoding.
/* desgin brief:: (cont.)
vim colorschemes, trees, tokyo?  0:22:45 https://x.com/ThePrimeagen/status/1861750821504827569
fractal trees? 1:08:45 https://x.com/ThePrimeagen/status/1861750821504827569
Hollow Knight style 5:00:11 https://x.com/ThePrimeagen/status/1854155062282531119
*/


// [ utils], partly done myself, partly copied

vec3 hex2col(uint hex){
    uint r = hex >> 16;
    uint g = hex >> 8 ^ r<<8;
    uint b = hex ^ r << 16 ^ g << 8;
    
    vec3 col;
    col.r = float(r)/255.0;
    col.g = float(g)/255.0;
    col.b = float(b)/255.0;
    return col;
}

// A pseudo-random number generator
// \param seed Numbers that are different for each invocation. Gets updated so
//             that it can be reused.
// \return Two independent, uniform, pseudo-random numbers in [0,1) (u_0, u_1)
vec2 hash22(in uvec2 seed) {
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

//todo: draw function with col inout and object col(already texture fitted), alpha
void draw(inout vec4 col, vec4 obj, float alpha){
    // col.a and obj.a holds depth
    float front = float(obj.a > col.a);
    col = mix(col, obj, clamp(0.0, 1.0, alpha*front));
}


// [ distance functions ]

float sdCircle(vec2 pos, float rad){
    return length(pos) -rad;
}
// with help from https://youtu.be/62-pRVZuS5c?si=cGF1eZBKKs1lXPHG
float sdBox(vec2 pos, float width, float height){
    vec2 dist = abs(pos) - vec2(width, height);
    
    return length(max(dist, 0.0)) + min(max(dist.x,dist.y),0.0);
}
// Isosceles  triangle(ref: https://www.shadertoy.com/view/MldcD7)
float sdTriangleIsosceles( in vec2 p, in vec2 q )
{
    p.x = abs(p.x);
    vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    float s = -sign( q.y );
    vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
                  vec2( dot(b,b), s*(p.y-q.y)  ));
    return -sqrt(d.x)*sign(d.y);
}

// simple or random trees?
// maybe fractals?
// one ref: https://www.youtube.com/watch?v=LLZPnh_LK8c
float sdTree(vec2 pos, float height){
    // pos is kinda the position of the root
    pos.y -= height;
    float trunk = sdTriangleIsosceles(pos, vec2(height/20.0, -height));
    float dist = trunk;
    // tbd maybe a small loop or fract?
    int num_leaves = int(height*(3.0+height))+1;
    for (int i = 0; i < num_leaves; i++){
        float width = 0.01+0.05*float(i+1);
        float height = -0.08*float(i+i+1);
        float leaf = sdTriangleIsosceles(pos - vec2(0.0, (-cos(abs(pos.x*2.9)-width*1.5))+1.0), vec2(width, height));
        pos.y += 0.002*float(i+i*num_leaves);
        dist = min(dist, leaf);
    }
    
    return dist;
    
}


// [ constructions? ]

// instead of the fake 3D stuff make this an element directly with alpha mask?
vec4 buildings(vec2 pos, vec3 wall_col, vec3 window_col, vec3 light_col){
    float num_buildings = 2.5; //scale with uv.x so it's lie 3x or something
    pos.x += iTime*0.1; // pseudo animation
    vec2 build_uv = vec2(fract(pos.x*num_buildings)-0.5, pos.y+1.0);
    // speudo hash
    float height = hash22(uvec2(floor(pos.x*num_buildings)+100.0, 544)).x*1.6 + 0.5;
    float building_dist = sdBox(build_uv, .45, height);
    
    // real numbers to hash after
    float floors = (build_uv.y - height)*floor(height+10.0);
    float rooms = build_uv.x*(1.0/0.45)*floor(height+3.5);
    vec2 window_uv = fract(vec2(rooms,floors))-vec2(0.5);
    float window_id = fract(dot(hash22(uvec2(rooms+254.0, floors+987.0)*uint(height*953.702)),vec2(12.34,56.78))); // bad hashes again
    float window_dist = sdBox(window_uv,0.25, 0.3);
    float window_mask = smoothstep(0.01, 0.0, window_dist);
    
    float lights_mask = float(window_id > 0.9);

    float alpha = clamp(smoothstep(0.01, 0.0,building_dist), 0.0, 1.0);
    vec3 col = wall_col;
    col = mix(col, window_col, window_mask);
    col = mix(col, light_col, lights_mask*window_mask);
    
    
    //col = vec3(window_id);
    return vec4(col, alpha);
}


// tbd with projection and sampling for craters?
vec4 moon(vec2 pos, vec3 moon_col, vec3 crater_col){
    vec3 col = moon_col;
    float alpha = 0.0;
    return vec4(col, alpha);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // uv from -1..1 for wide screen
    vec2 uv = (2.0 * fragCoord - iResolution.xy)/iResolution.y;

    // scene elements as distance functions
    // .z component is depth/layer for potential parallax
    vec3 moon_pos = vec3(-0.6, 0.3, -5.0);
    float moon_dist = sdCircle(uv-moon_pos.xy, 0.4);
    vec3 platform_pos = vec3(-0.7, -1.0, 1.0);
    float platform_dist = sdBox(vec2(fract(uv.x+(iTime+3.0)*0.2)-0.5,uv.y - platform_pos.y), 0.4, 0.1);
    vec3 caleb_pos = vec3(-1.0, max(-0.8, -(pow(mod(iTime, 5.0)-2.0,2.0))), 1.0);
    float caleb_dist = sdBox(uv - caleb_pos.xy, 0.05, 0.1);
    vec3 tree_pos = vec3(-iTime*0.2, -1.0, -2.0);
    float tree_dist = sdTree(vec2(fract(uv.x+iTime*0.15)-0.5, uv.y - tree_pos.y) , sin((floor(uv.x+iTime*0.15))*444.0)*0.3+1.0);


    // colors: https://github.com/folke/tokyonight.nvim/blob/main/lua/tokyonight/colors/night.lua
    vec3 col_bg = hex2col(0x1A1B26u);
    vec3 col_bg_dark = hex2col(0X16161Eu);
    // more colors = https://github.com/folke/tokyonight.nvim/blob/main/lua/tokyonight/colors/storm.lua
    vec3 col_blue = hex2col(0x7AA2F7u); // platform
    vec3 col_blue0 = hex2col(0x3D59A1u);
    vec3 col_blue1 = hex2col(0x2AC3dEu);
    vec3 col_fg = hex2col(0xC0CAF5u); // cursor?
    vec3 col_fg_gutter = hex2col(0x3B4261u);
    vec3 col_orange = hex2col(0xFF9E64u);
    vec3 col_yellow = hex2col(0xE0AF68u); // moon
    
    
    vec4 bg_buildings = buildings(uv, col_blue0, col_bg, col_orange);
    // gradient for the background
    vec3 col = mix(col_fg_gutter, col_bg, uv.y);
    
    col = mix(col, col_yellow, smoothstep(0.05, 0.0, moon_dist));
    col = mix(col, bg_buildings.rgb, bg_buildings.a);
    col = mix(col, col_bg_dark, smoothstep(0.01, 0.0, tree_dist));
    col = mix(col, col_fg, smoothstep(0.005, 0.0, caleb_dist));// * max(floor(mod(iTime*(1.0/0.53)-1.0,2.0)),float(caleb_pos.y > -0.8))); // blinking cursor?
    col = mix(col, col_blue, smoothstep(0.005, 0.0, platform_dist));
    
    //col = bg_buildings.rgb;
    fragColor = vec4(col,1.0);
}
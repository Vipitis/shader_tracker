// Apache 2.0 license
// sorta work in progress


// constants/defines?
const int MAX_STEPS = 128;

// might be horribly unstable and not fit for this scale.
float hash31(in vec3 a){
    //return texture(iChannel0, 0.9*a).r; // shortcut by sampling noise instead..
    vec3 b = a *vec3(54.1122, 123.532, 05.001);
    b = fract(b + 1.376)-91.12;
    return fract(dot(a-b,b)+0.43);
}

// 3d gradient noise??
float noise(in vec3 p){
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    // 8 corners of a cube
    float vLLL = hash31(i + vec3(0.0,0.0,0.0));
    float vLLH = hash31(i + vec3(0.0,0.0,1.0));
    float vLHL = hash31(i + vec3(0.0,1.0,0.0));
    float vLHH = hash31(i + vec3(0.0,1.0,1.0));
    
    float vHLL = hash31(i + vec3(1.0,0.0,0.0));
    float vHLH = hash31(i + vec3(1.0,0.0,1.0));
    float vHHL = hash31(i + vec3(1.0,1.0,0.0));
    float vHHH = hash31(i + vec3(1.0,1.0,1.0));
    
    // interpolated values in the different axis
    float nLLz = mix(vLLL, vLLH, f.z);
    float nLHz = mix(vLHL, vLHH, f.z);
    float nHHz = mix(vHHL, vHHH, f.z);
    float nHLz = mix(vHLL, vHLH, f.z);
    
    float nLyz = mix(nLLz, nLHz, f.y);
    float nHyz = mix(nHLz, nHHz, f.y);
    
    float nxyz = mix(nLyz, nHyz, f.x);
    
    return nxyz;

}

// rotate around the one axis left untouched.
mat2 rot2D( float angle){
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// is this a simple sphere? all we need?
float sdSphere(vec3 pos, float radius){
    return length(pos) - radius;
}

// can we analytically return normals as this is just spheres?
// TODO: normals for shadows and phong


// map might be a vec2 later, where we return distance and material ID or something
vec2 map(vec3 pos){
    int material = 0;
    float dist = 1000.0; // init as far??
    
    if (pos.y <= -5.0) {
        // very simple ground plane?
        return vec2(0.0, 1.0);
    }
    
    // different shells
    float ball = sdSphere(pos, 1.0); // blue water
    material = 2;
    float ball2 = sdSphere(pos, 1.0 + (0.05)*float(noise(pos*5.0)>0.5)); // green terrain?
    if (ball2 < ball) material = 3;
    dist = min(ball, ball2);
    
    
    vec3 cloud_pos = pos;
    cloud_pos.xz = pos.xz * rot2D(0.1*iTime);
    float cloud_start = sdSphere(pos, 1.2); // lower edge of clouds, white?
    float cloud_end = sdSphere(pos, 1.1 + (0.11)*float(noise(cloud_pos*8.0)>0.5)); // upper edge of clouds?
        
    float clouds = max(-cloud_start, cloud_end );
    if (clouds < dist) material = 4;
    //return vec2(clouds, 0.4);
    
    dist = min(dist, clouds);
    
    return vec2(dist, material);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/iResolution.y;
    vec2 m = (iMouse.xy * 2.0 - iResolution.xy)/iResolution.y;

    vec3 col = vec3(0.05);
    
    
    // camera setup
    // ro = ray origin
    vec3 ro = vec3(0.0, 0.0, -3.0);
    // rd = ray direction // third element is the fov/focal length? Inverse pyramid!
    vec3 rd = vec3(normalize(vec3(uv, 1.0)));
    
    // mouse control
    ro.yz *= rot2D(-m.y);
    rd.yz *= rot2D(-m.y);
    
    ro.xz *= rot2D(-m.x);
    rd.xz *= rot2D(-m.x);
    
    
    float total_dist = 0.0;
    // p current position, initialized at the ro?
    vec3 p = ro;
    int material_ID = 0;
    for (int i = 0; i < MAX_STEPS; i++){
        vec2 res = map(p);
        float d = res.x;
        material_ID = int(res.y);
        
        p += (d*rd);
        
        // break near and far?
        if (d > 100.0){
            material_ID = 0;
            break;
        }
        if (d < 0.001){
            break;
        }
        // fake ao indicator
        col.r += 0.02;
        total_dist += d;
    }
    
    
    // material coloring.
    if (material_ID >= 4) {
        // 4 -> terrain ~ whiteish
        col += vec3(0.8, 0.9, 0.9);
    }
    else if (material_ID >= 3) {
        // 3 -> terrain ~ green
        col += vec3(0.03, 0.6, 0.1);
    }
    else if (material_ID >= 2) {
        // 2 -> water ~ blue
        col += vec3(0.01, 0.02, 0.7);
    }
    else if (material_ID >= 1) {
        // 1 -> floor ~ brown
        col += vec3(0.3, 0.2, 0.1)*noise(p);
    }
    else {
        // noting as in distance.. fog?
        col = vec3(10.0/total_dist);
    }
    
    
    // col = vec3(noise(p));
    // col = vec3(noise(vec3(uv.x*30.0, iTime, uv.y*20.0)));
    fragColor = vec4(col,1.0);
}









// empty space to move the editor up :)







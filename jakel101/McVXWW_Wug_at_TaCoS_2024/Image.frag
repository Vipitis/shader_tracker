// Apache 2.0 licnese for this shader :)

#define EPS 0.001


mat2 rot2D( float angle){
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// root smooth minimum from @iq MIT license: https://www.shadertoy.com/view/DlVcW1
float smin( float a, float b, float k )
{
    k *= 2.0;
    float x = b-a;
    return 0.5*( a+b-sqrt(x*x+k*k) );
}

// rounded cone by @iq MIT license: https://www.shadertoy.com/view/Xds3zN
float sdRoundCone( in vec3 p, in float r1, float r2, float h )
{
    vec2 q = vec2( length(p.xz), p.y );
    
    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    float k = dot(q,vec2(-b,a));
    
    if( k < 0.0 ) return length(q) - r1;
    if( k > a*h ) return length(q-vec2(0.0,h)) - r2;
        
    return dot(q, vec2(a,b) ) - r1;
}

// capsule/stick/linesegment by @iq MIT license: https://www.shadertoy.com/view/Xds3zN
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - r;
}

// sphere from @iq MIT license: https://www.shadertoy.com/view/Xds3zN
float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

// solid angle from @iq MIT license: https://www.shadertoy.com/view/Xds3zN
float sdSolidAngle(vec3 pos, vec2 c, float ra)
{
    vec2 p = vec2( length(pos.xz), pos.y );
    float l = length(p) - ra;
	float m = length(p - c*clamp(dot(p,c),0.0,ra) );
    return max(l,m*sign(c.y*p.x-c.x*p.y));
}

// pyramid from @iq MIT license: https://www.shadertoy.com/view/Xds3zN
float sdPyramid( in vec3 p, in float h )
{
    float m2 = h*h + 0.25;
    
    // symmetry
    p.xz = abs(p.xz);
    p.xz = (p.z>p.x) ? p.zx : p.xz;
    p.xz -= 0.5;
	
    // project into face plane (2D)
    vec3 q = vec3( p.z, h*p.y - 0.5*p.x, h*p.x + 0.5*p.y);
   
    float s = max(-q.x,0.0);
    float t = clamp( (q.y-0.5*p.z)/(m2+0.25), 0.0, 1.0 );
    
    float a = m2*(q.x+s)*(q.x+s) + q.y*q.y;
	float b = m2*(q.x+0.5*t)*(q.x+0.5*t) + (q.y-m2*t)*(q.y-m2*t);
    
    float d2 = min(q.y,-q.x*m2-q.y*0.5) > 0.0 ? 0.0 : min(a,b);
    
    // recover 3D and scale, and add sign
    return sqrt( (d2+q.z*q.z)/m2 ) * sign(max(q.z,-p.y));;
}


// combine some primative shapes to get a 3D approximation of a Wug, including eyes and legs!
// res.x is the distance, res.y is the material ID, eyes and legs is ID 1.0; body is 2.0;
vec2 sdWug( vec3 p ) {
    float dist = float(0.0);
    float mat = 1.0;
    
    float height = 1.5;
    float scale = 1.1;
    
    //body
    float body = sdRoundCone(p, 0.7*height, 0.3*height, height);
    vec3 pyramidPos1 = p;
    pyramidPos1.xy *= rot2D(1.4);
    pyramidPos1.x -= -height;
    float pyramid1 = sdPyramid(pyramidPos1, scale*1.5);
    
    vec3 pyramidPos2 = p - vec3(-0.2,-.4,0.0);
    
    pyramidPos2.xy *= rot2D(-1.6);
    
    float pyramid2 = sdPyramid(pyramidPos2, scale*1.5);
    float pyramids = smin(pyramid1, pyramid2, 0.1);
    
    body = smin(body, pyramids, 0.4);
    
    // eyes
    vec3 eyePos = vec3(p.xy,abs(p.z)) - vec3(0.7, height-0.0, 0.4);
    float eye = sdSphere(eyePos, .25*scale);
    if (eye < body) mat = 2.0;
    dist = min(body, eye);
    
    // legs
    vec3 legPos = vec3(p.xy, abs(p.z)) - vec3(-0.3, -height-0.4, 0.5);
    float leg = sdCapsule( legPos, vec3(0.0), vec3(0.0,0.6,-0.1), 0.1);
    
    float foot = sdCapsule( legPos, vec3(0.0), vec3(0.6, 0.0, 0.1), 0.1);
    leg = smin(leg, foot, 0.05);
    if (leg < dist) mat = 2.0;
    dist = min(leg, dist);
    
    return vec2(dist, mat);
}


vec2 map( vec3 p ){
    float dist = float(0.0);
    float mat = 0.0;
    
    // ground is a plane just now
    float groundHeight = 2.0;
    float ground = p.y + groundHeight; 
    
    vec3 wugPos = vec3(p);
    // wugPos.z = 1.5 - mod(wugPos.z, 3.0); // <--- uncomment this line to get more of them!
    vec2 wug = sdWug(wugPos);
    dist = min(ground, wug.x);
    
    if (wug.x < ground) mat = wug.y; // if ground is closer than wug return wug material, else 0.0?
    
    return vec2(dist, mat);
}

vec3 calcNormal( in vec3 pos){
    vec2 e = vec2(EPS, 0.0);
    return normalize(vec3(  map(pos+ e.xyy).x - map(pos-e.xyy).x,
                            map(pos+ e.yxy).x - map(pos-e.yxy).x,
                            map(pos+ e.yyx).x - map(pos-e.yyx).x ) );
}


vec2 rayCast( in vec3 ro, in vec3 rd){
    float t = 0.0;                          //total distance travelled
    float m = -1.0; // base material ID -1.0 will be sky/miss
    // Raymarching loop
    int i;
    for (i=0; i<=100; i++){
        vec3 pos = ro + rd*t;                 // position along the ray
        vec2 h = map(pos);             // "hit"? currennt distance to next object in the scene
        m = h.y;
        if (h.x < EPS) break;               // early stop near
        t += h.x;                             // marching step
        
        if (t > 20.0) break;        // early stop far
    }
    if (t>20.0) m=-1.0;
    
    return vec2(t,m);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/iResolution.y;
    vec2 m = (iMouse.xy * vec2(4.0,2.0) - iResolution.xy)/iResolution.y;
    m.y -= 0.5;
    // Initialize
    vec3 ro = vec3(0.0, 0.0, 4.0);         // rayOrigin
    vec3 rd = normalize(vec3(uv, -0.8));       // rayDirection, value changes fov
    vec3 col = vec3(0.55,0.65,0.9) - 0.6*rd.y;           // sky color with gradient

    // mouse control
    if ((iMouse.x<=0.0)||(iMouse.y<=0.0)){m.x=-.5,m.y=-.4;};//quick hack to detect no mouse input for thumbnail
    m.x += iTime*0.25;
    ro.yz *= rot2D(m.y);
    rd.yz *= rot2D(m.y);
    
    ro.xz *= rot2D(m.x);
    rd.xz *= rot2D(m.x);
    
    
    vec2 res = rayCast(ro, rd);
    float dist = res.x;
    float mat = res.y;
    
    if (mat > -0.5){
        vec3 pos = ro + rd*dist;
        vec3 nor = calcNormal(pos);
        vec3 material = vec3(0.03,0.18,0.03); // + 0.03*sin(rd.x); // base baterial, albedo low for floor
        
        if (mat > 0.5) // ID 1.0 = wug
        {
            material = vec3(0.1, 0.1, 0.9); 
        }
        // should be else if, but I need to have the order correct
        if (mat > 1.5) // ID 2.0 = eyes, legs
        {
            material = vec3(0.03); // near black
        }
        
        
        vec3 sun_dir = normalize(vec3(1.6, 1.2, 0.7));                   // sun direction
        float sun_dif = clamp( dot(nor, sun_dir), 0.0, 1.0);             //diffused keylight?
        float sun_sha = step(rayCast( pos+nor*EPS, sun_dir ).y, 0.0); 
        float sky_dif = clamp( 0.5 + 0.5*dot(nor, vec3(0.0, 1.0, 0.0)), 0.0, 1.0); //diffused sky light, biased?
        
        col = material*vec3(1.0, 0.7, 0.5) * sun_dif * sun_sha;   // yellow sunlight
        col += material*vec3(0.0, 0.2, 0.4) * sky_dif;  // blue skylight
        
    }
    
    col = pow ( col, vec3(0.4545)); // gamma space - which one?
    
    fragColor = vec4(col,1.0);
}
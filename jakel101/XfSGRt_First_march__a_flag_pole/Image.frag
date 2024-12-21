// Apache 2.0 licnese for this shader :)

mat2 rot2D( float angle){
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// vertical cylinder from @iq MIT license: https://www.shadertoy.com/view/wdXGDr
float sdCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

// from @iq: https://iquilezles.org/articles/distfunctions/
float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// distance to the nearest object
float map( vec3 p ) {
    // ground is a plane just now
    float groundHeight = 1.0;    // ground at y = -1.0
    float ground = p.y + groundHeight; 
    
    // the "pole" is a Cylinder for now
    float poleHeight = 2.1;   
    vec3 polePos = vec3(0., -groundHeight + 0.5 * poleHeight, 0.);
    float poleRadius = 0.05;
    float pole = sdCylinder(p- polePos, poleHeight, poleRadius);
    
    // the "flag" is just a thin box right now
    vec3 flagShape = vec3(.8, 0.45, 0.025);
    vec3 flagPos = p - vec3(polePos.x, // flag starts in the center
                        polePos.y + poleHeight - flagShape.y, // flag height is linked to pol height and flag shape
                        polePos.z);
    // Flag moving down occasionally, always to half?
    flagPos.y += smoothstep(0.2, 0.8, sin(iTime* 0.73)) * poleHeight* 0.5;
                        
    float windDir = sin(iTime * 0.4); // * p.x; 
    // multiply by flagPos.x or something to make the sway stronger further out??? -tbd
    flagPos.xz *= rot2D(windDir); // first rotate
    flagPos.x -= flagShape.x;               // then offset to the side
    float flag = sdBox(flagPos, flagShape);
    
    
    return min(ground,min(pole,flag));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/iResolution.y;
    vec2 m = (iMouse.xy * 2.0 - iResolution.xy)/iResolution.y;
    
    // Initialize
    vec3 ro = vec3(0.0, 0.0, -4.0);         // rayOrigin
    vec3 rd = normalize(vec3(uv, 1));     // rayDirection
    vec3 col = vec3(0);                   // pixel color

    float t = 0.0;                          //total distance travelled
    
    // mouse control
    ro.yz *= rot2D(-m.y);
    rd.yz *= rot2D(-m.y);
    
    ro.xz *= rot2D(-m.x);
    rd.xz *= rot2D(-m.x);

    // Raymarching loop
    int i;
    vec3 p = vec3(0.0);
    for (i=0; i<=80; i++){
        p = ro + rd*t;                 // position along the ray
        float d = map(p);                   // current distance to next object in the scene
        
        t += d;                             // marching step
        
        if (d < 0.0005) break;               // early stop near
        if (d > 50.0) break;        // early stop far
    }
    
    // coloring, make sure to scale down to less than 1.0!!
    col.g = t * 0.05;

    col.r = float(i) * 0.05;
    col.b = p.z * 0.23;
    

    fragColor = vec4(col,1.0);
}
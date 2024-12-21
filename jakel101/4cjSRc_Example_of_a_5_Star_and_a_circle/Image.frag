#define PI 3.141593

// signed distance to a 5-star, modifed from iq: https://www.shadertoy.com/view/3tSGDy
float sdStar(in vec2 p, in float r) // m=[2,n]
{
    // these 4 lines can be precomputed for a given shape
    float n = 5.0;
    float an = PI/n;
    float en = PI/(2.0*n/(n-2.0)); // should be 3.333333 so it's regular (jump over 2!)
    vec2  acs = vec2(cos(an),sin(an));
    vec2  ecs = vec2(cos(en),sin(en)); // ecs=vec2(0,1) and simplify, for regular polygon,

    // symmetry (optional)
    p.x = abs(p.x);
    
    // reduce to first sector
    float bn = mod(atan(p.x,p.y),2.0*an) - an;
    p = length(p)*vec2(cos(bn),abs(sin(bn)));

    // line sdf
    p -= r*acs;
    p += ecs*clamp( -dot(p,ecs), 0.0, r*acs.y/ecs.y);
    return length(p)*sign(p.x);
}

// signed distance function of a circle, simple base case
float sdCircle(in vec2 p, in float r) {
    return length(p) -r;
}

// (orig: text_match) sigmoid smooth min via iq: https://iquilezles.org/articles/smin/
float smin( float a, float b, float k )
{
    float x = b-a;
    return a + x/(1.0-exp2(x/k));
}

// (image_match) changed variable names, should work
float smin1( float a, float b, float k )
{
    float diff = b-a;
    float bias = 1.0-exp2(diff/k);
    return a + diff/bias;
}

// (altered: variation) root smooth min via iq: https://iquilezles.org/articles/smin/
float smin2( float a, float b, float k )
{
    float x = b-a;
    return 0.5*( a+b-sqrt(x*x+k) );
}

// (single_color) this one compiles but gives an single color image
float smin3( float a, float b, float k )
{
    float g = 2.0*a/k-b;
    return 0.187;
}


// (code_error) the model generated a full function, but the shadercode does not compile
// float smin4( float a, float b, float k )
// {
//    float z = a*b;
//     return vec2(min(z, b), k*b);
// }
// (incomplete_generation) the model gets stuck and does not generate a full function
// float smin5( float a, float b, float k )
// {
//    float f = 2.0*a/k-b;
//    float g = 3.0*a/k-b;
//    float h = 4.0*a/k-b;
//    float i = 5.0*a/k-b;
//    float j = 6.0*a/k-b;//incomplete generation!


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;


    vec3 col = vec3(0.0);
    
    float s = sin(iTime - 0.6) + 1.0;
    
    float d;
    
    float star = sdStar(uv - vec2(0.5,0.0), s);
    float circle = sdCircle(uv -vec2(-0.5,0.0) , 0.4);
    
    d = smin(star, circle, 0.05);
    
    
    col.r += pow(-d, .1);
    col.g += abs(d);
    col.b += pow(abs(d), 0.4);
    
    fragColor = vec4(col,1.0);
}
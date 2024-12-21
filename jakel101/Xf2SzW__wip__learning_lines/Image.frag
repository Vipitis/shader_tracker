#define PHI 1.618033988749
#define TAU 6.283185307179586476925286766559

float hash1( float seed){
    return fract(11.5*seed*fract(PHI * 0.123));
}

// Basic noise via iq
float bnoise( in float x )
{    
    float i = floor(x);
    float f = fract(x);
    float s = sign(fract(x/2.0)-0.5);
    float k = fract(i*PHI);

    return s*f*(f-1.0)*((16.0*k-4.0)*f*(f-1.0)-1.0);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy * 2.0 -1.0;
    
    // hack cordinate space into polar?
    float r = length(uv);
    float a = atan(uv.y,uv.x);
    vec2 pc = vec2(r,a/TAU*8.0 - 0.175);
    uv = pc.yx - .4;
    
    float line;
    line = bnoise(uv.x * 5.0 + iTime) * 0.4;
    line *= 0.7; // scale vertical
    
    vec3 col = vec3(0.0);
    col += vec3(uv.y - line);
    col = abs(col); // does this count as an SDF?
    col *= 10.0; // thin the lines?
    col = 1.0 - clamp(col, 0.0, 1.0); //invert
    col *= 3.5;
    col = pow(col, vec3(1.4));
    
    // add some "color"
    col *= vec3(0.5, 0.2, 1.0);    
    fragColor = vec4(col,1.0);
}
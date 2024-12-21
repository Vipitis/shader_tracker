#define TAU 6.2831

// helpers
float hash21(float a, float b){
    return fract((a*5.421)*(b+2.876)*b);
}

float noise1(float s, float t){
    return mix(hash21(s, s*s), hash21(2.0*s, -1.0), abs(sin(t)));
}

//instruments
float bell(float f, float a, float t){
    return a*sin(TAU*f*t)*exp(-5.0*t);
}

float snare(float f, float a, float t, float d){
    return a*sin(exp(-TAU*t*f))*exp(-d*t)*noise1(f,t);
}

float triangle(float f, float a, float t){
    return (a*abs(4.0*f*mod(t,1.0/f)-2.0)-1.0)*exp(-7.0*t);
}



vec2 mainSound( int samp, float time )
{
    
    // add on to this for a lazy mix
    vec2 sig = vec2(0.0);
    
    sig += vec2(bell(660.0, 0.5, mod(time + 1.25, 2.0)));    
    sig += vec2(bell(440.0, 0.3, mod(time + 1.00, 2.0)));
    
    
    sig += vec2(triangle(22.0, .6, mod(time, 0.5)));
    
    sig += vec2(triangle(33.0, .8, mod(time, 2.0)));
    
    sig += vec2(snare(4.0, 0.3, mod(time + 1.75, 2.0), 1.0));
    
    
    return sig;
}
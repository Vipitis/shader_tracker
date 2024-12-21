// step 1: a funciton with an inout input and some other return value
float fn(inout float a) {
    a += 0.1;
    return 0.2;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // step 2: first variable that is vec2/vec3 (float works)
    vec2 cd = vec2(0.3, 0.4);
    
    // step 3: second variable is assigned to the return value, using first variable as args.
    float e = fn(cd.x);
    
    // Output to screen
    fragColor = vec4(e);
}
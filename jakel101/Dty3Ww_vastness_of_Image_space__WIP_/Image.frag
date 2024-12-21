float modSecs(float modulo)
{
    return mod(floor(iTime), modulo);
}

// an array of 13 int32 numbers can hold the 400bit number for us?
int[13] number;

bool get_bit(int idx)
{   
    // register of which idx of the array we are in
    int reg = idx >> 5;
    // remainder of which index in the specific int32 we are in
    int rem = idx & 0x1F;
    
    return ((number[reg] >> int(rem)) & 1) == 0;
}

bool get_bit_from_float(float inp, int idx)
{   
    return ((int(inp) >> idx) & 1) == 1;
}

void set_bit(bool val, int idx)
{
    // register of which idx of the array we are in
    int reg = idx >> 5;
    // remainder of which index in the specific int32 we are in
    int rem = idx & 0x1F;

    number[reg] |= (int(val) << rem);
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Define the resolution of the screen
    vec2 uv = fragCoord/iResolution.xy;

    vec2 fields = floor(uv * 20.0);
    
    float field_idx = fields.x + (fields.y * 20.0);

    // fill number with something "random"
    for (int i = 0; i < 13; i++)
    {
        // number[i] = 0xFA0AFA0A; // some funny pattern
        number[i] = int(fract(sin(floor(iTime)))*165191048.7*float(i+1)); // some "random" number constructor for now
    }

    // set_bit(true, (int(iTime)*2)); // not persistent?

    // Determine the color of the pixel based on its position
    // color.r (red) is one field at a time, walks around the whole screen in 400 seconds
    // color.g (green) does nothing right now (working on LSFR to run through all 400 bit of possible numbers randomly)
    // color.b (blue) is a binary counter of iDate.w (the seconds), counts up to 3600, but runs over at 32 bit.
    vec3 color = vec3(mod(field_idx - modSecs(400.0),400.0), get_bit(int(field_idx)), get_bit_from_float(iDate.w, int(field_idx)));

    // just look at red channel
    // color = vec3(color.r);
    
    // just look at green channel
    color = vec3(color.g);

    // just look at blue channel
    // color = vec3(color.b);

    // Set the color of the pixel
    fragColor = vec4(color, 1.0);
}
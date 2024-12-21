// Apache 2.0 no patents °!°


// shows the range from what happens with
// 1. negative bitshifts -16..-1]
// 2. defined bitshifts 0..31]
// 3. undefined bitshifts [32..
// 4. uint vs int (left vs right)
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;    
    
    // the initial value we are shifting (up)
    uint init = 1u;
    
    int x_shift = int(mod(uv.x * 128.0, 64.0))-16; // so it goes -16..48 twice
    vec3 col;
    // left half int
    if (uv.x < 0.5){
        int val = int(init);
        val <<= x_shift;
        col = vec3(float(log2(float(val)))<uv.y*32.0);
        // TODO: show the individual bits instead of just the highest bit value...
    }
    // right half uint
    else {
        uint val2 = uint(init);
        val2 <<= x_shift;
        col = vec3(float(log2(float(val2)))<uv.y*32.0);
        col.g *= 0.5; // indicate the uint side better
    }
    if (floor(uv.y*32.0) == 31.0) col.gb -= 1.0; // visualize the sign bit
    fragColor = vec4(col,1.0);
}
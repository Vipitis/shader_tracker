// Apache 2.0 no patents °!°

# define LOW -16
# define HIGH 48
// shows the range from what happens with
// 1. negative bitshifts LOW..-1]
// 2. defined bitshifts 0..31]
// 3. undefined bitshifts [32..HIGH
// 4. uint vs int (left vs right)
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;    
    
    // the initial value we are shifting (up)
    int init = floatBitsToInt((iMouse.x/iResolution.x)+iTime); // consider pausing
    
    const float range = float(abs(LOW-HIGH));
    int x_shift = int(mod(uv.x * range*2.0, range))+LOW; // so it goes LOW..HIGH twice
    int y_bit = int(uv.y*32.0); // sorta the y index
    
    vec3 col = vec3(0.06); // background == "off" color
    if (x_shift == 0) col.g = 0.5; // visualize the unshifted col
    bool bit_mask; // where bits are on or off....
    
    // TODO: calulate the bitmask for uint and int everywhere so you can check for differences!
    // left half int
    if (uv.x < 0.5){
        int val = int(init);
        val <<= x_shift;
        bit_mask = bool(val&(1<<y_bit)); // get the bit state per cell like this
        if (y_bit == 31) col.b = 0.5; // visualize the sign bit
    
    }
    // right half uint
    else {
        uint val2 = uint(init);
        val2 <<= x_shift;
        bit_mask = bool(val2&(1u<<y_bit));
        col.r = 0.5; // indicate the uint side better
    }
    
    
    vec3 on_col = vec3(0.95, 0.95, 0.5);
    col = mix(col, on_col, float(bit_mask)); // actual color happens here!
    // little "bulb" shape for the cells to make it easier to count?
    col *=vec3(1.4-length(fract(vec2(uv.x * 2.0 * range, uv.y * 32.0))-vec2(0.5))*1.0);
    //col.b = float(y_bit)/32.0;
    fragColor = vec4(col,1.0);
}
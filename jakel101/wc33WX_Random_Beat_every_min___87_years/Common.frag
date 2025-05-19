# define LIFE 6
// linetime of 2^n seconds per beat. Meant to be 6, but 0 or 1 can be used for testing

# define BPM 75.0
// change, recompile, play and then rewind!


// TODO: does this hash every repeat? I am not sure
// via https://www.shadertoy.com/view/XlGcRh
// https://www.pcg-random.org/
uint pcg(uint v)
{
	uint state = v * 747796405u + 2891336453u;
	uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
	return (word >> 22u) ^ word;
}

//TODO this is not at all accurate, but good enough for the demo
uint unixTime(){
    // deconstruct iDate back into a 32 bit unix timestamp:
    // iDate.x = years
    // iDate.y = months
    // iDate.z = days
    // iDate.w = seconds (including fractionals)
    // TODO month/day is off by one?
    uint time;
    
    uvec4 date = uvec4(iDate);
    date.x -= 1970u; // offset since Unix epoch!
    
    // lazy addition for now to get a value.
    // TODO: improve values.
    time += uint(365.24 * float(date.x )) * 24u * 60u * 60u;
    time += 30u*date.y * 24u * 60u * 60u;
    time += date.z * 24u * 60u * 60u;
    time += date.w;
    
    // On the Image pass we subtract the current runtime to get the time during compilation
    // this is meant to match the Sound pass compilation varaint in the future.
    //time -= uint(iTime); // can be out of sync -.-
    return time;

}

// 32 bit value interpreted at trinary by reading 2 bits with max(2)
// this should hash
uint beat_hash(){
    uint beat;
    
    // placeholder
    beat = unixTime();
    // to cause variations about every ~1 minute, we ignore the lowest 6 bits
    // our target space is 3^16 which needs less than 26 bits.
    uint seed = beat >> LIFE; // 6 bits to only change every 64 seconds, reduced for testing
    uint max_val = 43046720u; //3^16 -1
    seed = pcg(seed);
    //seed = seed%max_val; // so it rolls over?
    
    
    
    // convert to (binary-encoded) trineary representation:        
    int i;
    uint val = seed; // this is too imprecise? we lose precision
    for (i=0; i<16; i++){
        uint tri = val%3u;
        val = val/3u; // move to quotient for the next part
        // fill two bits at a time
        beat = beat << 2u;
        beat += uint(tri);//uint(tri);  
    }    
    return beat;
}

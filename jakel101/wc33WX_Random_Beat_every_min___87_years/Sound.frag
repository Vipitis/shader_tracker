# define TAU 6.2831

/* 
* I welcome any improvements to the instruments:
* the envelope is awfully cutoff
* better drum machines exist on Shadertoy alreay
* there is a progressively growing undertone, maybe it can be corrected
*/

// sorta useful as white noise for now
float noise(float t){
    // really bad idea but will do for now...
    uint u = floatBitsToUint(t);
    u = pcg(u);    
    float n =  uintBitsToFloat(u);
    n = clamp(n, -1.0, 1.0);
    return n;
}

//  TODO easier attach/pluck
float envelope_drum(float t, float target_t) {
    // this is a bad idea to cutoff the attack!!
    if (t < target_t + 0.025) return 0.0;
    
    // shifts the wave to the target place
    float t2 = t-target_t+0.05;
    // avoid the hard cuttoffs!
    return max(0.0, 5.0*t2*exp(-50.0*(t2-0.095)));
}

// TODO: better instruments
float kick(float t, float beat_time, float hit_time) {
    float env = envelope_drum(beat_time, hit_time);
    env = smoothstep(0.05, 0.95, env);
    float freq = 1.0-sinh((beat_time-hit_time)*TAU/2.0)*66.0;
    float tone = sin(TAU*freq);
    return 1.5*tone*env;
}

float snare(float t, float beat_time, float hit_time) {
    float env = envelope_drum(beat_time, hit_time);
    env = smoothstep(0.01, 0.9, env); // cut this off more
    // TODO: follow the concept: https://youtu.be/hULEn2_4Unw
    float freq = 1.0-tan((beat_time-hit_time)*TAU/2.0)*221.0;
    float tone = sin(TAU*freq);
    float noise = noise(t);
    return (0.02*noise+tone)*env;
}

float hihat(float t, float beat_time, float hit_time) {
    // TODO: better hi hat hit 
    float env = envelope_drum(beat_time, hit_time);
    env = tan(env);
    // fake gate
    float gate = smoothstep(0.20,0.80, env);
    float noise = noise(beat_time+t);
    noise = clamp(noise, 0.0, 1.0);
    
    float tone = sin(TAU * 3420.0 * t);
    tone *= sin(tone*8.20);
        
    
    float signal = (0.5*tone+noise)*gate*env;
    
    return signal;
}

// returns the instrument[0,1,2] type per measure
int player(int measure, uint beat){
    // read exactly the two bits in the 32-bit uint for this measure
    uint type = (beat >> 2*measure) & 3u;
    return int(type);
}


vec2 mainSound( int samp, float time )
{
    // there probably needs to be an additional time so the cutoff isn't this random!
    float beat_time = mod(time, (60.0*4.0/BPM))/(60.0*4.0/BPM);    
    // can we avoid the mod and instead do a gate/trigger?
    
    uint beat = beat_hash();
    
    float signal;
    
    int i;
    for (i=0; i<16; i++){
        int type = player(i, beat);
        float hit_time = float(i)/16.0;        
        float sound;
        if (type == 0) {
            sound = kick(time, beat_time, hit_time);
        }
        else if (type == 1) {
            sound = snare(time, beat_time, hit_time);
        }
        else if (type == 2) {
            sound = hihat(time, beat_time, hit_time);
        }
        // TODO: proper mixing
        signal += sound; 
    }
    
    // lots of fun with streo left over here.
    return vec2(signal);
}
# define TAU 6.2831

/* 
* I welcome any improvements to the instruments:
* the envelope is awfully cutoff
* better drum machines exist on Shadertoy alreay
* there is a progressively growing undertone, maybe it can be corrected
*/

//  TODO easier attach/pluck
float envelope(float t, float target_t) {
    // this is a bad idea to cutoff the attack!!
    if (t < target_t + 0.025) return 0.0;
    
    // shifts the wave to the target place
    float t2 = t-target_t+0.05;
    
    return max(0.0, 5.0*t2*exp(-20.0*(t2-0.09)));
}

// TODO: better instruments
float kick(float t, float env) {    
    return sin(TAU*180.0*t)*env;
}

float snare(float t, float env) {
    return sin(TAU*341.0*t)*env;
}

float hihat(float t, float env) {
    return sin(TAU*830.0*t)*env;
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
    uint beat = beat_hash();
    
    float signal;
    
    int i;
    for (i=0; i<16; i++){
        int type = player(i, beat);
        float env = envelope(beat_time, float(i)/16.0);
        float sound;
        if (type == 0) {
        // TODO: we could add all envs first and then call the instrument once instead
            sound = kick(time, env);
        }
        else if (type == 1) {
            sound = snare(time, env);
        }
        else if (type == 2) {
            sound = hihat(time, env);
        }        
        signal += sound; 
    }
    
    // lots of fun with streo left over here.
    return vec2(signal);
}
// Apache 2.0 no patents =_=

/*
* 
* Image pass holds the visualization, it's might get out of sync with the music for now :/
* Common pass holds the generation logic
* Sound pass plays the instruments for 3 minutes.
* recompile to get new patterns!
* this should only repeat every ~ 87 years so enjoy some unique patterns!
*/

# define LINE 0.005
// TODO: better pixel width

// informed by: https://youtu.be/PMltMdi1Wzg
float sdLineSegment(vec2 p, vec2 a, vec2 b) {
    // pos, start, end;
    float d;    
    // how far along we are between the points.    
    float h = clamp(dot(p-a, b-a)/(length(b-a)*length(b-a)), 0.0, 1.0);
    // point along the line between the two points
    vec2 q = mix(a, b, h);    
    //d = min(length(p-a),length(p-b)); // this actually doesn't matter anymore
    d = length(p-q); // debug, show point in between...
    return d;
}

// axis aligned box with center offset
float dBox(vec2 p, vec2 c, float h, float w){
    vec2 s = (p-c); // shift the center
    
    float d = length(max(abs(s) - vec2(h/2.0,w/2.0), 0.0));
    
    return d;
}


// helper functio to draw the blank lines/their mask
float blank(vec2 p) {
    // from, x:-0.85 to 0.85 (so 16 notes fit in nicely)
    // lines at y: -0.2, 0.1, 0.0, 0.1, 0.2
    // big lines at either end
    float mask = 0.0;    
    float width = 0.85;
    float vert_space = 0.1;
    
    // five horizontal lines
    int i;    
    for (i=-2; i<=2; i++){
        float height = vert_space*float(i);
        float l = sdLineSegment(p, vec2(width, height), vec2(-width, height));
        mask += smoothstep(LINE, 0.0, l);
    }
    
    // maybe use rectanle instead?
    float left = dBox(p, vec2(-width, 0.0), 0.01, vert_space*4.0);
    float right = dBox(p, vec2(width, 0.0), 0.01, vert_space*4.0);
    mask += smoothstep(LINE, 0.0, left);
    mask += smoothstep(LINE, 0.0, right);
    
    return mask; //step(0.5, mask); // step to make it more solid (really whacky)
}


// helper function to the top of the beamed notes
float beams(vec2 p) {
    // should be double beamed 1/16th?
    // from like -0.8 to -0.5; -0.4 to 0.0; ...?
    float mask;
    float height = 0.4;
    int i;
    for (i=0; i<4; i++){
        float start = -0.71 + float(i)*0.4;
        float l1 = dBox(p, vec2(start + 0.15, height + 0.05), 0.3, 0.03); 
        float l2 = dBox(p, vec2(start + 0.15, height), 0.3, 0.015); 
        mask += smoothstep(LINE, 0.0, l1);
        mask += smoothstep(LINE, 0.0, l2);
    }    
    
    return mask;    
}

// draw notes (masks)
float note(vec2 p, int time, uint type) {
    // type: 0 - kick, 1 - snare, 2 - hi hat
    // kick between 1 and 2 (height -0.3)
    // snare is between 3 and 4 (height 0.1)
    // hi hat is a ghost note (X) above 5 (height 0.5)
    // time is 0..16 at 0.1 intervals        
    float mask;
    float size = 0.04;
    float x = -0.75 + float(time)*0.1;
    float y = -0.15 + float(type)*0.2; // height
    
    
    float dist_note;
    float stem_bot = y;
    if (type > 1u){
        // hh ghostnote!
        float l1 = sdLineSegment(p, vec2(x+size,y+size), vec2(x-size,y-size));        
        float l2 = sdLineSegment(p, vec2(x+size,y-size), vec2(x-size,y+size));       
        dist_note = min(l1, l2);
        stem_bot += size;
    } 
    else {
        // TODO: little twist!
        dist_note = length(p-vec2(x,y)) - size;
    }
    float stem_dist = sdLineSegment(p, vec2(x+size, stem_bot), vec2(x+size, 0.45));
    
    mask += smoothstep(LINE, 0.0, min(dist_note, stem_dist));
    //mask += smoothstep(LINE, 0.0, stem_dist);
    return mask;
    
}

// mask again...
float notes(vec2 p, uint beat){
    int i;
    float mask;
    for (i=0; i<16; i++){
        uint type = beat & 3u; // select lowest two bits
        type = min(type, 2u); // this shouldn't exist anyway.
        beat = beat >> 2; // shift to bits out for next step
        float note_mask = note(p, i, type);
        mask += note_mask;
    }
    return mask;
}


// vizualize the BPM?
float indicator(vec2 p){
    float mask;
    float beat_time = mod(iTime, (60.0*4.0/BPM))/(60.0*4.0/BPM); // for test
    
    vec2 pos = vec2(-0.75 + beat_time*(2.0*0.75), -0.5);
    
    float d = length(p-pos);
    mask = smoothstep(0.1, 0.0, d);
    return mask;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    uint beat = beat_hash();
    vec2 uv = fragCoord/iResolution.xy;    
    uv -= vec2(0.5);
    uv *= 2.0;
    
    float line_dist = sdLineSegment(uv, vec2(0.85, 0.3), vec2(-0.85, 0.3));

    vec3 col = vec3(0.95, 0.98, 0.90);
    
    float bg_lines = blank(uv);
    float tops = beams(uv);
    float notes_mask = notes(uv, beat);
    float indicator_mask = indicator(uv);
    col = mix(col, vec3(0.01), bg_lines);
    col = mix(col, vec3(0.02), tops);
    col = mix(col, vec3(0.03), notes_mask);    
    col = mix(col, vec3(0.85, 0.23, 0.02), indicator_mask);
    fragColor = vec4(col,1.0);
}
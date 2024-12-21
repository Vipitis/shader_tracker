// Apache 2.0 no patetns°^° remixes welcome!
/* Fragment shader implementation of the TM Rave plugin for Trackmania
* link to original plugin: https://openplanet.dev/plugin/tmrave
* Meant for your live coding sessions where you want a bit more to show for the audience
* no more pausing time while coding!
* reference implementation at https://github.com/TheMatrixPill/tmrave/tree/main/source (MIT licensed)
* default settings are hard coded here: 2 lights, two corners, 0.2 intensity, no randomness
*/
#define PI 3.14159
vec4 rave(vec2 uv){
    // uv is expected to be screen space from 0.0 to 1.0, aspect ratio irrelevant.
    float width = 0.15;
    float edge = 1.5/iResolution.y;
    
    // top left
    float phase1 = abs(fract(iTime)-0.5)*PI;
    vec2 pos1 = vec2(0.0, 1.0);
    vec2 n1 = vec2(sin(phase1 - width), cos(phase1 - width));
    vec2 n2 = vec2(sin(phase1 + width), cos(phase1 + width));
    float e1 = dot(uv-pos1, n1);
    float e2 = dot(uv-pos1, n2);
    float mask1 = clamp(smoothstep(edge, 0.0, max(e1,-e2)), 0.0, 1.0);
    
    // TODO: can you not repeat yourself ... will sleep through the idea once.
    // top left
    float phase2 = (abs(fract(iTime+0.5)-0.5)+0.5)*PI;
    vec2 pos2 = vec2(1.0, 1.0);
    vec2 n3 = vec2(sin(phase2 - width), cos(phase2 - width));
    vec2 n4 = vec2(sin(phase2 + width), cos(phase2 + width));
    float e3 = dot(uv-pos2, n3);
    float e4 = dot(uv-pos2, n4);
    float mask2 = clamp(smoothstep(edge, 0.0, max(e3,-e4)), 0.0, 1.0);
    
    float mask = mask1 + mask2;
    // RGB rotation like this?
    vec4 col = vec4(normalize(sin(PI*(iTime+vec3(0.0, 2.0/3.0, 4.0/3.0)))), 1.0);
    col *= mask;
    col *= 0.2; // default light intensity
    return col;
}

// your normal main funciton
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = vec3(0.05);
    // your normal output
    fragColor = vec4(col,1.0);
    // sneaky addition of party lights, do this early for enjoyment!
    fragColor += rave(fragCoord/iResolution.xy);
}
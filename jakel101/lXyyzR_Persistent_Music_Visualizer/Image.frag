// Apache 2.0 no patents `.´

// Image pass is mainly used for displaying the Buffer A "background"
// Visualizer is purely done in Buffer A!
// to change the music or try something different, change Channel1 in Buffer A!

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;

    vec4 bg = texture(iChannel0, uv);
    
    fragColor = vec4(bg.rgb, 1.0);
}
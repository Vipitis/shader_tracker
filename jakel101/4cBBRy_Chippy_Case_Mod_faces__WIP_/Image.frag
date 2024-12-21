// Apache 2.0 for this shader, but the original images might be copyrighted by Intel.



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float short_edge = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord * 2.0 - iResolution.xy)/short_edge;
    uv *= 1.1; // lazy scale/camera
    uv += vec2(sin(iTime), cos(iTime))*0.034;
        
    
    // base background (LED is on?)
    vec3 col = vec3(0.01, 0.8, 0.23);
    
    // 1 pixel is 4 LEDs
    // IDs from
    vec2 pixelID = floor(uv*float(PIXELS/2));
    // every single LED from 0 to 1 in x and y
    vec2 LED_space = fract(uv*float(LEDs/2));
    
    // -1.0 outside the area, otherwise from (0 to 1 in 32 steps)
    vec2 pixel_space = (pixelID + float(PIXELS/2)) / float(PIXELS);
    
    // enforce the outer edge, needs a refactor
    if (pixel_space.x >=1.0) {
        pixel_space.x = -1.0;
    }
    if (pixel_space.y >=1.0) {
        pixel_space.y = -1.0;
    }
    
     
    if (pixel_space.x < 0.0 || pixel_space.y < 0.0) {
        // the outside area is just bluish for now.
        col = vec3(0.2, 0.4, 0.6);
        if ((abs(uv.x) > 1.3) && (abs(uv.y) < 0.4)) {
            // gold parts for the SMDs?
            col = vec3(0.7, 0.8, 0.1);
        }
    }
    else {
        
        // temporal LED visualizer
        col.rgb *= 1.4 - length(LED_space-vec2(0.5));
        // sample from the Buffer A (in iChannel0). With half a pixel offset to sample the center of those pixels.
        float half_pixel = (1.0/float(PIXELS*2));
        vec4 c0 = texture(iChannel0, (pixel_space + half_pixel));
        float on_pixels = step(0.5, c0.r); // quickly ensure binary output using threshold
        
        // always on outer border (2 LEDs, 1 pixel)
        float border_width = (1.0/(float(PIXELS)-1.0));
        if ((pixel_space.x > (1.0 - border_width)) ||
            (pixel_space.y > (1.0 - border_width)) ||
            (pixel_space.x < 0.5 * (border_width)) ||
            (pixel_space.y < 0.5 * (border_width)) ){
            on_pixels = 1.0;
        }
        
        // simulate on/off LEDs
        col = mix(col, 0.1*col, 1.0-on_pixels);
        

    }
    
    fragColor = vec4(vec3(col),1.0);
}
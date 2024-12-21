void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy * 2.0 -1.0;

    
    vec2 field = 3.0* vec2(uv.x*fract(-iTime*.5), uv.y -abs(sin(iTime*4.0))+1.0);
    // fold it?
    field *= 3.5* mod(abs(field), .5);
    field.x /= 2.0*uv.x;
    
    vec3 col = vec3(0.0);
    col.r += abs(field.y*field.x)*abs(sin(iTime/.2)+0.5);
    col.g += abs(field.y*field.x)*abs(sin(iTime/.25)+0.3);
    col.b += abs(field.y*field.x)*sin(iTime+1.25/.5)-0.1;
    

    // Output to screen
    fragColor = vec4(col,1.0);
}
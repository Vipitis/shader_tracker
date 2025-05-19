void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    
    if (uv.y > 0.5) (uv.x-=0.5);
    
    
    vec3 col;
    
    col.r = uv.x;
    col.g = (float(int(uv.x*255.0+0.5)))/255.0;   
    col.b = (float(trunc(uv.x*255.0+0.5)))/255.0;    
    
    fragColor = vec4(col,1.0);
}
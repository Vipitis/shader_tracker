// 1. declare constant integers

const int ID_left = 0;
const int ID_right = 1;


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = 2.0 * fragCoord/iResolution.xy;
    
    int side = int(uv.x);
 
    vec3 col = vec3(0.2);
    
    // 2. switch case on an int
    switch(side)
    {
    // 3. use those constants 
    case ID_left:
    {
        col *= 4.0;
    }
    case ID_right:
    {
        col *= 2.0;
    }
    }

    fragColor = vec4(col,1.0);
}
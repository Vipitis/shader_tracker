// forked from https://www.shadertoy.com/view/tXV3Rw
// changes:
// parameterized colors
// expanded style to fit mine...
// made smaller, changed colors,
// added little glow animation

// yes, join the Discord!! https://discord.gg/XtmMN6E
// it's official, see the bottom left corner


// goal is to get the apple logo kinda look, ref by 
// https://discord.com/channels/578696555612209173/579528698164805634/1395607001274515508

float sdEllipse(vec2 p, vec2 r)
{
    float f = length(p / r),
          g = length(p / r / r);
    
    return f * (f - 1.) / g;
}

float sdDiscord(vec2 p)
{
    p.x = abs(p.x);
    
    float d = length(p + vec2(0, .52)) - .91;
          d = max(d, length(p - vec2(0, .41)) - .83);
          d = max(d, length(p - vec2(.82, .09)) - .74);
          d = max(d, min(.54 - length(p - vec2(0, .21)), 
                         -(.81 * p.x + p.y + .03) / length(vec2(.81, 1))));
          d = min(d, max(length(p - vec2(0, .3)) - .59,
                         length(p + vec2(0, .36)) - .7));
          d = max(d, length(p + vec2(.34, .16)) - .84);
          d = max(d, -sdEllipse(p - vec2(.165, -.038), vec2(.09, .1)));
    
    return d;
}

void mainImage(out vec4 fragColor, vec2 fragCoord)
{
    vec2 uv = (fragCoord - .5 * iResolution.xy) / iResolution.y;
    
    float d = sdDiscord(uv*2.0);
    
    vec3 logo_col = vec3(0.878, 0.89, 1.0);
    vec3 back_col = vec3(0.345, 0.396, 0.949);
    vec3 dark_col = vec3(0.07, 0.07, 0.08); //~#121214

    // cheap glow
    float glow = exp(-d*50.0);
        
    vec3 col = mix(logo_col, dark_col, smoothstep(-1., 1., d * iResolution.y));
    col += glow*((sin(iTime)*0.4)+0.5);
    
    fragColor = vec4(col, 1.0);
}
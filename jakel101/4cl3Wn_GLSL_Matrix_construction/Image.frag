void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // "identity" matrix
    mat2 a = mat2(0.1);
    
    // from vec2: 1 does not work, 2 works
    // mat2 b1 = mat2(vec2(0.2));
    mat2 b2 = mat2(vec2(0.2), vec2(0.2));
    
    // with two floats
    mat2 c = mat2(0.3, 0.3, 0.3, 0.3);
    
    // with a vec4
    mat2 d = mat2(vec4(0.4));
    
    // some mixture of vec2 and float: e1 and e2 aren't enough components, e3-e5 work
    // mat2 e1 = mat2(vec2(0.5), 0.5);
    // mat2 e2 = mat2(0.5, vec2(0.5));
    mat2 e3 = mat2(vec2(0.5), 0.5, 0.5);
    mat2 e4 = mat2(0.5, vec2(0.5), 0.5);
    mat2 e5 = mat2(0.5, 0.5, vec2(0.5));
    mat2 e6 = mat2(0.5, 0.5, 0.5, vec2(0.5));
    
    vec4 col = vec4(a+b2+c+e3+e4+e5+e6);
    // Output to screen
    fragColor = vec4(col);
}
// Apache 2.0 free for all!


// third expression in a for loop "loop-expression" can contain multiple statements.
// it's evaluated after the loop body. And the variables stay available outside the namespace.
// OpenGL spec: https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.60.pdf Chapter 6.3
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;

    float a = 1.0;
    float b = 0.0;
    
    // right side
    if (uv.x >= 0.5) {
        // this variant has the iterator increment first and the external statements second
        for (int i = 0; i < 50; i+=1, b+=0.01) {
            a -= 0.01;
        }
    }
    //left side
    else {
        // here the parts are flipped, it should be equivalent.
        for (int i = 0; i < 50; b+=0.01, i+=1) {
            a -= 0.01;
        }
    }

    fragColor = vec4(a, b, 0.0, 1.0);
}
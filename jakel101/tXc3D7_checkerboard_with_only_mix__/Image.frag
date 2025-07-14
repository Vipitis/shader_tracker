/*#=#=#=#=#=#=#=#=#=#=#=#=#=#=
*  The One Function Challenge
* #=#=#=#=#=#=#=#=#=#=#=#=#=#=
* 
* only use a single built in function
*
* !RULES:
* + constructors, literals, uniforms are OKAY
* + array subscript and swizzling are FINE
* - functions and operators (including unary -, comparison) are NOT ALLOWED
* ~ control flow (for, while, if, else, ...) is ALRIGHT (but can we do without?)
* LIMITATIONS:
* > since there will be no subsitutes for texture sampling or bitcasting,
* > it will be Image pass only, and no input Channels (open for debate)
*
*
* /\/\/\/\/\/\/\/\/\/\/\/\/\/\
*   First Edition: only mix
* \/\/\/\/\/\/\/\/\/\/\/\/\/\/
*
* https://registry.khronos.org/OpenGL-Refpages/es3.0/html/mix.xhtml
* >> mix(a,b,x) = a*(1-x) + b*x
* We have recently been told to not use mix as an optimization:
* https://iquilezles.org/articles/gpuconditionals/ so hear me out.
* What if we ONLY use mix? Contributions, Submissions and Improvements welcome!
* 
* self link: https://www.shadertoy.com/view/tXc3D7
*/




// the following is my attempt to do at least a checkerboard and see how far I can go.
// If you don't want to be spoiled and have the fun of discovery yourself, don't scroll down!
// thanks to @Coderizer for brainstorming the start, @Cottrezz and @diatribes for feedback.
// please join the discussion below or better yet on the official Discord.
// yes there is an official Shadertoy discord, scroll down on the website invite link is bottom left corner
// link to where my idea started (and discussion followed):
// https://discord.com/channels/578696555612209173/578696556069257231/1389206125584449697


// just as a joke, we can even define mix by it's implementation
# define MIX(a,b,x) (a*(1-x) + b*x)

// arithmetic
# define MUL(a,b) mix(0.0, a, b)
# define NEG(a) mix(a, 0.0, 2.0)
# define ADD(a,b) MUL(mix(a,b, 0.5), 2.0)
# define SUB(a,b) ADD(a, NEG(b))
// DIV still missing (without some kind of loop)

// logic
# define NOT(a) bool(mix(1.0, 0.0, float(bool(a))))
# define OR(a,b) bool(ADD(float(bool(a)), float(bool(b))))
# define AND(a,b) NOT(OR(NOT(a), NOT(b)))
# define XOR(a,b) AND(OR(a,b), NOT(AND(a,b)))

// conditionals
# define EQ(a,b) bool(NOT(bool(SUB(a,b))))


// shader specific
# define FLOOR(a) float(int(a))
# define FRACT(a) SUB(a,FLOOR(a))
# define STEP(a,x) float(bool(uint(ADD(SUB(x,a),1.0))))
// STEP also works as LEQ (less eqaul than) I think
// NOTICE: uint(-1.0) is undefined behaviour and therefore not the greatest resource

// exapand formulas to vectors where needed.
# define MUL2(a,b) vec2(MUL(a.x, b.x), MUL(a.y, b.y))
# define FRACT2(a) vec2(FRACT(a.x), FRACT(a.y))


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // I wanted to have it be an 8x8 board but game up here
    float cell_width = MUL(iResolution.x, 0.25);
    float cell_height = MUL(iResolution.y, 0.25);
    
    float cell_x = STEP(MUL(iResolution.x, 0.5), fragCoord.x);
    float cell_y = STEP(MUL(iResolution.y, 0.5), fragCoord.y);
    
    vec3 col;
    
    col = vec3(XOR(cell_x, cell_y));    
    fragColor = vec4(col,1.0);
}
void Function(in sampler2D myTexture);
void Function2(sampler2D myTexture);

vec4 invertedSampler(in sampler2D s, in vec2 uv) {
    uv *= vec2(1.0, -1.0);
    return texture(s, uv);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec4 c0 = invertedSampler(iChannel0,uv);
    fragColor = c0;
}
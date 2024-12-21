
// constant
const float[] a = float[](0.0, 1.0, 2.0, 3.0);
const float[] b = float[4](0.1, 1.1, 2.1, 3.1);
const float[4] c = float[](0.2, 1.2, 2.2, 3.2);
const float[4] d = float[4](0.3, 1.3, 2.3, 3.3);

// not declared constant
float[] e = float[](0.4, 1.4, 2.4, 3.4);
float[] f = float[4](0.5, 1.5, 2.5, 3.5);
float[4] g = float[](0.6, 1.6, 2.6, 3.6);
float[4] h = float[4](0.7, 1.7, 2.7, 3.7);


float avg4( float arr[4]){
    float sum;
    sum = arr[0];
    sum += arr[1];
    sum += arr[2];
    sum += arr[3];
    return sum /float(arr.length());
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;

    // vec3 col = vec3(0.25 * avg4(a));
    // vec3 col = vec3(0.25 * avg4(b));
    // vec3 col = vec3(0.25 * avg4(c));
    vec3 col = vec3(0.25 * avg4(d));
    // vec3 col = vec3(0.25 * avg4(e));
    // vec3 col = vec3(0.25 * avg4(f));
    // vec3 col = vec3(0.25 * avg4(g));
    // vec3 col = vec3(0.25 * avg4(h));
    // vec3 col = vec3(0.123);
    
    fragColor = vec4(col,1.0);
}
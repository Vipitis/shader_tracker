// functions I need for the simulation and the vizualization - they get to be shared here!

# define PI 3.141592


// zero seems to be up and 1 is donw -.-
vec2 Polar2Cartesian(float rot, float dist){
    rot -= 0.5; // is this even correct anymore?
    rot *= PI;    
    vec2 res = vec2(cos(rot)*dist, sin(rot)*dist);    
    return res;
}

vec2 Cartesian2Polar(vec2 pos){
    float rot, dist;
    dist = length(pos);
    rot = atan(pos.y, pos.x);
    rot /= PI;
    rot += 0.5;
    return vec2(rot, dist);
}

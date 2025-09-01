// a few shared things
# define RADIUS 0.25
# define BALL_SIZE RADIUS


# define CELLS ivec2(64)
# define HEIGHT_SCALE 0.5


ivec2 worldToCell(vec3 p) {
    // move world space again
    p += 1.0;
    p *= 0.5;
    ivec2 st = ivec2((p.xy*vec2(CELLS.xy)));
    // TODO: find an actual solution to the edge cases!
    st = min(st, CELLS -1);
    return st;
}

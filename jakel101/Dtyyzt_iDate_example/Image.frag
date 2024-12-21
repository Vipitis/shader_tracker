float D(vec2 p, float n) {  // display digit
    int i=int(p.y), b=int(exp2(floor(30.-p.x-n*3.)));
    i = ( p.x<0.||p.x>3.? 0:
    i==5? 972980223: i==4? 690407533: i==3? 704642687: i==2? 696556137:i==1? 972881535: 0 )/b;
 	return float(i-i/2*2);
}
float N(vec2 p, float v) {  // display number
    for (float n=3.; n>=0.; n--)  // print digit 3 to 0 ( negative = fractionals )
        if ((p.x-=4.)<3.) return D(p,floor(mod(v/pow(10.,n),10.))); 
    return 0.;
}    


void mainImage( out vec4 O, vec2 U )
{
    U /= iResolution.xy;
    
    float years = iDate.x; // s = 2050
    float months = iDate.y; // s = 12
    float days = iDate.z; // s = 31
    float hours = floor(iDate.w/3600.0); // s = 60
    float mins = floor(mod(iDate.w/60.0, 60.0)); // s = 60
    float seconds = floor(mod(iDate.w,60.0)); // s = 60
    float milisecs = fract(iDate.w)*1000.0; // s = 1000
    
    
   
    
    O = vec4(U.x < milisecs/1000.0); // bars
    
    O += N(vec2(U.x,mod(U.y,1./7.))*iResolution.xy/6., months) *vec4(1,-1,-1,1); //digits

}
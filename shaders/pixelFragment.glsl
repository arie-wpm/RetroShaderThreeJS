uniform sampler2D mainTex;
uniform vec2 resolution;
uniform float pixelSize;
uniform int downscaleSteps;
uniform int bayerLevel;
uniform float spread;
uniform int redColourCount;
uniform int blueColourCount;
uniform int greenColourCount;
uniform bool pixelate;
varying vec2 vUv;
const int bayer2[4] = int[](0, 2, 3, 1);
const int bayer4[16] = int[](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
const int bayer8[64] = int[](0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21);
float GetBayer2(int x, int y) {
    return float(bayer2[int((x % 2)), (int((y % 2)) * 2)]) * (1.0 / 4.0) - 0.5;
}
float GetBayer4(int x, int y) {
    return float(bayer4[int((x % 4)), int((y % 4) * 4)]) * (1.0 / 16.0) - 0.5;
}

float GetBayer8(int x, int y) {
    return float(bayer8[int((x % 8)), int((y % 8) * 8)]) * (1.0 / 64.0) - 0.5;
}
void main(){

    if(pixelate){
        vec4 col = texture2D(mainTex, vUv);
        vec2 pixelatedUV;
        float currentPixelSize = pixelSize;

        for(int i = 0; i < downscaleSteps; i++){
            pixelatedUV = (floor(vUv * resolution / currentPixelSize) * currentPixelSize) / resolution;
            col = texture2D(mainTex, pixelatedUV);
            currentPixelSize /= 2.0;
        }

        int x = int(resolution.x);
        int y = int(resolution.y);
        float bayerValues[3] = float[3](0.0,0.0,0.0);
        bayerValues[0] = GetBayer2(int(x),int(y));
        bayerValues[1] = GetBayer4(int(x),int(y));
        bayerValues[2] = GetBayer8(int(x),int(y));

        vec4 bayerOutput = col + spread *0.5 * bayerValues[bayerLevel];
        bayerOutput.rgb = clamp(bayerOutput.rgb, 0.0, 1.0);


        bayerOutput.r = floor((float(redColourCount) - 1.0) * bayerOutput.r + 0.5) / (float(redColourCount) - 1.0);
        bayerOutput.g = floor((float(greenColourCount) - 1.0) * bayerOutput.g + 0.5) / (float(greenColourCount) - 1.0);
        bayerOutput.b = floor((float(blueColourCount) - 1.0) * bayerOutput.b + 0.5) / (float(blueColourCount) - 1.0);
        gl_FragColor = bayerOutput;}

    else{
        gl_FragColor = texture2D(mainTex, vUv);
    }
}
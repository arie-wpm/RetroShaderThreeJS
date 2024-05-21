import * as THREE from "three"
import {string} from "three/examples/jsm/nodes/shadernode/ShaderNode";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as dat from 'dat.gui';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = -100;
camera.position.x = 100;
camera.position.y = 50;
camera.rotation.setFromVector3(new THREE.Vector3(-2.2,0.8,2.4)); 
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const orbitControls = new OrbitControls(camera, renderer.domElement);
let rotate: boolean = true;
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
let model;
let shaderMat: THREE.ShaderMaterial;
let shaderMaterials = [];
let models = [];
let gui = new dat.GUI({
    name: "Shader Options"
});
const shaderParams = {
    pixelate: true,
    pixelSize: 8,
    bayerLevel: 1,
    downscaleSteps: 2,
    ditherSpread: 0,
    colourCount:64,
    dithering: true,
    rotate: false
}

let _VS: string  = `
varying vec2 vUv;
void main(){
vUv = uv;
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}
`;
let _FS: string = `
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
`;
InitSceneObjects();
function CreatePixelShaderMaterial(){
    return new THREE.ShaderMaterial({
        uniforms:{
            pixelate: {value: true},
            mainTex: {value: null},
            resolution: {value: null},
            pixelSize: {value: shaderParams.pixelSize},
            downscaleSteps:{value: 8},
            bayerLevel: {value: shaderParams.bayerLevel},
            spread: {value: shaderParams.ditherSpread},
            redColourCount: {value: shaderParams.colourCount},
            greenColourCount: {value: shaderParams.colourCount},
            blueColourCount: {value: shaderParams.colourCount},
        },
        vertexShader: _VS,
        fragmentShader: _FS,
    })
}

function InitSceneObjects(){
    
    LoadModel("./Models/bulbasaur/scene.gltf", new THREE.Vector3(100,100,100),new THREE.Vector3(0,0,0));
    LoadModel("./Models/red_dragon_bust/scene.gltf", new THREE.Vector3(25,25,25),new THREE.Vector3(200,10,0))
    LoadModel("./Models/sword/scene.gltf", new THREE.Vector3(1000,1000,1000),new THREE.Vector3(-100,10,0))
}

function LoadModel(pathToModel, scale, position){
    gltfLoader.load( pathToModel, function( gltf ){
        shaderMat = CreatePixelShaderMaterial();
        shaderMaterials.push(shaderMat);
        model = gltf.scene;
        model.traverse((o) => {
            if (o.isMesh && o.material.map){
                o.material.map.minFilter = THREE.NearestFilter;
                o.material.map.magFilter = THREE.NearestFilter;
                o.material.map.wrapS = THREE.RepeatWrapping;
                o.material.map.wrapT = THREE.RepeatWrapping;

                shaderMat.uniforms.mainTex.value = o.material.map;
                shaderMat.uniforms.resolution.value = new THREE.Vector2(
                    o.material.map.image.width,
                    o.material.map.image.height
                );
                shaderMat.uniforms.pixelSize.value = shaderParams.pixelSize;
                o.material = shaderMat;
            }
        });
        scene.add(gltf.scene);
        gltf.scene.scale.set(scale.x, scale.y,scale.z);
        gltf.scene.position.set(position.x, position.y,position.z);
        models.push(model);
    });
}

function CreateCube(){
    let cubeGeometry = new THREE.BoxGeometry(20,20,20);
    let cubeMat = CreatePixelShaderMaterial();
    const cubeTexture =  textureLoader.load( "./Textures/rainbowTex.jpg", function( texture){
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        cubeMat.uniforms.mainTex.value = cubeTexture;
        cubeMat.uniforms.resolution.value = new THREE.Vector2(texture.image.width, texture.image.height);})
    var cubeMesh = new THREE.Mesh(cubeGeometry, cubeMat);
    scene.add(cubeMesh);
        
}
function LogCameraPos(event){
    if (event.keyCode === 80){
        console.log(camera.position.x, camera.position.y, camera.position.z);
        console.log(camera.rotation);
    }
}

document.addEventListener("keydown", LogCameraPos);


const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);


function animate() {
    requestAnimationFrame(animate);
    if (shaderParams.rotate){
        models.forEach((model) => {
            model.rotation.y += 0.01;
        })
    }
    renderer.render(scene, camera);
}
window.addEventListener( 'resize', Resize);
function Resize( ){
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width,height);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.render(scene,camera);
}

function UpdateShaderValues(){
    shaderMaterials.forEach((shaderMat)=> {
        shaderMat.uniforms.pixelSize.value = shaderParams.pixelSize;
        shaderMat.uniforms.bayerLevel.value = shaderParams.bayerLevel;
        shaderMat.uniforms.spread.value = shaderParams.ditherSpread;
        shaderMat.uniforms.redColourCount.value = shaderParams.colourCount;
        shaderMat.uniforms.blueColourCount.value = shaderParams.colourCount;
        shaderMat.uniforms.greenColourCount.value = shaderParams.colourCount;
        shaderMat.uniforms.pixelate.value = shaderParams.pixelate;
        shaderMat.needsUpdate = true;
    })
}

gui.add(shaderParams,'pixelate', 1,256).onChange(UpdateShaderValues).name("Enable Pixel Filter");
gui.add(shaderParams,'pixelSize', {Level1: 256, Level2: 512, Level3:1024}).onChange(UpdateShaderValues).name("Pixelate Level");
gui.add(shaderParams,'bayerLevel', {Bayer2: 0, Bayer4: 1, Bayer8:2}).onChange(UpdateShaderValues).name("Bayer Matrix");
gui.add(shaderParams,'ditherSpread', 0.0,1.0).onChange(UpdateShaderValues).name("Dither Spread");
gui.add(shaderParams,'colourCount', 1,64).onChange(UpdateShaderValues).name("Colour Cap");
gui.add(shaderParams,'rotate', 1,256).onChange(UpdateShaderValues).name("Rotate Models");


animate();


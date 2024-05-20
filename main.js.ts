import * as THREE from "three"
import {string} from "three/examples/jsm/nodes/shadernode/ShaderNode";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 100;
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const orbitControls = new OrbitControls(camera, renderer.domElement);
const colour1: THREE.Vector3 = new THREE.Vector3( 1, 0.392, 0.945 );
const colour2: THREE.Vector3 = new THREE.Vector3( 0.929, 1, 0);
const scale1: THREE.Vector3 = new THREE.Vector3( 1,1,1);
const scale2: THREE.Vector3 = new THREE.Vector3( 5, 5, 5);
const sceneObjects = [];
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
let model;
let model2;
let useShaderMaterial: boolean = true;
let originalMaterials =[];
let shaderMat: THREE.ShaderMaterial;


let _VS: string  = `
uniform vec3 scale;
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
uniform int bayerLevel;
uniform float spread;
uniform int redColourCount;
uniform int blueColourCount;
uniform int greenColourCount;
varying vec2 vUv;
const int bayer2[2 * 2] = int[](0, 2, 3, 1);
const int bayer4[4 * 4] = int[](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
const int bayer8[8 * 8] = int[](0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21);
float GetBayer2(int x, int y) {
    return float(bayer2[int((x % 2)), int((y % 2) * 2)]) * (1.0 / 4.0) - 0.5;
}
float GetBayer4(int x, int y) {
    return float(bayer4[int((x % 4)), int((y % 4) * 4)]) * (1.0 / 16.0) - 0.5;
}

float GetBayer8(int x, int y) {
    return float(bayer8[int((x % 8)), int((y % 8) * 8)]) * (1.0 / 64.0) - 0.5;
}
void main(){
vec2 pixelatedUV = floor(vUv * resolution /pixelSize) * pixelSize/resolution;
vec4 col = texture2D(mainTex, pixelatedUV);
int x = int(resolution.x);
int y = int(resolution.y);
float bayerValues[3] = float[3](0.0,0.0,0.0);
bayerValues[0] = GetBayer2(int(x),int(y));
bayerValues[1] = GetBayer4(int(x),int(y));
bayerValues[2] = GetBayer8(int(x),int(y));

vec4 bayerOutput = col + spread * bayerValues[bayerLevel];
bayerOutput.rgb /= max(vec3(1.0), bayerOutput.rgb);

bayerOutput.r = floor((float(redColourCount) - 1.0) * bayerOutput.r + 0.5) / (float(redColourCount) - 1.0);
bayerOutput.g = floor((float(greenColourCount) - 1.0) * bayerOutput.g + 0.5) / (float(greenColourCount) - 1.0);
bayerOutput.b = floor((float(blueColourCount) - 1.0) * bayerOutput.b + 0.5) / (float(blueColourCount) - 1.0);

gl_FragColor = bayerOutput;}
`;
const waterTexture =  textureLoader.load( "./Textures/rainbowTex.jpg", function( texture){
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    shaderMat = new THREE.ShaderMaterial({
        uniforms: {
            cubeColour: {value: new THREE.Vector3(1.0, 0.0,0.0)},
            scale: {value: new THREE.Vector3(1.0, 1.0, 1.0)},
            mainTex: {value: texture},
            resolution: {value: new THREE.Vector2(texture.image.width, texture.image.height)},
            pixelSize: {value: 64},
            bayerLevel: {value: 0},
            spread: {value: 0.3},
            redColourCount: {value: 4},
            greenColourCount: {value: 4},
            blueColourCount: {value: 4},
        },
        vertexShader: _VS,
        fragmentShader: _FS,
    })
    InitSceneObjects(shaderMat);
} );

function CreatePixelShaderMaterial(){
    return new THREE.ShaderMaterial({
        uniforms:{
            cubeColour: {value: new THREE.Vector3(1.0, 0.0,0.0)},
            scale: {value: new THREE.Vector3(1.0, 1.0, 1.0)},
            mainTex: {value: null},
            resolution: {value: new THREE.Vector2(1,1)},
            pixelSize: {value: 16},
            bayerLevel: {value: 0},
            spread: {value: 0.2},
            redColourCount: {value: 2},
            greenColourCount: {value: 16},
            blueColourCount: {value: 2},
        },
        vertexShader: _VS,
        fragmentShader: _FS,
    })
}

function InitSceneObjects(shaderMat){
    let boxGeometry = new THREE.BoxGeometry(20,20,20,10,10,10);
    let sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(20,10,10);
    let sphereMesh1 = new THREE.Mesh(sphereGeometry, shaderMat);
    sphereMesh1.position.set(0,-10,0);
    scene.add(sphereMesh1);
    sceneObjects.push(sphereMesh1);
    gltfLoader.load( "./Models/bulbasaur/scene.gltf", function( gltf ){
        model = gltf.scene;
        model.traverse((o) => {
            if (o.isMesh && o.material.map){
                    originalMaterials.push(o.material);
                    const objectShaderMat = CreatePixelShaderMaterial();
                    objectShaderMat.uniforms.mainTex.value = o.material.map;
                    objectShaderMat.uniforms.resolution.value = new THREE.Vector3(
                        o.material.map.image.width,
                        o.material.map.image.height
                    );
                    objectShaderMat.uniforms.pixelSize.value = 6;
                    o.material = objectShaderMat;
            }
        });
        scene.add(gltf.scene);
        gltf.scene.scale.set(50,50,50);
        gltf.scene.position.set(-70,20,0);
    });

    gltfLoader.load( "./Models/bulbasaur/scene.gltf", function( gltf ){
        model2 = gltf.scene;
        scene.add(gltf.scene);
        gltf.scene.scale.set(50,50,50);
        gltf.scene.position.set(70,20,0);
    });
}

function ToggleShaderMat(model,useShaderMaterial){
    model.traverse((o) => {
        if (o.isMesh && o.material) {
            if (useShaderMaterial) {
                // Apply the custom shader material
                const objectShaderMat = CreatePixelShaderMaterial();
                objectShaderMat.uniforms.mainTex.value = o.material.map;
                objectShaderMat.uniforms.resolution.value = new THREE.Vector3(
                    o.material.map.image.width,
                    o.material.map.image.height
                );
                objectShaderMat.uniforms.pixelSize.value = 32;
                o.material = objectShaderMat;
            } else {
                // Revert to the original material
                o.material = originalMaterials[o.materialIndex]; // Ensure you have a way to track the index or handle multiple materials per mesh
            }
        }
    });
}


const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

function handleKeyDown(event){
    if (event.keyCode === 80){
        console.log("pressed");
        ToggleShaderMat(model, useShaderMaterial);
        useShaderMaterial = !useShaderMaterial;
    }
}

let direction = 1
let t = 0;
function animate() {
    requestAnimationFrame(animate);
    t += direction * 0.001;
    if (t >= 1){
        t = 1;
        direction = -1;
    }
    else if(t <= 0){
        t = 0;
        direction = 1;
    }
    const interpolatedColour = new THREE.Vector3().lerpVectors(colour1,colour2,t);
    const interpolatedShape = new THREE.Vector3().lerpVectors(scale1,scale2,t);
    //shaderMat.uniforms.cubeColour.value.copy(interpolatedColour);
    //shaderMat.uniforms.scale.value.copy(interpolatedShape);
    for(let object of sceneObjects) {
        object.rotation.x += 0.01
        object.rotation.y += 0.01
    }
    if (model && model2){
        model.rotation.y += 0.01;
        model2.rotation.y += 0.01;
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

animate();


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
let rabbitModel;
let rabbitModel2;
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
varying vec2 vUv;
void main(){
vec2 pixelatedUV = floor(vUv * resolution /pixelSize) * pixelSize/resolution;
vec4 col = texture2D(mainTex, pixelatedUV);
gl_FragColor = col;}`;
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
            pixelSize: {value: 64},
        },
        vertexShader: _VS,
        fragmentShader: _FS,
    })
}

function InitSceneObjects(shaderMat){
    let boxGeometry = new THREE.BoxGeometry(20,20,20,10,10,10);
    let sphereMat1 = new THREE.MeshBasicMaterial({
        color: 0xff0000,
    });
    let sphereMat2 = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
    });
    let sphereMesh1 = new THREE.Mesh(boxGeometry, shaderMat);
    sphereMesh1.position.set(-50,0,0);
    scene.add(sphereMesh1);
    sceneObjects.push(sphereMesh1);


    let sphereMesh2 = new THREE.Mesh(boxGeometry, sphereMat2);
    sphereMesh2.position.set(50,0,0);
    scene.add(sphereMesh2);
    sceneObjects.push(sphereMesh2);
}

gltfLoader.load( "./Models/silent_ash/scene.gltf", function( gltf ){
    rabbitModel = gltf.scene;
    rabbitModel.traverse((o) => {
        if (o.isMesh && o.material.map){
            const objectShaderMat = CreatePixelShaderMaterial();
            objectShaderMat.uniforms.mainTex.value = o.material.map;
            objectShaderMat.uniforms.resolution.value = new THREE.Vector3(
                o.material.map.image.width,
                o.material.map.image.height
            );
            objectShaderMat.uniforms.pixelSize.value = 16;
            o.material = objectShaderMat;
        }
    });
    scene.add(gltf.scene);
    gltf.scene.scale.set(30,30,30);
    gltf.scene.position.set(-50,20,0);
});

gltfLoader.load( "./Models/silent_ash/scene.gltf", function( gltf ){
    rabbitModel2 = gltf.scene;
    scene.add(gltf.scene);
    gltf.scene.scale.set(30,30,30);
    gltf.scene.position.set(50,20,0);
});


const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);



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
    if (rabbitModel && rabbitModel2){
        rabbitModel.rotation.y += 0.01;
        rabbitModel2.rotation.y += 0.01;
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


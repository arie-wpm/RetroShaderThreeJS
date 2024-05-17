import * as THREE from "three"
import {string} from "three/examples/jsm/nodes/shadernode/ShaderNode";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 100;
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const colour1: THREE.Vector3 = new THREE.Vector3( 1, 0.392, 0.945 );
const colour2: THREE.Vector3 = new THREE.Vector3( 0.929, 1, 0);
const scale1: THREE.Vector3 = new THREE.Vector3( 1,1,1);
const scale2: THREE.Vector3 = new THREE.Vector3( 5, 5, 5);
const sceneObjects = [];


let _VS: string  = `
uniform vec3 scale;
void main(){
gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0 );
}
`;
let _FS: string = `
uniform vec3 cubeColour;
void main(){
gl_FragColor = vec4(cubeColour, 1.0);}`;

const shaderMat: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        cubeColour: {value: new THREE.Vector3(1.0, 0.0,0.0)},
        scale: {value: new THREE.Vector3(1.0, 1.0, 1.0)},
    },
    vertexShader: _VS,
    fragmentShader: _FS,
})

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
    shaderMat.uniforms.cubeColour.value.copy(interpolatedColour); 
    shaderMat.uniforms.scale.value.copy(interpolatedShape);
    console.log(typeof t,t);
    for(let object of sceneObjects) {
        object.rotation.x += 0.01
        object.rotation.y += 0.01
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


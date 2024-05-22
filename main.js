import * as THREE from 'three'
import pixelFragment from "shaders/pixelFragment.glsl";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 100;
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

let sphereGeometry = new THREE.BoxGeometry()
let sphereMat1 = new THREE.MeshBasicMaterial({
    color: 0xff0000,
});
let sphereMat2 = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
});
let sphereMesh1 = new THREE.Mesh(sphereGeometry, sphereMat1);
sphereMesh1.position.set(-50,0,0);
scene.add(sphereMesh1);


let sphereMesh2 = new THREE.Mesh(sphereGeometry, sphereMat2);
sphereMesh2.position.set(50,0,0);
scene.add(sphereMesh2);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


function animate() {
    requestAnimationFrame(animate);
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


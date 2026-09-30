import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'
/****SCENE */
const newScene= document.getElementById('app')
const renderer= new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'})
renderer.setPixelRatio(Math.min(devicePixelRatio,2))
renderer.setSize(innerWidth,innerHeight)
renderer.shadowMap.enabled=true
renderer.shadowMap.type= THREE.PCFShadowMap
renderer.toneMappingExposure=0.4
renderer.domElement.id = 'gl'
newScene.appendChild(renderer.domElement)
const canvas=renderer.domElement
const scene= new THREE.Scene()
scene.background= new THREE.Color(0xf1f1f1)
/***CAMERA */
const camera= new THREE.PerspectiveCamera(90,innerWidth/innerHeight,0.1,2000)
camera.position.set(170,140,300)
const prrem= new THREE.PMREMGenerator(renderer)
scene.environment = prrem.fromScene(new RoomEnvironment(), 0.04).texture
/***LIGHTS */
scene.add(new THREE.HemisphereLight(0xf40,0x283,0.8))
const key= new THREE.DirectionalLight(0xf1f1f1,1.8)
key.position.set(10,8,12)
key.castShadow=true
key.shadow.mapSize.set(2048,2048)
key.shadow.camera.left=-11; key.shadow.camera.right=11
key.shadow.camera.top=13; key.shadow.camera.bottom=-6
key.shadow.camera.near=4; key.shadow.camera.far=45
key.shadow.bias=0.0006
scene.add(key)
/*****CONTROLS */
const controls= new OrbitControls(camera,canvas)
controls.target.set(0,4.4,0)
controls.enableDamping=true
controls.dampingFactor=0.06
controls.enablePan=false
controls.minDistance=9
controls.maxDistance=60
controls.maxPolarAngle=1.45
controls.rotateSpeed=0.6
/****GROUND */
const groundCanvas=document.createElement('canvas')
groundCanvas.width= groundCanvas.height=256
const groundContext= groundCanvas.getContext('2d')
const groundGradient= groundContext.createRadialGradient(128,128,0,128,128,128)
groundGradient.addColorStop(0,"#151515")
groundGradient.addColorStop(0.72, 'rgba(102,102,102,0.65)')
groundGradient.addColorStop(1,'rgba(102,102,102,0)')
groundContext.fillStyle=groundGradient
groundContext.fillRect(0,0,256,256)
const groundTexture= new THREE.CanvasTexture(groundCanvas)
const ground= new THREE.Mesh(
new THREE.CircleGeometry(70,64),
new THREE.MeshStandardMaterial({
color:0x666666,
map:groundTexture,
transparent:true,
roughness:0.9,
metalness:0
}))
ground.rotation.x=-Math.PI/2
ground.receiveShadow=true
scene.add(ground)
/*****Troppers Walking */
let mixer
let mixers=[]
const characters = []
const dracoLoader=new DRACOLoader()
dracoLoader.setDecoderPath('/assets/draco/')
const gltfLoader= new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)
const speed = 5
const troopDirection = new THREE.Vector3(0, 0, 1);
const minZ = -55
const maxZ = 55
gltfLoader.load(
'./assets/imperial_stormtrooper.glb',
(gltf) => {
const model = gltf.scene
const box = new THREE.Box3().setFromObject(model)
const size = box.getSize(new THREE.Vector3())
const maxDim = Math.max(size.x, size.y, size.z)
const targetSize = 26
const scaleFactor = targetSize / maxDim
model.scale.setScalar(scaleFactor)
const countX = 3
const countZ = 1
const spacing = 20
for (let x = 0; x < countX; x++) {
for (let z = 0; z < countZ; z++) {
const clone = SkeletonUtils.clone(model)
const posX = (x - countX / 2) * spacing
const posZ = (z - countZ / 2) * spacing
clone.position.set( posX,0,posZ)
scene.add(clone)
if (gltf.animations.length > 0) {
const mixer = new THREE.AnimationMixer(clone)
const action = mixer.clipAction(  gltf.animations[1])
action.setLoop(THREE.LoopRepeat, Infinity)
action.play()
mixers.push(mixer)
characters.push({
model: clone,
mixer: mixer,})}}}
console.log('Troopers:', mixers.length)})
/*
gltf.scene.traverse((obj) => {
console.log(obj.type,obj.name,obj.isBone ? '← BONE' : '')})
gltf.scene.traverse((obj) => {if (obj.isMesh) {const randomColor = Math.random() * 0xffffff;
if (!obj.userData.originalMaterial) {obj.userData.originalMaterial = obj.material}
obj.material = new THREE.MeshBasicMaterial({ color: randomColor })
console.log(`%c Mesh: ${obj.name} `, `background: #${Math.floor(randomColor).toString(16)}; color: #fff; padding: 2px 5px; border-radius: 3px;`)}})})*/

const clock= new THREE.Clock()
const maxRadius = 55
function animate(){
requestAnimationFrame(animate)
const delta = clock.getDelta()
for (const mixer of mixers) {
mixer.update(delta)}
for (const character of characters) {
const model = character.model
model.position.addScaledVector(
troopDirection,
speed * delta)
model.rotation.y = Math.atan2(troopDirection.x,troopDirection.z)}
let centerZ = 0
for (const character of characters) {
centerZ += character.model.position.z}
centerZ /= characters.length
if (troopDirection.z > 0 &&centerZ >= maxZ) {troopDirection.z = -1}
if (troopDirection.z < 0 &&centerZ <= minZ) {troopDirection.z = 1}
controls.update()
renderer.render(scene,camera)}
animate()


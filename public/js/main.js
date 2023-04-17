import { GLTFLoader } from '../modules/GLTFLoader.js';
import * as THREE from '../modules/three.module.js';
import { avatar } from './avatar.js';
import { clouds } from './clouds.js';
import { cursor } from './cursor.js';
import { Firework } from './firework.js';
import {ground} from './ground.js';
import { Island } from './island.js';
import { Ripple } from './ripple.js';
import { UIHandler } from './uiHandler.js';

const uiHandler = new UIHandler();

const scene = new THREE.Scene();
const sceneBackground = new THREE.Color().setHex(0xADD8E6);

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true });

const clock = new THREE.Clock();

let light = null;

let islands = [];
let visitedIslands = 0;
let allVisited = false;

let ripples = [];
let avatarRippleCD = 0;

let firework = null;

let hover = false;
let hoverIsland = null;
let targetIsland = null;

let navigationLocked = false;

// Array to store loadchecks of all models
let loadedList = [];
let loadedcount = 0;
// bool to check if scene is completly loaded
let sceneLoaded = false;

let target = new THREE.Vector3(0,0,0);

let cursor_x = -1;
let cursor_y = -1;

window.addEventListener( 'pointerdown', onPointerDown );
window.addEventListener( 'pointermove', onPointerMove );
window.addEventListener( 'resize', onResized );

window.onload = init();

//Init Scene, light and camera and connect to DOM
function init(){

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    document.body.appendChild( renderer.domElement );

    scene.background = sceneBackground;

    //fetch project data from JSON file
    fetch('./assets/json/projects.json')
        .then((response) => response.json())
        .then((json) => initModels(json));

    //setup lights
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
	hemiLight.color.setHSL( 0.6, 1, 0.6 );
	hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 50, 0 );
	scene.add( hemiLight );

    light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( -15, 20, 0 );
    light.castShadow = true;
    light.receiveShadow = true;
    scene.add(light);
    scene.add(light.target);

    //Set up shadow properties for the light
    const d = 50;

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.bias = -0.001;

    //Fog for scene
    scene.fog = new THREE.FogExp2( 0xf1f1f1, 0.005 );

    //setup camera
    camera.position.set(-20,20,0);
    camera.lookAt(0,0,0);

    animate();
}

//Animate every Frame
function animate(){

    requestAnimationFrame( animate );

    //if scene is not loaded, check if it is loaded now
    if(!sceneLoaded){
        updateLoadedList();
        populateScene();
    }

    if(sceneLoaded){

        let delta = clock.getDelta();
        //if you change the tab the animations are not played
        if(delta>1){
            return;
        }

        //update time uniform for shaders
        ground.scene.traverse(function(child) {

            if(child.isMesh) {
                const shader = child.material.userData.shader;

                if(shader) {
                    shader.uniforms.time.value = performance.now() / 1000;
                }
            }
        } );

        //update time uniform for shaders
        clouds.scene.traverse(function(child) {
            if(child.isMesh) {
                const shader = child.material.userData.shader;

                if(shader) {
                    shader.uniforms.time.value = performance.now() / 1000;
                }
            }
        } );


        updateAnimations(delta);
        //check if mouse is hovering island
        checkHover();

        //claculate objectavoidance and move avatar
        avatar.calcTarget(target, islands);

        if(!avatar.targetReached){
            avatar.moveToTarget(camera, delta);
            createMoveRipple(avatar.scene.position, delta);
            
        }else if(targetIsland != null){
            if(!targetIsland.visiting){
                targetIsland.visit();
                navigationLocked = true;
                //counter for visited islands
                if(!targetIsland.visited){
                    visitedIslands++;
                    targetIsland.visited = true;
                    uiHandler.updateScore(visitedIslands, islands.length);
                }
            }
        }


        uiHandler.animateIslandUI(delta);
        uiHandler.updateHelp(delta);

        //check if all islands have been visited
        if(!allVisited){
            if(visitedIslands === islands.length){
                allVisited = true;
                firework.startFirework();
            }
        }

        //remove cursor if target is reached
        if(avatar.targetReached){
            scene.remove(scene.getObjectByName("cursor"));
        }

        for(let i = 0; i < islands.length; i++){
            createIslandRipple(islands[i], delta);
        }


        //move light for shadows
        light.position.set(avatar.scene.position.x - 20, light.position.y, avatar.scene.position.z-5);
        light.target.position.set(avatar.scene.position.x, 0, avatar.scene.position.z);

    }

    //Render scene
	renderer.render( scene, camera );
}

//Update animation mixers
function updateAnimations(delta){

    cursor.mixer.update(delta);
    avatar.mixer.update(delta);

    firework.updateFirework(delta);

    for(let i = 0; i < islands.length; i++){

        islands[i].title.mixer.update(delta);

    }

    //Ripple animations
    for(let i = 0; i < ripples.length; i++){
        ripples[i].updateRadius(delta);

        //check if ripple should get bigger or smaller
        if(ripples[i].direction > 0){
            //remove ripple if max size is reached
            if(ripples[i].radius >= ripples[i].endRadius){
                scene.remove(ripples[i].scene);
                ripples[i].scene.visible = false;
                ripples.splice(i, 1);
            }else{
                ripples[i].scene.scale.set(ripples[i].radius, ripples[i].radius, ripples[i].radius);
            }
        }else{
            //remove ripple if max size is reached
            if(ripples[i].radius <= ripples[i].endRadius){
                scene.remove(ripples[i].scene);
                ripples[i].scene.visible = false;
                ripples.splice(i, 1);
            }else{
                ripples[i].scene.scale.set(ripples[i].radius, ripples[i].radius, ripples[i].radius);
            }
        }
        
    }
}

//init all models
function initModels(projects){

    //generate islands from JSON file
    for(let i = 0; i < projects.length; i++){
        let island = new Island(projects[i].model, projects[i].previewImage, projects[i]._3DText, projects[i].id, uiHandler);
        islands.push(island);
    }

    uiHandler.generateProjects(projects);
    initCloseButtons();

    const loader = new GLTFLoader();

    //load islands in island array
    for(let i = 0; i < islands.length; i++){

        //onload function for every island
        loader.load(islands[i].path, function (gltf){

            islands[i].init(gltf);

        }, undefined, undefined);

        //onload function for title of island
        loader.load(islands[i].title.path, function (gltf){

            islands[i].title.init(gltf);

        }, undefined, undefined);
    }

    firework = new Firework(islands);

    avatar.init();
    ground.init();
    clouds.init();
    cursor.init();
    
}

//check if all models are loaded
function checkLoaded(){

    loadedcount = 0;
    let loadedFalse = false;
    
    //check if islands are loaded
    for(let i = 0; i < loadedList.length; i++){
        if(loadedList[i]){

            loadedcount++;
        }else{

            loadedFalse = true;
        }
    }

    //update loadingscreen
    uiHandler.updateLoading(Math.floor((loadedcount * 100) / loadedList.length));

    if(loadedFalse){
        return false;
    }else{
        return true;
    }
}

//setup list with loadcheck on all models
function updateLoadedList(){
    loadedList[0] = avatar.loaded;
    loadedList[1] = ground.loaded;
    loadedList[2] = cursor.loaded;
    loadedList[3] = clouds.loaded;
    
    for(let i = 0; i < islands.length; i++){
        loadedList[4 + i] = islands[i].loaded;
        loadedList[4 + i + 1] = islands[i].title.loaded;
    }
    
}

//add models to scene
function populateScene(){

    if(checkLoaded()){

        scene.add(avatar.scene);
        scene.add(ground.scene);
        scene.add(clouds.scene);
        cursor.placable = true;

        //add islands and place at correct position. also add island title and calculate position of dock
        for(let i = 0; i<islands.length; i++){

            //place islands in spiral
            if(islands.length<=1){

                islands[i].scene.position.x = Math.sin((i+6)) * (i+6) * 7;
                islands[i].scene.position.z = Math.cos((i+6)) * (i+6) * 7;
            }else{

                islands[i].scene.position.x = Math.sin((i+5)) * (i+5) * 5;
                islands[i].scene.position.z = Math.cos((i+5)) * (i+5) * 5;
            }

            islands[i].dock = new THREE.Vector3(islands[i].scene.position.x - (islands[i].radius + 0.5), islands[i].scene.position.y, islands[i].scene.position.z);
            
            islands[i].scene.add(islands[i].title.scene);
            islands[i].title.scene.position.set(-(islands[i].radius + 1.8), 0, 0);

            //add eventlistener for animationend
            islands[i].title.mixer.addEventListener('finished', onAnimationEnd);
            
            scene.add(islands[i].scene);
        }

        firework.positionFirework(scene);

        sceneLoaded = true;

        //island score counter
        uiHandler.initScore(islands.length);

        uiHandler.hideLoading();
        //console.log("All loaded!");
    }
}

//create ripple for avatar
function createMoveRipple(position, delta){

    if(avatarRippleCD >= 0.1){

        let ripple = new Ripple(1, 2, 1, new THREE.Vector3(position.x, 0.01, position.z));
        scene.add(ripple.scene);
        ripples.push(ripple);

        avatarRippleCD = 0;
    }

    avatarRippleCD += delta;
}

//create ripple for islands
function createIslandRipple(island, delta){

    if(island.rippleCD >= island.rippleCDMax){

        let ripple = new Ripple(3, 2.6, 0.1, new THREE.Vector3(island.scene.position.x, 0.01, island.scene.position.z));
        scene.add(ripple.scene);
        ripples.push(ripple);

        island.rippleCD = 0;
    }

    island.rippleCD += delta;
}

//check mouseposition
function onPointerMove(event){

    cursor_x = event.pageX;
    cursor_y = event.pageY;
}

//check if mouse is hovering above island
function checkHover(){

    let raycaster = new THREE.Raycaster();
    let pointer = new THREE.Vector2();

    pointer.x = ( cursor_x / renderer.domElement.clientWidth ) * 2 - 1;
    pointer.y = - ( cursor_y / renderer.domElement.clientHeight ) * 2 + 1;
    raycaster.setFromCamera( pointer, camera );

    hover = false;
    hoverIsland = null;

    for(let i = 0; i < islands.length; i++){

        //check for intersections with islandscene. Including its hitbox
        let intersects = raycaster.intersectObject(islands[i].hitbox);

        if ( intersects.length > 0 ) {
            hover = true;
            hoverIsland = islands[i];
            islands[i].title.playHoverAnimation();
        }else{
            islands[i].title.setAction(0);
        }
    }

    //change mousecursor if hovering over island
    uiHandler.changeCursor(hover);
}

//after animation has ended for island titles -> play followup animation
function onAnimationEnd(event){

    if(event.action._clip.name === 'rise'){
        hoverIsland.title.setAction(1);
    }
}

//after mouseclick
function onPointerDown(event){

    //if click is left mousebutton
    if(event.buttons === 1){
        if(!navigationLocked){

            //hide helpertext after clicking
            uiHandler.hideHelp();

            if(sceneLoaded){

                let raycaster = new THREE.Raycaster();
                let pointer = new THREE.Vector2();

                pointer.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
                pointer.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
                raycaster.setFromCamera( pointer, camera );

                hover = false;
                hoverIsland = null;

                for(let i = 0; i < islands.length; i++){

                    //check for intersections with islandscene. Including its hitbox
                    let intersects = raycaster.intersectObject(islands[i].hitbox);

                    if ( intersects.length > 0 ) {
                        hover = true;
                        hoverIsland = islands[i];
                    }
                }
    
                //if clicked on island go to its dock
                if(hover){
                    target = hoverIsland.dock;
                    targetIsland = hoverIsland;
        
                    cursor.place(scene, target);
                }else{

                    targetIsland = null;
        
                    let raycaster = new THREE.Raycaster();
                    let pointer = new THREE.Vector2();
        
                    pointer.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
                    pointer.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
                    raycaster.setFromCamera( pointer, camera );
        
                    //check where ray intersects with ground
                    const intersects = raycaster.intersectObject( ground.scene.children[1] );
        
                    //place cursor at intersection and add target to avatar
                    if ( intersects.length > 0 ) {
        
                        target = intersects[ 0 ].point;
        
                        cursor.place(scene, target);
        
                    }
                }
            }
        }
    }
}

//resize canvas on windowresize
function onResized(event){

    camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

//onclick events for close button of project windows after windows are loaded
function initCloseButtons(){
    let closeBtn = document.getElementsByClassName("closeBtn");

    for(let i = 0; i < closeBtn.length; i++){
        closeBtn[i].onclick = function(){
    
            if(targetIsland.visiting){
        
                navigationLocked = false;
                targetIsland.leave();
                targetIsland = null;
            }
        }
    }
}



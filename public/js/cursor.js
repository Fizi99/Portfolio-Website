import { GLTFLoader } from '../modules/GLTFLoader.js';
import * as THREE from '../modules/three.module.js';

export const cursor = {

    path: './assets/models/cursor.glb',
    loaded: false,
    scene: null,
    placable: false,
    mixer: new THREE.AnimationMixer(),

    init: function(){

        const loader = new GLTFLoader();

        //load scene from gltf File
        loader.load(this.path, function (gltf){

            //animations
            cursor.mixer = new THREE.AnimationMixer(gltf.scene);
            const animationAction = cursor.mixer.clipAction(gltf.animations[0]);
            animationAction.play();

            //set variables in Object
            cursor.scene = gltf.scene;
            cursor.loaded = true;
            cursor.scene.name = "cursor";

            for(let i = 0; i < cursor.scene.children.length; i++){
                if (cursor.scene.children[i].isMesh) {
                    cursor.scene.children[i].castShadow = true;
                    cursor.scene.children[i].receiveShadow = true;
                };
    
            }
            
        }, undefined, undefined);
    },

    //place cursor at position
    place: function(scene, position){

        if(this.placable){

            scene.add(this.scene);
            this.scene.position.set(position.x, position.y, position.z);
        }
    }
}
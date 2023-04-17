import * as THREE from '../modules/three.module.js';

export class IslandTitle{

    constructor(path){
        this.path = path;
        this.loaded = false;
        this.scene = null;
        this.animationActions = [];
        this.mixer = new THREE.AnimationMixer;
        this.activeAction = null;
    }

    init(gltf){

        this.scene = gltf.scene;
        this.loaded = true;

        //activate shadows for models
        for(let i = 0; i < this.scene.children.length; i++){
            if (this.scene.children[i].isMesh) {
                this.scene.children[i].castShadow = true;
                this.scene.children[i].receiveShadow = true;
            }
        };

        //init animations from 1 file: index 0 = idle1
        //                             index 1 = idle2
        //                             index 2 = rise
        this.mixer = new THREE.AnimationMixer(gltf.scene);
        this.animationActions.push(this.mixer.clipAction(gltf.animations[0]));
        this.animationActions.push(this.mixer.clipAction(gltf.animations[1]));
        this.animationActions.push(this.mixer.clipAction(gltf.animations[2]));

        this.animationActions[0].play();
        this.activeAction = 0;

        //only play rise animation once
        this.animationActions[2].loop = THREE.LoopOnce;
        

    }

    //Update animation action
    setAction(actionIndex){

        if(this.activeAction != actionIndex){
            this.animationActions[actionIndex].reset();
            this.animationActions[actionIndex].play();
            this.animationActions[this.activeAction].stop();
            this.activeAction = actionIndex;
        }

    }

    playHoverAnimation(){

        if(this.activeAction === 0){
            this.setAction(2);
        }
    }
}
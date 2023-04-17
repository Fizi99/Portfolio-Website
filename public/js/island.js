import * as THREE from '../modules/three.module.js';
import { IslandTitle } from './islandTitle.js';


export class Island{

    constructor(path, previewImagePath, titlePath, domID, uiHandler){
        this.path = path;
        this.loaded = false;
        this.scene = null;
        this.hitbox = null;
        this.radius = 8;
        this.dock = new THREE.Vector3();
        this.title = new IslandTitle(titlePath);
        this.domID = domID;
        this.visiting = false;
        this.rippleCDMax = 15;
        this.rippleCD = Math.floor(Math.random() * (this.rippleCDMax / 2));
        this.visited = false;

        this.previewImage = new THREE.TextureLoader().load(previewImagePath);
        this.previewImage.encoding = THREE.sRGBEncoding;

        this.uiHandler = uiHandler;
    }

    //after model is loaded from gltf
    init(gltf) {

        this.scene = gltf.scene;
        this.loaded = true;

        //add hitbox circle
        let m = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        let g = new THREE.CircleGeometry( this.radius, 24 );
        let circle = new THREE.LineLoop( g, m );
        circle.rotation.set(Math.PI/2,0,0);

        //activate shadows for models
        this.activateShadows(this.scene.children);
        //set hitbox
        for(let i = 0; i < this.scene.children.length; i++){
            //search for 3D Object hitbox
            if ( this.scene.children[i].name === "hitbox"){
                this.hitbox = this.scene.children[i];
                this.hitbox.add(circle);
                this.hitbox.visible = false;
            }
        }

        //set preview image as texture of sign
        for(let i = 0; i < this.scene.children.length; i++){
            //search for 3D Object sign
            if ( this.scene.children[i].name === "sign"){
                //search for material sign
                for(let j = 0; j < this.scene.children[i].children.length; j++){
                    if(this.scene.children[i].children[j].material.name === "sign"){
                        
                        this.scene.children[i].children[j].material.map = this.previewImage;
                    }
                }

            }
        }

        //this.scene.visible = false;

    }

    //recursively add shadows to meshes in scene
    activateShadows(array){
        for(let i = 0; i < array.length; i++){
            if(array[i].isMesh){
                if(this.scene.children[i].name != "hitbox"){
                    this.scene.children[i].castShadow = true;
                    this.scene.children[i].receiveShadow = true;
                }
            }else if(array[i].isGroup){
                this.activateShadows(array[i].children);
            }
        }
    }

    visit(){
        this.visiting = true;
        this.uiHandler.visitIsland(this);
    }

    leave(){
        this.visiting = false;
        this.uiHandler.leaveIsland(this);
    }
}
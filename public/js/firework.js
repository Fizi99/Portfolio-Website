import * as THREE from '../modules/three.module.js';
import { ParticleSystem } from './particleSystem.js';

export class Firework{

    constructor(islands){

        this.islands = islands;
        this.active = false;
        this.particlesystemPerIsland = 2;
        this.particleSystems = [];

        //initialize particlesystems for each island with random cooldowns and color
        for(let i = 0; i < this.islands.length; i++){
            let tempArr = [];
            for(let j = 0; j < this.particlesystemPerIsland; j++){
                let cooldown = this.randomInterval(1,6);
                let color = new THREE.Color(Math.random(), Math.random(), Math.random());
                tempArr.push(new ParticleSystem(100, 10, 15, 0.1, 2, cooldown, color));
            }
            this.particleSystems.push(tempArr);
        }
    }

    //place firework above island with slight offset
    positionFirework(scene){
        
        for(let i = 0; i < this.islands.length; i++){
            for(let j = 0; j < this.particlesystemPerIsland; j++){
                let offset = this.randomInterval(0, 6) - 3;
                this.particleSystems[i][j].init(scene, new THREE.Vector3(this.islands[i].scene.position.x + offset, this.randomInterval(10,20), this.islands[i].scene.position.z + offset));
            }
        }
    }

    //start the firework loop
    startFirework(){
        this.active = true;
        this.particleSystems.forEach(element => {
            element.forEach(system => {
                system.startEmission();
            });
        });
    }

    //update particlesystems
    updateFirework(delta){

        if(this.active){
            this.particleSystems.forEach(element => {
                element.forEach(system => {
                    system.updateParticleSystem(delta);
                });
            });
    
            this.fireworkLoop(delta);
        }
    }

    //check if firework should be activated again
    fireworkLoop(){
        this.particleSystems.forEach(element => {
            element.forEach(system => {
                if(!system.visible){
                    if(system.cooldown >= system.maxCooldown){
                        system.startEmission();
                    }
                }
            });
        });
    }

    randomInterval(min, max){
        return Math.random() * (max - min + 1) + min;
    }
}
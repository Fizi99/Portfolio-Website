import * as THREE from '../modules/three.module.js';
import { Particle } from './particle.js';

export class ParticleSystem{

    constructor(amount, minSpeed, maxSpeed, minLifetime, maxLifetime, maxCooldown, color){

        this.clock = new THREE.Clock();
        this.delta = 0;
        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.grav = new THREE.Vector3(0, -9.81, 0);
        this.resistance = 0.3;
        this.amount = amount;
        this.position = new THREE.Vector3(0,0,0);
        this.visible = false;
        this.minLifetime = minLifetime;
        this.maxLifetime = maxLifetime;
        this.lifetime = 0;
        this.color = color;

        //cooldown for animationloop
        this.maxCooldown = maxCooldown;
        this.cooldown = 0;

        //particles for rocket tail
        this.tailParticles = [];
        this.targetReached = false;

        for(let i = 0; i<10; i++){
            //size and alpha for tail gets smaller
            this.tailParticles[i] = new Particle(new THREE.Color("white"), 1 - (i/10), (15*(10-i))/10);
            this.tailParticles[i].maxLifetime = 4;

            //velocity, position and acceleration of particles gets initialized
            this.tailParticles[i].defaultVelocity = new THREE.Vector3(0, 20, 0);
            this.tailParticles[i].velocity = this.tailParticles[i].defaultVelocity;

            this.tailParticles[i].position = new THREE.Vector3(0,0,0);

            this.tailParticles[i].defaultAcceleration = new THREE.Vector3(0,1,0);
            this.tailParticles[i].acceleration = this.tailParticles[i].defaultAcceleration;

            this.tailParticles[i].point.visible = false;
        }

        //particles for rocket explosion
        this.particles = [];

        //golden angle in radians
        let phi = Math.PI*(3-Math.sqrt(5));

        //calculate fibonacci sphere to scatter particles
        for(let i = 0; i < this.amount; i++){

            //y position on sphere (latitude)
            let y = 1 - (i/this.amount) * 2;

            //radius of circle at y position
            let radius = Math.sqrt(1-y*y);

            //angle of current particle
            let theta = phi * i;

            //x, z position (longitude) at y latitude
            let x = Math.cos(theta) * radius;
            let z = Math.sin(theta) * radius;

            //init the particle
            this.particles[i] = new Particle(this.color, 1, 15);

            //random speed and lifetime
            let speed = this.randomInterval(this.minSpeed, this.maxSpeed);
            this.particles[i].maxLifetime = this.randomInterval(this.minLifetime, this.maxLifetime);

            //calculate velocity of particle in direction of fibonacci sphere point
            this.particles[i].defaultVelocity = new THREE.Vector3(x * speed,
                                                                  y * speed,
                                                                  z * speed);

            this.particles[i].velocity = this.particles[i].defaultVelocity;

            this.particles[i].position = new THREE.Vector3(0,0,0);
            this.particles[i].defaultAcceleration = new THREE.Vector3(this.grav.x + (-1 * this.particles[i].velocity.x * this.resistance),
                                                                      this.grav.y + (-1 * this.particles[i].velocity.y * this.resistance),
                                                                      this.grav.z + (-1 * this.particles[i].velocity.z * this.resistance));

            this.particles[i].acceleration = this.particles[i].defaultAcceleration;

            this.particles[i].point.visible = false;

        }

    }

    //add particles to scene
    init(scene, position){

        this.position = position;

        //add tail particles to scene
        for(let j = 0; j < this.tailParticles.length; j++){
            this.tailParticles[j].position = new THREE.Vector3(this.position.x, 0-0.1*j, this.position.z);
            scene.add(this.tailParticles[j].point);
        }

        //add explosion particles to scene
        for(let i = 0; i < this.particles.length; i++){
            
            this.particles[i].position = position;
            scene.add(this.particles[i].point);
        }
    }


    //emit explosion particles
    startExplosion(){
        this.particles.forEach(element => {
            element.point.visible = true;
            element.alive = true;
        });
    }

    //activate particle system and emmit tail particles
    startEmission(){
        this.visible = true;

        this.tailParticles.forEach(element => {
            element.point.visible = true;
            element.alive = true;
        });
    }

    //reset particle system
    stopEmission(){
        this.visible = false;

        //reset tail particles
        for(let i = 0; i < this.tailParticles.length; i++){
            
                this.tailParticles[i].killParticle();
                this.tailParticles[i].position = new THREE.Vector3(this.position.x,0-0.1*i,this.position.z);
                this.tailParticles[i].point.position.set(this.position.x,0-0.1*i,this.position.z);
            
        }
        
        this.targetReached = false;
        
        //reset explosion particles
        this.particles.forEach(element => {
            element.killParticle();
            element.position = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
            element.point.position.set(this.position.x, this.position.y, this.position.z);
        });
        this.cooldown = 0;
        this.lifetime = 0;
    }

    //update particle system depending on lifetime
    updateParticleSystem(delta){

        if(this.visible){

            //update tail particles if target height is not reached
            if(!this.targetReached){
                for(let i = 0; i < this.tailParticles.length; i++){
                    this.tailParticles[i].updateParticle(delta);

                    //check if particle has reached target height
                    let dist = new THREE.Vector3(this.position.x - this.tailParticles[i].position.x,
                                                 this.position.y - this.tailParticles[i].position.y,
                                                 this.position.z - this.tailParticles[i].position.z);
                    if(dist.length() <= 1){

                        //start explosion and kill tail particles
                        this.startExplosion();
                        this.targetReached = true;
                        for(let j = 0; j < this.tailParticles.length; j++){
                            this.tailParticles[j].killParticle();
                        }
                    }   
                }
            }else{
                //if lifetime is over reset all particles
                if(this.lifetime > this.maxLifetime){
                    this.stopEmission();
                }else{
                    //update explosion particles
                    for(let i = 0; i < this.amount; i++){
                        this.particles[i].updateParticle(delta, this.grav, this.resistance);
                    }

                    this.lifetime += delta;
                }
            }
        //update cooldown of particlesystem, if it is not active
        }else{
            this.cooldown += delta;
        }
    }


    randomInterval(min, max){
        return Math.random() * (max - min + 1) + min;
    }

}
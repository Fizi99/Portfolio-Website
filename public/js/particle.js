import * as THREE from '../modules/three.module.js';

export class Particle{

    constructor(color, factor, size){
        //constructed in particle system
        this.velocity = null;
        this.defaultVelocity = null;
        this.position = null;
        this.acceleration = null;
        this.defaultAcceleration = null;
        this.lifetime = 0;
        this.maxLifetime = 0;
        this.alive = true;
        this.color = color;

        this.factor = factor;
        this.size = size;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [0,0,0], 3 ) );

        //uniforms for shadermaterial
        let uniforms = {
            size : {type: 'float', value: this.size},
            factor : {type: 'float', value: this.factor},
            mycolor : {type: 'vec3', value: this.color}
        };

        const material = new THREE.ShaderMaterial( {uniforms: uniforms,
                                                    vertexShader: this.vertexShader(),
                                                    fragmentShader: this.fragmentShader(),
                                                    transparent: true
                                                    });

        this.point = new THREE.Points( geometry, material );
    }

    updateParticle(delta){

        if(this.alive){

            //update particle depending on its lifetime
            if(this.lifetime >= this.maxLifetime){
                this.killParticle();
            }else{

                this.velocity = new THREE.Vector3(this.velocity.x + this.acceleration.x * delta,
                                                this.velocity.y + this.acceleration.y * delta,
                                                this.velocity.z + this.acceleration.z * delta);

                this.position = new THREE.Vector3(this.position.x + ((this.velocity.x * delta) + (0.5 * this.acceleration.x * delta * delta)),
                                                this.position.y + ((this.velocity.y * delta) + (0.5 * this.acceleration.y * delta * delta)),
                                                this.position.z + ((this.velocity.z * delta) + (0.5 * this.acceleration.z * delta * delta)));

                this.point.position.set(this.position.x, this.position.y, this.position.z);

                this.lifetime += delta;
            }
        }
    }

    //reset particle
    killParticle(){
        this.point.visible = false;
        this.lifetime = 0;
        this.alive = false;
        this.velocity = this.defaultVelocity;
        this.acceleration = this.defaultAcceleration;
    }

    vertexShader(){
        return `

        uniform float size;

        void main(){
            gl_PointSize = size;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
        }
        
        `
    }

    fragmentShader(){
        return `

        uniform float factor;
        uniform vec3 mycolor;

        void main() {

            vec2 pos = vec2(0.5, 0.5) - gl_PointCoord;
            float dist = 2. * (0.5 - length(pos));

            vec3 endcolor = vec3(0.,0.,0.);

            if(dist >= 0.9){
                endcolor = vec3(1.,1.,1.);
            }else{
                endcolor = mycolor;
            }

            float alpha = factor * dist;
            gl_FragColor = vec4(endcolor, alpha);
          }
        
        `
    }
}
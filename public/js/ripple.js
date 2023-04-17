import * as THREE from '../modules/three.module.js';

export class Ripple{

    constructor(startRadius, endRadius, speed, position){
        this.startRadius = startRadius;
        this.radius = startRadius;
        this.endRadius = endRadius;

        //check if ripple gets bigger or smaller over time
        if(endRadius > startRadius){
            this.direction = 1;
            this.percentRad = (endRadius - startRadius) / 100;
        }else{
            this.direction = -1;
            this.percentRad = (startRadius - endRadius) / 100;
        }

        this.currentPercentRad = 100;
        this.speed = speed;
        this.scene = null;

        const geometry = new THREE.TorusGeometry( startRadius, 0.05, 2, 30 );

        //custom material properties
        let uniforms = {
            alpha : {type: 'float', value: this.currentPercentRad}
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: this.fragmentShader(),
            transparent: true
        });

        //place ripple
        this.scene = new THREE.Mesh( geometry, material );
        this.scene.rotation.set(Math.PI/2,0,0);
        this.scene.position.set(position.x, position.y, position.z);

    }

    //update ripple size over time
    updateRadius(delta){
        this.radius += this.speed * delta * this.direction;

        if(this.direction > 0){
            this.currentPercentRad = 100 - ((this.radius - this.startRadius) / this.percentRad);
        }else{
            this.currentPercentRad = 100 - ((this.radius - this.endRadius) / this.percentRad);
        }
        this.scene.material.uniforms.alpha.value = this.currentPercentRad / 100;

    }

    //Shader for ripples to simulate transparancy over time
    fragmentShader(){
        return `
        uniform float alpha; 
  
        void main() {
          gl_FragColor = vec4(255, 255, 255, alpha);
        }
        `
    }

}
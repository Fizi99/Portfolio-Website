import { GLTFLoader } from '../modules/GLTFLoader.js';
import * as THREE from '../modules/three.module.js';

export const ground = {

    path: './assets/models/water.glb',
    loaded: false,
    scene: null,

    init: function(){

        //modify shader of standard material
        ground.material = new THREE.MeshStandardMaterial();
        ground.material.onBeforeCompile = function ( shader ) {

            shader.uniforms.time = { value: 0 };
            shader.uniforms.waterColor = { value: new THREE.Color('#17cbfc') };
            shader.uniforms.highlightColor = { value: new THREE.Color('#b3ffff') };

            shader.vertexShader = 'uniform float time;\n' + 'out vec3 pos;\n' + 

            //random vector
            'vec2 randomVec2 (in vec2 st) {\n' +
            'st = vec2( dot(st,vec2(127.1,311.7)),dot(st,vec2(269.5,183.3)) );\n' +
            'return -1.0 + 2.0*fract(sin(st)*43758.5453123);}\n' + 

            //gradiant noise
            'float gradNoise (in vec2 st) {\n' + 
            'vec2 i = floor(st);\n' + 
            'vec2 f = fract(st);\n' +
            'vec2 u = f*f*(3.0-2.0*f);\n' +

            `return mix( mix( dot( randomVec2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
            dot( randomVec2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
            mix( dot( randomVec2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
            dot( randomVec2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);}\n` +

            //wave function
            'float wave(in vec2 point, in float amp, in float periode, in float dist, in float t) {\n' + 
            'float pi = 3.14159265359;\n' + 
            'return amp * sin(periode * (dist + gradNoise(point) * pi + t));}\n' +
            
            shader.vertexShader;
                                   
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                [

                    `float pi = 3.14159265359;`,
                    'vec3 tempPos = position.xyz;',

                    //put wavegenerators in 4 corners
                    'vec2 origin1 = tempPos.xz + vec2(300.0, 300.0);',
                    'vec2 origin2 = tempPos.xz + vec2(-300.0, 300.0);',
                    'vec2 origin3 = tempPos.xz + vec2(300.0, -300.0);',
                    'vec2 origin4 = tempPos.xz + vec2(-300.0, -300.0);',

                    'float distance1 = length(origin1);',
                    'float distance2 = length(origin2);',
                    'float distance3 = length(origin3);',
                    'float distance4 = length(origin4);',

                    //first set of waves
                    'float wave1 = wave(tempPos.xz, 0.1, 0.5, distance1, time * 1.);',
                    'float wave2 = wave(tempPos.xz, 0.2, 0.4, distance2, time * 2.);',
                    'float wave3 = wave(tempPos.xz, 0.3, 0.3, distance3, time * 3.);',
                    'float wave4 = wave(tempPos.xz, 0.4, 0.2, distance4, time * 4.);',

                    //combine first set
                    'float combined1 = wave1 + wave2 + wave3 + wave4;',

                    //second set of waves
                    'float wave5 = wave(tempPos.xz, 0.4, 0.5, distance1, time * 4.);',
                    'float wave6 = wave(tempPos.xz, 0.3, 0.4, distance2, time * 3.);',
                    'float wave7 = wave(tempPos.xz, 0.2, 0.3, distance3, time * 2.);',
                    'float wave8 = wave(tempPos.xz, 0.1, 0.2, distance4, time * 1.);',

                    //combine second set
                    'float combined2 = wave5 + wave6 + wave7 + wave8;',

                    //calculate y position
                    'tempPos.y += gradNoise(vec2(tempPos.x, tempPos.z)) * (combined1 + combined2) + 0.1;',
      
                    //uniform for fragmentShader
                    'pos = tempPos;',

                    'vec3 transformed = vec3(tempPos);',
                ].join('\n')
            );

            shader.fragmentShader = 'in vec3 pos;\n' +
            'uniform vec3 waterColor;\n' +
            'uniform vec3 highlightColor;\n' +
            'uniform float time;\n' +

            //randomNumber
            'float randomNumb (in float seed) {\n' + 
            'return fract(sin(seed) * 1000000.);}\n' + 

            //random2
            'vec2 randomVec2 (in vec2 st) {\n' +
            'st = vec2( dot(st,vec2(127.1,311.7)),dot(st,vec2(269.5,183.3)) );\n' +
            'return -1.0 + 2.0*fract(sin(st)*43758.5453123);}\n' + 

            //gradiant noise
            'float gradNoise (in vec2 st) {\n' + 
            'vec2 i = floor(st);\n' + 
            'vec2 f = fract(st);\n' +
            'vec2 u = f*f*(3.0-2.0*f);\n' +

            `return mix( mix( dot( randomVec2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
            dot( randomVec2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
            mix( dot( randomVec2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
            dot( randomVec2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);}\n` +

            shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                [
                    //colormask for water
                    'float maskTop = (pos.y - 0.3) * 2.;',

                    //colormask for waterfall
                    'float factor1 = pos.y * 0.05 + time;',
                    'float factor2 = pos.z * 0.5;',
                    'float maskBottom = gradNoise(vec2(factor1, factor2)) - 0.5;',

                    'float mask = maskTop;',

                    //factor for smoother transition
                    'float factor = clamp(abs(pos.y), 0., 1.);',

                    //mix masks for smoother transition
                    'mask = mix(maskTop, maskBottom, factor);',

                    //calculate color depending on mask
                    'diffuseColor.rgb = mix(waterColor, highlightColor, mask);',

                ].join('\n')
            );

            ground.material.userData.shader = shader;

        };

        const loader = new GLTFLoader();

        //load scene from gltf File
        loader.load(this.path, function (gltf){

            //set variables in Object
            ground.scene = gltf.scene;
            ground.loaded = true;

            for(let i = 0; i < ground.scene.children.length; i++){
                if (ground.scene.children[i].isMesh) {

                    if(ground.scene.children[i].name == "sea"){
                        //ground.scene.children[i].visible = false;
                        ground.scene.children[i].material = ground.material;
                    }
                    if(ground.scene.children[i].name == "waterfall"){
                        //ground.scene.children[i].visible = false;
                        ground.scene.children[i].material = ground.material;
                    }
                    ground.scene.children[i].castShadow = true;
                    ground.scene.children[i].receiveShadow = true;
                }
            }

            //ground.scene.visible = false;

        }, undefined, undefined);
    },

    material : null
    
}


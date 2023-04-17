import { GLTFLoader } from '../modules/GLTFLoader.js';
import * as THREE from '../modules/three.module.js';

export const clouds = {

    loaded: false,
    scene: null,
    offset: -40,

    init: function(){

        const loader = new GLTFLoader();

        //modify shader of standard material
        clouds.material = new THREE.MeshStandardMaterial();
        clouds.material.onBeforeCompile = function ( shader ) {

            shader.uniforms.time = { value: 0 };
            shader.uniforms.offset = { value: clouds.offset };
            shader.uniforms.cloudColor = { value: new THREE.Color('#999999') };
            shader.uniforms.highlightColor = { value: new THREE.Color('#f2f2f2') };

            //modify vertexshader
            shader.vertexShader = 'uniform float time;\n' + 'out vec3 pos;\n' + 

            //random vec
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

                    //place wave generators in 4 corners
                    'vec2 origin1 = tempPos.xz + vec2(300.0, 300.0);',
                    'vec2 origin2 = tempPos.xz + vec2(-300.0, 300.0);',
                    'vec2 origin3 = tempPos.xz + vec2(300.0, -300.0);',
                    'vec2 origin4 = tempPos.xz + vec2(-300.0, -300.0);',

                    'float distance1 = length(origin1);',
                    'float distance2 = length(origin2);',
                    'float distance3 = length(origin3);',
                    'float distance4 = length(origin4);',

                    //first set of waves
                    'float wave1 = wave(tempPos.xz, 0.1, 0.5, distance1, time * 0.5);',
                    'float wave2 = wave(tempPos.xz, 0.2, 0.4, distance2, time * 0.7);',
                    'float wave3 = wave(tempPos.xz, 0.3, 0.3, distance3, time * 0.9);',
                    'float wave4 = wave(tempPos.xz, 0.4, 0.2, distance4, time * 1.1);',

                    //combine first set
                    'float combined1 = abs(wave1 + wave2 + wave3 + wave4);',

                    //second set of waves
                    'float wave5 = wave(tempPos.xz, 0.4, 0.5, distance1, time * 1.1);',
                    'float wave6 = wave(tempPos.xz, 0.3, 0.4, distance2, time * 0.9);',
                    'float wave7 = wave(tempPos.xz, 0.2, 0.3, distance3, time * 0.7);',
                    'float wave8 = wave(tempPos.xz, 0.1, 0.2, distance4, time * 0.5);',

                    //combine second set
                    'float combined2 = abs(wave5 + wave6 + wave7 + wave8);',

                    //calculate y position
                    'tempPos.y += abs(gradNoise(vec2(tempPos.x, tempPos.z))) + (combined1 + combined2 - 0.3) * 3.;',

                    //uniform for fragmentShader
                    'pos = tempPos;',

                    'vec3 transformed = vec3(tempPos);',
                ].join('\n')
            );

            //modify fragmentshader
            shader.fragmentShader = 'in vec3 pos;\n' +
            'uniform vec3 cloudColor;\n' +
            'uniform vec3 highlightColor;\n' +
            'uniform float offset;\n' +

            shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                [
                    'float mask = clamp(pos.y - offset, -1., 1.);',

                    'diffuseColor.rgb = mix(cloudColor, highlightColor, mask);',

                ].join('\n')
            );

            clouds.material.userData.shader = shader;

        };

        //init plane for cloud surface
        const geometry = new THREE.PlaneGeometry(1500, 1500, 350, 350).rotateX(-Math.PI / 2).translate(0, clouds.offset, 0);

        const mesh = new THREE.Mesh(geometry, clouds.material);
        clouds.scene = mesh;

        clouds.loaded = true;
    },

    material : null
    
}
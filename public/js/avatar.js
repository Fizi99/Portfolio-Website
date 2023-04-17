
import { GLTFLoader } from '../modules/GLTFLoader.js';
import * as THREE from '../modules/three.module.js';

export const avatar = {

    path: './assets/models/avatar.glb',
    loaded: false,
    scene: null,
    target: new THREE.Vector3(0,0,0),
    moveVec: new THREE.Vector3(0,0,0),
    speed: 0.1,
    targetReached: false,
    searchRadius: 10,
    offset: 1,
    mixer: null,

    init: function(){

        const loader = new GLTFLoader();

        //load scene from gltf File
        loader.load(this.path, function (gltf){

            //animations
            avatar.mixer = new THREE.AnimationMixer(gltf.scene);
            const animationAction = avatar.mixer.clipAction(gltf.animations[0]);
            animationAction.play();

            //set variables in Object
            avatar.scene = gltf.scene;
            avatar.loaded = true;
            avatar.scene.position.set(0,0,0);

            for(let i = 0; i < avatar.scene.children[0].children.length; i++){
                if (avatar.scene.children[0].children[i].isMesh) {
                    avatar.scene.children[0].children[i].castShadow = true;
                    avatar.scene.children[0].children[i].receiveShadow = true;
                }
                
    
            }

            //avatar.scene.visible = false;

        }, undefined, undefined);
    },

    
    calcTarget: function(target, islands){

        let direction = new THREE.Vector3(target.x - avatar.scene.position.x, target.y - avatar.scene.position.y, target.z - avatar.scene.position.z);

        //check if targetpoint is reached
        if(direction.length() <= 0.5){
            avatar.targetReached = true;
            return;
        }else{
            avatar.targetReached = false;
        }

        //check for intersections with islands
        let intersects = [];

        for(let i = 0; i < islands.length; i++){

            //check if island is in searchradius
            let closeness = new THREE.Vector2(islands[i].scene.position.x - avatar.scene.position.x, islands[i].scene.position.z - avatar.scene.position.z);
            if(closeness.length() < this.searchRadius){

                if(this.intersectsCircle(avatar.scene.position.x, avatar.scene.position.z, target.x, target.z, islands[i].scene.position.x, islands[i].scene.position.z, islands[i].radius)){

                    intersects[i] = islands[i];
                }else{
                    intersects[i] = null;
                }
            }else{

                intersects[i] = null;
            }
        }

        //calculate closest island in way of path
        let closestVec = new THREE.Vector3(1000,1000,1000);
        let closestIsland = null;

        //loop through intersects
        for(let i = 0; i < intersects.length; i++){

            //if arrayposition contains intersections
            if(intersects[i]!= null){
                
                let currentVec = intersects[i].scene.position;

                let current = new THREE.Vector2(currentVec.x - avatar.scene.position.x, currentVec.z - avatar.scene.position.z);

                //check if new colliding island is closest
                if(current.lengthSq() < closestVec.lengthSq()){

                    closestIsland = islands[i];
                    closestVec = current;
                }
            }
        }

        //if avatar might collide with island, calculate a new target tangential to islandhitbox
        if(closestVec.x != 1000){

            //calc thales circle with middlepoint between avatarposition and islandposition
            let vecAvatarIsland = new THREE.Vector2(closestIsland.scene.position.x - avatar.scene.position.x, closestIsland.scene.position.z - avatar.scene.position.z);
            let radAvatarIsland = vecAvatarIsland.length() / 2;
            let mPAvatarIsland = new THREE.Vector2(avatar.scene.position.x + (vecAvatarIsland.x / 2), avatar.scene.position.z + (vecAvatarIsland.y / 2));

            //calc points tangential to island hitbox by finding intersections between hitbox and thales circle
            let tangentPointsAvatar = this.intersectionPoints(mPAvatarIsland.x, mPAvatarIsland.y, radAvatarIsland, closestIsland.scene.position.x, closestIsland.scene.position.z, closestIsland.radius);

            if(tangentPointsAvatar.length > 0){

                //check what way around island is closest to target
                let dist1 = new THREE.Vector2(target.x - tangentPointsAvatar[0][0], target.z - tangentPointsAvatar[0][1]);
                let dist2 = new THREE.Vector2(target.x - tangentPointsAvatar[1][0], target.z - tangentPointsAvatar[1][1]);

                dist1 = dist1.length();
                dist2 = dist2.length();

                let offsetVec = new THREE.Vector3;

                //if distances are too similar the avatar starts to flicker. to prevent this we have a range that chooses what path to take in that case.
                let range = 1;
                if((dist1 - range) < dist2 && (dist1 + range) > dist2){
                    dist1 += 1000;
                }

                //dist1 <= dist2

                if(dist1 <= dist2){

                    //offset new targetpoint so avatar doesnt get stuck on island when calculating new tangents next frame
                    offsetVec = new THREE.Vector3(tangentPointsAvatar[0][0] - closestIsland.scene.position.x,
                                                  0,
                                                  tangentPointsAvatar[0][1] - closestIsland.scene.position.z);
                    offsetVec = offsetVec.normalize();

                    //set new targetpoint
                    avatar.target = new THREE.Vector3(tangentPointsAvatar[0][0] + (offsetVec.x * this.offset), 0, tangentPointsAvatar[0][1] + (offsetVec.z * this.offset));

                }else{

                    //offset new targetpoint so avatar doesnt get stuck on island when calculating new tangents next frame
                    offsetVec = new THREE.Vector3(tangentPointsAvatar[1][0] - closestIsland.scene.position.x,
                                                  0,
                                                  tangentPointsAvatar[1][1] - closestIsland.scene.position.z);
                    offsetVec = offsetVec.normalize();

                    //set new targetpoint
                    avatar.target = new THREE.Vector3(tangentPointsAvatar[1][0] + (offsetVec.x * this.offset), 0, tangentPointsAvatar[1][1] + (offsetVec.z * this.offset));
                }

            }

        } else {

            avatar.target = target;

        }

        //erst in 2d umformen
        /*satz des Thales:
        kreis mit mittelpunkt: O
        aktuelle position: P
        gesuchter punkt auf kreis: T und T´
        rechtwinkliges dreieck T->P
        kreis mit mittelpunkt zwischen O und P bilden
        schnittpunkte der Kreise ermitteln um Tangenten zu erhalten

        hypotenuse: OP mit länge vektor OP
        gegenkathete: OT mit länge radius
        alpha = arcsin(gegenkathete/hypotenuse)
        beta = 90-alpha
        */

    },

    //check if line segment intersects circle
    //https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
    intersectsCircle: function(ax, ay, bx, by, cx, cy, r){

        //move c to origin
        ax -= cx;
        ay -= cy;
        bx -= cx;
        by -= cy;

        //put vectors into circle quation and multiply out
        //(ax^2+ay^2−r^2)+2(ax(bx−ax)+ay(by−ay))t+((bx−ax)^2+(by−ay)^2)t^2=0
        //for easier code readability simplify brackets
        let a = (ax * ax) + (ay * ay) - (r * r);
        let c = ((bx - ax) * (bx - ax)) + ((by - ay) * (by - ay));
        let b = 2*(ax*(bx - ax) + ay*(by - ay));
        
        //use discriminant to check if t has 2 real values
        let disc = (b * b) - 4 * c * a;

        if(disc <= 0){
            return false;
        }

        //calculate t to check if it is between 0 and 1. If it is, the linesegment intersects the circle.
        let sqrtdisc = Math.sqrt(disc);
        let t1 = (-b + sqrtdisc)/(2*c);
        let t2 = (-b - sqrtdisc)/(2*c);

        if((0 < t1 && t1 < 1) || (0 < t2 && t2 < 1)){
            return true;
        }

        return false;

    },

    //Finds intersection point of two circles
    // based on the math here:
    // http://math.stackexchange.com/a/1367732
    // x1,y1 is the center of the first circle, with radius r1
    // x2,y2 is the center of the second ricle, with radius r2
    //https://gist.github.com/jupdike/bfe5eb23d1c395d8a0a1a4ddd94882ac
    //calculate intersection points between 2 circles
    intersectionPoints: function(x1, y1, r1, x2, y2, r2){

        var centerdx = x1 - x2;
        var centerdy = y1 - y2;
        var R = Math.sqrt(centerdx * centerdx + centerdy * centerdy);
        if (!(Math.abs(r1 - r2) <= R && R <= r1 + r2)) { // no intersection
            return []; // empty list of results
        }
        // intersection(s) should exist

        var R2 = R*R;
        var R4 = R2*R2;
        var a = (r1*r1 - r2*r2) / (2 * R2);
        var r2r2 = (r1*r1 - r2*r2);
        var c = Math.sqrt(2 * (r1*r1 + r2*r2) / R2 - (r2r2 * r2r2) / R4 - 1);

        var fx = (x1+x2) / 2 + a * (x2 - x1);
        var gx = c * (y2 - y1) / 2;
        var ix1 = fx + gx;
        var ix2 = fx - gx;

        var fy = (y1+y2) / 2 + a * (y2 - y1);
        var gy = c * (x1 - x2) / 2;
        var iy1 = fy + gy;
        var iy2 = fy - gy;

        return [[ix1, iy1], [ix2, iy2]];
    },

    //move avatar to target
    moveToTarget: function(camera, delta){

        //calc moveVec from target point and current position
        avatar.moveVec = new THREE.Vector3(avatar.target.x - avatar.scene.position.x, avatar.target.y - avatar.scene.position.y, avatar.target.z - avatar.scene.position.z);

        avatar.moveVec = avatar.moveVec.normalize();
 
        //move avatar along movevector and rotate to face target
        avatar.scene.position.set(avatar.scene.position.x + avatar.moveVec.x * avatar.speed * delta * 100
                                , avatar.scene.position.y
                                , avatar.scene.position.z + avatar.moveVec.z * avatar.speed * delta * 100);
        avatar.scene.lookAt(avatar.target);
        //update camera position
        camera.position.set(camera.position.x + avatar.moveVec.x * avatar.speed * delta * 100
                            , camera.position.y
                            , camera.position.z + avatar.moveVec.z * avatar.speed * delta * 100);
        
    }

}
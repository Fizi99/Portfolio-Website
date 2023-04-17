export class UIHandler{

    constructor(){
        this.island = null;
        this.animateIsland = false;
        this.onIsland = false;
        this.animationTime = 0.3;
        this.currentAnimationTime = 0;
        this.maxLeft = 100;
        this.minLeft = 45;
        this.helpVisible = false;
        this.helpOpacity = 1;
        this.helpOpacityStep = 0.9;
        this.helpOpacityDirection = -1;
    }

    //interpolate left position of projectwindow
    animateIslandUI(delta){
        if(this.animateIsland){
            //animation for mobile screens
            if(window.matchMedia("(max-width: 550px)").matches){
                this.minLeft = 0;
            }else if(window.matchMedia("(min-width: 550px) and (max-width: 1160px)").matches){
                this.minLeft = 25;
            }else{
                this.minLeft = 45;
            }
            if(this.currentAnimationTime < this.animationTime){

                let deltaTime = ((this.currentAnimationTime * 100) / this.animationTime) / 100;

                document.getElementById(this.island.domID).style.left = (1 - deltaTime) * this.maxLeft + deltaTime * this.minLeft + "%";

                this.currentAnimationTime += delta;
            }else{
                //snap window to correct position
                document.getElementById(this.island.domID).style.left = this.minLeft + "%";
                this.animateIsland = false;
            }
        }
    }

    //generate Project Window from JSON file
    generateProjects(projects){
        const wrapper = document.getElementById('projectWrapper');

        for(let i = 0; i < projects.length; i++){
            //create the window
            let window = document.createElement('div');
            window.setAttribute('class', 'projectWindow');
            window.setAttribute('id', projects[i].id);

            //create the close button
            let closeBtn = document.createElement('button');
            closeBtn.setAttribute('class', 'closeBtn');
            closeBtn.setAttribute('alt', 'close button');

            //create headline
            let headline = document.createElement('h1');
            headline.setAttribute('class', 'projectHeader');
            headline.innerHTML = projects[i].title;

            //create content div
            let content = document.createElement('div');
            content.setAttribute('class', 'scroller');

            //create media
            //1 => images
            //2 => video
            if(projects[i].media === 1){
                for(let j = 0; j < projects[i].images.length; j++){
                    let image = document.createElement('img');
                    image.setAttribute('class', 'projectPic');
                    image.setAttribute('src', projects[i].images[j].path);
                    image.setAttribute('alt', projects[i].images[j].alt);

                    //append image to contentdiv
                    content.appendChild(image);
                }

            }else if(projects[i].media === 2){
                let video = document.createElement('video');
                video.setAttribute('width', '720');
                video.setAttribute('height', '480');
                video.setAttribute('controls', 'controls');
                video.setAttribute('class', 'projectVid');
                video.innerHTML = "Your browser does not support the video tag.";

                let videoSource = document.createElement('source');
                videoSource.setAttribute('src', projects[i].video);
                videoSource.setAttribute('type', 'video/mp4');

                //append source to video tag and to content
                video.appendChild(videoSource);
                content.appendChild(video);
            }

            //create text
            let text = document.createElement('p');
            text.setAttribute('class', 'projectText');
            text.innerHTML = projects[i].text;

            //append text to contentdiv
            content.appendChild(text);

            //create link
            if(projects[i].link === 1){
                //link button
                let linkWrapper = document.createElement('div');
                linkWrapper.setAttribute('class', 'linkWrapper');

                //link
                let link = document.createElement('a');
                link.setAttribute('href', projects[i].href);
                link.setAttribute('class', 'link');
                link.setAttribute('target', '_blank');
                link.innerHTML = projects[i].linkText;

                //append link to contentdiv
                linkWrapper.appendChild(link);
                content.appendChild(linkWrapper);
                
            }

            //append to window
            window.appendChild(closeBtn);
            window.appendChild(headline);
            window.appendChild(content);

            wrapper.appendChild(window);
        }
    }

    visitIsland(island){
        this.island = island;
        this.animateIsland = true;
        this.onIsland = true;
        document.getElementById(this.island.domID).style.visibility = "visible";
        document.body.style.cursor = "auto";
    }

    leaveIsland(){
        this.onIsland = false;
        this.animateIsland = false;
        document.getElementById(this.island.domID).style.visibility = "hidden";
        this.island = null;
        this.currentAnimationTime = 0;
    }

    changeCursor(hover){

        if(!this.onIsland){

            if(hover){
                document.body.style.cursor = "pointer";
            }else{
                document.body.style.cursor = "auto";
            }
        }
    }

    updateLoading(percent){
        document.getElementById("loadingText").innerHTML = percent + "%";
    }

    hideLoading(){
        document.getElementById("loadingscreen").style.visibility = "hidden";
        this.initHelp();
    }

    initScore(islandLength){
        document.getElementById("scoreText").innerHTML = "0" + "/" + islandLength;
    }

    updateScore(visitedIslands, islandLength){
        document.getElementById("scoreText").innerHTML = visitedIslands + "/" + islandLength;
    }

    initHelp(){
        if(window.matchMedia("(max-width: 550px)").matches){
            document.getElementById("helpText").innerHTML = "Tippe, um mein Portfolio zu erkunden!";
        }
        document.getElementById("help").style.visibility = "visible";
        this.helpVisible = true;
    }

    hideHelp(){
        if(this.helpVisible){
            document.getElementById("help").style.visibility = "hidden";
            this.helpVisible = false;
        }
    }

    //animate helpertext
    updateHelp(delta){
        if(this.helpVisible){
            if(this.helpOpacity <= 0){
                this.helpOpacity = 0;
                this.helpOpacityDirection = 1;
            }else if(this.helpOpacity >= 1){
                this.helpOpacity = 1;
                this.helpOpacityDirection = -1;
            }

            this.helpOpacity += this.helpOpacityDirection * this.helpOpacityStep * delta;
            document.getElementById("help").style.opacity = this.helpOpacity;

        }
    }
}
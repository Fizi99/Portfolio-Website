/*AUTHOR ANTON FRIEDRICH FITZENREITER*/



//Nach dem laden der Seite wird Code ausgeführt
window.onload = function(){
    addEvent();
};

//Menüknopf bekommt EventListener
function addEvent() {
    document.getElementById("button").addEventListener("touchstart", menuOnTouch);
    document.getElementById("button").addEventListener("click", menuOnClick);
}

//Menü wird ausgeklappt. Bei erneutem anklicken des Knopfes wird Menü geschlossen
function menuOnClick() {
    document.getElementById("changeontap").style.display = 'block';
    document.getElementById("button").addEventListener("click", cancelClick);
    document.getElementById("button").removeEventListener("click", menuOnClick);
}

//Menü wird eingeklappt. Bei erneutem klicken des Knopfes wird Menü wieder geöffnet
function cancelClick() {
    document.getElementById("changeontap").style.display = 'none';
    document.getElementById("button").addEventListener("click", menuOnClick);
    document.getElementById("button").removeEventListener("click", cancelClick);
}

//Menü wird ausgeklappt. Bei erneutem antippen des Knopfes wird Menü geschlossen
function menuOnTouch() {
    document.getElementById("changeontap").style.display = 'block';
    document.getElementById("button").addEventListener("touchstart", cancelTouch);
    document.getElementById("button").removeEventListener("touchstart", menuOnTouch);
    
}

//Menü wird eingeklappt. Bei erneutem antippen des Knopfes wird Menü wieder geöffnet
function cancelTouch() {
    document.getElementById("changeontap").style.display = 'none';
    document.getElementById("button").addEventListener("touchstart", menuOnTouch);
    document.getElementById("button").removeEventListener("touchstart", cancelTouch);
}
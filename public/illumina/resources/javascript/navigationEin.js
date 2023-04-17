/*AUTHOR MUNIR ALI*/


//Nach dem laden der Seite wird Code ausgeführt
window.onload = function(){
  addEvent();


  try{

    let gru = document.getElementById("gru"); 
    let adre = document.getElementById("adre");
    let beste= document.getElementById("beste");
    
    //Daten in die Kundennachricht einfügen
    gru.innerHTML = gru.innerHTML + localStorage.getItem("anrede") + " " + localStorage.getItem("name");

    beste.innerHTML="Wir haben die Bestellungsdetails erhalten und werden diese Schnellst möglich verarbeiten. Der Gegenstand" + localStorage.getItem("gegenstand") +  " wird an folgende Adresse Versand:";
    adre.innerHTML = localStorage.getItem("straße") + " " + localStorage.getItem("hausnummer") +" " + "<br></br>" + localStorage.getItem("postleitzahl") +" "+ localStorage.getItem("stadt")  + "<br></br>" + "Die Rechnung über "+localStorage.getItem("preis")  +" wird mit der Bestellung zusammen eingehen.";
  
    //link zur Startseite
    document.getElementById("back").addEventListener("click", function() {

      window.location.href="index.html"
    })
   }
   catch (e) {
    
   }
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


const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const clinixstore = new Store();
let $ = require('jquery');


const init = () => {
    let mess = "<b>Versión de Clinix:</b> " + clinixstore.get('clinix_version') + ".<br>";
    mess += "<b>Versión de Node:</b> " + clinixstore.get('node_version') + ".<br>";
    mess += "<b>Versión de Chrome:</b> " + clinixstore.get('chrome_version') + ".<br>";
    mess += "<b>Versión de Electron:</b> " + clinixstore.get('electron_version') + ".<br>";
    document.getElementById('app-info').innerHTML = mess;

    alertOnlineStatus()
    window.addEventListener('online', alertOnlineStatus)
    window.addEventListener('offline', alertOnlineStatus)
    window.addEventListener('blur', function(){
        document.body.className = "focusout"
    })
    window.addEventListener('focus', function(){
        document.body.className = ""
    })
}

const alertOnlineStatus = () => {
    new Notification('Estatus de Red', {
        body: navigator.onLine ? 'En línea' : 'Sin conexión'
    })
}

// maximize, minimize, close control buttons
document.getElementById('close-button').addEventListener('click', async () => {
    await ipcRenderer.invoke('control-buttons:close')
})
document.getElementById('min-button').addEventListener('click', async () => {
    await ipcRenderer.invoke('control-buttons:minimize')
})
document.getElementById('max-button').addEventListener('click', async () => {
    await ipcRenderer.invoke('control-buttons:toggle')
})
document.getElementById('window-header').addEventListener('dblclick', async () => {
    await ipcRenderer.invoke('control-buttons:toggle')
})

/*
const myNotification = new Notification('Title', {
    body: 'Notification from the Renderer process'
})
  
myNotification.onclick = (not, evt) => {
    console.log('Notification clicked', evt)
}
*/

// toggle Dark / Light Mode
$('#set-dark-mode').on('click', function(e){
    e.preventDefault();
    ipcRenderer.invoke('dark-mode:set')
})
$('#set-light-mode').on('click', function(e){
    e.preventDefault();
    ipcRenderer.invoke('light-mode:set')
})

init();

currsecc = '';
$("#sidemenu").on("click", "a", function(e){
    e.preventDefault();
    $("#sidemenu a.active").removeClass("active");
    $(this).addClass("active");
    tgt = $(this).attr("href");
    if(tgt != currsecc){
        initsecc(tgt);
        if(currsecc != ''){
            $("section:visible").slideUp(400, function(){
                $(tgt).fadeIn(400, function(){ currsecc = tgt });
            });
        }
        else{
            $(tgt).fadeIn(400, function(){ currsecc = tgt });
        }
    }
})

// funciones especificas al cargar cada sección
function initsecc(sec){
    if(sec == "#secc_account"){
        $("#form-login").show();
        $("#form-register").hide();
        $("#form-resetpassword").hide();
    }

    var sf = sec.replace("#","");

    if(typeof window["onLoad_" + sf] === 'function'){
        window["onLoad_" + sf]();
    }
}

function onLoad_secc_config(){
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("no esta permitido acceder a los dispositivos.");
        return;
    }
    else{
        navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
            $("#audio-in option").remove();
            $("#audio-out option").remove();
            $("#video-in option").remove();
            devices.forEach(function(device) {
                //console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
                if(device.kind == "audiooutput")
                    $("#audio-in").append("<option value='" + device.deviceId + "'>" + device.label + "</option>");
                else if(device.kind == "audioinput")
                    $("#audio-out").append("<option value='" + device.deviceId + "'>" + device.label + "</option>");
                else if(device.kind == "videoinput")
                    $("#video-in").append("<option value='" + device.deviceId + "'>" + device.label + "</option>");
            });
        })
        .catch(errorCallback)
        
    }
}


// acciones modulo account
$(".btn-resetpassword").on("click", function(){
    $("#form-login:visible, #form-register:visible").fadeOut(300, function(){
        $("#form-resetpassword").fadeIn(400);
    });
})

$(".btn-createaccount").on("click", function(){
    $("#form-login:visible, #form-resetpassword:visible").fadeOut(300, function(){
        $("#form-register").fadeIn(400);
    });
})

$(".btn-login").on("click", function(){
    $("#form-register:visible, #form-resetpassword:visible").fadeOut(300, function(){
        $("#form-login").fadeIn(400);
    });
})

// funcion para manejo de errores
function errorCallback(e) {
    console.log('Error:', e)
}
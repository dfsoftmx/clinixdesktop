const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const clinixstorage = new Store();
let $ = jQuery = require('jquery');


const init = () => {
   
	if(process.platform == 'win32'){
		$("body").addClass('windows')
	}
	else{
		$("body").addClass('macos')		
	}

	window.addEventListener('blur', function(){
		$("body").addClass("focusout");
	})
	window.addEventListener('focus', function(){
		$("body").removeClass("focusout");
	})

	let mess = "<b>Versión de Clinix:</b> " + clinixstorage.get('clinix_version') + ".<br>";
	mess += "<b>Versión de Node:</b> " + clinixstorage.get('node_version') + ".<br>";
	mess += "<b>Versión de Chrome:</b> " + clinixstorage.get('chrome_version') + ".<br>";
	mess += "<b>Versión de Electron:</b> " + clinixstorage.get('electron_version') + ".<br>";
	document.getElementById('app-info').innerHTML = mess;

	// maximize, minimize, close control buttons
	$(".btn-win-close").on("click", function(e){
		ipcRenderer.invoke('control-buttons:close');
	})
	$(".btn-win-mini").on("click", function(e){
		ipcRenderer.invoke('control-buttons:minimize')
	})

	initsecc("#secc_config");
}

// toggle Dark / Light Mode
$('#set-dark-mode').on('click', function(e){
	e.preventDefault();
	ipcRenderer.invoke('dark-mode:set')
	clinixstorage.set('style_theme', 'dark');
})
$('#set-light-mode').on('click', function(e){
	e.preventDefault();
	ipcRenderer.invoke('light-mode:set')
	clinixstorage.set('style_theme', 'light');
})

let currsecc = '';
$("#sidemenu").on("click", "a", function(e){
	e.preventDefault();
	tgt = $(this).attr("href");
	initsecc(tgt);
})

// funciones especificas al cargar cada sección
function initsecc(sec){

	$("#sidemenu a.active").removeClass("active");
	$("#sidemenu a[href='" + sec + "']").addClass("active");
	
	if(sec != currsecc){
		
		if(currsecc != ''){
			$("section:visible").slideUp(400, function(){
				$(sec).fadeIn(400, function(){ currsecc = sec });
			});
		}
		else{
			$(sec).fadeIn(400, function(){ currsecc = sec });
		}
	}

	var sf = sec.replace("#","");

	if(typeof window["onLoad_" + sf] === 'function'){
		window["onLoad_" + sf]();
	}

	$("#video-in").on("change", function(e){
		let src = $(this).val();
		if(src){
			console.log("video-in: ", src);
			clinixstorage.set("default_video_in", src);    
		}
		else{
			clinixstorage.delete("default_video_in");
		}
	});
	$("#audio-out").on("change", function(e){
		let src = $(this).val();
		if(src){
			console.log("audio-out: ", src);
			clinixstorage.set("default_audio_out", src);
		}
		else{
			clinixstorage.delete("default_audio_out");
		}
	});
	$("#audio-in").on("change", function(e){
		let src = $(this).val();
		if(src){
			console.log("audio-in", src);
			clinixstorage.set("default_audio_in", src);
		}
		else{
			clinixstorage.delete("default_audio_in");
		}
	});
}

function onLoad_secc_config(){
	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		console.log("no esta permitido acceder a los dispositivos.");
		return;
	}
	else{
		_default_audio_in = clinixstorage.get("default_audio_in",'');
		_default_audio_out = clinixstorage.get("default_audio_out",'');
		_default_video_in = clinixstorage.get("default_video_in",'');
		let selected = '';
		navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
			$("#audio-in option").remove();
			$("#audio-out option").remove();
			$("#video-in option").remove();
			$("#audio-out").append("<option value=''> --- </option>");
			$("#audio-in").append("<option value=''> --- </option>");
			$("#video-in").append("<option value=''> --- </option>");
			devices.forEach(function(device) {
				//console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
				if(device.kind == "audiooutput"){
					selected = (_default_audio_out == device.deviceId) ? 'selected' : '';
					$("#audio-out").append("<option value='" + device.deviceId + "' " + selected + " >" + device.label + "</option>");
				}
				else if(device.kind == "audioinput"){
					selected = (_default_audio_in == device.deviceId) ? 'selected' : '';
					$("#audio-in").append("<option value='" + device.deviceId + "' " + selected + " >" + device.label + "</option>");
				}
				else if(device.kind == "videoinput"){
					selected = (_default_video_in == device.deviceId) ? 'selected' : '';
					$("#video-in").append("<option value='" + device.deviceId + "' " + selected + " >" + device.label + "</option>");
				}
			});
		})
		.catch(errorCallback)
		
	}
}

// funcion para manejo de errores
function errorCallback(e) {
	console.log('Error:', e)
}

init();
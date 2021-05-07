const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const clinixstore = new Store();
let $ = jQuery = require('jquery');
let currsecc = '';


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

	// validamos si existe un token de usuario firmado
	if(clinixstore.get('clinix_user_token', '') !== ''){
		getLoggedUser();
	}
	else{
		initsecc("#secc_account");
	}

	$("#form-login").on("submit", function(e){
		e.preventDefault();
		loginUser();
	})

	// maximize, minimize, close control buttons
	$(".btn-win-close").on("click", function(e){
		ipcRenderer.invoke('control-buttons:close');
	})
	$(".btn-win-mini").on("click", function(e){
		ipcRenderer.invoke('control-buttons:minimize')
	})
	
	// boton abrir configuración para windows
	$(".btn-mini-config").on("click", function(e){
		e.preventDefault();
		ipcRenderer.invoke('window-open:config');
	})

	$(".btn-admin").hide();

	const notification = document.getElementById('notification');
	const message = document.getElementById('message');
	const restartButton = document.getElementById('restart-button');
	ipcRenderer.on('update_available', () => {
		ipcRenderer.removeAllListeners('update_available');
		message.innerText = 'Hay una nueva actualización. Descargando...';
		notification.classList.remove('hidden');
	});
	ipcRenderer.on('update_downloaded', () => {
	ipcRenderer.removeAllListeners('update_downloaded');
		message.innerText = 'Actualización descargada. Se instalará al reiniciar. Reiniciar ahora?';
		restartButton.classList.remove('hidden');
		notification.classList.remove('hidden');
	});
}

init();

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
		
		if(sec == "#secc_account"){
			$("#secc_logout_btn").hide();
			$("#secc_info_btn").hide();
			$("#secc_account_btn").show();
			$("#form-login").show();
			$("#form-register").hide();
			$("#form-resetpassword").hide();
		}
		else if(sec == "#secc_info"){
			$("#secc_logout_btn").show();
			$("#secc_info_btn").show();
			$("#secc_account_btn").hide();
			$("#view-info").show();
			$("#form-info").hide();
		}
		else if(sec == "#secc_logout"){
			logoutUser();
			sec = "#secc_account";
			initsecc(sec);
			return;
		}

		var sf = sec.replace("#","");

		if(typeof window["onLoad_" + sf] === 'function'){
			window["onLoad_" + sf]();
		}

		if(currsecc != ''){
			$("section:visible").slideUp(400, function(){
				$(sec).fadeIn(400, function(){ currsecc = sec });
			});
		}
		else{
			$(sec).fadeIn(400, function(){ currsecc = sec });
		}
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

// acciones modulo informacion de la cuenta
$(".btn-clinica").on("click", function(e){
	ipcRenderer.invoke('window-open:consulta')
})
$(".btn-expediente").on("click", function(e){
	ipcRenderer.invoke('window-open:expediente')
})
$(".btn-agenda").on("click", function(e){
	//ipcRenderer.invoke('window-open:agenda')
})
$(".btn-admin").on("click", function(e){
	e.preventDefault();
	ipcRenderer.invoke('window-open:admin')
});

// function al iniciar la sección de información del usuario
function onLoad_secc_info(){
	user = JSON.parse(clinixstore.get('clinix_user'));
	info_cont = user.name + " (" + user.email + ")<br>";
	if(user.phone != null && user.phone != '')
		info_cont += "Tel:" + user.phone + "<br>";
	if(user.speacialty != null && user.speacialty != '')
		info_cont += "Especialidad:" + user.speacialty + "<br>";

	$("#view-info .content").html(info_cont);
}

// function que valida si el token es valido
function getLoggedUser(){
	token = clinixstore.get('clinix_user_token');
	$.ajax({
		url: process.env.API_URL + '/medico',
		type: 'GET',
		headers:{
		  'X-Requested-With': 'XMLHttpRequest',
		  'Authorization': 'Bearer ' + token
		},
		success: function(resp){
			if(resp.status == 'ok'){
				clinixstore.set('clinix_user', JSON.stringify(resp.user));
				console.log(resp.user);
				initsecc("#secc_info");
				if(typeof resp.user.group != 'undefined' && resp.user.group < 6){
					ipcRenderer.invoke('menu:rebuild', 'admin')
					$(".btn-admin").show();
				}
				else{
					ipcRenderer.invoke('menu:rebuild', 'medic')
				}
			}
			else{
				clinixstore.delete('clinix_user_token');
				clinixstore.delete('clinix_user');
				initsecc("#secc_account");
				let alertdata = {type: 'Cerrar sesión', message: 'Tu sesión ha caducado'}
				ipcRenderer.invoke('notifications:show', alertdata)
			}
		},
		error: function(error){
			clinixstore.delete('clinix_user_token');
			clinixstore.delete('clinix_user');
			initsecc("#secc_account");
		}
	});
}

// login user
function loginUser(){
	token = clinixstore.get('clinix_user_token');
	_user = $("#usuario-login").val();
	_pass = $("#password-login").val();
	$.ajax({
		url: process.env.API_URL + '/medico/auth',
		type: 'POST',
		data: {email: _user, password: _pass},
		headers:{
		  'X-Requested-With': 'XMLHttpRequest',
		  'Authorization': 'Bearer ' + token
		},
		success: function(resp){
			if(resp.status == 'ok'){
				clinixstore.set('clinix_user_token', resp.ctoken);
				let alertdata = {type: 'Bienvenido', message: 'Es bueno tenerte de vuelta'}
				ipcRenderer.invoke('notifications:show', alertdata)
				getLoggedUser();
			}
			else{
				clinixstore.delete('clinix_user_token');
				clinixstore.delete('clinix_user');
				initsecc("#secc_account");
				let alertdata = {type: resp.status, message: resp.message}
				ipcRenderer.invoke('notifications:show', alertdata)
			}
		},
		error: function(error){
			clinixstore.delete('clinix_user_token');
			clinixstore.delete('clinix_user');
			initsecc("#secc_account");
			let alertdata = {type: 'error', message: error}
			ipcRenderer.invoke('notifications:show', alertdata)
		}
	});
}

// logout user
function logoutUser(){
	token = clinixstore.get('clinix_user_token');
	clinixstore.delete('clinix_user_token');
	clinixstore.delete('clinix_user');
	$.ajax({
		url: process.env.API_URL + '/medico/logout',
		type: 'GET',
		headers:{
		  'X-Requested-With': 'XMLHttpRequest',
		  'Authorization': 'Bearer ' + token
		},
		success: function(resp){
			if(resp.status == 'ok'){
				let alertdata = {type: 'Cerrar sesión', message: 'Se ha cerrado la sesión'}
				ipcRenderer.invoke('notifications:show', alertdata)
			}
			else{
				let alertdata = {type: 'Error', message: 'Ocurrio un error:' + resp.message}
				ipcRenderer.invoke('notifications:show', alertdata)
			}
		},
		error: function(error){
			let alertdata = {type: 'Error', message: 'Ocurrio un error:' + error}
			ipcRenderer.invoke('notifications:show', alertdata)
			errorCallback(error)
		}
	});
}

// funcion para manejo de errores
function errorCallback(e) {
    console.log('Error:', e)
}

function closeNotification() {
	notification.classList.add('hidden');
}
function restartApp() {
	ipcRenderer.send('restart-install:app');
}
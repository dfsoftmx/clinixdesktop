const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const clinixstorage = new Store();
let $ = jQuery = require('jquery');

var OV, publisher, videosession;
let clinixroom, _timer, _timepaused, _lasterrormesstime;
let _default_audio_in, _default_audio_out, _default_video_in;
let currentpatient = {};
let clinixconnected = clinicaactiva = clinixroom_name = false;

let soundWL = new Audio('file://' + __dirname + '/sound/patient_wl.mp3');
	
ipcRenderer.on('close-windowactions', (event) => {
	closeWindowActions();
});

const init = () => {

	if(process.platform == 'win32'){
		$("body").addClass('windows')
	}
	else{
		$("body").addClass('macos')		
	}

	// definimos que el sonido se reproduce en loop
	soundWL.loop = true;
	
	window.addEventListener('blur', function(){
		$("body").addClass("focusout");
	})
	window.addEventListener('focus', function(){
		$("body").removeClass("focusout");
	})
	window.addEventListener('online', networkStatusChange)
	window.addEventListener('offline', networkStatusChange)


	// maximize, minimize, close control buttons
	$(".btn-win-close").on("click", function(e){
		closeWindowActions();
		setTimeout(function(){
			ipcRenderer.invoke('control-buttons:close');
		},100);
	})
	$(".btn-win-mini").on("click", function(e){
		ipcRenderer.invoke('control-buttons:minimize')
	})
	$(".btn-win-maxi").on("click", function(e){
		ipcRenderer.invoke('control-buttons:toggle')
	})
	document.getElementById('maximize-bar').addEventListener('dblclick', () => {
		ipcRenderer.invoke('control-buttons:toggle')
	})
	
	_default_layout = clinixstorage.get('clinix_consulta_default_layout');
	if(_default_layout)
		setLayout(_default_layout);

	connectClinix();
	initVideoThumbnail();
	detectMediaDevices();

	$("#video-patient").hide();

	$("#chat-message-input").on("keydown", "input", function(e) {
		if(e.which == 13) {
			e.preventDefault();
			let mess = $("#chat-message-input input").val();
			clinixroom.sendChatMessage(mess);
			addChatMessage(mess, 'local');
			$("#chat-message-input input").val('');
		}
	});
}

let currsecc = '';
$("#topmenu").on("click", "a", function(e){
	e.preventDefault();
	let tgt = $(this).attr("href");
	tgt = tgt.replace("#","");
	console.log('btn click:', tgt);
	if(tgt == 'expediente'){
		ipcRenderer.invoke('window-open:expediente')
	}
	else if(tgt == 'switchclinica'){
		toggleClinica();
	}
	else{
		setLayout(tgt);
	}
})

$(".waiting-list ul").on("click", "a", function(e){
	e.preventDefault();
	selectListNode($(this).parent("li"));
});

$(".waiting-list ul").on("click", ".btn-close", function(e){
	e.preventDefault();
	closePatient($(this));
})
$(".waiting-list ul").on("click", ".btn-pause", function(e){
	e.preventDefault();
	pausePatient($(this));
})
$(".waiting-list ul").on("click", ".btn-restart", function(e){
	e.preventDefault();
	restartPatient($(this));
})

// funciones de la pantalla de la consulta
function closeWindowActions(){
	closingWindow();
	leaveSession();
}

function networkStatusChange(){
	if(navigator.onLine){
		networkChangeOnline();
	}
	else{
		networkChangeOffline();
	}
}

function networkChangeOffline(){
	if(!_lasterrormesstime)
		_lasterrormesstime = 0;

	let dif = Date.now() - _lasterrormesstime;
	console.log(dif);
	if(dif > 60000){
		_lasterrormesstime = Date.now();
		$("#div-offline").fadeIn(400);
		createNotification('error', 'No hay conexión a internet');
		holdClinica();
	}
}

function networkChangeOnline(){
	$("#div-offline").fadeOut(400);
}

function detectMediaDevices(){
	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		createNotification('Error', 'Clinix no tiene acceso al micrófono y cámara.\nSon inidispensables para dar consulta.')
		ipcRenderer.invoke('window-open:config')
		return;
	}
	else{
		navigator.mediaDevices.enumerateDevices()
		.then(function(devices) {
			if(Object.keys(devices).length == 0){
				createNotification('Error', 'No se detectaron dispositivos de micrófono / cámara.\nSon inidispensables para dar consulta.')
				ipcRenderer.invoke('window-open:config')
			}
			else{
				_audio_in = clinixstorage.get("default_audio_in", undefined);
				_audio_out = clinixstorage.get("default_audio_out", undefined);
				_video_in = clinixstorage.get("default_video_in", undefined);
				_default_audio_in = undefined;
				_default_audio_out = undefined;
				_default_video_in = undefined;
				devices.forEach(function(device) {
					if(_audio_out != undefined && device.kind == "audiooutput" && _audio_out == device.deviceId){
						_default_audio_out = _audio_out;
					}
					else if(_audio_in != undefined && device.kind == "audioinput" && _audio_in == device.deviceId){
						_default_audio_in = _audio_in;
					}
					else if(_video_in != undefined && device.kind == "videoinput" && _video_in == device.deviceId){
						_default_video_in = _video_in;
					}
				});
			}
		})
		.catch(function(_err){
			createNotification('Error', 'No se detectaron dispositivos de micrófono / cámara.\nSon inidispensables para dar consulta.')
			ipcRenderer.invoke('window-open:config')
		})
		
	}
}

function setLayout(layout){
	$("#topmenu a.active").not(".activaclinica, .expediente").removeClass("active");
	$("#topmenu a[href='#" + layout + "']").addClass("active");
	$("body").removeClass("starter");
	$("body").removeClass("no_distractions");
	$("body").removeClass("full_view");
	$("body").addClass(layout);
	clinixstorage.set('clinix_consulta_default_layout', layout);
}

function toggleClinica(){

	console.log('toggleClinica current:', clinicaactiva);
	clinicaactiva = (clinicaactiva) ? false : true;
	console.log('toggleClinica new:', clinicaactiva);

	if(clinicaactiva){
		unholdClinica();
	}
	else{
		holdClinica();
	}
}

function holdClinica(){
	$("#topmenu a[href='#switchclinica']").removeClass("active");
	clinixroom.holdClinic();
}

function unholdClinica(){
	$("#topmenu a[href='#switchclinica']").addClass("active");
	clinixroom.unholdClinic();
}

function closingWindow(){
	clinixroom.closingWindow();
}

function startTimer(){
	if(typeof _timepaused == 'undefined' || _timepaused != true)
		_counter = 0;

	_timer = setInterval(function(){
		_min = 0;
		_hour = 0;
		++_counter;
		if(_counter > 59){
			_min = Math.floor(_counter / 60);
			if(_min > 59){
				_hour = Math.floor(_min / 60);
				_min = _min - (_hour * 60);
			}
		}
		
		_sec = _counter - (_min * 60) - (_hour * 3600);

		if(_hour > 0){
			_hour = (_hour.toString().length == 1) ? '0' + _hour : _hour;
			_min = (_min.toString().length == 1) ? '0' + _min : _min;
			_sec = (_sec.toString().length == 1) ? '0' + _sec : _sec;
			_timeelapsed = _hour + ':' + _min + ':' + _sec;
		}
		else{
			_min = (_min.toString().length == 1) ? '0' + _min : _min;
			_sec = (_sec.toString().length == 1) ? '0' + _sec : _sec;
			_timeelapsed = _min + ':' + _sec;
		}

		$("#topmenu .counter-time").html(_timeelapsed);
	}, 1000);
}

function pauseTimer(){
	_timepaused = true;
	clearInterval(_timer);
}

function stopTimer(){
	_timepaused = false;
	clearInterval(_timer);
	$("#topmenu .counter-time").html('');
}

function connectClinix(){
	clinixtoken = clinixstorage.get('clinix_user_token');
	clinixroom = new Clinix(clinixtoken);
	//clinixroom.connect();
}

function connectedClinix(){
	if(clinixconnected){
		if(clinicaactiva){
			unholdClinica();
		}
	}
	clinixconnected = true;
}

// funciones de Open VIDU
function onStartConnection(){
	OV = new OpenVidu();
	OV.enableProdMode();
	videosession = OV.initSession();

	videosession.on('streamCreated', (event) => {
		console.log("recibiendo stream de paciente");
		var subscriber = videosession.subscribe(event.stream, 'video-patient');
		subscriber.on('videoElementCreated', (evt) => {
			initVideoPatient(evt.element);
			$('#video-patient').show();
		});
	});

	videosession.on('streamDestroyed', (event) => {
		// Delete the HTML element with the user's name and nickname
		cleanVideoPatient();
	});

	videosession.on('sessionDisconnected', (event) => {
		cleanVideoPatient();
		cleanVideoMedic();
	})
	
	var userdata = JSON.parse(clinixstorage.get('clinix_user'));

	videotoken = clinixroom.getVIDUToken();
	videosession.connect(videotoken, 'msid:' + clinixroom.getSocketId())
	.then((resp) => {

		publisher = OV.initPublisher('video-medic', {
			audioSource: _default_audio_in,
			videoSource: _default_video_in,
			publishAudio: true,
			publishVideo: true,
			resolution: '640x480',
			frameRate: 30,
			insertMode: 'APPEND',
			mirror: true
		});

		publisher.on('videoElementCreated', (event) => {
			initVideoMedic(event.element);
			$(event.element).prop('muted', true);
		});

		videosession.publish(publisher);
		setSelectedPatient();
	})
	.catch(error => {
		console.warn('There was an error connecting to the session:', error.code, error.message);
	});
	return false;
}

function onErrorConnection(data){
	createNotification('Error', 'No fue posible conectarnos al servicio de videoconferencia.\n' + data.message)
}

function joinVideoSession(){
	publisher.publishAudio(true);
	publisher.publishVideo(true);
	return false;
}

function leaveSession() {
	if(typeof videosession != 'undefined' && videosession){
		videosession.disconnect();
		videosession = null;
	}
	cleanVideoMedic();
	cleanVideoPatient();
	clinixroom.deleteVIDUSession();
}

function holdVideoSession() {
	$('.video-viewer-patient video').hide();
	$('.video-viewer-medic video').hide();
	publisher.publishAudio(false);
	publisher.publishVideo(false);
}

function unholdVideoSession(){
	publisher.publishAudio(true);
	publisher.publishVideo(true);
	$('.video-viewer-patient video').show();
	$('.video-viewer-medic video').show();
	return true;
}

function initVideoMedic(videoElement) {
	$('#video-medic').get(0).srcObject = videoElement.srcObject;
	$('#video-medic').prop('muted', true);
	createNotification('Info', 'Has iniciado tu consulta.\nya puedes seleccionar un paciente en la lista')
}

function initVideoPatient(videoElement) {
	$('#video-patient').get(0).srcObject = videoElement.srcObject;
	//$('#video-patient').prop('muted', true);
}

function cleanVideoMedic() {
	$('#video-medic').get(0).srcObject = null;
}

function cleanVideoPatient() {
	$('#video-patient').get(0).srcObject = null;
}

function initVideoThumbnail() {
	$('.video-viewer-patient').css("background", "url('img/basic_video.svg') no-repeat center");
	$('.video-viewer-medic').css("background", "url('img/basic_video.svg') no-repeat center");
}

// Funciones de Lista de Espera
function setWaitingList(data){
	console.log("lista de espera", data);
	
	// si al recibir la lista de espera esta como activa la marcamos  como activa localmente
	if(data.status == 'active'){
		clinicaactiva = true;
		$("#topmenu a[href='#switchclinica']").addClass("active");
	}
	else{
		clinicaactiva = false;
		$("#topmenu a[href='#switchclinica']").removeClass("active");
	}
	
	removeNotInlist(data);

	$(data.patients).each(function(idx, user){
		//if(user.status == 'inlist' || user.status == 'emergency' || user.status == 'assigned' || user.status == 'attending' || user.status == 'attending'){
		if(user.status !== 'attended' && user.status !== 'reset'){
			addListNode(user);
		}
	});

	$(".waiting-list ul li").not(".active").find(".btn").hide();
	setWLAudioStatus();
}

function removeNotInlist(data){
	$(".waiting-list ul li").each(function(idx){
		_li_data = $(this).data();
		_existe = false;
		$(data.patients).each(function(idx, user){
			if(_li_data.rowId == user._id){
				_existe = true;
				return false;
			}
		});

		if(!_existe){
			$(this).remove();
		}
	})
}

function addListNode(user){
	if($(".waiting-list ul li[data-row-id=" + user._id + "]").length <= 0){
		_li_class = user.status;
		_patient = clinixstorage.get('_p_' + user._id);
		_patient = (typeof _patient == 'undefined') ? {} : JSON.parse(_patient);
		if(typeof _patient.status != 'undefined' && _patient.status == 'attending')
			_li_class += " active";
		_node = '<li data-row-id="' + user._id + '" class="' + _li_class + '">';
		_node += '<button class="btn btn-danger btn-circle btn-close"><div class="icon-mask"></div></button>'
		_node += '<button class="btn btn-warning btn-circle btn-pause"><div class="icon-mask"></div></button>'
		_node += '<button class="btn btn-primary btn-circle btn-restart"><div class="icon-mask"></div></button>'
		_node += '<a href="#select-patient" data-patient-id="' + user._id + '"><h4>' + user.name + '</h4></a>';
		_node += '<a href="mailto:' + user.email + '">' + user.email + '</a>';
		if(user.phone != null && user.phone != '')
			_node += ' / <a href="tel:' + user.phone + '">' + user.phone + '</a>';

		_node += '</li>';

		if(user.status == 'emergency')
			$(".waiting-list ul").prepend(_node);
		else
			$(".waiting-list ul").append(_node);
	}
}

function selectListNode(node){
	stopTimer();
	_active_row_data = $(".waiting-list ul .active").data();
	row_data = node.data();
	console.log(row_data);
	cleanVideoPatient();
	cleanVideoMedic();
	if(typeof _active_row_data != 'undefined')
		setLocalPatientStatus(_active_row_data.rowId, 'paused')

	addLocalPatient(row_data);
	$(".waiting-list ul .active").removeClass("active");
	node.addClass("active");
	$(".waiting-list ul .btn").hide();
	$(".waiting-list ul .active .btn").show();
	if(typeof currentpatient.rowId == 'undefined' || currentpatient.rowId != row_data.rowId)
	{
		resetChat();
	}
	currentpatient = row_data;

	// solicitamos crear una nueva sesión
	clinixroom.requestVIDUConn();
	startTimer();
	setWLAudioStatus();
}

function setSelectedPatient(){
	clinixroom.selectPatient(currentpatient.rowId);
}

function restartPatient(tgt){
	leaveSession();
	row_data = $(tgt).parent("li").data();
	clinixroom.restartPatient(row_data.rowId);
	setLocalPatientStatus(row_data.rowId, 'restarted');
	currentpatient = {}
	resetChat();
	stopTimer();
	_t = setTimeout(() => {
		setWLAudioStatus();
	}, 5000);
}

function closePatient(tgt){
	leaveSession();
	row_data = $(tgt).parent("li").data();
	deleteLocalPatient(row_data.rowId);
	clinixroom.closePatient(row_data.rowId);
	currentpatient = {}
	resetChat();
	stopTimer();
	_t = setTimeout(() => {
		setWLAudioStatus();
	}, 5000);
}

function pausePatient(tgt){
	row_data = $(tgt).parent("li").data();
	setLocalPatientStatus(row_data.rowId, 'paused');
	clinixroom.pausePatient(row_data.rowId);
	pauseTimer();
}

function setWLAudioStatus(){
	console.log(currentpatient);
	console.log($(".waiting-list ul li").length);
	if(Object.keys(currentpatient).length == 0 && $(".waiting-list ul li").length > 0){
		soundWL.play();
	}
	else{
		console.log("con paciente actual o con lista vacia");
		soundWL.pause();
	}
}

// Funciones de la pantalla
function createNotification(status, _message){
	let alertdata = {type: status, message: _message}
	ipcRenderer.invoke('notifications:show', alertdata)
}

function getProjects(){
	let token = clinixstorage.get('clinix_user_token');
	let u = JSON.parse(clinixstorage.get('clinix_user'));
	$.ajax({
		url: process.env.API_URL + '/accounts/' + u.account_id + '/projects',
		type: 'GET',
		headers:{
		  'X-Requested-With': 'XMLHttpRequest',
		  'Authorization': 'Bearer ' + token
		},
		success: function(resp){
			if(resp.status == 'ok'){
				console.log(resp);
				
			}
			else{
				
			}
		},
		error: function(error){
			
		}
	});
}

// Funciones del Chat
function addChatMessage(mess, type = 'remote'){
	if(mess.trim() != ''){
		_class = "messg";
		if(type != 'remote') _class += " titular";

		_m = '<p class="' + _class + '"><span>' + mess + '</span></p>';

		$(".chat-content").append(_m);
		$('.chat-content').scrollTop($('.chat-content').outerHeight());
	}
}

function resetChat(){
	$(".chat-content").html('');
}

function setPatientPresentation(message, patient_id){
	_local_patient = clinixstorage.get('_p_' + patient_id);
	if(_local_patient)
		_local_patient = JSON.parse(_local_patient);
		
	if(!_local_patient || typeof _local_patient.status == 'undefined' || _local_patient.status != 'paused'){
		addChatMessage(message);
		_u = clinixstorage.get('clinix_user');
		_u = JSON.parse(_u);
		_m1 = '¿Como te encuentras?';
		_m2 = 'Te atiende el Dr. ' + _u.name;
		_m3 = '¿En que te podemos ayudar?';
		addChatMessage(_m1, 'local');
		addChatMessage(_m2, 'local');
		addChatMessage(_m3, 'local');
		clinixroom.sendChatMessage(_m1);
		clinixroom.sendChatMessage(_m2);
		clinixroom.sendChatMessage(_m3);
	}
	else{
		setLocalPatientStatus(patient_id, 'attending');
	}
}

// Funciones para traking local de pacientes
function addLocalPatient(data){
	console.log("add local patient: ", data)
	_patient = clinixstorage.get('_p_' + data.patientId);
	_patient = (typeof _patient == 'undefined') ? {} : JSON.parse(_patient);
	if(!_patient){
		_patient = data;
		_patient.status = 'attending';
	}
	else{
		_patient.status = 'attending';
	}
	
	clinixstorage.set('_p_' + data.patientId, JSON.stringify(_patient));
}

function deleteLocalPatient(patient_id){
	console.log("delete local patient: ", patient_id)
	clinixstorage.delete('_p_' + patient_id);
}

function setLocalPatientStatus(patient_id, status){
	console.log("set local patient: ", patient_id)
	_patient = clinixstorage.get('_p_' + patient_id);
	_patient = (typeof _patient == 'undefined') ? {} : JSON.parse(_patient);
	if(_patient){
		_patient.status = status;
	}
	else{
		_patient.patientId = patient_id;
		_patient.status = status;
	}

	clinixstorage.set('_p_' + patient_id, JSON.stringify(_patient));
}

// ejecutamos las funciones de incio
init();
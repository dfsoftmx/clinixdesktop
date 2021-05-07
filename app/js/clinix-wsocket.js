function Clinix(token){
	let _token = token;
	let _url = process.env.RPC_URL;
	var status = '';
	let on_ConnectionError, on_StartConnection;

	const socket = io(_url);

	this.connect = function(){
		if(!socket.connected)
			socket.connect();
	}

	socket.on('connect', function(){
		networkChangeOnline();
		socket.emit('authenticate', _token);
	});

	socket.on("connect_error", () => {
		networkChangeOffline();
		console.log("error al conectar a clinix");
		socket.close();
		_t = setTimeout(() => {
			if(!socket.connected)
				socket.connect();
		}, 500);
	});

	socket.io.on("reconnection_attempt", function(resp){
		console.log("respuesta intento de reconexion", resp);
	});

	socket.on('disconnect', function(reason) {
		console.log("desconectando de clinix: ", reason);
		if (reason === "io server disconnect") {
			_t = setTimeout(() => {
				if(!socket.connected)
					socket.connect();
			}, 500);
		}
		else if(reason == 'ping timeout' || reason == 'transport close' || reason == 'transport error'){
			networkChangeOffline();
		}
	});

	socket.on('authenticated', function(data) {
		console.log("conectado a clinix", data);
		connectedClinix();
	});

	socket.on('set-viduconnection', function(data){
		//console.log(data);
		socket.viduconnection = data;
		onStartConnection();
		console.log("set-viduconnection at " + new Date() + ": ",data);
	});

	socket.on('set-waitinglist', function(data){
		setWaitingList(data);
	});

	socket.on('show-notification', function(data){
		createNotification(data.status, data.message)
	});

	socket.on('add-message', function(mess){
		if(mess.trim() != ''){
			addChatMessage(mess);
		}
	});

	socket.on('chat-presentation', function(mess, patient_id){
		setPatientPresentation(mess, patient_id);
	});

	// Metodos de Open VIDU
	this.getVIDUToken = function(){
		if(typeof socket.viduconnection.token != 'undefined')
			return socket.viduconnection.token;
		else
			return false;
	}

	this.requestVIDUConn = function(){
		socket.emit('get-viduconnection');
	}

	this.getVIDUConn = function(){
		if(typeof socket.viduconnection !== 'undefined'){
			return socket.viduconnection
		}
		else{
			return {status: 'error', message: 'no existe conexión al servicio de videoconferencia'}
		}
	}

	this.deleteVIDUSession = function(){
		delete socket.viduconnection;
		socket.emit('delete-vidusession', socket.id);
	}

	// set callback functions for sesson and connection open vidu
	this.set_on_ConnectionError = function(conn_error_callback){
		on_ConnectionError = conn_error_callback;
	}

	this.set_on_StartConnection = function(conn_start_callback){
		on_StartConnection = conn_start_callback;
	}

	// Metodos de lista de espera
	this.getWaitingList = function(){
		socket.emit('get-waitinglist');
	}

	this.selectPatient = function(id){
		socket.emit('select-patient', id);
	}

	this.pausePatient = function(id){
		socket.emit('pause-patient', id);
	}

	this.closePatient = function(id){
		socket.emit('finish-appointment', id);
	}

	this.restartPatient = function(id){
		socket.emit('restart-patient', id);
	}

	// metodos de la clinica digital
	this.unholdClinic = function(){
		socket.emit('unhold-clinic', socket.id);
	}

	this.holdClinic = function(){
		socket.emit('hold-clinic', socket.id);
	}

	this.closingWindow = function(){
		socket.emit('closing-window', 1);
	}

	// Metodos de la sala de Chat
	this.sendChatMessage = function(message){
		if(message.trim() != ''){
			console.log("send-message", message);
			socket.emit('send-message', message);
		}
	}

	// metodos generales de Clinixroom
	this.getSocketId = function(){
		return socket.id;
	}
}
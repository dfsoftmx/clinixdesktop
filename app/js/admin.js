const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const clinixstorage = new Store();
let $ = jQuery = require('jquery');
let token, localdata={}, _type_lists, _curr_acc, _curr_proj, _curr_list;


const init = () => {
	token = clinixstorage.get('clinix_user_token');

	let localdatamanager = {
		set: function (target, key, value) {
			console.log(`${key} updated to:`, value);	
			target[key] = value;

			switch (key) {
				case 'accounts':
					popAccounts();
					break;
				case 'projects':
					popProjects();
					break;
				case 'project':
					//popProject();
					break;
				case 'waitinglists':
				case 'clinics':
					popLists();
					break;
				default:
					break;
			}
			return true;
		}
	};

	localdata = new Proxy({}, localdatamanager);
	  

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
	window.addEventListener('online', networkStatusChange)
	window.addEventListener('offline', networkStatusChange)

	// maximize, minimize, close control buttons
	$(".btn-win-close").on("click", function(e){
		ipcRenderer.invoke('control-buttons:close');
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

	// cargamos los datos de las cuentas
	getData('accounts');

	// handlers de las listas
	_type_lists = "clinics";
	$(".btn-view-clinics").on("click", function(e){
		_type_lists = "clinics";
		$(".btn-view-wl").removeClass("active");
		$(this).addClass("active");
		$("#title-tipo").text("Clinicas");
	})
	$(".btn-view-wl").on("click", function(e){
		_type_lists = "waitinglists";
		$(".btn-view-clinics").removeClass("active");
		$(this).addClass("active");
		$("#title-tipo").text("Salas de espera");
	})
	$("#list-accounts").on("click","li",function(e){
		_d = $(this).data();
		_curr_acc = _d.accountId;
		$("#list-accounts li").removeClass("active");
		$(this).addClass("active");
		_url = "accounts/" + _curr_acc + "/projects";
		getData("projects", _url);
	});
	$("#list-projects").on("click","li",function(e){
		_d = $(this).data();
		_curr_proj = _d.projectId;
		$("#list-projects li").removeClass("active");
		$(this).addClass("active");
		_url = "accounts/" + _curr_acc + "/projects/" + _curr_proj;
		getData("project", _url);
		loadLists();
	});
}

// funciones de la ventana
// function que valida si el token es valido
function getData(type, _url = null){

	if(!_url) _url = type;

	$.ajax({
		url: process.env.API_URL + '/' + _url,
		type: 'GET',
		headers:{
		  'X-Requested-With': 'XMLHttpRequest',
		  'Authorization': 'Bearer ' + token
		},
		success: function(_resp){
			if(_resp.status == 'ok'){
				localdata[type] = _resp.resp;	
			}
			else{
				let alertdata = {type: 'Error', message: 'No fue posible obtener ' + type}
				ipcRenderer.invoke('notifications:show', alertdata)
			}
		},
		error: function(error){
			let alertdata = {type: 'Error', message: 'Ocurrio un error: ' + error}
			ipcRenderer.invoke('notifications:show', alertdata)
		}
	});
}

function popAccounts(){
	_acc = localdata.accounts;
	$("#list-accounts li").remove();
	_acc.forEach(function(a){
		_sel = (a.account_id == _curr_acc) ? 'active' : '';
		_op = '<li data-account-id="' + a.account_id +'" class="' + _sel + '" >' + a.account_name +'</li>';
		$("#list-accounts").append(_op);
	});
}

function popProjects(){
	_proj = localdata.projects;
	$("#list-projects li").remove();
	_proj.forEach(function(p){
		_sel = (p.project_id == _curr_proj) ? 'active' : '';
		_op = '<li data-project-id="' + p.project_id +'" class="' + _sel + '" >' + p.project_name +'</li>';
		$("#list-projects").append(_op);
	});
}

function popLists(){
	_list = localdata[_type_lists];
	$("#lists li").remove();
	_list.forEach(function(l){
		if(_type_lists == 'waitinglists'){
			_sel = (l._id == _curr_list) ? 'active' : '';
			_op = '<li data-list-id="' + l._id +'" class="' + _sel + '" > Lista de espera </li>';
		}
		else{
			_sel = (l._id == _curr_list) ? 'active' : '';
		_op = '<li data-list-id="' + l._id +'" class="' + _sel + '" >' + l.room_name +'</li>';
		}
		$("#lists").append(_op);
	});
}

function loadLists(){
	if(_type_lists == 'waitinglists'){
		_url = "accounts/" + _curr_acc + "/projects/" + _curr_proj + '/wl';
	}
	else{
		_url = "accounts/" + _curr_acc + "/projects/" + _curr_proj + '/rooms';
	}
	getData(_type_lists, _url);
}

function networkStatusChange(){
	if(navigator.onLine){
		$("#div-offline").fadeOut(400);
	}
	else{
		$("#div-offline").fadeIn(400);
		holdClinica();
	}
}


// funcion para manejo de errores
function errorCallback(e) {
	console.log('Error:', e)
}

init();
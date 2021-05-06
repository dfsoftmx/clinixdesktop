const { app, BrowserWindow, BrowserView, Tray, Menu, Notification, screen, dialog, ipcMain, nativeTheme, systemPreferences } = require('electron');
const { autoUpdater } = require('electron-updater');
const Storage = require('electron-store');
const url = require("url");
const path = require("path");

let appIcon, mainWindow, configWindow, consultaWindow, agendaWindow, expWindow, adminWindow, logWindow;
const clinixstorage = new Storage();
let win_title, _theme, open_dev_tools, screenSize;

// Pantalla Principal -> Login / Registro / Info de la cuenta (mainWindow)
function viewWinAccount () {
  
	if(BrowserWindow.getAllWindows().length > 0 && mainWindow !== undefined && mainWindow !== null){
		mainWindow.show()
	}
	else{
		mainWindow = new BrowserWindow({
			width: 700,
			height: 600,
			frame: false,
			resizable: false,
			title: win_title,
			webPreferences: {
				enableRemoteModule: true,
				contextIsolation: false,
				nodeIntegration: true,
				//devTools: false
			}
		})
	
		mainWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		//mainWindow.setAlwaysOnTop(true, "floating", 1);
		mainWindow.setVisibleOnAllWorkspaces(true);
	
		mainWindow.loadFile(path.join(__dirname, '/dist/login_register.html'))
	
		if(open_dev_tools)
			mainWindow.webContents.openDevTools()
	
		mainWindow.on('closed', function () {
			mainWindow = null
		})

		mainWindow.once('ready-to-show', () => {
			autoUpdater.checkForUpdatesAndNotify();
		});
	}
}

// Pantalla Configuración (configWindow)
function viewWindConfig () {
	if(BrowserWindow.getAllWindows().length > 0 && configWindow !== undefined && configWindow !== null){
		configWindow.show()
	}
	else{
		configWindow = new BrowserWindow({
			width: 800,
			height: 700,
			frame: false,
			resizable: false,
			title: 'Configuración | ' + win_title,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				contextIsolation: false
			}
		  })
		configWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		configWindow.setAlwaysOnTop(true, "floating", 1);
		//configWindow.setVisibleOnAllWorkspaces(true); 
		configWindow.loadFile(path.join(__dirname, '/dist/config.html'))
		if(open_dev_tools)
			configWindow.webContents.openDevTools()
	
		configWindow.on('closed', function () {
			configWindow = null
		})
	}
}

// Pantalla Consulta Online (consultaWindow)
function viewWindConsulta () {

	if(BrowserWindow.getAllWindows().length > 0 && consultaWindow !== undefined && consultaWindow !== null){
		consultaWindow.show()
	}
	else{
		consultaWindow = new BrowserWindow({
			width: 800,
			height: 600,
			frame: false,
			title: 'Consulta | ' + win_title,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				contextIsolation: false
			}
		})
		
		consultaWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		//consultaWindow.setAlwaysOnTop(true, "floating", 1);
		consultaWindow.setVisibleOnAllWorkspaces(true); 
		consultaWindow.loadFile(path.join(__dirname, '/dist/consulta.html'))
		consultaWindow.maximize()
		if(open_dev_tools)
			consultaWindow.webContents.openDevTools()
		
		consultaWindow.on('closed', function () {
			consultaWindow = null
		})
		
	}

}

// Pantalla Agenda (agendaWindow)
function viewWindAgenda () {

	if(BrowserWindow.getAllWindows().length > 0 && agendaWindow !== undefined && agendaWindow !== null){
		agendaWindow.show()
	}
	else{
		agendaWindow = new BrowserWindow({
			width: 800,
			height: 600,
			frame: false,
			title: 'Consulta | ' + win_title,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				contextIsolation: false
			}
		})
		
		agendaWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		agendaWindow.setVisibleOnAllWorkspaces(true); 
		agendaWindow.loadFile(path.join(__dirname, '/dist/agenda.html'))
		agendaWindow.maximize()
		if(open_dev_tools)
			agendaWindow.webContents.openDevTools()
		
		agendaWindow.on('closed', function () {
			agendaWindow = null
		})
		
	}

}

// Pantalla Expediente Médico (expWindow)
function viewWindExpediente () {

	if(BrowserWindow.getAllWindows().length > 0 && expWindow !== undefined && expWindow !== null){
		expWindow.show()
	}
	else{
		expWindow = new BrowserWindow({
			width: 800,
			height: 600,
			title: 'Expediente | ' + win_title,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true
			}
		})

		expWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		const view = new BrowserView()
		expWindow.setBrowserView(view)
		if(open_dev_tools)
			view.webContents.openDevTools()
		var contentBounds = expWindow.getContentBounds();
		view.setBounds({ x: 0, y: 0, width: contentBounds.width, height: contentBounds.height })
		token = clinixstorage.get('clinix_user_token');
		const options = { extraHeaders: 'Authorization: Bearer ' + token }
		view.webContents.loadURL('https://e.medworks.mx/?action=login&lang=es_MX', options)

		expWindow.on('closed', function () {
			expWindow = null
		})
		expWindow.on('resize', function () {
			contentBounds = expWindow.getContentBounds();
			view.setBounds({ x: 0, y: 0, width: contentBounds.width, height: contentBounds.height })
		})

		expWindow.maximize()
	}

}

// Pantalla Admin Administración (adminWindow)
function viewWindAdmin () {

	if(BrowserWindow.getAllWindows().length > 0 && adminWindow !== undefined && adminWindow !== null){
		adminWindow.show()
	}
	else{
		adminWindow = new BrowserWindow({
			width: 800,
			height: 600,
			frame: false,
			title: 'Administración | ' + win_title,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				contextIsolation: false
			}
		})
		
		//adminWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		adminWindow.setVisibleOnAllWorkspaces(true); 
		adminWindow.loadFile(path.join(__dirname, '/dist/admin.html'))
		adminWindow.maximize()
		if(open_dev_tools)
			adminWindow.webContents.openDevTools()
		
		adminWindow.on('closed', function () {
			adminWindow = null
		})	
	}
}

// Pantalla Admin Bitacora (logWindow)
function viewWindLog () {

	if(BrowserWindow.getAllWindows().length > 0 && logWindow !== undefined && logWindow !== null){
		logWindow.show()
	}
	else{
		logWindow = new BrowserWindow({
			width: 800,
			height: 600,
			frame: false,
			title: 'Botácora | ' + win_title,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				contextIsolation: false
			}
		})
		
		//logWindow.setIcon(path.join(__dirname, '/build/icons/icon.png'));
		logWindow.setVisibleOnAllWorkspaces(true); 
		logWindow.loadFile(path.join(__dirname, '/dist/admin.html'))
		logWindow.maximize()
		if(open_dev_tools)
			logWindow.webContents.openDevTools()
		
		logWindow.on('closed', function () {
			logWindow = null
		})	
	}
}

// ocultamos todas las ventanas
function hideAll(){
	BrowserWindow.getAllWindows().forEach(_w => _w.minimize());
}
// restauramos todas las ventanas
function showAll(){
	BrowserWindow.getAllWindows().forEach(_w => _w.restore());
}

// manejo de dark mode
ipcMain.handle('dark-mode:set', () => {
  if (!nativeTheme.shouldUseDarkColors)
    nativeTheme.themeSource = 'dark'
})

ipcMain.handle('light-mode:set', () => {
  if (nativeTheme.shouldUseDarkColors)
    nativeTheme.themeSource = 'light'
})

// manejo de maximize, minimize, close control buttons 
ipcMain.handle('control-buttons:minimize', () => {
  let theWindow = BrowserWindow.getFocusedWindow()
  if(theWindow)
    theWindow.minimize()
})
ipcMain.handle('control-buttons:toggle', () => {
  let theWindow = BrowserWindow.getFocusedWindow();
  if(theWindow){
    if (theWindow.isMaximized()) {
      theWindow.unmaximize()
    } else {
      theWindow.maximize()
    } 
  }
})
ipcMain.handle('control-buttons:close', () => {
	let theWindow = BrowserWindow.getFocusedWindow();
	if(theWindow)
		theWindow.close()
})

// manejo de notificaciones del usuario
function showNotification(type, mess) {
	titulo = type.substring(0,1).toUpperCase() + type.substring(1).toLowerCase()
    not = new Notification({
		icon: appIcon,
		title: titulo,
        body: mess
	}).show()

}

// llamar notificaciones desde otras ventanas
ipcMain.handle('notifications:show', (evt, notdata) => {
	showNotification(notdata.type, notdata.message)
})

// creamos el menú para mac
function buildMenu(type='start'){
	_m = [];
	_m.push({
		label: 'Clinix',
		submenu: [
			{
				label:'Acerca de Clinix',
				click() {
					viewWindConfig ()
				}
			},
			{
				label:'Configuración',
				click() {
					viewWindConfig ()
				}
			},
			{ type: 'separator' },
			{
				label:'Salir',
				accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
				click() { 
					app.quit() 
				}
			}
		]
	});

	if(type == 'medic' || type == 'admin'){
		_m.push({
			label: 'Ver',
			submenu: [
				{
					label:'Cuenta',
					click() {
						viewWinAccount ()
					}
				},
				{
					label:'Atención Remota',
					click() {
						viewWindConsulta ()
					}
				},
				{
					label:'Expediente Médico',
					click() {
						viewWindExpediente ()
					}
				},
				{
					label:'Agenda',
					click() {
						viewWindAgenda ()
					}
				},
				{ type: 'separator' },
				{
					label:'Ocultar todas',
					accelerator: process.platform === 'darwin' ? 'Cmd+H' : 'Ctrl+H',
					click() {
						hideAll ()
					}
				},
				{
					label:'Mostrar todas',
					click() {
						showAll ()
					}
				},
			]
		});
	}

	if(type == 'admin'){
		_m.push({
			label: 'Admin',
			submenu: [
				{
					label:'Cuentas / Proyectos / Listas',
					click() {
						viewWindAdmin()
					}
				},
				{
					label:'Bitacora',
					click() {
						viewWindLog()
					}
				}
			]
		});
	}

	var menu = Menu.buildFromTemplate(_m)
	Menu.setApplicationMenu(menu);
}
ipcMain.handle('menu:rebuild', (evt, type) => {
	buildMenu(type);
})

// acciones al iniciar
app.whenReady().then(() => {

	process.env.API_URL = 'https://api-devclinix.dfsoft.mx' // 'https://api.clinix.mx'
	process.env.RPC_URL = 'https://rpc-devclinix.dfsoft.mx' // 'https://rtc.clinix.mx'
	//tray = new Tray(path.join(__dirname, '/build/icons/icon.png'))
	appIcon = new Tray(path.join(__dirname, '/build/icon.png'));
	clinixstorage.set('clinix_version', app.getVersion());
	clinixstorage.set('node_version', process.versions.node);
	clinixstorage.set('chrome_version', process.versions.chrome);
	clinixstorage.set('electron_version', process.versions.electron);
	win_title = "Clinix (" + app.getVersion() + ")";
	open_dev_tools = true;

	_theme = clinixstorage.get('style_theme', 'light');

	if(_theme == 'dark'){
		nativeTheme.themeSource = 'dark'
	}
	else{
		nativeTheme.themeSource = 'light'
	}

	// construimos el menú
	buildMenu();

	// abrimos la ventana por default
	viewWinAccount()

	systemPreferences.askForMediaAccess('camera').then((allowed)=>console.log('Camera is allowed')).catch(function(_err){
		console.log("camera: ", _err)
		viewWindConfig()
	});
	systemPreferences.askForMediaAccess('microphone').then((allowed)=>console.log('Mic is allowed')).catch(function(_err){
		console.log("microphone: ", _err)
		viewWindConfig()
	});
	systemPreferences.askForMediaAccess('screen').then((allowed)=>console.log('ScreenShare is allowed')).catch(function(_err){
		console.log("screen: ", _err)
		if(_err != 'Error: Invalid media type'){
			viewWindConfig()
		}
	});

	screenSize = screen.getPrimaryDisplay().workAreaSize;

})

// llamar abrir ventana Consulta desde otra ventana
ipcMain.handle('window-open:consulta', () => {
	viewWindConsulta();
})

// llamar abrir ventana Expediente desde otra ventana
ipcMain.handle('window-open:expediente', () => {
	viewWindExpediente();
})

// llamar abrir ventana Agenda desde otra ventana
ipcMain.handle('window-open:agenda', () => {
	viewWindAgenda();
})

// llamar abrir ventana Config desde otra ventana
ipcMain.handle('window-open:config', () => {
	viewWindConfig();
})

// llamar abrir ventana Admin desde otra ventana
ipcMain.handle('window-open:admin', () => {
	viewWindAdmin();
})

// llamar abrir ventana Log desde otra ventana
ipcMain.handle('window-open:log', () => {
	viewWindLog();
})

//si es windows definimos app.setAppUserModelId()  Esto afecta el nombre que muestra las notificaciones en windows
if(process.platform == 'win32'){
	app.setAppUserModelId('Clinix');
}
// al cerrar todas las ventanas cerrar la aplicación
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		if (mainWindow === null) viewWinAccount()
	}
})

// funcion para manejo de errores
function errorCallback(e) {
  console.log(e)
}

// funciones para el autoupdate
autoUpdater.on('update-available', () => {
	mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
	mainWindow.webContents.send('update_downloaded');
});
ipcMain.handle('restart-install:app', () => {
	autoUpdater.quitAndInstall();
})
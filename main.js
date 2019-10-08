const electron = require('electron');
const {
	app,
	Tray,
	BrowserWindow,
	Menu,
	ipcMain,
	dialog,
	Notification
} = electron;
const path = require('path');
const fse = require('fs-extra');
const destPath = 'c:\\softer\\config';
const iconPath = path.join(__dirname, 'img/icon.png');
const url = require('url');
const {
	autoUpdater
} = require('electron-updater');
const log = require('electron-log');

let appIcon = null,
	win = null,
	aboutWindow = null,
	configWindow = null,
	chatWindow = null;

// configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

function startApp() {
	win = new BrowserWindow({
		show: false
	});

	appIcon = new Tray(iconPath);

	var contextMenu = Menu.buildFromTemplate([{
		label: 'Configurações',
		click(item, focusedWindow) {
			openConfigWindow();
		}
	}, {
		label: 'Sobre',
		click(item, focusedWindow) {
			openAboutWindow();
		}
	}, {
		label: 'Chat',
		click(item, focusedWindow) {
			openChatWindow();
		}
	}, {
		label: 'Fechar',
		click() {
			dialog.showMessageBox(win, {
				type: 'question',
				title: 'Atenção!',
				message: 'Tem certeza que deseja fechar o aplicativo?',
				buttons: ['Sim', 'Não'],
				defaultId: 0,
				noLink: true
			}, (resp) => {
				if (resp == 0)
					app.quit();
			});
		}
	}]);

	appIcon.setToolTip('Syncronização - SGI');
	appIcon.setContextMenu(contextMenu);

	fse.readFile(`${destPath}\\config.json`, function (err, data) {
		if (err) {
			return console.log(err);
		}
		let fileRead = fse.readFileSync(`${destPath}\\config.json`, 'utf8');
		config = JSON.parse(fileRead);

		const io = require('socket.io-client');
		let socket = io(`http://${config.broadServer}`);

		// var socket = require('socket.io-client').connect('http://localhost:3000', {
		//     reconnect: true
		// });

		// socket.on('connect', function () {
		//     console.log('Connected to server.');
		//     socket.on('event', function (data) {})
		// });

		socket.on('welcome', (e) => {
			console.log('welcome received'); // displayed
			socket.emit('test')
		});

		socket.on('error', (e) => {
			console.log(e); // not displayed
		});

		socket.on('connect', () => {
			console.log("connected"); // displayed
		});

		socket.on('messages', (data) => {
			console.log(data); // displayed
			let result = JSON.parse(data);
			let syncingWindow = BrowserWindow.getFocusedWindow();
			if (syncingWindow)
				syncingWindow.close();
			if (result.type.indexOf('syncing') !== -1) {
				let syncing = new BrowserWindow({
					parent: win,
					modal: true,
					show: false,
					// x: 0,
					// y: 0,
					alwaysOnTop: true,
					autoHideMenuBar: true,
					minimizable: false,
					width: 420,
					height: 280,
					resizable: false,
					icon: path.join(__dirname, 'build/icon.ico')
				});

				syncing.setMenu(null);

				syncing.loadURL(url.format({
					pathname: path.join(__dirname, '/html/onSyncing.html'),
					protocol: 'file:',
					slashes: true
				}));

				syncing.once('ready-to-show', () => {
					syncing.show();
					syncing.webContents.send('onSyncing-content', data);

					const opt = {
						title: 'Sincronização em andamento!',
						body: 'O aplicativo SGI não deve ser usado até a conclusão da sincronização.',
						icon: iconPath
					};

					new Notification(opt).show();
				});
			} else {
				let doneSyncingWindow = BrowserWindow.getFocusedWindow();
				if (doneSyncingWindow)
					doneSyncingWindow.close();

				let doneSyncing = new BrowserWindow({
					parent: win,
					modal: true,
					show: false,
					// x: 0,
					// y: 0,
					alwaysOnTop: true,
					autoHideMenuBar: true,
					minimizable: false,
					width: 420,
					height: 280,
					resizable: false,
					icon: path.join(__dirname, 'build/icon.ico')
				});

				doneSyncing.setMenu(null);

				doneSyncing.loadURL(url.format({
					pathname: path.join(__dirname, '/html/onDoneSyncing.html'),
					protocol: 'file:',
					slashes: true
				}));

				doneSyncing.once('ready-to-show', () => {
					doneSyncing.show();
					doneSyncing.webContents.send('onDoneSyncing-content', data);

					const opt = {
						title: 'Atenção!',
						subtitle: 'Sincronização concluida',
						body: 'O uso do aplicativo SGI está liberada.',
						icon: iconPath
					};

					new Notification(opt).show();
				});
			}
		});
	});

	app.setAppUserModelId("com.br.softernet.sgi-sync-app-tray");

	const opt = {
		title: 'Atenção!',
		subtitle: 'Um subtitulo',
		body: 'O aplicativo está ativo na barra de tarefas.',
		icon: iconPath
	};

	new Notification(opt).show();

	// notification.on('show', () => {
	//     log.info('I\'m coming~');
	// });

	// notification.onclick = () => {
	//     log.info('On no! You touch me. It\'s hurt!!');
	// };

	// notification.addEventListener('close', () => {
	//     log.info('I\'ll be back!!');
	// });

	// notification.addListener('error', (err) => {
	//     console.error(err);
	// });

	// log.info('What does the notification say? ' + notification.body);

	// setTimeout(() => notification.close(), 20000);
};

// Configurações menu
const configMenuTemplate = [{
	label: 'Recarregar',
	accelerator: 'CmdOrCtrl+R',
	click(item, focusedWindow) {
		if (focusedWindow) focusedWindow.reload()
	}
},
{
	label: 'Ferramentas',
	submenu: [{
		label: 'Diagnóstico',
		accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
		click(item, focusedWindow) {
			if (focusedWindow) focusedWindow.webContents.toggleDevTools()
		}
	}]
},
{
	label: 'Fechar',
	click(item, focusedWindow) {
		if (focusedWindow) focusedWindow.close()
	}
}
];

// Configurações
function openConfigWindow() {
	if (configWindow) {
		configWindow.focus()
		return;
	}

	configWindow = new BrowserWindow({
		title: "Configurações",
		minimizable: false,
		parent: win,
		fullscreenable: false,
		width: 660,
		height: 520,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'build/icon.ico')
	});

	configWindow.setMenu(null);

	configWindow.loadURL('file://' + __dirname + '/html/config.html');

	const configMenu = Menu.buildFromTemplate(configMenuTemplate);

	// // Insert menu
	configWindow.setMenu(configMenu);

	configWindow.on('closed', function () {
		// mainWindow.reload();
		configWindow = null;
	});

	// Open developer tools if not in production
	// if (process.env.NODE_ENV !== 'production') {
	//     configWindow.webContents.openDevTools({
	//         mode: 'detach'
	//     });
	// }
};

function openAboutWindow() {
	aboutWindow = new BrowserWindow({
		parent: win,
		modal: true,
		show: false,
		// x: 0,
		// y: 0,
		// frame: false,
		alwaysOnTop: true,
		autoHideMenuBar: true,
		minimizable: false,
		width: 460,
		height: 380,
		resizable: false,
		icon: path.join(__dirname, 'build/icon.ico')
	});

	aboutWindow.loadURL('file://' + __dirname + '/html/about.html');

	aboutWindow.once('ready-to-show', () => {
		aboutWindow.show();
	});
};

/**
 * Open chat window
 */
function openChatWindow(arg) {
	chatWindow = new BrowserWindow({
		parent: win,
		modal: true,
		show: false,
		x: 10,
		y: 10,
		// frame: false,
		alwaysOnTop: true,
		autoHideMenuBar: true,
		minimizable: true,
		width: 270,
		height: 480,
		resizable: true,
		icon: path.join(__dirname, 'build/icon.ico')
	});

	chatWindow.loadURL('file://' + __dirname + '/html/chatWindow.html');

	const chatMenu = Menu.buildFromTemplate(basicMenuTemplate);

	/** Insert menu */
	chatWindow.setMenu(chatMenu);

	chatWindow.once('ready-to-show', () => {
		chatWindow.show();
	});

	chatWindow.on('closed', function () {
		chatWindow = null;
	});

	if (arg == 'ping') {
		if (user) {
			chatWindow.setTitle(focusedWindow.webContents.browserWindowOptions.title + ' - Usuário logado: ' + user);
		}
	}

	// Open developer tools if not in production
	if (process.env.NODE_ENV == 'production') {
		chatWindow.webContents.openDevTools({
			mode: 'detach'
		});
	}
}

/**
 * Basic menu template
 */
const basicMenuTemplate = [{
	label: 'Recarregar',
	accelerator: 'CmdOrCtrl+R',
	click(item, focusedWindow) {
		if (focusedWindow) focusedWindow.reload()
	}
}, {
	label: 'Ferramentas',
	submenu: [{
		label: 'Diagnóstico',
		accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
		click(item, focusedWindow) {
			if (focusedWindow) focusedWindow.webContents.toggleDevTools()
		}
	}]
},
{
	label: 'Fechar',
	click(item, focusedWindow) {
		if (focusedWindow) focusedWindow.close()
	}
}
];

// Listen for the app to be ready
app.on('ready', startApp);

//-------------------------------------------------------------------
// Auto updates
//-------------------------------------------------------------------
const sendStatusToWindow = (text) => {
	log.info(text);
	aboutWindow.webContents.send('update-content', text);
};

ipcMain.on('checkForUpdates', checkForUpdates);

function checkForUpdates() {
	// trigger autoupdate check
	autoUpdater.checkForUpdates();
};

autoUpdater.on('checking-for-update', () => {
	sendStatusToWindow('Procurando por atualização...');
});

autoUpdater.on('update-available', info => {
	sendStatusToWindow('Atualização disponível.');
});

autoUpdater.on('update-not-available', info => {
	sendStatusToWindow('Atualização não disponível.');
});

autoUpdater.on('error', err => {
	sendStatusToWindow(`Error no atualizador: ${err.toString()}`);
});

autoUpdater.on('download-progress', progressObj => {
	sendStatusToWindow(
		`Velocidade: ${formatBytes(progressObj.bytesPerSecond)} /seg
         <br />Baixado: ${progressObj.percent.toFixed(2)}%
         <br />(${formatBytes(progressObj.transferred)} de ${formatBytes(progressObj.total)} + )`
	);
});

autoUpdater.on('update-downloaded', info => {
	sendStatusToWindow('Atualização baixada; Começando a atualização...');
});

autoUpdater.on('update-downloaded', info => {
	// Wait 5 seconds, then quit and install
	// In your application, you don't need to wait 500 ms.
	// You could call autoUpdater.quitAndInstall(); immediately
	autoUpdater.quitAndInstall();
});

function formatBytes(bytes, decimals) {
	if (bytes == 0) return '0 Bytes';
	var k = 1024,
		dm = decimals <= 0 ? 0 : decimals || 2,
		sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
'use strict'

const {
    ipcRenderer
} = require('electron');

const os = require('os');

$('#username').val(os.userInfo.username);

ipcRenderer.on('onSyncing-content', (event, arg) => {
    let result = JSON.parse(arg);
    document.getElementById('h5Msg').innerHTML = `${result.message}`;
    document.getElementById('h6Msg').innerHTML = `Favor contactar "${result.username}" para mais informações.`;
});
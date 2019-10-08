'use strict'

const {
    ipcRenderer
} = require('electron');

ipcRenderer.on('onDoneSyncing-content', (event, arg) => {
    let result = JSON.parse(arg);
    document.getElementById('h5Msg').innerHTML = `${result.message}`;
    document.getElementById('h6Msg').innerHTML = `Favor contactar "${result.username}" para mais informações.`;
});
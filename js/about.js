'use strict'

const {
    ipcRenderer,
    remote
} = eRequire('electron');

$(function () {

    $('#msg').html(`Versão instalada: ${remote.app.getVersion()}`);

    // notifier.notify({
    //         title: 'Atenção',
    //         message: 'O aplicativo está ativo.',
    //         sound: true, // true | false.
    //         wait: true, // Wait for User Action against Notification
    //         icon: path.join(__dirname, 'img/icon.png'),
    //         // timeout: 10
    //     },
    //     function (err, response) {
    //         // Response is response from notification
    //         console.log(response);
    //     }
    // );

    $('#btnUpdate').click(function (e) {
        if (e.clientX === 0) {
            return false;
        }
        e.preventDefault();

        $(this).prop('disabled', true);

        ipcRenderer.send('checkForUpdates', '');
    });

    $('#btnCancel').click(function (e) {
        if (e.clientX === 0) {
            return false;
        }
        e.preventDefault();

        let win = remote.getCurrentWindow();
        win.close();
    });

});

ipcRenderer.on('update-content', (event, arg) => {
    $('#msg').html(arg);
});
const {
    ipcRenderer,
    remote
} = eRequire('electron');
const fse = eRequire('fs-extra');
const storage = eRequire('electron-json-storage');

let destPath = 'c:\\softer\\config';
fse.mkdirsSync(destPath);

$(function () {
    storage.setDataPath(destPath);

    fse.readFile(`${destPath}\\config.json`, function (err, data) {
        if (err) {
            return console.log(err);
        }
        let fileRead = fse.readFileSync(`${destPath}\\config.json`, 'utf8');
        config = JSON.parse(fileRead);

        $('#broadServer').val(config.broadServer);
        $('#chatServer').val(config.chatServer);

        Materialize.updateTextFields();
    });

    $('#btnSave').click(function (e) {
        if (e.clientX === 0) {
            return false;
        }
        e.preventDefault();

        let params = {
            broadServer: $('#broadServer').val(),
            chatServer: $('#chatServer').val()
        };

        storage.set('config', params, function (error) {
            if (error)
                throw error;

            new PNotify({
                title: "Sucesso",
                text: "Configuração salva. É recomendado reiniciar o aplicativo.",
                type: 'success',
                icon: false
            });
        });
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
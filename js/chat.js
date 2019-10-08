const {
    ipcRenderer,
    remote
} = eRequire('electron');
const fse = eRequire('fs-extra');
const notifier = eRequire('node-notifier');
const path = eRequire('path');
const os = require('os');

const mainWin = remote.getCurrentWindow();

const destPath = 'c:\\softer\\config';

fse.readFile(`${destPath}\\config.json`, function (err, data) {
    if (err) {
        return console.log(err);
    }

    let fileRead = fse.readFileSync(`${destPath}\\config.json`, 'utf8');
    config = JSON.parse(fileRead);

    let socket = io(`http://${config.chatServer}`);

    let typing = false;
    let typingTimer;

    let author = os.userInfo().username; // $('input[name="username"]').val();
    $('input[name="username"]').val(author);
    let message = $('input[name="message"]').val();

    function renderMessages(message) {
        $('.messages').append('<div class="message"><strong>' + message.author + ':</strong> ' + message.message + '</div>');
        $('.typingIndicator').html('');
        $('#message').val('');

        if (!mainWin.isFocused()) {
            notifier.notify({
                title: 'Chat',
                message: `${message.author} diz: ${message.message}`,
                sound: true, // true | false.
                wait: true, // Wait for User Action against Notification
                icon: path.join(__dirname, 'img/icon.png'),
                // timeout: 10
            },
                function (err, response) {
                    // Response is response from notification
                    console.log(response);
                }
            );

            notifier.on('click', function (notifierObject, options) {
                mainWin.focus();
            });
        }
    }

    function isTyping(message) {
        $('.typingIndicator').html('<span class="typing"><strong>' + message.author + '</strong> ' + message.message + '</span>');
    }

    socket.on('previewsMessages', messages => {
        for (message of messages) {
            renderMessages(message);
        }
    });

    socket.on('receivedMessage', message => {
        renderMessages(message);
    });

    socket.on('typing', message => {
        isTyping(message);
    });

    socket.on('done-typing', message => {
        isTyping(message);
    });

    $('input[name="message"]').keypress(function (event) {
        const username = $('input[name="username"]').val();
        if (!typing) {
            typing = true;
            socket.emit('typing', { username });
        }
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        typingTimer = setTimeout(() => {
            typing = false;
            socket.emit('done-typing', { username });
        }, 5000);
    });

    $('#btnSend').click(function (event) {
        event.preventDefault();

        let author = $('input[name="username"]').val();
        let message = $('input[name="message"]').val();

        if (author.length && message.length) {
            let messageObject = {
                author: author,
                message: message
            };

            renderMessages(messageObject);

            socket.emit('sendMessage', messageObject);
        }
    });

    Materialize.updateTextFields();

    $('#message').focus();

});
const toast = (message, type = 'normal') => {

    let messageType = type || 'normal';

    if (type == 'error') {
        messageType = 'linear-gradient(147deg, #FFE53B 0%, #FF2525 74%)';
    }

    Toastify({
        text: message,
        duration: 3000,
        newWindow: false,
        close: false,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: messageType,
            minWidth: '200px',
        },
        onClick: () => { }
    }).showToast();
}

const $ = document.querySelector.bind(document);

const setCookie = (cname, cvalue, exdays) => {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

$('#login').addEventListener('click', (e) => {
    const username = $('#username').value;
    const password = $('#password').value;

    axios.post('/api/login', {
        username,
        password
    }).then((res) => {
        const code = res.data.code;
        if (code == 200) {
            setCookie('admin_token', res.data.data.token, 1);
            window.location.replace('/admin');
        } else {
            toast(res.data.data.message, 'error')
        }
    })
})
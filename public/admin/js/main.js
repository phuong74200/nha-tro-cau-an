const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

Element.prototype.on = Element.prototype.addEventListener;

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

const saveStack = {};

$('#logout').on('click', () => {
    document.cookie = 'admin_token' + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.replace('/login');
})

$('#save').on('click', (e) => {
    axios.post('/api/page/text', { saveStack: Object.entries(saveStack) }, { headers: { authorization: '123' } }).then((res) => {
        if (res.data.code == 200) {
            toast('Lưu thành công!');
        } else {
            toast('Lưu thất bại! Vui lòng thử lại', 'error');
        }
    }).catch((err) => {
        toast('Lưu thất bại! Vui lòng thử lại', 'error');
    })
})

axios.get('/api/page').then((response) => {
    const pages = response.data.data;

    for (let page of pages) {
        let type = page.mimetype.split('/')[0];
        if (type === 'text')
            document.querySelector(`[page-id="${page.page_id}"]`).value = page.text;
        else if (type == 'image') {
            document.querySelector(`[page-id="${page.page_id}"]`)
                .querySelector('img')
                .src = `/image/${page.filename}`
        }
        else if (type == 'video') {
            document.querySelector(`[page-id="${page.page_id}"]`)
                .querySelector('video')
                .src = `/video/${page.filename}`
            document.querySelector(`[page-id="${page.page_id}"]`)
                .querySelector('.video-title')
                .textContent = page.originalname
        }
        else if (type == 'images') {
            const gallery = document.querySelector(`[page-id="${page.page_id}"]`);
            const container = gallery.querySelector('.image-container');
            for (let file of page.files) {
                const div = document.createElement('div');
                const rm = document.createElement('div');
                rm.textContent = 'Xoá hình này';
                rm.className = 'remove';
                div.className = "image";
                const img = document.createElement('img');
                img.src = `/image/${file.filename}`;
                div.append(img);
                div.append(rm);
                container.append(div)

                rm.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    axios.delete('/api/page/images', {
                        data: {
                            page_id: page.page_id,
                            filename: file.filename,
                        },
                        headers: { authorization: '123' }
                    }).then((res) => {
                        if (res.data.code == 200) {
                            div.remove();
                            toast('Xoá hình ảnh thành công!');
                        }
                    })
                })
            }
        }
    }
})
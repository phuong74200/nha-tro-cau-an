const imageUpload = (file, page_id) => {
    const bodyFormData = new FormData();
    bodyFormData.append('image', file);
    bodyFormData.append('page_id', page_id);
    return axios.post('/api/page/image', bodyFormData, {
        headers: {
            authorization: '123',
            'Content-Type': 'multipart/form-data'
        }
    }).then((res) => {
        if (res.data.code == 200) {
            toast('Lưu thành công!');
        } else {
            toast('Lưu thất bại! Vui lòng thử lại', 'error');
        }
    }).catch((err) => {
        toast('Lưu thất bại! Vui lòng thử lại', 'error');
    })
}

const videoUpload = (file, page_id) => {
    const bodyFormData = new FormData();
    bodyFormData.append('video', file);
    bodyFormData.append('page_id', page_id);
    return axios.post('/api/page/video', bodyFormData, {
        headers: {
            authorization: '123',
            'Content-Type': 'multipart/form-data'
        }
    }).then((res) => {
        if (res.data.code == 200) {
            toast('Lưu thành công!');
        } else {
            toast('Lưu thất bại! Vui lòng thử lại', 'error');
        }
    }).catch((err) => {
        toast('Lưu thất bại! Vui lòng thử lại', 'error');
    })
}

const imagesUpload = (files, page_id) => {
    const bodyFormData = new FormData();
    for (var i = 0; i < files.length; i++) {
        bodyFormData.append('images', files[i]);
    }
    bodyFormData.append('page_id', page_id);
    return axios.post('/api/page/images', bodyFormData, {
        headers: {
            authorization: '123',
            'Content-Type': 'multipart/form-data'
        }
    })
}
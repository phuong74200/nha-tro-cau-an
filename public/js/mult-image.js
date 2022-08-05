const IMAGE_MUTL_DROP_AREA = $$('[images-drop]');

IMAGE_MUTL_DROP_AREA.forEach((area) => {
    const overClass = area.getAttribute('image-drop') || 'image-over';
    const page_id = area.getAttribute('page-id');

    if (!page_id)
        console.warn({
            message: 'missing <page_id>',
            target: area
        });

    const input = area.querySelector('input');
    const container = area.querySelector('.image-container');

    const handleFile = (files) => {
        const image = area.querySelector('img');

        imagesUpload(files, page_id).then((res) => {
            if (res.data.code == 200) {
                toast('Lưu thành công!');
                const files = res.data.data.files;
                for (let file of files) {
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
                                page_id: page_id,
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
            } else {
                toast('Lưu thất bại! Vui lòng thử lại', 'error');
            }
        }).catch((err) => {
            console.log(err);
            toast('Lưu thất bại! Vui lòng thử lại err-catch', 'error');
        });
    }

    area.on('click', () => input.click());

    input.on('change', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const files = e.target.files;

        handleFile(files);

        area.classList.remove(overClass);
    })

    area.on('dragover', (e) => {
        e.stopPropagation();
        e.preventDefault();

        e.dataTransfer.dropEffect = 'copy';

        area.classList.add(overClass);
    })

    area.on('drop', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const files = e.dataTransfer.files;

        handleFile(files);

        area.classList.remove(overClass);
    })

    area.on('dragleave', (e) => {
        e.stopPropagation();
        e.preventDefault();

        e.dataTransfer.dropEffect = 'copy';

        area.classList.remove(overClass);
    })
})
const VIDEO_DROP_AREA = $$('[video-drop]');

const readFile = (file) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    return reader;
}

VIDEO_DROP_AREA.forEach((area) => {
    const overClass = area.getAttribute('video-drop') || 'video-over';

    const input = area.querySelector('input');
    const progress = area.querySelector('.progress');
    const loadbar = area.querySelector('.video-load');

    const video = area.querySelector('video');

    const page_id = area.getAttribute('page-id');

    const handleFile = (file) => {
        const reader = readFile(file);

        const type = file.type.split('/')[0];

        if (type == 'video') {
            reader.addEventListener('loadstart', () => {
                videoUpload(file, page_id);
                loadbar.style.opacity = 1;
                area.querySelector('.video-title').textContent = file.name;
                progress.style.width = `0`
                video.removeAttribute('src');
                video.load();
            })

            reader.addEventListener('progress', (e) => {
                progress.style.width = `${(e.loaded / e.total) * 100}%`;
            })

            reader.addEventListener('loadend', (e) => {
                loadbar.style.opacity = 0;
                video.src = e.target.result;
                video.load();
            })
        } else {
            toast('Chỉ được phép upload video vào ô này!', 'error');
        }
    }

    area.on('click', () => input.click());

    input.on('change', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const file = e.target.files[0];

        handleFile(file);

        const type = file.type.split('/')[0];

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

        const file = e.dataTransfer.files[0];

        handleFile(file);

        const type = file.type.split('/')[0];

        area.classList.remove(overClass);
    })

    area.on('dragleave', (e) => {
        e.stopPropagation();
        e.preventDefault();

        e.dataTransfer.dropEffect = 'copy';

        area.classList.remove(overClass);
    })
})
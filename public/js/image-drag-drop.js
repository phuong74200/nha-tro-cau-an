const IMAGE_DROP_AREA = $$('[image-drop]');

const readImage = (img) => {
    const reader = new FileReader();

    reader.readAsDataURL(img);

    return new Promise((resolve, reject) => {
        reader.addEventListener('load', resolve);
        reader.addEventListener('error', reject);
    })
}

IMAGE_DROP_AREA.forEach((area) => {
    const overClass = area.getAttribute('image-drop') || 'image-over';
    const page_id = area.getAttribute('page-id');

    if (!page_id)
        console.warn({
            message: 'missing <page_id>',
            target: area
        });

    const input = area.querySelector('input');

    const handleFile = (file) => {
        const image = area.querySelector('img');

        const type = file.type.split('/')[0];

        if (type == 'image') {
            imageUpload(file, page_id);
            readImage(file).then((img) => {
                image.src = img.target.result;
            })
        } else {
            toast('Chỉ được phép upload hình ảnh vào ô này!', 'error');
        }
    }

    area.on('click', () => input.click());

    input.on('change', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const file = e.target.files[0];

        handleFile(file);

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

        area.classList.remove(overClass);
    })

    area.on('dragleave', (e) => {
        e.stopPropagation();
        e.preventDefault();

        e.dataTransfer.dropEffect = 'copy';

        area.classList.remove(overClass);
    })
})
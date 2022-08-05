const handle_changeImgBtn = (element) => {
    const handleChange = (e) => {
        const _element = e.target;

        if (_element.files.length > 0) {
            let fileToLoad = _element.files[0];

            let fileReader = new FileReader();

            fileReader.onload = (e) => {
                let srcData = e.target.result; // ==> img/base64

                console.log(srcData);

                // post { id: element.getAttribute('edit'), data: srcData }
            }
            fileReader.readAsDataURL(fileToLoad);
        }
    }
    element.addEventListener("change", handleChange);
}

const handle_text = (element) => {
    const handleChange = (e) => {
        const value = e.value;

        // post { id: element.getAttribute('edit'), data: value }
    }

    element.addEventListener('change', handleChange);
}


const edits = document.querySelectorAll('[edit]');


const changeImgBtns = [...edits].forEach((edit) => {
    const value = edit.getAttribute('edit');
    const [head, body, foot] = value.split('_');
    if (body == 'changeImgBtn') {
        handle_changeImgBtn(edit);
    }
})

const text = [...edits].forEach((edit) => {
    const value = edit.getAttribute('edit');
    const [head, body, foot] = value.split('_');
    if (body == 'text') {
        handle_text(edit);
    }
})

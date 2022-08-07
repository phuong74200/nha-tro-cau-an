axios.get('/api/page').then((response) => {
    const pages = response.data.data;

    for (let page of pages) {
        let type = page.mimetype.split('/')[0];
        if (type === 'text') {
            if (page.page_id == 'footer-text-1') {
                document.querySelector(`[page-id="${page.page_id}"]`).src = page.text;
            } else {
                document.querySelector(`[page-id="${page.page_id}"]`).textContent = page.text;
            }
        }
        else if (type == 'image') {
            document.querySelector(`[page-id="${page.page_id}"]`).src = `/image/${page.filename}`
        }
        else if (type == 'video') {
            document.querySelector(`[page-id="${page.page_id}"]`).src = `/video/${page.filename}`
        }
        else if (type == 'images') {
            console.log(page);
            const gallery = document.querySelector(`[page-id="${page.page_id}"]`);

            if (page.files.length > 0) {
                while (gallery.children.length > 0) {
                    gallery.children[0].remove();
                }

                for (let file of page.files) {
                    const img = document.createElement('img');
                    img.src = `/image/${file.filename}`;
                    gallery.appendChild(img);
                }
            }
        }
    }
})
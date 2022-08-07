const textareas = $$('textarea');

textareas.forEach((textarea) => {
    const heightLimit = 500; /* Maximum height: 200px */
    textarea.addEventListener('input', () => {
        textarea.style.height = "";
        textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + "px";
    })
    textarea.addEventListener('change', () => {
        textarea.style.height = "";
        textarea.style.height = Math.min(textarea.scrollHeight, heightLimit) + "px";
    })
})
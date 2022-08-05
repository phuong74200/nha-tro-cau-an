const inputs = $$('input[class="form__field"], textarea[class="form__field"]');

inputs.forEach((input) => {
    const page_id = input.getAttribute('page-id');

    if (!page_id)
        console.warn({
            message: 'input missing <page_id>',
            target: input
        });
    else {
        input.on('change', (e) => {
            console.log(e);
            saveStack[page_id] = e.target.value;
        })
    }
})
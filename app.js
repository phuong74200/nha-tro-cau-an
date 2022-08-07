const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const multer = require('multer');
const { log, error } = require('./utils/logger');

const privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const DataStore = require('nedb');

const db = {};

db.page = new DataStore('./db/page.db');
db.page.loadDatabase();

app.use(function (req, res, next) {
    log(req.method + ' ' + req.originalUrl);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.use(express.json());
app.use('/admin', express.static('public/admin'));

const image = multer({
    dest: 'images/',
    fileFilter: (req, file, cb) => {
        const type = file.mimetype.split('/')[0];
        if (type != 'image') {
            return cb(new Error('Only images are allowed'), false)
        }
        cb(null, true)
    },
});
const video = multer({ dest: 'videos/' });

app.get('/', (req, res) => {
    res.status(500).json({
        code: 500,
        data: {
            message: 'internal server error'
        }
    });
});

app.get('/image/:image_id', (req, res) => {
    const { image_id } = req.params;
    res.sendFile(`${__dirname}/images/${image_id}`, {
        headers: { 'Content-Type': 'image/png' }
    });
})

app.get('/video/:video_id', (req, res) => {
    const { video_id } = req.params;
    res.sendFile(`${__dirname}/videos/${video_id}`, {
        headers: { 'Content-Type': 'video/*' }
    });
})

app.get('/api/page', (req, res) => {
    db.page.find({ is_remove: false }, (err, docs) => {
        res.json({
            code: 200,
            data: docs.map((doc) => {
                const minify = {
                    page_id: doc.page_id,
                };
                if (doc.text)
                    minify.text = doc.text;
                if (doc.filename)
                    minify.filename = doc.filename;
                if (doc.mimetype)
                    minify.mimetype = doc.mimetype;
                if (doc.originalname)
                    minify.originalname = doc.originalname;
                if (doc.files)
                    minify.files = doc.files.map((file) => ({ filename: file.filename }));
                return minify;
            })
        })
    })
})

app.use((req, res, next) => {
    const token = req.headers.authorization;
    if (token == '123') {
        return next();
    }
    return res.status(403).json({
        code: 400,
        data: {
            message: 'unauthorized'
        }
    });
});

app.post('/api/page/image', image.single('image'), (req, res) => {
    const file = req.file;

    const { page_id } = req.body;

    if (page_id) {
        db.page.update({ page_id }, { is_remove: true }, (err, doc) => {
            db.page.insert({ ...file, page_id, is_remove: false }, (err, doc) => {
                if (err) {
                    return res.json({
                        code: 200,
                        data: {
                            message: 'image write failed',
                        }
                    });
                } else {
                    res.json({
                        code: 200,
                        data: {
                            message: 'write image success',
                        }
                    })
                }
            });
        });
    } else {
        res.json({
            code: 400,
            data: {
                message: 'Missing field <page_id>',
            }
        })
    }
});

app.post('/api/page/video', video.single('video'), (req, res) => {
    const file = req.file;

    const { page_id } = req.body;

    if (page_id) {
        db.page.update({ page_id }, { is_remove: true }, (err, doc) => {
            db.page.insert({ ...file, page_id, is_remove: false }, (err, doc) => {
                if (err) {
                    return res.json({
                        code: 200,
                        data: {
                            message: 'video write failed',
                        }
                    });
                } else {
                    res.json({
                        code: 200,
                        data: {
                            message: 'video write success',
                        }
                    })
                }
            });
        });
    } else {
        res.json({
            code: 400,
            data: {
                message: 'Missing field <page_id>',
            }
        })
    }
});

app.post('/api/page/text', (req, res) => {
    const { saveStack } = req.body;

    if (!saveStack || !Array.isArray(saveStack)) {
        return res.json({
            code: 400,
            data: {
                message: '<saveStack> must be Array',
            }
        });
    }

    for (let [page_id, value] of saveStack) {
        db.page.update({ page_id, is_remove: false }, { text: value, is_remove: false, page_id, mimetype: 'text/plain' }, (err, numReplaced) => {
            if (numReplaced == 0) {
                db.page.insert({ page_id, text: value, is_remove: false, mimetype: 'text/plain' }, (err, doc) => {
                    console.log(doc)
                })
            }
        });
    }

    return res.json({
        code: 200,
        data: {
            message: 'update text fields successfully'
        }
    })
})

const uploadGallery = image.array('images');

app.post('/api/page/images', (req, res, next) => {
    uploadGallery(req, res, function (err) {
        if (err) {
            return res.status(400).send({ message: err.message })
        }
        const files = req.files;
        const { page_id } = req.body;

        db.page.findOne({ page_id, is_remove: false }, (err, doc) => {
            if (doc) {
                db.page.update({ page_id: doc.page_id }, { files: doc.files.concat(files), is_remove: false, page_id, mimetype: 'images/*' }, (err, numReplaced) => {
                    return res.status(200).json({
                        code: 200,
                        data: {
                            message: 'upload success',
                            files: files,
                        }
                    })
                });
            } else {
                db.page.insert({ files: files, is_remove: false, page_id, mimetype: 'images/*' }, (err, doc) => {
                    return res.status(200).json({
                        code: 200,
                        data: {
                            message: 'upload success',
                            files: files,
                        }
                    })
                })
            }
        })
    })
})

app.delete('/api/page/images', (req, res) => {
    const { page_id, filename } = req.body;

    db.page.findOne({ page_id, is_remove: false }, (err, doc) => {
        if (doc) {
            const update = doc.files.filter((file) => {
                return file.filename != filename;
            })
            db.page.update({ page_id: doc.page_id }, { files: update, is_remove: false, page_id, mimetype: 'images/*' }, (err, numReplaced) => {
                return res.json({
                    code: 200,
                    data: {
                        message: 'removed ' + numReplaced + ' file(s)',
                        update: update
                    }
                })
            });
        } else {
            return res.json({
                code: 200,
                data: {
                    message: 'no file matching',
                }
            })
        }
    })
})

app.use((err, req, res, next) => {
    error(err);

    if (err.type == 'time-out')
        return res.status(408).send({
            code: 408,
        })
    else
        return res.status(500).send({
            code: 500,
            data: {
                message: 'internal server error'
            }
        })
})

const httpsServer = https.createServer(credentials, app);
app.listen(443);
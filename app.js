require('dotenv').config();

const express = require('express');
const app = express();
const https = require('https');
const path = require('path');
const fs = require('fs');
const cookieParser = require("cookie-parser");
const multer = require('multer');
const { log, error } = require('./utils/logger');
const { hash, compare } = require('./utils/bcrypt');
const { sign, verify } = require('./utils/jwt');
const message = require('./utils/message');

const privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const DataStore = require('nedb');

const db = {};

db.page = new DataStore('./db/page.db');
db.page.loadDatabase((err) => {
    if (err)
        return error(err);
    log('loaded db.page');
});

db.user = new DataStore('./db/user.db');
db.user.loadDatabase((err) => {
    if (err)
        return error(err);
    log('loaded db.user');

    db.user.findOne({ username: 'admin' }, (err, user) => {
        if (user) return;
        hash(process.env.DEFAULT_PASSWORD)
            .then((hashed) => {
                db.user.insert({ username: 'admin', password: hashed }, (err, user) => {
                    log(`db.user - ${JSON.stringify(user)}`);
                })
            })
    })
});

app.use(express.json());
app.use(cookieParser());

app.use(function (req, res, next) {
    log(req.method + ' ' + req.originalUrl);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

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
            message: message.INTERNAL_ERROR
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

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.user.findOne({ username: username }, (err, user) => {
        if (err)
            return res.status(500).json({
                code: 500,
                data: {
                    message: message.INTERNAL_ERROR
                }
            })
        else if (user) {
            const hash = user.password;
            compare(password, hash)
                .then((result) => {
                    if (result) {
                        sign({ username })
                            .then((token) => {
                                return res.json({
                                    code: 200,
                                    data: {
                                        message: message.LOGIN_SUCCESS,
                                        token: token
                                    }
                                })
                            })
                    } else {
                        return res.json({
                            code: 400,
                            data: {
                                message: message.WRONG_USER
                            }
                        })
                    }
                })
        } else {
            return res.json({
                code: 400,
                data: {
                    message: message.WRONG_USER
                }
            })
        }
    })
});

app.use('/login', (req, res, next) => {
    const { admin_token } = req.cookies;

    verify(admin_token)
        .then(() => {
            res.redirect('/admin');
        }).catch(() => {
            next();
        })
})
app.use('/login', express.static(path.join(__dirname, 'public/login')));
app.use('/admin', (req, res, next) => {
    const { admin_token } = req.cookies;

    verify(admin_token)
        .then(() => {
            next();
        }).catch(() => {
            return res.status(403).json({
                code: 400,
                data: {
                    message: message.NOT_FOUND
                }
            });
        })
})
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

app.use((req, res, next) => {
    const { admin_token } = req.cookies;

    log('Token: ' + admin_token);

    verify(admin_token)
        .then(() => {
            next();
        }).catch(() => {
            return res.status(403).json({
                code: 400,
                data: {
                    message: message.NOT_FOUND
                }
            });
        })
});

app.post('/api/page/image', image.single('image'), (req, res) => {
    const file = req.file;

    const { page_id } = req.body;

    if (page_id) {
        db.page.update({ page_id }, { is_remove: true }, (err, doc) => {
            db.page.insert({ ...file, page_id, is_remove: false }, (err, doc) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: {
                            message: message.UPLOAD_FAIL,
                        }
                    });
                } else {
                    res.json({
                        code: 200,
                        data: {
                            message: message.UPLOAD_SUCCESS,
                        }
                    })
                }
            });
        });
    } else {
        res.json({
            code: 400,
            data: {
                message: message.MISSING_PAGE_ID,
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
                        code: 400,
                        data: {
                            message: message.UPLOAD_FAIL,
                        }
                    });
                } else {
                    res.json({
                        code: 200,
                        data: {
                            message: message.UPLOAD_SUCCESS,
                        }
                    })
                }
            });
        });
    } else {
        res.json({
            code: 400,
            data: {
                message: message.MISSING_PAGE_ID,
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
                message: message.INVALID_DATA_TYPE,
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
            message: message.UPLOAD_SUCCESS
        }
    })
})

const uploadGallery = image.array('images');

app.post('/api/page/images', (req, res, next) => {
    uploadGallery(req, res, function (err) {
        if (err) {
            return res.status(400).send({ message: message.UPLOAD_FAIL })
        }
        const files = req.files;
        const { page_id } = req.body;

        db.page.findOne({ page_id, is_remove: false }, (err, doc) => {
            if (doc) {
                db.page.update({ page_id: doc.page_id }, { files: doc.files.concat(files), is_remove: false, page_id, mimetype: 'images/*' }, (err, numReplaced) => {
                    return res.status(200).json({
                        code: 200,
                        data: {
                            message: message.UPLOAD_SUCCESS,
                            files: files,
                        }
                    })
                });
            } else {
                db.page.insert({ files: files, is_remove: false, page_id, mimetype: 'images/*' }, (err, doc) => {
                    return res.status(200).json({
                        code: 200,
                        data: {
                            message: message.UPLOAD_SUCCESS,
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
                    message: message.NOT_FOUND,
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
                message: message.INTERNAL_ERROR
            }
        })
})

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(process.env.HTTPS_PORT, () => {
    log('server start at ' + process.env.HTTPS_PORT);
});
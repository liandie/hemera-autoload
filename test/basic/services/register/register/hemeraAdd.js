'use strict'
const hp = require('hemera-plugin')

module.exports = hp(function (hemera, opts, next) {
    hemera.add(
        {
            pubsub$: true,
            topic: 'math',
            cmd: 'add'
        },
        function (req, cb) {
            console.log('.................', { sum: req.a + req.b, a: req.a, b: req.b })
            //cb(null, { sum: req.a + req.b, a: req.a, b: req.b })
        }
    )
    next()
})
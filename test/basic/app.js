const hp = require('hemera-plugin')
const path = require('path')
const AutoLoad = require('../..')

module.exports = hp(function (hemera, opts, next) {

    hemera.register(AutoLoad, {
        dir: path.join(__dirname, 'plugins'),
        options: Object.assign({}, opts)
    })

    hemera.register(AutoLoad, {
        dir: path.join(__dirname, 'services'),
        options: Object.assign({}, opts)
    })
    next()
})
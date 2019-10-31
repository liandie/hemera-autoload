'use strict'

const hp = require('hemera-plugin')

module.exports = hp(function (hemera, opts, next) {
    hemera.decorate('test', function () {
    return '这是一个扫描组件'
  })
  next()
})
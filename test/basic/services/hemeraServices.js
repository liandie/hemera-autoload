'use strict'
const hp = require('hemera-plugin')

module.exports = hp(function (hemera, opts, next) {
	hemera.add(
		{
			topic: 'math',
			cmd: 'add'
		},
		function (req, cb) {
			console.log('.................', { sum: req.a + req.b + 1, a: req.a, b: req.b })
			cb(null, req.a + req.b)
		}
	)
	next()
})
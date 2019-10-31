'use strict'
const hp = require('hemera-plugin')

module.exports = hp(function (hemera, opts, next) {
	hemera.add(
		{
			topic: 'math',
			cmd: 'add1'
		},
		function (req, cb) {
			console.log('.................', { sum: req.a + req.b, a: req.a, b: req.b })
			cb(null, { sum: req.a + req.b, a: req.a, b: req.b ,c: 'abc'})
		}
	)
	next()
})
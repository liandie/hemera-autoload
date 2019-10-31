'use strict'

const tap = require("tap")
const AJV = require("ajv")
const ajv = new AJV()
const Hemera = require('nats-hemera')
const nats = require('nats').connect({
  url: 'nats://120.78.64.187:4222',
  user: 'bimgroup',
  pass: 'commonpwd'
})

const hemera = new Hemera(nats)
hemera.register(require('./basic/app'))

tap.test("测试返回值是不是一个数字型", (t) => {
  t.plan(2)
  hemera.ready(() => {
    hemera.act(
      {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 3
      },
      function (err, res) {
        t.error(err)
        t.ok(ajv.validate({
          type: 'number',
        }, res), { error: ajv.errors, res });
      }
    )
  })
})

tap.test("测试返回值是不是一个对象", (t) => {
  t.plan(2)
    hemera.act(
      {
        topic: 'math',
        cmd: 'add1',
        a: 1,
        b: 3
      },
      function (err, res) {
        t.error(err)
        t.ok(ajv.validate({
          type: "object",
          properties: {
            sum: { type: "number" },
            a: { type: "number" },
            b: { type: "number" }
          },
          additionalProperties: true
        }, res), { error: ajv.errors, res });
        hemera.close()
      }
    )
})
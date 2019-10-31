'use strict'

const fs = require('fs')
const path = require('path')
const steed = require('steed')

module.exports = function (hemera, opts, next) {

    const defaultPluginOptions = opts.options
    const packagePattern = /^package\.json$/im
    const indexPattern = opts.includeTypeScript
        ? /^index\.(ts|js)$/im
        : /^index\.js$/im
    const scriptPattern = opts.includeTypeScript
        ? /\.(ts|js)$/im
        : /\.js$/im

    function enrichError(err) {
        // Hack SyntaxError message so that we provide
        // the line number to the user, otherwise they
        // will be left in the cold.
        if (err instanceof SyntaxError) {
            err.message += ' at ' + err.stack.split('\n')[0]
        }
        return err
    }
    // 读取opts.dir目录下所有文件包括文件夹
    fs.readdir(opts.dir, function (err, list) {
        if (err) {
            next(err)
            return
        }
        // 迭代遍历list列表，并调用自身cb回调函数，会将同一个地方调用的cb传入数据封装成list触发回调
        steed.map(list, (file, cb) => {
            // opts.ignorePattern 要过滤的文件名正则
            if (opts.ignorePattern && file.match(opts.ignorePattern)) {
                cb(null, { skip: true }) // skip files matching `ignorePattern`
                return
            }
            const toLoad = path.join(opts.dir, file)
            //读取文件类型
            fs.stat(toLoad, (err, stat) => {
                if (err) {
                    cb(err)
                    return
                }
                if (stat.isDirectory()) {
                    //继续遍历二级目录下的文件
                    fs.readdir(toLoad, (err, files) => {
                        if (err) {
                            cb(err)
                            return
                        }
                        const fileList = files.join('\n')
                        // 判断不是package.json跟index.js跟是js文件
                        if (!packagePattern.test(fileList) && !indexPattern.test(fileList) && scriptPattern.test(fileList)) {
                            const plugins = []
                            //循环将该文件夹下的所有文件封装成list
                            for (let index = 0; index < files.length; index++) {
                                const file = files[index]
                                plugins.push({
                                    skip: !scriptPattern.test(file),
                                    opts: {
                                        prefix: toLoad.split(path.sep).pop()
                                    },
                                    file: path.join(toLoad, file)
                                })
                            }
                            cb(null, plugins)
                        } else {
                            cb(null, {
                                skip: files.every(name => !scriptPattern.test(name)),
                                file: toLoad
                            })
                        }
                    })
                } else {
                    cb(null, {
                        skip: !(stat.isFile() && scriptPattern.test(file)),
                        file: toLoad
                    })
                }
            })
        }, (err, files) => {
            if (err) {
                next(err)
                return
            }
            const stats = [].concat(...files)
            //记录已经注册的插件
            const allPlugins = {}
            for (let i = 0; i < stats.length; i++) {
                const { skip, file, opts } = stats[i]

                //如果是跳过文件就不注册成组件
                if (skip) {
                    continue
                }
                try {
                    //加载组件
                    const plugin = require(file)
                    const pluginOptions = Object.assign({}, defaultPluginOptions)
                    const pluginMeta = plugin[Symbol.for('plugin-meta')] || {}
                    const pluginName = pluginMeta.name || file

                    if (opts && !plugin.autoPrefix) {
                        plugin.autoPrefix = opts.prefix
                    }

                    if (plugin.autoPrefix) {
                        const prefix = pluginOptions.prefix || ''
                        pluginOptions.prefix = prefix + plugin.autoPrefix
                    }

                    if (plugin.prefixOverride !== undefined) {
                        pluginOptions.prefix = plugin.prefixOverride
                    }

                    //判断组件是否已经加载
                    if (allPlugins[pluginName]) {
                        throw new Error(`Duplicate plugin: ${pluginName}`)
                    }

                    allPlugins[pluginName] = {
                        plugin,
                        name: pluginName,
                        dependencies: pluginMeta.dependencies,
                        options: pluginOptions
                    }
                } catch (err) {
                    next(enrichError(err))
                    return
                }
            }
            const loadedPlugins = {}

            //将组件注册到hemera中
            function registerPlugin(name, plugin, options) {
                if (loadedPlugins[name]) return
                hemera.register(plugin.default || plugin, options)
                loadedPlugins[name] = true
            }

            let cyclicDependencyCheck = {}

            function loadPlugin({ plugin, name, dependencies = [], options }) {
                if (cyclicDependencyCheck[name]) throw new Error('Cyclic dependency')
                if (dependencies.length) {
                    cyclicDependencyCheck[name] = true
                    dependencies.forEach((name) => allPlugins[name] && loadPlugin(allPlugins[name]))
                }
                registerPlugin(name, plugin, options)
            }

            const pluginKeys = Object.keys(allPlugins)
            for (let i = 0; i < pluginKeys.length; i++) {
                cyclicDependencyCheck = {}
                try {
                    loadPlugin(allPlugins[pluginKeys[i]])
                } catch (err) {
                    next(enrichError(err))
                    return
                }
            }

            next()
        })
    })

}
// 这个文件会帮我们打包 packages 下的模块，最终打包出 js 代码

// node dev.js 要打包的名字 -f 要打包的格式

import minimist from "minimist"
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from "module"
import esbuild from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

// node中的命令行参数通过 process 来获取 process.argv
const args = minimist(process.argv.slice(2))

const target = args._[0] || 'reactivity' // 打包哪个项目
const format = args.f || 'iife' // 打包后的模块化规范

// 入口文件 根据命令行提供的路径来解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
const pkg = require(`../packages/${target}/package.json`)


// 根据需要进行打包
esbuild.context({
  entryPoints: [entry],
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
  bundle: true, // reactivity -> shared 会打包到一起
  platform: 'browser', // 打包后给浏览器使用
  sourcemap: true, // 可以调试源代码
  format,
  globalName: pkg.buildOptions?.name
}).then((ctx) => {
  console.log('start dev')

  // 监控入口文件持续打包
  return ctx.watch()
})
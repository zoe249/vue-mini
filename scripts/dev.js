// 这个文件会帮我们打包 packages 下的模块，最终打包出 js 代码

// node dev.js 要打包的名字 -f 要打包的格式

import minimist from "minimist";
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

// node中的命令行参数通过 process 来获取 process.argv
const args = minimist(process.argv.slice(2))

const target = args._[0] || 'reactivity' // 打包哪个项目
const format = args.f || 'iife' // 打包后的模块化规范

console.log(args)

// 入口文件 根据命令行提供的路径来解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)

console.log(entry)
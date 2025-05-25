/**
 * 模板编译
 * 1.解析模板，转化成AST语法树
 * 2.转化生成codegennode
 * 3.生成render方法
 */

import { NodeTypes } from './ast'

function createParseContext(content) {
  return {
    originalSource: content, // 原始模板
    source: content, // 字符串会不停的减少
    line: 1, // 行数
    column: 1, // 列数
    offset: 0 // 偏移量
  }
}

function isEnd(content) {
  return !content.source
}

function advanceBy(context, endIndex) {
  const c = context.source.slice(endIndex)
  context.source = c
}

function parseTextData(context, endIndex) {
  const content = context.source.slice(0, endIndex)
  advanceBy(context, endIndex)
  return content
}

function parseText(context) {
  let tokens = ['<', '{{']
  let endIndex = context.source.length // 先假设找不到
  for (let i = 0; i < tokens.length; i++) {
    const index = context.source.indexOf(tokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  let content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content
  }
}

function advanceSpace(context) {
  const match = /^[ \t\r\n]+/.exec(context.source)

  if (match) { // 删除空格
    advanceBy(context, match[0].length)
  }
}

function parseTag(context) {  
  const start = getCursor(context)
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
  const tag = match[1]

  advanceBy(context, match[0].length) // 删除匹配到的内容

  advanceSpace(context) // 删除空格

  const isSelfCLosing = context.source.startsWith('/>')

  advanceBy(context, isSelfCLosing ? 2 : 1) // 根据是否自闭合删除不同的内容
  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfCLosing,
    loc: getSelection(context, start) // 开头标签解析的信息
  }
}

function parseElement(context) {
  // <div></div> => div
  const ele = parseTag(context);

  if (context.source.startsWith('</')) {
    parseTag(context) // 闭合标签没有意义，直接删除
  }

  (ele as any).children = [];
  (ele as any).loc = getSelection(context, ele.loc.start)

  return ele
}

function parseChildren(content) {
  const nodes = []
  while (!isEnd(content)) {
    const c = content.source
    let node
    if (c.startsWith('{{')) {
      node = '表达式'
    } else if (c[0] === '<') {
      node = parseElement(content)
    } else {
      node = parseText(content)
      
    }
    // 有限状态机
    nodes.push(node)
  }
  return nodes
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children
  }
}

export function parse(template) {
  // 根据template产生一棵树 line column offset
  // 解析模板，转化成AST语法树
  // return root;
  parseChildren(template)
  const context = createParseContext(template)

  return createRoot(parseChildren(context))
}

export function compile() {}

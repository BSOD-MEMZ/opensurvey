/**
 * 计算题的公式求值
 *
 * 只支持：数字、变量（Q1、Q2…，对应「参与计算的题目」的顺序）、+ - * / ( )
 * 刻意不用 eval / new Function —— 公式由问卷作者填写，但不能让它有能力执行任意代码。
 * 采用调度场算法（shunting-yard）转成后缀表达式再求值。
 */

const OPERATORS = {
  '+': { precedence: 1, assoc: 'left', calc: (a, b) => a + b },
  '-': { precedence: 1, assoc: 'left', calc: (a, b) => a - b },
  '*': { precedence: 2, assoc: 'left', calc: (a, b) => a * b },
  '/': { precedence: 2, assoc: 'left', calc: (a, b) => (b === 0 ? 0 : a / b) }
}

// 一元负号用独立记号表示，避免与减号混淆
const UNARY = 'u-'

function tokenize(expression) {
  const tokens = []
  let index = 0

  while (index < expression.length) {
    const char = expression[index]

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (/[0-9.]/.test(char)) {
      let literal = ''
      while (index < expression.length && /[0-9.]/.test(expression[index])) {
        literal += expression[index]
        index += 1
      }
      const value = Number(literal)
      if (!Number.isFinite(value)) {
        throw new Error(`无法识别的数字：${literal}`)
      }
      tokens.push({ type: 'number', value })
      continue
    }

    if (/[Qq]/.test(char)) {
      let name = ''
      while (index < expression.length && /[A-Za-z0-9_]/.test(expression[index])) {
        name += expression[index]
        index += 1
      }
      tokens.push({ type: 'variable', value: name.toUpperCase() })
      continue
    }

    if ('+-*/()'.includes(char)) {
      tokens.push({ type: char })
      index += 1
      continue
    }

    throw new Error(`公式里有不支持的字符：${char}`)
  }

  return tokens
}

function toRpn(tokens) {
  const output = []
  const stack = []

  tokens.forEach((token, position) => {
    if (token.type === 'number' || token.type === 'variable') {
      output.push(token)
      return
    }

    if (token.type === '(') {
      stack.push(token)
      return
    }

    if (token.type === ')') {
      while (stack.length && stack[stack.length - 1].type !== '(') {
        output.push(stack.pop())
      }
      if (!stack.length) {
        throw new Error('公式里的括号不匹配')
      }
      stack.pop()
      return
    }

    // + - * /
    const previous = tokens[position - 1]
    const isUnaryMinus =
      token.type === '-' &&
      (!previous || previous.type === '(' || previous.type in OPERATORS)

    if (isUnaryMinus) {
      stack.push({ type: UNARY })
      return
    }

    const current = OPERATORS[token.type]
    while (stack.length) {
      const top = stack[stack.length - 1]
      if (top.type === '(') break
      const isUnary = top.type === UNARY
      const topPrecedence = isUnary ? 3 : OPERATORS[top.type].precedence
      const shouldPop =
        topPrecedence > current.precedence ||
        (topPrecedence === current.precedence && current.assoc === 'left')
      if (!shouldPop) break
      output.push(stack.pop())
    }
    stack.push(token)
  })

  while (stack.length) {
    const top = stack.pop()
    if (top.type === '(') {
      throw new Error('公式里的括号不匹配')
    }
    output.push(top)
  }

  return output
}

/**
 * @param {string} expression 形如 'Q1 + Q2 * 0.3'
 * @param {Record<string, number>} variables 形如 { Q1: 3, Q2: 4 }
 * @returns {number} 计算结果；无法计算时抛错
 */
export function evaluateFormula(expression, variables = {}) {
  if (!expression || !String(expression).trim()) {
    throw new Error('公式为空')
  }

  const rpn = toRpn(tokenize(String(expression)))
  const stack = []

  rpn.forEach((token) => {
    if (token.type === 'number') {
      stack.push(token.value)
      return
    }
    if (token.type === 'variable') {
      const value = Number(variables[token.value])
      stack.push(Number.isFinite(value) ? value : 0)
      return
    }
    if (token.type === UNARY) {
      const operand = stack.pop()
      stack.push(-Number(operand || 0))
      return
    }
    const right = stack.pop()
    const left = stack.pop()
    if (left === undefined || right === undefined) {
      throw new Error('公式不完整')
    }
    stack.push(OPERATORS[token.type].calc(Number(left), Number(right)))
  })

  if (stack.length !== 1) {
    throw new Error('公式不完整')
  }

  return stack[0]
}

/** 校验公式（编辑器里做即时提示用） */
export function validateFormula(expression) {
  try {
    evaluateFormula(expression, {})
    return ''
  } catch (error) {
    return error?.message || '公式有误'
  }
}

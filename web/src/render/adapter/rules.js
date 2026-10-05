import {
  forEach as _forEach,
  get as _get,
  isArray as _isArray,
  keys as _keys,
  set as _set
} from 'lodash-es'
import { INPUT, RATES, OBJECT_VALUE_TYPES, QUESTION_TYPE } from '@/common/typeEnum.ts'
import { regexpMap } from '@/common/regexpMap.ts'

const msgMap = {
  '*': '必填',
  m: '请输入手机号',
  idcard: '请输入正确的身份证号码',
  strictIdcard: '请输入正确的身份证号码',
  n: '请输入数字',
  nd: '请输入数字',
  e: '请输入邮箱',
  licensePlate: '请输入车牌号'
}
const checkBoxTip = '至少选择#min#项，少选择了#less#项'
const checkBoxTipSame = '请选择#min#项，少选择了#less#项'
const textRangeMinTip = '至少输入#min#字'
const numberRangeMinTip = '数字最小为#min#'
const numberRangeMaxTip = '数字最大为#max#'

// 多选题的选项数目限制
export function optionValidator(value, minNum, maxNum) {
  let tip = minNum === maxNum ? checkBoxTipSame : checkBoxTip
  if (_isArray(value) && value.length < minNum) {
    const less = minNum - value.length
    tip = tip.replace(/#min#/g, minNum)
    tip = tip.replace(/#less#/g, less)
    return tip
  }
  return ''
}

// textarea最小字数检验
export function textAreaValidator(isRequired, value, textRangeMin) {
  let tip = textRangeMinTip
  if (value && value.length < parseInt(textRangeMin)) {
    tip = tip.replace(/#min#/g, textRangeMin)
    return tip
  }
  return ''
}

// 数字类的输入框，配置了最小值的，要对数值做校验
export function numberMinValidator(value, numberRangeMin) {
  let tip = numberRangeMinTip
  if (Number(value) < Number(numberRangeMin)) {
    tip = tip.replace(/#min#/g, numberRangeMin)
    return tip
  }
  return ''
}
// 数字类的输入框，配置了最大值的，要对数值做校验
export function numberMaxValidator(value, numberRangeMax) {
  let tip = numberRangeMaxTip
  if (Number(value) > Number(numberRangeMax)) {
    tip = tip.replace(/#max#/g, numberRangeMax)
    return tip
  }
  return ''
}

// 根据提醒和题目的配置，生成本题的校验规则
export function generateValidArr(
  isRequired,
  valid,
  minNum,
  textRangeMin,
  type,
  numberRangeMin,
  numberRangeMax
) {
  const validArr = []
  const isInput = INPUT.indexOf(type) !== -1
  if (isRequired || valid === '*') {
    // 输入框的必填校验做trim
    if (!isInput) {
      validArr.push({
        required: true,
        message: '此项未填，请填写完整'
        // trigger: 'change|blur'
      })
    } else {
      validArr.push({
        required: true,
        validator(rule, value, callback) {
          let errors = []
          let tip = ''
          if (value === '' || value?.replace(/\s*/, '') === '') {
            tip = '此项未填，请填写完整'
          }
          if (tip) {
            errors = [tip]
          }
          callback(errors)
        }
        // trigger: 'change|blur'
      })
    }
  }
  if (regexpMap[valid]) {
    validArr.push({
      validator(rule, value, callback) {
        let errors = []
        let tip = ''
        if (!regexpMap[valid].test(value)) {
          tip = msgMap[valid]
        }
        if (value === '') {
          tip = ''
        }
        if (tip) {
          errors = [tip]
        }
        callback(errors)
      }
      // trigger: 'change|blur'
    })
  }

  if (minNum) {
    validArr.unshift({
      validator(rule, value, callback) {
        let errors = []
        const tip = optionValidator(value, minNum)
        if (tip) {
          errors = [tip]
        }
        callback(errors)
      }
      // trigger: 'change|blur'
    })
  }

  if (textRangeMin) {
    validArr.push({
      validator(rule, value, callback) {
        let errors = []
        const tip = textAreaValidator(isRequired, value, textRangeMin)
        if (tip) {
          errors = [tip]
        }
        callback(errors)
      }
      // trigger: 'change|blur'
    })
  }

  if (isInput && valid === 'n' && numberRangeMin) {
    validArr.push({
      validator(rule, value, callback) {
        let errors = []
        const tip = numberMinValidator(value, numberRangeMin)
        if (tip) {
          errors = [tip]
        }
        callback(errors)
      }
      // trigger: 'change|blur'
    })
  }

  if (isInput && valid === 'n' && numberRangeMax) {
    validArr.push({
      validator(rule, value, callback) {
        let errors = []
        const tip = numberMaxValidator(value, numberRangeMax)
        if (tip) {
          errors = [tip]
        }
        callback(errors)
      }
      // trigger: 'change|blur'
    })
  }

  return validArr
}

// 生成选择类或者评分类的题目的更多输入框
const generateOthersKeyMap = (question) => {
  const { type, field } = question
  let othersKeyMap = undefined

  if (RATES.includes(type)) {
    const { rangeConfig } = question
    othersKeyMap = {}
    for (const key in rangeConfig) {
      if (rangeConfig[key].isShowInput) {
        othersKeyMap[`${field}_${key}`] = key
      }
    }
  } else if (type?.includes(QUESTION_TYPE.RADIO) || type?.includes(QUESTION_TYPE.CHECKBOX)) {
    const { options } = question
    othersKeyMap = {}
    options
      .filter((op) => op.others)
      .forEach((option) => {
        othersKeyMap[`${field}_${option.hash}`] = option.text
      })
  }
  return othersKeyMap
}

// 各「值为对象」的题型的必填判定：通用 required 判定不出"空对象"，只能逐题判断
const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})

const objectRequiredValidators = {
  [QUESTION_TYPE.MATRIX_RADIO](question) {
    return (value) => {
      const rows = _get(question, 'matrixRows', []) || []
      const answered = asObject(value)
      return rows.filter((row) => !answered[row.hash]).length
    }
  },
  [QUESTION_TYPE.MATRIX_SCALE](question) {
    return (value) => {
      const rows = _get(question, 'matrixRows', []) || []
      const answered = asObject(value)
      return rows.filter((row) => !answered[row.hash]).length
    }
  },
  [QUESTION_TYPE.MATRIX_CHECKBOX](question) {
    return (value) => {
      const rows = _get(question, 'matrixRows', []) || []
      const answered = asObject(value)
      return rows.filter((row) => {
        const picked = answered[row.hash]
        return !Array.isArray(picked) || picked.length === 0
      }).length
    }
  },
  [QUESTION_TYPE.MATRIX_INPUT](question) {
    return (value) => {
      const rows = _get(question, 'matrixRows', []) || []
      const answered = asObject(value)
      return rows.filter((row) => {
        const rowValue = answered[row.hash]
        if (!rowValue || typeof rowValue !== 'object') return true
        return !Object.keys(rowValue).some((key) => String(rowValue[key] ?? '').trim())
      }).length
    }
  },
  [QUESTION_TYPE.MULTI_FILL](question) {
    return (value) => {
      const blanks = _get(question, 'fillBlanks', []) || []
      const answered = asObject(value)
      return blanks.filter((blank) => !String(answered[blank.hash] ?? '').trim()).length
    }
  },
  [QUESTION_TYPE.PROPORTION](question) {
    return (value) => {
      const options = _get(question, 'options', []) || []
      const answered = asObject(value)
      const filled = options.filter((option) => String(answered[option.hash] ?? '').trim() !== '')
      return filled.length > 0 ? 0 : 1
    }
  }
}

const objectRequiredMessages = {
  [QUESTION_TYPE.MATRIX_RADIO]: (missing) => `还有 ${missing} 行未选择，请填写完整`,
  [QUESTION_TYPE.MATRIX_SCALE]: (missing) => `还有 ${missing} 行未选择，请填写完整`,
  [QUESTION_TYPE.MATRIX_CHECKBOX]: (missing) => `还有 ${missing} 行未选择，请填写完整`,
  [QUESTION_TYPE.MATRIX_INPUT]: (missing) => `还有 ${missing} 行未填写，请填写完整`,
  [QUESTION_TYPE.MULTI_FILL]: (missing) => `还有 ${missing} 项未填写，请填写完整`,
  [QUESTION_TYPE.PROPORTION]: () => '请为各项分配比重'
}

// 比重题：填了值就必须合计等于目标值
const proportionSumValidator = (question) => ({
  validator(rule, value, callback) {
    const options = _get(question, 'options', []) || []
    const total = Number(_get(question, 'total', 100)) || 100
    const answered = asObject(value)
    const touched = options.some((option) => String(answered[option.hash] ?? '').trim() !== '')
    if (!touched) {
      callback([])
      return
    }
    const sum = options.reduce((acc, option) => acc + (Number(answered[option.hash]) || 0), 0)
    callback(sum === total ? [] : [`各项之和需为 ${total}，当前为 ${sum}`])
  }
})

// 生成所有题目的校验规则
export default function (questionConfig) {
  const dataList = _get(questionConfig, 'dataConf.dataList')
  const rules = dataList.reduce((pre, current) => {
    const {
      field,
      valid,
      minNum,
      // othersKeyMap,
      type,
      options,
      isRequired,
      textRange,
      numberRange,
      rangeConfig
    } = current
    const othersKeyMap = generateOthersKeyMap(current)
    // 说明题与计算题不参与校验
    if (valid === '0' || /mobileHidden|section|hidden/.test(type) || type === QUESTION_TYPE.CALCULATION) {
      return pre
    }

    let validMap = {}
    const textRangeMin = _get(textRange, 'min.value')
    const numberRangeMin = _get(numberRange, 'min.value')
    const numberRangeMax = _get(numberRange, 'max.value')

    const validArr = generateValidArr(
      isRequired,
      valid,
      minNum,
      textRangeMin,
      type,
      numberRangeMin,
      numberRangeMax
    )

    // 值为对象的题型（矩阵 / 多项填空 / 比重）：通用 required 判定不出"空对象"，
    // 换成按题型逐个判断（矩阵逐行、填空逐空、比重看是否分配过）
    if (OBJECT_VALUE_TYPES.includes(type)) {
      const objectRules = validArr.filter((rule) => !rule.required)
      const missingCounter = objectRequiredValidators[type]
      if ((isRequired || valid === '*') && missingCounter) {
        objectRules.unshift({
          validator(rule, value, callback) {
            const missing = missingCounter(current)(value)
            callback(missing > 0 ? [objectRequiredMessages[type](missing)] : [])
          }
        })
      }
      if (type === QUESTION_TYPE.PROPORTION) {
        objectRules.push(proportionSumValidator(current))
      }
      validArr.length = 0
      validArr.push(...objectRules)
    }

    validMap = { [field]: validArr }

    // 对于选择题支持填写更多信息的，需要做是否必填的校验
    if (_keys(othersKeyMap).length) {
      if (RATES.includes(type)) {
        if (rangeConfig) {
          for (const key in rangeConfig) {
            if (rangeConfig[key].isShowInput && rangeConfig[key].required) {
              _set(validMap, `${field}_${key}`, generateValidArr(true, ''))
            }
          }
        }
      } else {
        _forEach(options, (item) => {
          const othersKey = `${field}_${item.hash}`
          const { mustOthers } = item
          if (mustOthers) {
            _set(validMap, othersKey, generateValidArr(true, ''))
          }
        })
      }
    }
    return Object.assign(validMap, pre)
  }, {})
  return { rules }
}

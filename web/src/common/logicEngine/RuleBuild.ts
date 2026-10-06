import { nanoid } from 'nanoid'
import * as yup from 'yup'
import { type FieldTypes, PrefixID, Operator, Scope } from './BasicType'

export function generateID(prefix = PrefixID.Rule) {
  return `${prefix}-${nanoid(5)}`
}
// 定义条件规则类
export class ConditionNode {
  id: string = ''
  public field: string = ''
  public operator: Operator = Operator.Include
  public value: FieldTypes = []
  constructor(field: string = '', operator: Operator = Operator.Include, value: FieldTypes = []) {
    this.field = field
    this.operator = operator
    this.value = value
    this.id = generateID(PrefixID.Condition)
  }
  setField(field: string) {
    this.field = field
  }
  setOperator(operator: Operator) {
    this.operator = operator
  }
  setValue(value: FieldTypes) {
    this.value = value
  }
}

export class RuleNode {
  id: string = ''
  conditions: ConditionNode[] = []
  scope: string = Scope.Question
  target: string = ''
  /**
   * 批量应用分组：同一条条件的多个目标题属于同一组，编辑器里合并成一张卡片。
   * 仅用于编辑态，toJson() 不输出 —— 落库后是独立规则，答题端无需知道分组。
   */
  groupId: string = ''
  constructor(
    target: string = '',
    scope: string = Scope.Question,
    id?: string,
    groupId?: string
  ) {
    this.id = id || generateID(PrefixID.Rule)
    this.scope = scope
    this.target = target
    this.groupId = groupId || `g-${nanoid(5)}`
  }
  setTarget(value: string) {
    this.target = value
  }
  addCondition(condition: ConditionNode) {
    this.conditions.push(condition)
  }
  removeCondition(id: string) {
    this.conditions = this.conditions.filter((v) => v.id !== id)
  }
  findCondition(conditionId: string) {
    return this.conditions.find((condition) => condition.id === conditionId)
  }
}

export class RuleBuild {
  rules: RuleNode[] = []
  constructor() {
    this.rules = []
  }

  // 添加条件规则到规则引擎中
  addRule(rule: RuleNode) {
    this.rules.push(rule)
  }
  removeRule(ruleId: string) {
    const target = this.rules.find((rule) => rule.id === ruleId)
    if (target?.groupId) {
      // 批量应用的规则整组一起删
      this.rules = this.rules.filter(
        (rule) => rule.groupId !== target.groupId,
      )
      return
    }
    this.rules = this.rules.filter((rule) => rule.id !== ruleId)
  }

  /** 取同一批量分组下的所有目标题 */
  findTargetsByGroup(groupId: string) {
    return this.rules
      .filter((rule) => rule.groupId === groupId)
      .map((rule) => rule.target)
  }

  /**
   * 把某条规则的目标批量设为 targets。
   * 首条复用原规则 id（保持 UI 引用稳定），其余新建同组规则、复制同一套条件。
   */
  setGroupTargets(ruleId: string, targets: string[]) {
    const head = this.rules.find((rule) => rule.id === ruleId)
    if (!head) {
      return
    }
    const groupId = head.groupId
    const baseConditions = head.conditions
    this.rules = this.rules.filter((rule) => rule.groupId !== groupId)
    targets.forEach((target, index) => {
      const node = new RuleNode(
        target,
        Scope.Question,
        index === 0 ? head.id : undefined,
        groupId,
      )
      baseConditions.forEach((condition) => {
        node.addCondition(
          new ConditionNode(
            condition.field,
            condition.operator,
            condition.value,
          ),
        )
      })
      this.rules.push(node)
    })
  }
  clear() {
    this.rules = []
  }
  findRule(ruleId: string) {
    return this.rules.find((rule) => rule.id === ruleId)
  }
  toJson() {
    return this.rules.map((rule) => {
      return {
        target: rule.target,
        scope: rule.scope,
        conditions: rule.conditions.map((condition) => {
          return {
            field: condition.field,
            operator: condition.operator,
            value: condition.value
          }
        })
      }
    })
  }
  fromJson(ruleConf: any) {
    this.rules = []
    if (ruleConf instanceof Array) {
      ruleConf.forEach((rule: any) => {
        const { scope, target } = rule
        const ruleNode = new RuleNode(target, scope)
        rule.conditions.forEach((condition: any) => {
          const { field, operator, value } = condition
          const conditionNode = new ConditionNode(field, operator, value)
          ruleNode.addCondition(conditionNode)
        })
        this.addRule(ruleNode)
      })
    }
    return this
  }
  validateSchema() {
    return ruleSchema.validateSync(this.toJson())
  }
  // 实现目标选择了下拉框置灰效果
  findTargetsByScope(scope: string) {
    return this.rules.filter((rule) => rule.scope === scope).map((rule) => rule.target)
  }
  findRulesByField(field: string) {
    return this.rules.filter((rule) => {
      return rule.conditions.filter((condition) => condition.field === field).length
    })
  }
  // 实现前置题删除校验
  findTargetsByField(field: string) {
    const nodes = this.findRulesByField(field)
    return nodes.map((item: any) => {
      return item.target
    })
  }
  // 根据目标题获取关联的逻辑条件
  findConditionByTarget(target: string) {
    return this.rules.filter((rule) => rule.target === target).map((item) => item.conditions)
  }
}

export const ruleSchema = yup.array().of(
  yup.object({
    target: yup.string().required(),
    scope: yup.string().required(),
    conditions: yup.array().of(
      yup.object({
        field: yup.string().required(),
        operator: yup.string().required(),
        value: yup.array().of(yup.string().required())
      })
    )
  })
)

<template>
  <div class="exam-panel">
    <div class="exam-panel__head">
      <span class="exam-panel__label">考试模式</span>
      <el-switch v-model="examMode" @change="onModeChange" />
      <el-tooltip
        placement="top"
        content="开启后，答题端提交时会按每题的标准答案自动判分，成绩会存入答卷并在「答卷管理」中展示"
      >
        <i-ep-question-filled class="exam-panel__help" />
      </el-tooltip>
      <template v-if="examMode">
        <span class="exam-panel__label exam-panel__label--gap">及格分</span>
        <el-input-number v-model="passScore" :min="0" :step="1" size="small" @change="onPassChange" />
        <span class="exam-panel__total">
          满分 <b>{{ fullScore }}</b> 分 · 共 <b>{{ gradableList.length }}</b> 道可判分题
        </span>
      </template>
    </div>

    <div v-if="examMode" class="exam-table">
      <div class="exam-table__head">
        <span class="col col--index">#</span>
        <span class="col col--title">题目</span>
        <span class="col col--answer">标准答案</span>
        <span class="col col--score">分值</span>
      </div>

      <div v-for="(item, index) in gradableList" :key="item.field" class="exam-table__row">
        <span class="col col--index">{{ index + 1 }}</span>
        <span class="col col--title" :title="plainTitle(item.title)">
          {{ plainTitle(item.title) }}
          <em class="exam-table__type">{{ typeLabel(item.type) }}</em>
        </span>
        <span class="col col--answer">
          <!-- 选项类：多选选项 hash -->
          <el-select
            v-if="optionTypes.includes(item.type)"
            :model-value="answerOf(item)"
            multiple
            collapse-tags
            collapse-tags-tooltip
            size="small"
            placeholder="选择正确答案"
            @change="(val) => setAnswer(item, val)"
          >
            <el-option
              v-for="opt in item.options || []"
              :key="opt.hash"
              :label="opt.text"
              :value="opt.hash"
            />
          </el-select>
          <!-- 文本类：直接填答案 -->
          <el-input
            v-else
            :model-value="textAnswerOf(item)"
            size="small"
            placeholder="填写标准答案（完全匹配）"
            @change="(val) => setAnswer(item, val)"
          />
        </span>
        <span class="col col--score">
          <el-input-number
            :model-value="scoreOf(item)"
            :min="0"
            :step="1"
            size="small"
            controls-position="right"
            @change="(val) => setScore(item, val)"
          />
        </span>
      </div>

      <div v-if="!gradableList.length" class="exam-table__empty">
        当前问卷没有可判分的题目（支持单选/多选/判断/下拉/图片题/排序/填空）
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/switch.scss'
import 'element-plus/theme-chalk/src/tooltip.scss'
import { useEditStore } from '@/management/stores/edit'
import { QUESTION_TYPE } from '@/common/typeEnum.ts'
import { cleanRichText } from '@/common/xss'

const editStore = useEditStore()
const schema = computed(() => editStore.schema)

/** 能配置标准答案的题型（与服务端 utils/exam.ts 的 gradable 保持一致） */
const optionTypes = [
  QUESTION_TYPE.RADIO,
  QUESTION_TYPE.CHECKBOX,
  QUESTION_TYPE.BINARY_CHOICE,
  QUESTION_TYPE.VOTE,
  QUESTION_TYPE.SELECT,
  QUESTION_TYPE.IMAGE_RADIO,
  QUESTION_TYPE.IMAGE_CHECKBOX,
  QUESTION_TYPE.SORT
]
const textTypes = [QUESTION_TYPE.TEXT, QUESTION_TYPE.TEXTAREA]

const TYPE_LABELS = {
  [QUESTION_TYPE.RADIO]: '单选',
  [QUESTION_TYPE.CHECKBOX]: '多选',
  [QUESTION_TYPE.BINARY_CHOICE]: '判断',
  [QUESTION_TYPE.VOTE]: '投票',
  [QUESTION_TYPE.SELECT]: '下拉',
  [QUESTION_TYPE.IMAGE_RADIO]: '图片单选',
  [QUESTION_TYPE.IMAGE_CHECKBOX]: '图片多选',
  [QUESTION_TYPE.SORT]: '排序',
  [QUESTION_TYPE.TEXT]: '填空',
  [QUESTION_TYPE.TEXTAREA]: '多行填空'
}

const examMode = ref(Boolean(schema.value?.baseConf?.examMode))
const passScore = ref(Number(schema.value?.baseConf?.examPassScore) || 0)

const gradableList = computed(() => {
  const list = schema.value?.questionDataList || []
  return list.filter((item) => {
    if (optionTypes.includes(item.type)) {
      return (item.options || []).length > 0
    }
    return textTypes.includes(item.type)
  })
})

const fullScore = computed(() =>
  gradableList.value.reduce((sum, item) => sum + (Number(item.examScore) || 1), 0)
)

const typeLabel = (type) => TYPE_LABELS[type] || type

const plainTitle = (title) => cleanRichText(title || '').slice(0, 40)

function answerOf(item) {
  const answer = item.examAnswer
  if (Array.isArray(answer)) {
    return answer
  }
  return answer ? [answer] : []
}

function textAnswerOf(item) {
  const answer = item.examAnswer
  if (Array.isArray(answer)) {
    return answer[0] || ''
  }
  return answer || ''
}

function scoreOf(item) {
  const n = Number(item.examScore)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/** 直接改题目对象（questionDataList 是 schema 上的数组，改动会被 buildData 带出去） */
/** 选项类存 hash 数组，文本类存字符串 —— 与服务端 utils/exam.ts 的判分方式对应 */
function setAnswer(item, value) {
  item.examAnswer = Array.isArray(value) ? value : String(value ?? '').trim()
  if (!item.examScore) {
    item.examScore = 1
  }
  editStore.changeSchema({
    key: 'questionDataList',
    value: [...(schema.value?.questionDataList || [])]
  })
}

function setScore(item, value) {
  item.examScore = Number(value) || 1
  editStore.changeSchema({
    key: 'questionDataList',
    value: [...(schema.value?.questionDataList || [])]
  })
}

function onModeChange(val) {
  editStore.changeSchema({ key: 'baseConf.examMode', value: Boolean(val) })
  if (val && !gradableList.value.length) {
    ElMessage.warning('当前问卷没有可判分的题目')
  }
}

function onPassChange(val) {
  editStore.changeSchema({ key: 'baseConf.examPassScore', value: Number(val) || 0 })
}

watch(
  () => schema.value?.metaData?._id,
  () => {
    examMode.value = Boolean(schema.value?.baseConf?.examMode)
    passScore.value = Number(schema.value?.baseConf?.examPassScore) || 0
  }
)
</script>

<style lang="scss" scoped>
.exam-panel {
  width: 100%;
  padding: 4px 0 12px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #6e707c;
  }

  &__label {
    color: #444466;
    font-weight: 500;

    &--gap {
      margin-left: 16px;
    }
  }

  &__help {
    color: #a8aab5;
    cursor: help;
  }

  &__total {
    margin-left: 16px;
    color: #92949d;

    b {
      color: #2fa596;
    }
  }
}

.exam-table {
  border: 1px solid #e6e9f2;
  border-radius: 8px;
  overflow: hidden;

  &__head,
  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
  }

  &__head {
    background: #f7f9fb;
    font-size: 12px;
    color: #92949d;
    font-weight: 500;
  }

  &__row {
    border-top: 1px solid #eef1f6;
    font-size: 13px;
    color: #444466;

    &:hover {
      background: #fafbfe;
    }
  }

  &__type {
    margin-left: 6px;
    font-style: normal;
    font-size: 11px;
    color: #92949d;
    background: #eef1f6;
    border-radius: 3px;
    padding: 0 5px;
  }

  &__empty {
    padding: 24px;
    text-align: center;
    color: #a8aab5;
    font-size: 13px;
  }

  .col {
    &--index {
      flex: none;
      width: 32px;
      color: #92949d;
    }

    &--title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &--answer {
      flex: none;
      width: 320px;
    }

    &--score {
      flex: none;
      width: 130px;
    }
  }
}
</style>

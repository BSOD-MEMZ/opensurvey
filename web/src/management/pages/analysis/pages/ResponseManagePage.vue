<template>
  <div class="response-manage-page">
    <!-- 概览 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-card__label">回收总量</div>
        <div class="stat-card__value">{{ overview.total }}<span class="unit">份</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">今日新增</div>
        <div class="stat-card__value">{{ overview.todayTotal }}<span class="unit">份</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">平均用时</div>
        <div class="stat-card__value">{{ overview.avgDuration }}<span class="unit">秒</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">最近提交</div>
        <div class="stat-card__value stat-card__value--time">{{ formatTime(overview.lastSubmitAt) }}</div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar__row">
        <span class="toolbar__label">筛选</span>
        <el-select
          v-model="filterForm.field"
          class="filter-field"
          placeholder="选择题目"
          @change="onFilterFieldChange"
        >
          <el-option
            v-for="q in filterableQuestions"
            :key="q.field"
            :label="q.title"
            :value="q.field"
          />
        </el-select>
        <el-select
          v-model="filterForm.values"
          class="filter-values"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择选项"
          :disabled="!filterForm.field"
        >
          <el-option
            v-for="opt in filterOptions"
            :key="opt.hash"
            :label="opt.text"
            :value="opt.hash"
          />
        </el-select>
        <el-button type="primary" plain :disabled="!canAddFilter" @click="addFilter">
          添加条件
        </el-button>
        <div class="toolbar__spacer"></div>
        <el-input
          v-model="keyword"
          class="keyword-input"
          placeholder="搜索答案内容"
          clearable
          @keyup.enter="reload(1)"
        />
        <el-checkbox v-model="onlySuspicious" @change="reload(1)">只看可疑答卷</el-checkbox>
        <el-button @click="reload(1)">刷新</el-button>
      </div>

      <div v-if="filters.length" class="toolbar__row toolbar__row--tags">
        <span class="toolbar__label">条件</span>
        <el-tag
          v-for="(f, idx) in filters"
          :key="idx"
          class="filter-tag"
          closable
          @close="removeFilter(idx)"
        >
          {{ filterText(f) }}
        </el-tag>
        <el-button link type="danger" @click="clearFilters">清空全部</el-button>
      </div>
    </div>

    <!-- 批量操作条 -->
    <div v-if="selectedIds.length" class="batch-bar">
      <span>已选 <b>{{ selectedIds.length }}</b> 份答卷</span>
      <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
      <el-button size="small" @click="clearSelection">取消选择</el-button>
    </div>

    <!-- 列表 -->
    <div v-if="loading" class="loading-box" v-loading="loading" element-loading-text="加载中"></div>
    <template v-else-if="rows.length">
      <el-table
        ref="tableRef"
        :data="rows"
        class="response-table"
        row-key="id"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column label="#" width="60">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="用时" width="90">
          <template #default="{ row }">
            <span :class="{ 'warn-text': row.diffTime < 30 }">{{ row.diffTime }}s</span>
          </template>
        </el-table-column>
        <el-table-column label="作答" width="80">
          <template #default="{ row }">{{ row.answerCount }} 题</template>
        </el-table-column>
        <el-table-column label="答案摘要" min-width="300">
          <template #default="{ row }">
            <div v-if="row.preview.length" class="preview">
              <div v-for="p in row.preview" :key="p.field" class="preview__item">
                <span class="preview__q">{{ p.title }}</span>
                <span class="preview__a">{{ p.text || '（空）' }}</span>
              </div>
            </div>
            <span v-else class="muted">（未作答）</span>
          </template>
        </el-table-column>
        <el-table-column label="质量" width="190">
          <template #default="{ row }">
            <el-tag
              v-for="f in row.flags"
              :key="f.code"
              class="flag-tag"
              type="warning"
              effect="light"
              size="small"
            >
              {{ f.label }}
            </el-tag>
            <span v-if="!row.flags.length" class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @current-change="reload"
      />
    </template>
    <EmptyIndex v-else :data="emptyConfig" />

    <!-- 详情 -->
    <el-dialog v-model="detailVisible" title="答卷详情" width="720px" top="6vh">
      <div v-if="detail" class="detail">
        <div class="detail__meta">
          <span>提交时间：{{ formatTime(detail.createdAt) }}</span>
          <span>用时：{{ detail.diffTime }} 秒</span>
          <span>作答：{{ detail.items.filter((i) => i.answered).length }} / {{ detail.items.length }} 题</span>
        </div>
        <el-alert
          v-if="detail.flags.length"
          class="detail__alert"
          type="warning"
          :closable="false"
          show-icon
          :title="detail.flags.map((f) => f.label + '：' + f.detail).join('；')"
        />
        <div class="detail__list">
          <div
            v-for="(item, idx) in detail.items"
            :key="item.field"
            class="detail__item"
            :class="{ 'is-empty': !item.answered }"
          >
            <div class="detail__title">
              <span class="detail__index">{{ idx + 1 }}.</span>
              <span v-html="cleanTitle(item.title)"></span>
              <span class="detail__type">{{ item.type }}</span>
              <span v-if="item.isRequired" class="detail__required">*</span>
            </div>
            <div class="detail__answer">{{ item.text || '（未作答）' }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, toRefs } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/tag.scss'
import 'element-plus/theme-chalk/src/alert.scss'
import EmptyIndex from '@/management/components/EmptyIndex.vue'
import { getSurveyById } from '@/management/api/survey'
import {
  deleteResponses,
  getResponseDetail,
  getResponseList,
  getResponseOverview
} from '@/management/api/analysis'

const route = useRoute()
const surveyId = route.params.id

const emptyConfig = {
  title: '暂无答卷',
  desc: '这份问卷还没有收到答卷，去投放页分享出去吧！',
  img: '/imgs/icons/analysis-empty.webp'
}

const state = reactive({
  loading: false,
  rows: [],
  total: 0,
  currentPage: 1,
  pageSize: 10,
  keyword: '',
  onlySuspicious: false,
  filters: [],
  overview: {
    total: 0,
    todayTotal: 0,
    avgDuration: 0,
    lastSubmitAt: null
  },
  questions: []
})
const {
  loading,
  rows,
  total,
  currentPage,
  pageSize,
  keyword,
  onlySuspicious,
  filters,
  overview,
  questions
} = toRefs(state)

const filterForm = reactive({ field: '', values: [] })
const selectedIds = ref([])
const tableRef = ref(null)
const detailVisible = ref(false)
const detail = ref(null)

/** 能作为筛选条件的题：有选项的题 */
const filterableQuestions = computed(() =>
  state.questions.filter((q) => Array.isArray(q.options) && q.options.length)
)

const filterOptions = computed(() => {
  const q = state.questions.find((item) => item.field === filterForm.field)
  return q?.options || []
})

const canAddFilter = computed(
  () => filterForm.field && filterForm.values.length > 0
)

function fieldTitle(field) {
  return state.questions.find((q) => q.field === field)?.title || field
}

function optionText(field, hash) {
  const q = state.questions.find((item) => item.field === field)
  return q?.options?.find((o) => o.hash === hash)?.text || hash
}

/** 筛选条件展示文案：题目：选项1、选项2 */
function filterText(f) {
  const texts = f.values.map((hash) => optionText(f.field, hash)).join('、')
  return `${fieldTitle(f.field)}：${texts}`
}

function onFilterFieldChange() {
  filterForm.values = []
}

function addFilter() {
  if (!canAddFilter.value) {
    return
  }
  const exist = state.filters.find((f) => f.field === filterForm.field)
  if (exist) {
    exist.values = Array.from(new Set([...exist.values, ...filterForm.values]))
  } else {
    state.filters.push({
      field: filterForm.field,
      values: [...filterForm.values]
    })
  }
  filterForm.field = ''
  filterForm.values = []
  reload(1)
}

function removeFilter(idx) {
  state.filters.splice(idx, 1)
  reload(1)
}

function clearFilters() {
  state.filters = []
  reload(1)
}

function onSelectionChange(selection) {
  selectedIds.value = selection.map((item) => item.id)
}

function clearSelection() {
  tableRef.value?.clearSelection()
  selectedIds.value = []
}

function formatTime(value) {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 题干里可能带富文本标签，列表里去掉标签只留文字 */
function cleanTitle(title) {
  if (!title) {
    return ''
  }
  return String(title)
    .replace(/<[^>]+>/g, '')
    .slice(0, 120)
}

async function loadOverview() {
  const res = await getResponseOverview({ surveyId })
  if (res?.code === 200) {
    state.overview = { ...state.overview, ...res.data }
  }
}

async function loadQuestions() {
  try {
    const res = await getSurveyById(surveyId)
    const dataList = res?.data?.surveyConfRes?.code?.dataConf?.dataList || []
    state.questions = dataList
  } catch (e) {
    state.questions = []
  }
}

async function reload(page = state.currentPage) {
  state.currentPage = page
  state.loading = true
  try {
    const params = {
      surveyId,
      page,
      pageSize: state.pageSize,
      onlySuspicious: state.onlySuspicious
    }
    if (state.keyword) {
      params.keyword = state.keyword
    }
    if (state.filters.length) {
      params.filters = JSON.stringify(state.filters)
    }
    const res = await getResponseList(params)
    if (res?.code === 200) {
      state.rows = res.data.list || []
      state.total = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('加载答卷失败')
  } finally {
    state.loading = false
  }
}

async function openDetail(row) {
  detailVisible.value = true
  detail.value = null
  const res = await getResponseDetail({ surveyId, id: row.id })
  if (res?.code === 200) {
    detail.value = res.data
  } else {
    ElMessage.error('加载详情失败')
    detailVisible.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      '删除后该答卷将不再出现在统计与导出中，确定删除？',
      '删除答卷',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  const res = await deleteResponses({ surveyId, ids: [row.id] })
  if (res?.code === 200) {
    ElMessage.success(`已删除 ${res.data?.deleted ?? 0} 份`)
    await Promise.all([reload(), loadOverview()])
  } else {
    ElMessage.error('删除失败')
  }
}

async function handleBatchDelete() {
  const ids = [...selectedIds.value]
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${ids.length} 份答卷？删除后不计入统计与导出。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  const res = await deleteResponses({ surveyId, ids })
  if (res?.code === 200) {
    ElMessage.success(`已删除 ${res.data?.deleted ?? 0} 份`)
    clearSelection()
    await Promise.all([reload(1), loadOverview()])
  } else {
    ElMessage.error('删除失败')
  }
}

onMounted(async () => {
  await loadQuestions()
  await Promise.all([reload(1), loadOverview()])
})
</script>

<style lang="scss" scoped>
.response-manage-page {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  flex: none;

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgb(68 68 102 / 8%);

    &__label {
      font-size: 13px;
      color: #92949d;
      margin-bottom: 8px;
    }

    &__value {
      font-size: 26px;
      font-weight: 700;
      color: #444466;
      line-height: 1.2;

      &--time {
        font-size: 16px;
        font-weight: 500;
      }

      .unit {
        font-size: 13px;
        font-weight: 400;
        color: #92949d;
        margin-left: 4px;
      }
    }
  }
}

.toolbar {
  flex: none;
  background: #fff;
  border-radius: 8px;
  padding: 14px 20px 10px;
  box-shadow: 0 1px 3px rgb(68 68 102 / 8%);

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;

    &--tags {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #e6e9f2;
      flex-wrap: wrap;
    }
  }

  &__label {
    font-size: 13px;
    color: #92949d;
    flex: none;
  }

  &__spacer {
    flex: auto;
  }

  .filter-field {
    width: 200px;
  }

  .filter-values {
    width: 280px;
  }

  .keyword-input {
    width: 200px;
  }
}

.batch-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: #eafcf9;
  border: 1px solid #b8ece4;
  border-radius: 8px;
  font-size: 13px;
  color: #2fa596;
}

.loading-box {
  height: 240px;
}

.response-table {
  flex: none;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.preview {
  &__item {
    display: flex;
    gap: 8px;
    line-height: 20px;
    font-size: 13px;
  }

  &__q {
    color: #92949d;
    flex: none;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__a {
    color: #444466;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.flag-tag {
  margin-right: 4px;
}

.warn-text {
  color: #e6a23c;
  font-weight: 600;
}

.muted {
  color: #c8c9cd;
}

.detail {
  &__meta {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: #92949d;
    margin-bottom: 12px;
  }

  &__alert {
    margin-bottom: 12px;
  }

  &__list {
    max-height: 56vh;
    overflow-y: auto;
    padding-right: 6px;
  }

  &__item {
    padding: 12px 14px;
    border-radius: 8px;
    background: #fafbfe;
    margin-bottom: 8px;

    &.is-empty {
      opacity: 0.6;
    }
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #444466;
    display: flex;
    align-items: baseline;
    gap: 6px;

    .detail__index {
      flex: none;
    }

    .detail__type {
      font-size: 11px;
      font-weight: 400;
      color: #92949d;
      background: #eef1f6;
      border-radius: 3px;
      padding: 0 5px;
      flex: none;
    }

    .detail__required {
      color: #ec4e29;
      flex: none;
    }
  }

  &__answer {
    margin-top: 6px;
    margin-left: 20px;
    font-size: 13px;
    color: #292a36;
    word-break: break-all;
    white-space: pre-wrap;
  }
}
</style>

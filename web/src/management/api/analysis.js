import axios from './base'

export const getRecycleList = (data) => {
  return axios.get('/survey/dataStatistic/dataTable', {
    params: {
      pageSize: 10,
      ...data
    }
  })
}

export const getStatisticList = (data) => {
  return axios.get('/survey/dataStatistic/aggregationStatis', {
    params: {
      ...data
    }
  })
}

/* ---------- 答卷管理 ---------- */

// 概览：总量 / 今日新增 / 平均用时
export const getResponseOverview = (data) => {
  return axios.get('/survey/response/overview', { params: { ...data } })
}

// 答卷列表（分页 + 筛选）
export const getResponseList = (data) => {
  return axios.get('/survey/response/list', { params: { ...data } })
}

// 单份答卷详情
export const getResponseDetail = (data) => {
  return axios.get('/survey/response/detail', { params: { ...data } })
}

// 删除答卷（支持批量）
export const deleteResponses = (data) => {
  return axios.post('/survey/response/delete', { ...data })
}


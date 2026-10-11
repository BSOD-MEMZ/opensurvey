import axios from './base'

// 注：原「团队空间」相关接口（/workspace 增删改查、member/list）已随团队空间功能一并移除。

export const createGroup = ({ name }: any) => {
  return axios.post('surveyGroup', { name })
}

export const updateGroup = ({ _id, name }: any) => {
  return axios.post(`/surveyGroup/update`, { name, groupId: _id })
}

export const getGroupList = (params: any) => {
  return axios.get('/surveyGroup', {
    params
  })
}

export const deleteGroup = (id: string) => {
  return axios.post(`/surveyGroup/delete`, { groupId: id })
}

export const getRecycleBinCount = (params: any) => {
  return axios.get('/recycleBin', {
    params
  })
}
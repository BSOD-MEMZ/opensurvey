import axios from './base'

// 注：原「团队空间」相关接口（/workspace 增删改查、member/list）已随团队空间功能一并移除。

export const getUserList = (username: string) => {
  return axios.get(`/user/getUserList`, {
    params: {
      username
    }
  })
}

// 获取协作权限下拉框枚举
export const getPermissionList = () => {
  return axios.get('collaborator/getPermissionList')
}

export const saveCollaborator = ({ surveyId, collaborators }: any) => {
  return axios.post('collaborator/batchSave', {
    surveyId,
    collaborators
  })
}

// 添加协作人
export const addCollaborator = ({ surveyId, userId, permissions }: any) => {
  return axios.post('collaborator', {
    surveyId,
    userId,
    permissions
  })
}
// 获取问卷协作信息
export const getCollaborator = (surveyId: string) => {
  return axios.get(`collaborator`, {
    params: {
      surveyId
    }
  })
}
// 获取问卷协作权限
export const getCollaboratorPermissions = (surveyId: string) => {
  return axios.get(`collaborator/permissions`, {
    params: {
      surveyId
    }
  })
}

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
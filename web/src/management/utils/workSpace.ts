export interface ListItem {
  value: string
  label: string
}

export interface MenuItem {
  id: string
  name: string
  icon?: string
  total?: Number
  count?: Number
  children?: MenuItem[]
}

export type IGroup = {
  _id?: string
  name: string
}

export type IMember = {
  userId: string
  username: string
  role: any
  _id?: string
}

export interface ICollaborator {
  _id?: string
  userId: string
  username: string
  permissions: Array<number>
}

export type GroupItem = {
  _id: string
  name: string
  createdAt: string
  updatedAt?: string
  ownerId: string
  surveyTotal: number
}

export enum MenuType {
  PersonalGroup = 'personalGroup',
  RecycleBin = 'recycleBin'
}

export enum UserRole {
  Admin = 'admin',
  Member = 'user'
}

export enum GroupState {
  All = 'all',
  Not = 'unclassified'
}

// 定义角色标签映射对象
export const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: '管理员',
  [UserRole.Member]: '成员'
}

export enum SurveyPermissions {
  SurveyManage = 'SURVEY_CONF_MANAGE',
  DataManage = 'SURVEY_RESPONSE_MANAGE',
  CollaboratorManage = 'SURVEY_COOPERATION_MANAGE'
}


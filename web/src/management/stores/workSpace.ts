import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'

import { CODE_MAP } from '@/management/api/base'
import {
  createGroup,
  getGroupList as getGroupListReq,
  updateGroup as updateGroupReq,
  deleteGroup as deleteGroupReq,
  getRecycleBinCount as getRecycleBinCountReq
} from '@/management/api/space'

import { GroupState, MenuType } from '@/management/utils/workSpace'
import { type IGroup, type GroupItem } from '@/management/utils/workSpace'

import { useSurveyListStore } from './surveyList'

export const useWorkSpaceStore = defineStore('workSpace', () => {
  // 侧栏菜单（原「团队空间」一项已随该功能移除）
  const spaceMenus = ref([
    {
      icon: 'icon-wodekongjian',
      name: '我的空间',
      id: MenuType.PersonalGroup,
      children: []
    },
    {
      icon: 'icon-huishouzhan',
      name: '回收站',
      id: MenuType.RecycleBin,
      count: 0,
      children: []
    }
  ])
  const menuType = ref(MenuType.PersonalGroup)
  const groupId = ref('')

  const surveyListStore = useSurveyListStore()

  function changeMenuType(id: MenuType) {
    menuType.value = id
  }

  function changeGroup(id: string) {
    groupId.value = id
    surveyListStore.resetSearch()
  }

  // 分组
  const groupList = ref<GroupItem[]>([])
  const groupAllList = ref<IGroup[]>([])
  const groupListTotal = ref(0)
  const groupDetail = ref<GroupItem | null>(null)
  async function addGroup(params: IGroup) {
    const { name } = params
    const res: any = await createGroup({ name })

    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success('添加成功')
    } else {
      ElMessage.error('createGroup  code err' + res.errmsg)
    }
  }

  async function updateGroup(params: Required<IGroup>) {
    const { _id, name } = params
    const res: any = await updateGroupReq({ _id, name })

    if (res?.code === CODE_MAP.SUCCESS) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.error(res?.errmsg)
    }
  }

  async function getGroupList(params = { curPage: 1 }) {
    try {
      const res: any = await getGroupListReq(params)
      if (res.code === CODE_MAP.SUCCESS) {
        const { list, allList, total, unclassifiedSurveyTotal, allSurveyTotal } = res.data
        const group = list.map((item: GroupItem) => {
          return {
            id: item._id,
            name: item.name,
            total: item.surveyTotal
          }
        })
        group.unshift(
          {
            id: GroupState.All,
            name: '全部',
            total: allSurveyTotal
          },
          {
            id: GroupState.Not,
            name: '未分组',
            total: unclassifiedSurveyTotal
          }
        )
        groupList.value = list
        groupListTotal.value = total
        spaceMenus.value[0].children = group
        groupAllList.value = allList
      } else {
        ElMessage.error('getGroupList' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getGroupList' + err)
    }
  }

  function getGroupDetail(id: string) {
    try {
      const data = groupList.value.find((item: GroupItem) => item._id === id)
      if (data != undefined) {
        groupDetail.value = data
      } else {
        ElMessage.error('groupDetail 未找到分组')
      }
    } catch (err) {
      ElMessage.error('groupDetail' + err)
    }
  }

  function setGroupDetail(data: null | GroupItem) {
    groupDetail.value = data
  }

  async function deleteGroup(id: string) {
    try {
      const res: any = await deleteGroupReq(id)

      if (res.code === CODE_MAP.SUCCESS) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error(res.errmsg)
      }
    } catch (err: any) {
      ElMessage.error(err)
    }
  }

  async function getRecycleBinCount(params?: any) {
    const recycleBinMenu = spaceMenus.value.find((menu) => menu.id === MenuType.RecycleBin)

    try {
      const res: any = await getRecycleBinCountReq(params)
      if (res.code === CODE_MAP.SUCCESS) {
        const { count } = res.data
        recycleBinMenu && (recycleBinMenu.count = count)
      } else {
        ElMessage.error('getRecycleBinCount' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getRecycleBinCount' + err)
    }
  }

  return {
    menuType,
    spaceMenus,
    groupId,
    changeMenuType,
    changeGroup,
    groupList,
    groupAllList,
    groupListTotal,
    groupDetail,
    addGroup,
    updateGroup,
    getGroupList,
    getGroupDetail,
    setGroupDetail,
    deleteGroup,
    getRecycleBinCount: getRecycleBinCount
  }
})

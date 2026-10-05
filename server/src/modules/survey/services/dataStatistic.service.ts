import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { SurveyResponse } from 'src/models/surveyResponse.entity';

import moment from 'moment';
import { keyBy } from 'lodash';
import { DataItem } from 'src/interfaces/survey';
import { ResponseSchema } from 'src/models/responseSchema.entity';
import { getListHeadByDataList, transformAndMergeArrayFields } from '../utils';
import { QUESTION_TYPE } from 'src/enums/question';

/** 值为对象的题型（数据表 / 导出需要把 hash 还原成可读文案） */
const OBJECT_VALUE_TYPES: string[] = [
  QUESTION_TYPE.MATRIX_RADIO,
  QUESTION_TYPE.MATRIX_SCALE,
  QUESTION_TYPE.MATRIX_CHECKBOX,
  QUESTION_TYPE.MATRIX_INPUT,
  QUESTION_TYPE.MULTI_FILL,
  QUESTION_TYPE.PROPORTION,
];

/** 量表列没有实体选项，直接用 scale_N 里的数字 */
function columnText(columnMap: Record<string, any>, hash: any): string {
  if (columnMap[hash]?.text) {
    return columnMap[hash].text;
  }
  if (typeof hash === 'string' && hash.indexOf('scale_') === 0) {
    return hash.replace('scale_', '');
  }
  return String(hash);
}

/**
 * 把「值为对象」的题型还原成一行可读文案
 * 例：矩阵单选 -> 整体体验：满意；功能完整性：满意
 */
function stringifyObjectAnswer(
  itemConfig: DataItem,
  picked: Record<string, any>,
): string {
  const columnMap = keyBy(itemConfig.options || [], 'hash');
  const rowMap = keyBy(itemConfig.matrixRows || [], 'hash');
  const blankMap = keyBy(itemConfig.fillBlanks || [], 'hash');

  switch (itemConfig.type) {
    case QUESTION_TYPE.MATRIX_RADIO:
    case QUESTION_TYPE.MATRIX_SCALE:
      return Object.keys(picked)
        .map((rowHash) => {
          const rowText = rowMap[rowHash]?.text || rowHash;
          return `${rowText}：${columnText(columnMap, picked[rowHash])}`;
        })
        .join('；');

    case QUESTION_TYPE.MATRIX_CHECKBOX:
      return Object.keys(picked)
        .map((rowHash) => {
          const rowText = rowMap[rowHash]?.text || rowHash;
          const pickedColumns = Array.isArray(picked[rowHash])
            ? picked[rowHash]
            : [];
          const text = pickedColumns
            .map((colHash) => columnText(columnMap, colHash))
            .join('、');
          return `${rowText}：${text || '未选择'}`;
        })
        .join('；');

    case QUESTION_TYPE.MATRIX_INPUT:
      return Object.keys(picked)
        .map((rowHash) => {
          const rowText = rowMap[rowHash]?.text || rowHash;
          const rowValue = picked[rowHash];
          if (!rowValue || typeof rowValue !== 'object') {
            return `${rowText}：`;
          }
          const cells = Object.keys(rowValue)
            .filter((colHash) => String(rowValue[colHash] ?? '').trim() !== '')
            .map(
              (colHash) =>
                `${columnText(columnMap, colHash)}=${rowValue[colHash]}`,
            );
          return `${rowText}：${cells.join('，')}`;
        })
        .join('；');

    case QUESTION_TYPE.MULTI_FILL:
      return Object.keys(picked)
        .map((blankHash) => {
          const blankText = blankMap[blankHash]?.text || blankHash;
          return `${blankText}：${picked[blankHash] ?? ''}`;
        })
        .join('；');

    case QUESTION_TYPE.PROPORTION:
      return Object.keys(picked)
        .map((optionHash) => {
          const optionText = columnMap[optionHash]?.text || optionHash;
          const value = picked[optionHash];
          return `${optionText}：${value === '' || value === undefined ? 0 : value}`;
        })
        .join('；');

    default:
      return JSON.stringify(picked);
  }
}

@Injectable()
export class DataStatisticService {
  private radioType = [QUESTION_TYPE.RADIO_STAR, QUESTION_TYPE.RADIO_NPS];

  constructor(
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: MongoRepository<SurveyResponse>,
  ) {}

  async getDataTable({
    surveyId,
    pageNum,
    pageSize,
    responseSchema,
  }: {
    surveyId: string;
    pageNum: number;
    pageSize: number;
    responseSchema: ResponseSchema;
  }) {
    const dataList = responseSchema?.code?.dataConf?.dataList || [];
    const listHead = getListHeadByDataList(dataList);
    const dataListMap = keyBy(dataList, 'field');
    const where = {
      pageId: surveyId,
      isDeleted: {
        $ne: true,
      },
    };
    const [surveyResponseList, total] =
      await this.surveyResponseRepository.findAndCount({
        where,
        take: pageSize,
        skip: (pageNum - 1) * pageSize,
        order: {
          createdAt: -1,
        },
      });

    const listBody = surveyResponseList.map((submitedData) => {
      const data = submitedData.data;
      const dataKeys = Object.keys(data);

      for (const itemKey of dataKeys) {
        if (typeof itemKey !== 'string') {
          continue;
        }
        if (itemKey.indexOf('data') !== 0) {
          continue;
        }
        // 获取题目id
        const itemConfigKey = itemKey.split('_')[0];
        // 获取题目
        const itemConfig: DataItem = dataListMap[itemConfigKey];
        // 题目删除会出现，数据列表报错
        if (!itemConfig) {
          continue;
        }
        // 处理选项的更多输入框
        if (
          this.radioType.includes(itemConfig.type as QUESTION_TYPE) &&
          !data[`${itemConfigKey}_custom`]
        ) {
          data[`${itemConfigKey}_custom`] =
            data[`${itemConfigKey}_${data[itemConfigKey]}`];
        }
        // 值为对象的题型（矩阵 / 多项填空 / 比重）：还原为可读文案
        if (
          OBJECT_VALUE_TYPES.includes(itemConfig.type) &&
          data[itemKey] &&
          typeof data[itemKey] === 'object' &&
          !Array.isArray(data[itemKey])
        ) {
          data[itemKey] = stringifyObjectAnswer(
            itemConfig,
            data[itemKey] as Record<string, any>,
          );
          continue;
        }
        // 将选项id还原成选项文案
        if (
          Array.isArray(itemConfig.options) &&
          itemConfig.options.length > 0
        ) {
          const optionTextMap = keyBy(itemConfig.options, 'hash');
          data[itemKey] = Array.isArray(data[itemKey])
            ? data[itemKey]
                .map((item) => optionTextMap[item]?.text || item)
                .join(',')
            : optionTextMap[data[itemKey]]?.text || data[itemKey];
        }
        // 将多级联动id还原成选项文案
        if (
          itemConfig.cascaderData &&
          itemConfig.type === QUESTION_TYPE.CASCADER
        ) {
          let optionTextMap = keyBy(itemConfig.cascaderData.children, 'hash');
          data[itemKey] = data[itemKey]
            ?.split(',')
            .map((v) => {
              const text = optionTextMap[v]?.text || v;
              optionTextMap = keyBy(optionTextMap[v].children, 'hash');
              return text;
            })
            .join('-');
        }
      }
      return {
        ...data,
        diffTime: submitedData.diffTime
          ? (submitedData.diffTime / 1000).toFixed(2)
          : '0',
        createdAt: moment(submitedData.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      };
    });
    return {
      total,
      listHead,
      listBody,
    };
  }

  async aggregationStatis({ surveyId, fieldList }) {
    const $facet = fieldList.reduce((pre, cur) => {
      const $match = { $match: { [`data.${cur}`]: { $nin: [[], '', null] } } };
      const $group = { $group: { _id: `$data.${cur}`, count: { $sum: 1 } } };
      const $project = {
        $project: {
          _id: 0,
          count: 1,
          secretKeys: 1,
          sensitiveKeys: 1,
          [`data.${cur}`]: '$_id',
        },
      };
      pre[cur] = [$match, $group, $project];
      return pre;
    }, {});
    const aggregation = this.surveyResponseRepository.aggregate(
      [
        {
          $match: {
            pageId: surveyId,
            isDeleted: {
              $ne: true,
            },
          },
        },
        { $facet },
      ],
      { maxTimeMS: 30000, allowDiskUse: true },
    );
    const res = await aggregation.next();
    const submitionCountMap: Record<string, number> = {};
    for (const field in res) {
      let count = 0;
      if (Array.isArray(res[field])) {
        for (const optionItem of res[field]) {
          count += optionItem.count;
        }
      }
      submitionCountMap[field] = count;
    }
    const transformedData = transformAndMergeArrayFields(res);
    return fieldList.map((field) => {
      return {
        field,
        data: {
          aggregation: (transformedData?.[field] || []).map((optionItem) => {
            return {
              id: optionItem.data[field],
              count: optionItem.count,
            };
          }),
          submitionCount: submitionCountMap?.[field] || 0,
        },
      };
    });
  }
}

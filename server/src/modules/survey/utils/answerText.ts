import { keyBy } from 'lodash';
import { DataItem } from 'src/interfaces/survey';
import { QUESTION_TYPE } from 'src/enums/question';

/**
 * 值为对象的题型：提交上来的不是标量也不是 hash 数组，而是一个映射对象。
 * 这些题型的可读化统一走 stringifyObjectAnswer。
 */
export const OBJECT_VALUE_TYPES: string[] = [
  QUESTION_TYPE.MATRIX_RADIO,
  QUESTION_TYPE.MATRIX_SCALE,
  QUESTION_TYPE.MATRIX_CHECKBOX,
  QUESTION_TYPE.MATRIX_INPUT,
  QUESTION_TYPE.MULTI_FILL,
  QUESTION_TYPE.PROPORTION,
];

/** 提交值是「单个选项 hash」的题型 */
export const SINGLE_HASH_TYPES: string[] = [
  QUESTION_TYPE.RADIO,
  QUESTION_TYPE.BINARY_CHOICE,
  QUESTION_TYPE.VOTE,
  QUESTION_TYPE.CASCADER,
  QUESTION_TYPE.SELECT,
  QUESTION_TYPE.IMAGE_RADIO,
];

/** 提交值是「选项 hash 数组」的题型 */
export const MULTI_HASH_TYPES: string[] = [
  QUESTION_TYPE.CHECKBOX,
  QUESTION_TYPE.SORT,
  QUESTION_TYPE.IMAGE_CHECKBOX,
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
export function stringifyObjectAnswer(
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

/** 判断一个答案是不是「空」 */
export function isEmptyAnswer(value: any): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

/**
 * 把任意题型的一道题答案还原成可读文案。
 *
 * 单一入口：数据表、导出、答卷详情都走这里，避免多处实现漂移。
 *
 * @param itemConfig 题目配置（含 options / matrixRows / fillBlanks）
 * @param value      提交上来的原始值
 * @param record     整条答卷记录（可选）。用于取 optionTextAndId ——
 *                   选项文案在提交后可能被作者改掉，快照能保证历史数据不变。
 */
export function answerToText(
  itemConfig: DataItem,
  value: any,
  record?: Record<string, any>,
): string {
  if (isEmptyAnswer(value)) {
    return '';
  }

  const type = itemConfig.type;

  // 值为对象的题型
  if (OBJECT_VALUE_TYPES.includes(type)) {
    return stringifyObjectAnswer(itemConfig, value);
  }

  // 选项 hash -> 文案；先查当前 schema，查不到再查提交时的快照
  const optionMap = keyBy(itemConfig.options || [], 'hash');
  const snapshotMap = keyBy(
    record?.optionTextAndId?.[itemConfig.field] || [],
    'hash',
  );
  const hashToText = (hash: any) =>
    optionMap[hash]?.text ?? snapshotMap[hash]?.text ?? String(hash);

  // hash 数组（多选 / 排序 / 图片多选）
  if (Array.isArray(value)) {
    return value.map(hashToText).join('、');
  }

  // 单个 hash（单选 / 下拉 / 判断 / 投票 / 多级联动 / 图片单选）
  if (SINGLE_HASH_TYPES.includes(type)) {
    return hashToText(value);
  }

  // 标量：输入 / 日期 / 时间 / 滑块 / 上传 / 计算题
  return String(value);
}

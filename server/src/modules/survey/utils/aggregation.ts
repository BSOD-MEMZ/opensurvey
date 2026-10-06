import { keyBy } from 'lodash';
import { DataItem } from 'src/interfaces/survey';
import { QUESTION_TYPE } from 'src/enums/question';

/** 会被纳入分题统计的题型（说明题除外） */
export const AGGREGATABLE_TYPES: string[] = [
  // 输入类
  QUESTION_TYPE.TEXT,
  QUESTION_TYPE.TEXTAREA,
  QUESTION_TYPE.DATE,
  QUESTION_TYPE.TIME,
  QUESTION_TYPE.UPLOAD,
  QUESTION_TYPE.MULTI_FILL,
  // 选择类
  QUESTION_TYPE.RADIO,
  QUESTION_TYPE.CHECKBOX,
  QUESTION_TYPE.BINARY_CHOICE,
  QUESTION_TYPE.VOTE,
  QUESTION_TYPE.SELECT,
  QUESTION_TYPE.IMAGE_RADIO,
  QUESTION_TYPE.IMAGE_CHECKBOX,
  // 评分类
  QUESTION_TYPE.RADIO_STAR,
  QUESTION_TYPE.RADIO_NPS,
  // 矩阵类
  QUESTION_TYPE.MATRIX_RADIO,
  QUESTION_TYPE.MATRIX_SCALE,
  QUESTION_TYPE.MATRIX_CHECKBOX,
  QUESTION_TYPE.MATRIX_INPUT,
  // 高级
  QUESTION_TYPE.CASCADER,
  QUESTION_TYPE.SORT,
  QUESTION_TYPE.SLIDER,
  QUESTION_TYPE.PROPORTION,
  QUESTION_TYPE.CALCULATION,
];

/** 选项类：提交的是选项 hash / hash 数组 */
const OPTION_TYPES: string[] = [
  QUESTION_TYPE.RADIO,
  QUESTION_TYPE.CHECKBOX,
  QUESTION_TYPE.BINARY_CHOICE,
  QUESTION_TYPE.VOTE,
  QUESTION_TYPE.SELECT,
  QUESTION_TYPE.IMAGE_RADIO,
  QUESTION_TYPE.IMAGE_CHECKBOX,
];

/** 矩阵类（值为 { 行hash: 列hash 或 单元格对象 }） */
const MATRIX_TYPES: string[] = [
  QUESTION_TYPE.MATRIX_RADIO,
  QUESTION_TYPE.MATRIX_SCALE,
  QUESTION_TYPE.MATRIX_CHECKBOX,
  QUESTION_TYPE.MATRIX_INPUT,
];

/** 数值类：按区间分桶 */
const NUMERIC_TYPES: string[] = [
  QUESTION_TYPE.SLIDER,
  QUESTION_TYPE.CALCULATION,
];

/** 值就是一行文本的题型 */
const PLAIN_VALUE_TYPES: string[] = [
  QUESTION_TYPE.TEXT,
  QUESTION_TYPE.TEXTAREA,
  QUESTION_TYPE.DATE,
  QUESTION_TYPE.TIME,
  QUESTION_TYPE.UPLOAD,
];

const SEP = '__';
const rowKey = (field: string, rowHash: string) => `${field}${SEP}row${SEP}${rowHash}`;
const cellKey = (field: string, rowHash: string, colHash: string) =>
  `${field}${SEP}cell${SEP}${rowHash}${SEP}${colHash}`;
const blankKey = (field: string, blankHash: string) =>
  `${field}${SEP}blank${SEP}${blankHash}`;
const totalKey = (field: string) => `${field}${SEP}total`;
const rankKey = (field: string) => `${field}${SEP}rank`;
const statsKey = (field: string) => `${field}${SEP}stats`;

/** 该字段有值（非空数组 / 非空串 / 非 null）的计数 */
function countStages(path: string) {
  return [
    {
      $match: {
        [path]: { $nin: [[], '', null] },
      },
    },
    { $count: 'count' },
  ];
}

/** 按某个 data 路径分组计数 */
function groupStages(path: string) {
  return [
    { $match: { [path]: { $nin: [[], '', null] } } },
    { $group: { _id: `$${path}`, count: { $sum: 1 } } },
  ];
}

/**
 * 按题型生成 $facet 各分支的管道。
 *
 * $facet 的每个键可以是完全不同的管道，所以矩阵题可以按「行」拆成多个键，
 * 排序题可以用 $map/$unwind 展开名次，滑块题可以直接 $bucketAuto 分桶。
 */
export function buildFacet(dataList: DataItem[]) {
  const facet: Record<string, any[]> = {};

  for (const item of dataList) {
    const field = item.field;
    const type = item.type;

    if (MATRIX_TYPES.includes(type)) {
      if (type === QUESTION_TYPE.MATRIX_INPUT) {
        // 矩阵填空：值为 { 行: { 列: 文本 } }，按 行×列 逐个统计填写次数
        for (const row of item.matrixRows || []) {
          for (const col of item.options || []) {
            facet[cellKey(field, row.hash, col.hash)] = countStages(
              `data.${field}.${row.hash}.${col.hash}`,
            );
          }
        }
      } else {
        // 矩阵单选 / 量表 / 多选：按行统计各列的分布
        for (const row of item.matrixRows || []) {
          facet[rowKey(field, row.hash)] = groupStages(
            `data.${field}.${row.hash}`,
          );
        }
      }
      facet[totalKey(field)] = countStages(`data.${field}`);
      continue;
    }

    if (type === QUESTION_TYPE.MULTI_FILL) {
      // 多项填空：值为 { 空hash: 文本 }，按空统计填写次数
      for (const blank of item.fillBlanks || []) {
        facet[blankKey(field, blank.hash)] = countStages(
          `data.${field}.${blank.hash}`,
        );
      }
      facet[totalKey(field)] = countStages(`data.${field}`);
      continue;
    }

    if (type === QUESTION_TYPE.SORT) {
      // 排序：值为 hash 数组，展开成 (选项, 名次) 再聚合
      facet[rankKey(field)] = [
        { $match: { [`data.${field}`]: { $type: 'array' } } },
        {
          $project: {
            pairs: {
              $map: {
                input: { $range: [0, { $size: `$data.${field}` }] },
                as: 'i',
                in: {
                  hash: { $arrayElemAt: [`$data.${field}`, '$$i'] },
                  rank: { $add: ['$$i', 1] },
                },
              },
            },
          },
        },
        { $unwind: '$pairs' },
        {
          $group: {
            _id: { hash: '$pairs.hash', rank: '$pairs.rank' },
            count: { $sum: 1 },
          },
        },
      ];
      facet[totalKey(field)] = countStages(`data.${field}`);
      continue;
    }

    if (type === QUESTION_TYPE.PROPORTION) {
      // 比重：值为 { 选项hash: 数值 }，逐选项求和 + 求均值
      for (const opt of item.options || []) {
        facet[`${field}${SEP}opt${SEP}${opt.hash}`] = [
          {
            $match: {
              [`data.${field}.${opt.hash}`]: { $type: 'number' },
            },
          },
          {
            $group: {
              _id: null,
              avg: { $avg: `$data.${field}.${opt.hash}` },
              sum: { $sum: `$data.${field}.${opt.hash}` },
              count: { $sum: 1 },
            },
          },
        ];
      }
      facet[totalKey(field)] = countStages(`data.${field}`);
      continue;
    }

    if (NUMERIC_TYPES.includes(type)) {
      // 滑块 / 计算题：自动分 10 桶，同时给出均值与极值
      facet[field] = [
        { $match: { [`data.${field}`]: { $type: 'number' } } },
        { $bucketAuto: { groupBy: `$data.${field}`, buckets: 10 } },
      ];
      facet[statsKey(field)] = [
        { $match: { [`data.${field}`]: { $type: 'number' } } },
        {
          $group: {
            _id: null,
            avg: { $avg: `$data.${field}` },
            min: { $min: `$data.${field}` },
            max: { $max: `$data.${field}` },
            count: { $sum: 1 },
          },
        },
      ];
      continue;
    }

    // 其余（选择类 / 量表 / 纯文本 / 日期时间 / 多级联动 / 上传）：按值分组
    facet[field] = groupStages(`data.${field}`);
    facet[totalKey(field)] = countStages(`data.${field}`);
  }

  return facet;
}

/* ---------- 数值辅助 ---------- */

function numericList(aggregation: Array<{ id: any; count: number }>) {
  const list: number[] = [];
  for (const item of aggregation) {
    const num = Number(item.id);
    if (!Number.isNaN(num)) {
      for (let i = 0; i < item.count; i++) {
        list.push(num);
      }
    }
  }
  return list.sort((a, b) => a - b);
}

function average(list: number[]) {
  if (!list.length) {
    return 0;
  }
  return Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(2));
}

function median(list: number[]) {
  if (!list.length) {
    return 0;
  }
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : Number(((list[mid - 1] + list[mid]) / 2).toFixed(2));
}

function variance(list: number[], avg: number) {
  if (!list.length) {
    return 0;
  }
  const sum = list.reduce((acc, v) => acc + (v - avg) ** 2, 0);
  return Number((sum / list.length).toFixed(2));
}

/** NPS = 推荐者占比 - 贬损者占比（9~10 推荐，0~6 贬损） */
function nps(list: number[]) {
  if (!list.length) {
    return 0;
  }
  const promoters = list.filter((v) => v >= 9).length;
  const detractors = list.filter((v) => v <= 6).length;
  return Number((((promoters - detractors) / list.length) * 100).toFixed(1));
}

const round1 = (v: any) => {
  const num = Number(v);
  return Number.isNaN(num) ? 0 : Number(num.toFixed(1));
};

/**
 * 矩阵题的「列」。
 * 矩阵量表的列不是实体选项，而是由 scaleMax 生成的 1~N，提交值形如 scale_3，
 * 所以这里要按 scaleMax 造出来，不能直接读 options。
 */
function matrixColumns(item: DataItem): Array<{ hash: string; text: string }> {
  if (Array.isArray(item.options) && item.options.length) {
    return item.options.map((opt) => ({ hash: opt.hash, text: opt.text }));
  }
  if (item.type === QUESTION_TYPE.MATRIX_SCALE) {
    const max = Number(item.scaleMax) || 5;
    return Array.from({ length: max }, (_, i) => ({
      hash: `scale_${i + 1}`,
      text: String(i + 1),
    }));
  }
  return [];
}

/* ---------- 结果整形 ---------- */

interface AggregationItem {
  id: string;
  text: string;
  count: number;
}

function emptySubmission(field: string) {
  return { field, data: { aggregation: [], submitionCount: 0 } };
}

/**
 * 把 $facet 结果整形成前端契约：
 * { field, title, type, data: { aggregation: [{id, text, count}], submitionCount, summary? } }
 *
 * 前端图表只认 aggregation 的 id/text/count，所以矩阵展开成「行 · 列」、
 * 排序把平均名次写进 text、比重把均值写进 text —— 不用改前端就能出图。
 */
export function shapeAggregation({
  facetResult,
  dataList,
}: {
  facetResult: Record<string, any>;
  dataList: DataItem[];
}): any[] {
  const out: any[] = [];

  for (const item of dataList) {
    const field = item.field;
    const type = item.type;
    const title = item.title;

    if (!facetResult) {
      out.push(emptySubmission(field));
      continue;
    }

    const optionMap = keyBy(item.options || [], 'hash');
    const rowMap = keyBy(item.matrixRows || [], 'hash');
    const blankMap = keyBy(item.fillBlanks || [], 'hash');
    const total = facetResult[totalKey(field)]?.[0]?.count || 0;

    out.push({
      field,
      title,
      type,
      data: {
        aggregation: [],
        submitionCount: total,
      },
      ...(() => {
        const data: any = { aggregation: [] as AggregationItem[], submitionCount: total };

        if (MATRIX_TYPES.includes(type)) {
          if (type === QUESTION_TYPE.MATRIX_INPUT) {
            const cols = matrixColumns(item);
            for (const row of item.matrixRows || []) {
              for (const col of cols) {
                const count =
                  facetResult[cellKey(field, row.hash, col.hash)]?.[0]?.count || 0;
                data.aggregation.push({
                  id: `${row.hash}_${col.hash}`,
                  text: `${row.text} · ${col.text}`,
                  count,
                });
              }
            }
          } else {
            const cols = matrixColumns(item);
            for (const row of item.matrixRows || []) {
              const rows: any[] = facetResult[rowKey(field, row.hash)] || [];
              const countMap: Record<string, number> = {};
              for (const r of rows) {
                const key = Array.isArray(r._id) ? r._id.join('|') : r._id;
                countMap[key] = (countMap[key] || 0) + r.count;
              }
              for (const col of cols) {
                const raw = countMap[col.hash] || 0;
                data.aggregation.push({
                  id: `${row.hash}_${col.hash}`,
                  text: `${row.text} · ${col.text}`,
                  count: raw,
                });
              }
            }
          }
          // 只在有数据时给图（没有数据的组合不占图例）
          const hasValue = data.aggregation.some((a: AggregationItem) => a.count > 0);
          if (!hasValue) {
            data.aggregation = [];
          }
          data.summary = { answeredRows: data.aggregation.length };
          return { data };
        }

        if (type === QUESTION_TYPE.MULTI_FILL) {
          for (const blank of item.fillBlanks || []) {
            data.aggregation.push({
              id: blank.hash,
              text: blank.text,
              count: facetResult[blankKey(field, blank.hash)]?.[0]?.count || 0,
            });
          }
          return { data };
        }

        if (type === QUESTION_TYPE.SORT) {
          const rows: any[] = facetResult[rankKey(field)] || [];
          const statMap: Record<string, { firstCount: number; rankSum: number; total: number }> = {};
          for (const r of rows) {
            const hash = r._id?.hash;
            const rank = r._id?.rank;
            if (!hash || !rank) {
              continue;
            }
            if (!statMap[hash]) {
              statMap[hash] = { firstCount: 0, rankSum: 0, total: 0 };
            }
            statMap[hash].rankSum += rank * r.count;
            statMap[hash].total += r.count;
            if (rank === 1) {
              statMap[hash].firstCount += r.count;
            }
          }
          // 图表按「被排在第 1 位的次数」排序，text 里带上平均名次
          data.aggregation = (item.options || []).map((opt) => {
            const stat = statMap[opt.hash];
            const avgRank = stat && stat.total ? round1(stat.rankSum / stat.total) : 0;
            return {
              id: opt.hash,
              text: `${opt.text}（平均第 ${avgRank} 名）`,
              count: stat?.firstCount || 0,
            };
          });
          data.aggregation.sort(
            (a: AggregationItem, b: AggregationItem) => b.count - a.count,
          );
          data.summary = { note: 'count 为「被排在第 1 位」的次数，括号内为平均名次' };
          return { data };
        }

        if (type === QUESTION_TYPE.PROPORTION) {
          data.aggregation = (item.options || []).map((opt) => {
            const stat = facetResult[`${field}${SEP}opt${SEP}${opt.hash}`]?.[0];
            const avg = stat?.avg ?? 0;
            return {
              id: opt.hash,
              text: `${opt.text}（平均 ${round1(avg)}）`,
              count: Math.round(Number(avg) || 0),
              sum: Math.round(stat?.sum || 0),
              average: round1(avg),
            };
          });
          data.summary = { note: 'count 为平均分配值（百分比），sum 为总分配值' };
          return { data };
        }

        if (NUMERIC_TYPES.includes(type)) {
          const buckets: any[] = facetResult[field] || [];
          data.aggregation = buckets.map((b) => {
            const min = b._id?.min ?? 0;
            const max = b._id?.max ?? 0;
            return {
              id: `${min}_${max}`,
              text: min === max ? String(min) : `${round1(min)} ~ ${round1(max)}`,
              count: b.count,
            };
          });
          const stat = facetResult[statsKey(field)]?.[0];
          if (stat) {
            data.summary = {
              average: round1(stat.avg),
              min: round1(stat.min),
              max: round1(stat.max),
              count: stat.count,
            };
          }
          return { data };
        }

        // 选项类：按 schema 的选项顺序补齐，没被选的显示 0
        if (OPTION_TYPES.includes(type)) {
          const rows: any[] = facetResult[field] || [];
          const countMap: Record<string, number> = {};
          for (const r of rows) {
            const key = Array.isArray(r._id) ? r._id.join('|') : r._id;
            countMap[key] = (countMap[key] || 0) + r.count;
          }
          data.aggregation = (item.options || []).map((opt) => ({
            id: opt.hash,
            text: opt.text,
            count: countMap[opt.hash] || 0,
          }));
          return { data };
        }

        // 评分题
        if (
          type === QUESTION_TYPE.RADIO_STAR ||
          type === QUESTION_TYPE.RADIO_NPS
        ) {
          const rows: any[] = facetResult[field] || [];
          const rawAgg = rows.map((r) => ({
            id: r._id,
            count: r.count,
          }));
          const list = numericList(rawAgg);
          const avg = average(list);
          const range =
            type === QUESTION_TYPE.RADIO_NPS ? [0, 10] : [1, 5];
          data.aggregation = [];
          for (let i = range[0]; i <= range[1]; i++) {
            data.aggregation.push({
              id: String(i),
              text: String(i),
              count:
                rawAgg.find((a) => String(a.id) === String(i))?.count || 0,
            });
          }
          data.summary = {
            average: avg,
            median: median(list),
            variance: variance(list, avg),
          };
          if (type === QUESTION_TYPE.RADIO_NPS) {
            data.summary.nps = nps(list);
          }
          return { data };
        }

        // 多级联动
        if (type === QUESTION_TYPE.CASCADER) {
          const rows: any[] = facetResult[field] || [];
          const textPaths = collectCascaderPaths(item.cascaderData?.children || []);
          const countMap: Record<string, number> = {};
          for (const r of rows) {
            const key = Array.isArray(r._id) ? r._id.join('/') : r._id;
            countMap[key] = (countMap[key] || 0) + r.count;
          }
          data.aggregation = textPaths
            .map((p) => ({
              id: p.id,
              text: p.text,
              count: countMap[p.id] || 0,
            }))
            .filter((v) => v.count > 0);
          return { data };
        }

        // 纯文本 / 日期 / 时间 / 上传：按值分组，取前 50 个高频值
        if (PLAIN_VALUE_TYPES.includes(type)) {
          const rows: any[] = facetResult[field] || [];
          data.aggregation = rows
            .map((r) => ({
              id: String(r._id),
              text: String(r._id).slice(0, 80),
              count: r.count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 50);
          return { data };
        }

        return { data };
      })(),
    });
  }

  return out;
}

/** 多级联动的全路径（用于把提交值还原成可读文案） */
function collectCascaderPaths(
  arr: any[],
  textPrefix = '',
  idPrefix = '',
): Array<{ id: string; text: string }> {
  let out: Array<{ id: string; text: string }> = [];
  for (const item of arr || []) {
    const text = textPrefix ? `${textPrefix}/${item.label}` : item.label;
    const id = idPrefix ? `${idPrefix}/${item.value}` : String(item.value);
    if (Array.isArray(item.children) && item.children.length) {
      out = out.concat(collectCascaderPaths(item.children, text, id));
    } else {
      out.push({ id, text });
    }
  }
  return out;
}

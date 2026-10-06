import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { keyBy } from 'lodash';
import moment from 'moment';

import { SurveyResponse } from 'src/models/surveyResponse.entity';
import { ResponseSchema } from 'src/models/responseSchema.entity';
import { DataItem } from 'src/interfaces/survey';
import { QUESTION_TYPE } from 'src/enums/question';
import { answerToText, isEmptyAnswer } from '../utils/answerText';

/** 答卷筛选条件：某题选中了某些选项（值 = 选项 hash） */
export interface ResponseFilter {
  field: string;
  values: string[];
}

export interface ResponseListParams {
  surveyId: string;
  pageNum: number;
  pageSize: number;
  filters?: ResponseFilter[];
  /** 只看可疑答卷（用时过短 / 直线作答） */
  onlySuspicious?: boolean;
  keyword?: string;
  beginTime?: string;
  endTime?: string;
}

/** 用时过短的判据：平均每题低于这个秒数就标记 */
const SECONDS_PER_QUESTION_MIN = 2;

/** 直线作答判据：连续这么多道选项/量表题选同一个位置就标记 */
const STRAIGHT_LINE_THRESHOLD = 6;

@Injectable()
export class SurveyResponseManageService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: MongoRepository<SurveyResponse>,
  ) {}

  /** 构造「软删除之外 + 筛选条件」的查询 */
  private buildWhere({
    surveyId,
    filters,
    beginTime,
    endTime,
  }: Partial<ResponseListParams>) {
    const where: Record<string, any> = {
      pageId: surveyId,
      isDeleted: { $ne: true },
    };

    if (beginTime || endTime) {
      const range: Record<string, any> = {};
      if (beginTime) {
        range.$gte = new Date(beginTime);
      }
      if (endTime) {
        range.$lte = new Date(endTime);
      }
      where.createdAt = range;
    }

    // 每道题一个条件，多个条件之间是「且」。
    // data.<field> 是 hash 或 hash 数组，$in 对两者都能命中。
    const andList: Record<string, any>[] = [];
    for (const filter of filters || []) {
      if (!filter?.field || !Array.isArray(filter.values) || !filter.values.length) {
        continue;
      }
      andList.push({ [`data.${filter.field}`]: { $in: filter.values } });
    }
    if (andList.length) {
      where.$and = andList;
    }

    return where;
  }

  /**
   * 答卷列表。
   * 支持分页、按题目选项筛选、时间范围筛选。
   */
  async getList({
    surveyId,
    pageNum,
    pageSize,
    filters,
    onlySuspicious,
    keyword,
    beginTime,
    endTime,
    responseSchema,
  }: ResponseListParams & { responseSchema: ResponseSchema }) {
    const dataList: DataItem[] = responseSchema?.code?.dataConf?.dataList || [];
    // 只保留会产出答案的题（说明题 / 隐藏题不占位）
    const answerableList = dataList.filter(
      (item) => !/section|hidden/i.test(item.type || ''),
    );
    const dataMap = keyBy(dataList, 'field');
    const where = this.buildWhere({ surveyId, filters, beginTime, endTime });

    // 有关键词或只看可疑时，无法在数据库层判定，需要取全量再在内存里过
    const needMemoryFilter = Boolean(onlySuspicious || keyword);

    if (!needMemoryFilter) {
      const [list, total] = await this.surveyResponseRepository.findAndCount({
        where,
        take: pageSize,
        skip: (pageNum - 1) * pageSize,
        order: { createdAt: -1 },
      });
      return {
        total,
        list: list.map((item) => this.toListItem(item, answerableList, dataMap)),
      };
    }

    // 内存筛选模式：先取全部匹配（上限保护），过滤后再分页
    const all = await this.surveyResponseRepository.find({
      where,
      order: { createdAt: -1 },
      take: 5000,
    });
    let filtered = all.map((item) =>
      this.toListItem(item, answerableList, dataMap),
    );

    if (keyword) {
      const kw = keyword.trim();
      filtered = filtered.filter((item) =>
        item.preview.some((p) => p.text.includes(kw)),
      );
    }
    if (onlySuspicious) {
      filtered = filtered.filter((item) => item.flags.length > 0);
    }

    const total = filtered.length;
    const start = (pageNum - 1) * pageSize;
    return { total, list: filtered.slice(start, start + pageSize) };
  }

  /** 把一条答卷转成列表行（含答案摘要与质量标记） */
  private toListItem(
    record: SurveyResponse,
    answerableList: DataItem[],
    dataMap: Record<string, DataItem>,
  ) {
    const data = record.data || {};
    const preview: Array<{ field: string; title: string; text: string }> = [];

    for (const item of answerableList) {
      const raw = data[item.field];
      if (isEmptyAnswer(raw)) {
        continue;
      }
      preview.push({
        field: item.field,
        title: item.title,
        text: answerToText(item, raw, record as any).slice(0, 80),
      });
      if (preview.length >= 3) {
        break;
      }
    }

    const flags = this.detectQualityFlags(record, dataMap);

    return {
      id: String(record._id),
      createdAt: record.createdAt,
      diffTime: record.diffTime ? Number((record.diffTime / 1000).toFixed(1)) : 0,
      channelId: record.channelId || '',
      answerCount: Object.keys(data).filter(
        (k) => k.indexOf('data') === 0 && !isEmptyAnswer(data[k]),
      ).length,
      preview,
      flags,
    };
  }

  /**
   * 数据质量检测。
   * 用时过短 / 直线作答 —— 研究场景里剔除无效样本的依据。
   */
  private detectQualityFlags(
    record: SurveyResponse,
    dataMap: Record<string, DataItem>,
  ): Array<{ code: string; label: string; detail: string }> {
    const flags: Array<{ code: string; label: string; detail: string }> = [];
    const data = record.data || {};
    const answeredFields = Object.keys(data).filter(
      (k) => k.indexOf('data') === 0 && !isEmptyAnswer(data[k]),
    );

    // 1. 用时过短
    const answeredCount = answeredFields.length || 1;
    const seconds = (record.diffTime || 0) / 1000;
    const perQuestion = seconds / answeredCount;
    if (record.diffTime && perQuestion < SECONDS_PER_QUESTION_MIN) {
      flags.push({
        code: 'too_fast',
        label: '用时过短',
        detail: `共 ${seconds.toFixed(0)} 秒 / ${answeredCount} 题，平均每题 ${perQuestion.toFixed(1)} 秒`,
      });
    }

    // 2. 直线作答：把「选项位置」序列化，找最长连续相同段
    const positions: number[] = [];
    for (const field of answeredFields) {
      const item = dataMap[field.split('_')[0]] || dataMap[field];
      if (!item || !Array.isArray(item.options) || !item.options.length) {
        continue;
      }
      const value = data[field];
      const hash = Array.isArray(value) ? value[0] : value;
      if (typeof hash !== 'string') {
        continue;
      }
      const idx = item.options.findIndex((opt) => opt.hash === hash);
      if (idx >= 0) {
        positions.push(idx);
      }
    }
    let best = 0;
    let run = 0;
    for (let i = 0; i < positions.length; i++) {
      run = i > 0 && positions[i] === positions[i - 1] ? run + 1 : 1;
      if (run > best) {
        best = run;
      }
    }
    if (best >= STRAIGHT_LINE_THRESHOLD) {
      flags.push({
        code: 'straight_line',
        label: '直线作答',
        detail: `连续 ${best} 道题选了同一位置的选项`,
      });
    }

    return flags;
  }

  /** 单份答卷详情：逐题给出题干与可读答案 */
  async getDetail({
    surveyId,
    id,
    responseSchema,
  }: {
    surveyId: string;
    id: string;
    responseSchema: ResponseSchema;
  }) {
    let oid: ObjectId;
    try {
      oid = new ObjectId(id);
    } catch {
      return null;
    }
    const record = await this.surveyResponseRepository.findOne({
      where: {
        _id: oid,
        pageId: surveyId,
        isDeleted: { $ne: true },
      },
    });
    if (!record) {
      return null;
    }

    const dataList: DataItem[] = responseSchema?.code?.dataConf?.dataList || [];
    const data = record.data || {};

    const items = dataList
      .filter((item) => !/section|hidden/i.test(item.type || ''))
      .map((item) => {
        const raw = data[item.field];
        return {
          field: item.field,
          title: item.title,
          type: item.type,
          isRequired: item.isRequired,
          answered: !isEmptyAnswer(raw),
          // 选项题的原始选择，前端可以据此高亮
          raw: raw === undefined ? null : raw,
          text: isEmptyAnswer(raw) ? '' : answerToText(item, raw, record as any),
        };
      });

    const dataMap = keyBy(dataList, 'field');
    return {
      id: String(record._id),
      createdAt: record.createdAt,
      clientTime: record.clientTime,
      diffTime: record.diffTime
        ? Number((record.diffTime / 1000).toFixed(1))
        : 0,
      channelId: record.channelId || '',
      flags: this.detectQualityFlags(record, dataMap),
      items,
    };
  }

  /** 概览：总量、今日新增、平均用时、最近提交时间 */
  async getOverview({ surveyId }: { surveyId: string }) {
    const where = { pageId: surveyId, isDeleted: { $ne: true } };
    const total = await this.surveyResponseRepository.count(where);

    const todayStart = moment().startOf('day').toDate();
    const todayTotal = await this.surveyResponseRepository.count({
      ...where,
      createdAt: { $gte: todayStart },
    });

    const last = await this.surveyResponseRepository.find({
      where,
      order: { createdAt: -1 },
      take: 1,
    });

    // 平均用时：取最近 500 份算，避免全量扫描
    const recent = await this.surveyResponseRepository.find({
      where,
      order: { createdAt: -1 },
      take: 500,
      select: ['_id', 'diffTime'],
    });
    const durations = recent
      .map((item) => item.diffTime)
      .filter((v) => typeof v === 'number' && v > 0);
    const avgDuration = durations.length
      ? Number(
          (
            durations.reduce((a, b) => a + b, 0) /
            durations.length /
            1000
          ).toFixed(1),
        )
      : 0;

    return {
      total,
      todayTotal,
      avgDuration,
      lastSubmitAt: last[0]?.createdAt || null,
    };
  }

  /**
   * 数据大屏一次性取数。
   * 大屏每几秒刷新一次，所以合并成一个接口，避免多请求互相错峰。
   */
  async getScreenData({
    surveyId,
    responseSchema,
    topQuestions = 6,
    latestCount = 12,
  }: {
    surveyId: string;
    responseSchema: ResponseSchema;
    topQuestions?: number;
    latestCount?: number;
  }) {
    const where = { pageId: surveyId, isDeleted: { $ne: true } };
    const overview = await this.getOverview({ surveyId });

    // 近 24 小时按小时分布
    const since = moment().subtract(23, 'hour').startOf('hour').toDate();
    const recentDocs = await this.surveyResponseRepository.find({
      where: { ...where, createdAt: { $gte: since } },
      order: { createdAt: 1 },
      take: 20000,
      select: ['_id', 'createdAt', 'channelId'],
    });

    const hourlyMap: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[moment(since).add(i, 'hour').format('HH:00')] = 0;
    }
    const channelMap: Record<string, number> = {};
    for (const doc of recentDocs) {
      const key = moment(doc.createdAt).format('HH:00');
      if (key in hourlyMap) {
        hourlyMap[key] += 1;
      }
    }

    // 全量渠道分布（不限于 24 小时）
    const allDocs = await this.surveyResponseRepository.find({
      where,
      take: 20000,
      select: ['_id', 'channelId'],
    });
    for (const doc of allDocs) {
      const key = doc.channelId || '__none__';
      channelMap[key] = (channelMap[key] || 0) + 1;
    }

    // 各题分布：取前 N 道「有选项分布意义」的题
    const dataList: DataItem[] = responseSchema?.code?.dataConf?.dataList || [];
    const distTypes: string[] = [
      QUESTION_TYPE.RADIO,
      QUESTION_TYPE.CHECKBOX,
      QUESTION_TYPE.BINARY_CHOICE,
      QUESTION_TYPE.SELECT,
      QUESTION_TYPE.IMAGE_RADIO,
      QUESTION_TYPE.IMAGE_CHECKBOX,
      QUESTION_TYPE.VOTE,
      QUESTION_TYPE.RADIO_STAR,
      QUESTION_TYPE.RADIO_NPS,
    ];
    const picked = dataList
      .filter((item) => distTypes.includes(item.type))
      .slice(0, topQuestions);

    let questions: any[] = [];
    if (picked.length) {
      const aggregate = this.surveyResponseRepository.aggregate(
        [
          { $match: { pageId: surveyId, isDeleted: { $ne: true } } },
          {
            $facet: picked.reduce((pre, item) => {
              pre[item.field] = [
                { $match: { [`data.${item.field}`]: { $nin: [[], '', null] } } },
                { $group: { _id: `$data.${item.field}`, count: { $sum: 1 } } },
              ];
              return pre;
            }, {}),
          },
        ],
        { maxTimeMS: 30000, allowDiskUse: true },
      );
      const facet = await aggregate.next();
      questions = picked.map((item) => {
        const rows: any[] = facet?.[item.field] || [];
        const countMap: Record<string, number> = {};
        for (const r of rows) {
          const key = Array.isArray(r._id) ? r._id.join('|') : r._id;
          countMap[key] = (countMap[key] || 0) + r.count;
        }
        const options = Array.isArray(item.options) ? item.options : [];
        let aggregation = options.length
          ? options.map((opt) => ({
              id: opt.hash,
              text: opt.text,
              count: countMap[opt.hash] || 0,
            }))
          : rows
              .map((r) => ({
                id: String(r._id),
                text: String(r._id),
                count: r.count,
              }))
              .sort((a, b) => b.count - a.count);
        aggregation = aggregation
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        return {
          field: item.field,
          title: item.title,
          type: item.type,
          total: aggregation.reduce((sum, a) => sum + a.count, 0),
          aggregation,
        };
      });
    }

    // 最新答卷
    const latestDocs = await this.surveyResponseRepository.find({
      where,
      order: { createdAt: -1 },
      take: latestCount,
    });
    const latest = latestDocs.map((doc) =>
      this.toListItem(doc, dataList.filter((i) => !/section|hidden/i.test(i.type)), keyBy(dataList, 'field')),
    );

    return {
      overview,
      hourly: Object.keys(hourlyMap).map((hour) => ({
        hour,
        count: hourlyMap[hour],
      })),
      channels: Object.keys(channelMap)
        .map((channelId) => ({
          channelId,
          count: channelMap[channelId],
        }))
        .sort((a, b) => b.count - a.count),
      questions,
      latest,
      generatedAt: new Date(),
    };
  }

  /** 软删除（可批量）。返回实际删除条数 */
  async removeResponses({
    surveyId,
    ids,
  }: {
    surveyId: string;
    ids: string[];
  }) {    const objectIds: ObjectId[] = [];
    for (const id of ids) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {
        // 非法 id 直接跳过
      }
    }
    if (!objectIds.length) {
      return { deleted: 0 };
    }
    const res = await this.surveyResponseRepository.updateMany(
      { _id: { $in: objectIds }, pageId: surveyId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );
    return { deleted: res?.modifiedCount ?? 0 };
  }
}

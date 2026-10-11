import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { SurveyResponse } from 'src/models/surveyResponse.entity';

@Injectable()
export class SurveyResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: MongoRepository<SurveyResponse>,
  ) {}

  async createSurveyResponse({
    data,
    clientTime,
    diffTime,
    surveyId,
    surveyPath,
    optionTextAndId,
    channelId = undefined,
    score,
    examDetail,
    respondentId = undefined,
  }: {
    data: any;
    clientTime: any;
    diffTime: any;
    surveyId: any;
    surveyPath: any;
    optionTextAndId: any;
    channelId?: any;
    /** 考试模式的得分，未开启考试模式时传 undefined */
    score?: number;
    /** 考试模式的逐题对错明细 */
    examDetail?: any;
    /** 作答者标识（浏览器本地 uuid），用于「同一人只能填一次」 */
    respondentId?: string;
  }) {
    const newSubmitData = this.surveyResponseRepository.create({
      surveyPath,
      data,
      secretKeys: [],
      clientTime,
      diffTime,
      pageId: surveyId,
      optionTextAndId,
      channelId,
      ...(respondentId ? { respondentId } : {}),
      // 考试模式下才有值；未开启考试模式时不写入这两个字段
      ...(typeof score === 'number' ? { score } : {}),
      ...(examDetail ? { examDetail } : {}),
    });

    // 提交问卷
    const res = await this.surveyResponseRepository.save(newSubmitData);
    // res是加密后的数据，需要手动调用loaded才会触发解密
    res.onDataLoaded();
    return res;
  }

  async getSurveyResponseTotalByPath(surveyPath: string) {
    const data = await this.surveyResponseRepository.find({
      where: {
        surveyPath,
      },
    });
    return (data || []).length;
  }

  /** 同一份问卷下，这个作答者（浏览器 uuid）已经提交过几份 */
  async getResponseCountByRespondent({
    surveyPath,
    respondentId,
  }: {
    surveyPath: string;
    respondentId: string;
  }) {
    // 用 find 而不是 count：MongoRepository.count 在带 $ne 之类的操作符时
    // 会静默返回 0（实测踩过），find 和上面 tLimit 的统计走同一条路，行为一致
    const data = await this.surveyResponseRepository.find({
      where: {
        surveyPath,
        respondentId,
      },
    });
    return (data || []).length;
  }
  async getSurveyResponseTotalByChannel({ channelId }) {
    const data = await this.surveyResponseRepository.find({
      where: {
        channelId: channelId,
      },
    });
    return (data || []).length;
  }
}

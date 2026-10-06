import {
  Controller,
  Get,
  Query,
  HttpCode,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import * as Joi from 'joi';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { DataStatisticService } from '../services/dataStatistic.service';
import { ResponseSchemaService } from '../../surveyResponse/services/responseScheme.service';

import { Authentication } from 'src/guards/authentication.guard';
import { PluginManager } from 'src/securityPlugin/pluginManager';
import { SurveyGuard } from 'src/guards/survey.guard';
import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';
import { Logger } from 'src/logger';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { AggregationStatisDto } from '../dto/aggregationStatis.dto';
import { AGGREGATABLE_TYPES } from '../utils/aggregation';
import { QUESTION_TYPE } from 'src/enums/question';

@ApiTags('survey')
@ApiBearerAuth()
@Controller('/api/survey/dataStatistic')
export class DataStatisticController {
  constructor(
    private readonly responseSchemaService: ResponseSchemaService,
    private readonly dataStatisticService: DataStatisticService,
    private readonly pluginManager: PluginManager,
    private readonly logger: Logger,
  ) {}

  @Get('/dataTable')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @UseGuards(Authentication)
  async data(
    @Query()
    queryInfo,
  ) {
    const { value, error } = await Joi.object({
      surveyId: Joi.string().required(),
      isMasked: Joi.boolean().default(true), // 默认true就是需要脱敏
      page: Joi.number().default(1),
      pageSize: Joi.number().default(10),
    }).validate(queryInfo);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const { surveyId, isMasked, page, pageSize } = value;
    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPageId(surveyId);
    const { total, listHead, listBody } =
      await this.dataStatisticService.getDataTable({
        responseSchema,
        surveyId,
        pageNum: page,
        pageSize,
      });

    if (isMasked) {
      // 脱敏
      listBody.forEach((item) => {
        this.pluginManager.triggerHook('maskData', item);
      });
    }

    return {
      code: 200,
      data: {
        total,
        listHead,
        listBody,
      },
    };
  }

  @Get('/aggregationStatis')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @UseGuards(Authentication)
  async aggregationStatis(@Query() queryInfo: AggregationStatisDto) {
    // 聚合统计
    const { value, error } = AggregationStatisDto.validate(queryInfo);
    if (error) {
      throw new HttpException('参数错误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPageId(
        value.surveyId,
      );
    if (!responseSchema) {
      return {
        code: 200,
        data: [],
      };
    }
    // 全题型统计：题型白名单收敛到 utils/aggregation 的单一来源
    const dataList = responseSchema.code.dataConf.dataList.filter((item) =>
      AGGREGATABLE_TYPES.includes(item.type),
    );
    const res = await this.dataStatisticService.aggregationStatisAll({
      surveyId: value.surveyId,
      dataList,
    });
    return {
      code: 200,
      data: res,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import * as Joi from 'joi';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { SurveyResponseManageService } from '../services/surveyResponseManage.service';
import { ResponseSchemaService } from '../../surveyResponse/services/responseScheme.service';

import { Authentication } from 'src/guards/authentication.guard';
import { SurveyGuard } from 'src/guards/survey.guard';
import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';
import { Logger } from 'src/logger';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';

const DASH = '/api/survey/response';

@ApiTags('survey')
@ApiBearerAuth()
@Controller(DASH)
export class SurveyResponseManageController {
  constructor(
    private readonly responseSchemaService: ResponseSchemaService,
    private readonly surveyResponseManageService: SurveyResponseManageService,
    private readonly logger: Logger,
  ) {}

  /** 解析 filters 参数：前端传 JSON 字符串，形如 [{"field":"data1","values":["h1"]}] */
  private parseFilters(raw: any) {
    if (!raw) {
      return [];
    }
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item) => item && typeof item.field === 'string')
        .map((item) => ({
          field: item.field,
          values: Array.isArray(item.values) ? item.values.map(String) : [],
        }));
    } catch {
      return [];
    }
  }

  /** 概览：总量 / 今日新增 / 平均用时 */
  @Get('/overview')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @UseGuards(Authentication)
  async overview(@Query() queryInfo) {
    const { value, error } = Joi.object({
      surveyId: Joi.string().required(),
    }).validate(queryInfo);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const data = await this.surveyResponseManageService.getOverview({
      surveyId: value.surveyId,
    });
    return { code: 200, data };
  }

  /** 答卷列表（分页 + 筛选） */
  @Get('/list')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @UseGuards(Authentication)
  async list(@Query() queryInfo) {
    const { value, error } = Joi.object({
      surveyId: Joi.string().required(),
      page: Joi.number().default(1),
      pageSize: Joi.number().default(10),
      filters: Joi.any(),
      onlySuspicious: Joi.boolean().default(false),
      keyword: Joi.string().allow('', null),
      beginTime: Joi.string().allow('', null),
      endTime: Joi.string().allow('', null),
    }).validate(queryInfo);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }

    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPageId(
        value.surveyId,
      );

    const { total, list } = await this.surveyResponseManageService.getList({
      surveyId: value.surveyId,
      pageNum: value.page,
      pageSize: value.pageSize,
      filters: this.parseFilters(value.filters),
      onlySuspicious: value.onlySuspicious,
      keyword: value.keyword || '',
      beginTime: value.beginTime || '',
      endTime: value.endTime || '',
      responseSchema,
    });

    return { code: 200, data: { total, list } };
  }

  /** 单份答卷详情 */
  @Get('/detail')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'query.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @UseGuards(Authentication)
  async detail(@Query() queryInfo) {
    const { value, error } = Joi.object({
      surveyId: Joi.string().required(),
      id: Joi.string().required(),
    }).validate(queryInfo);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const responseSchema =
      await this.responseSchemaService.getResponseSchemaByPageId(
        value.surveyId,
      );
    const data = await this.surveyResponseManageService.getDetail({
      surveyId: value.surveyId,
      id: value.id,
      responseSchema,
    });
    if (!data) {
      throw new HttpException('答卷不存在', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    return { code: 200, data };
  }

  /** 删除答卷（支持批量） */
  @Post('/delete')
  @HttpCode(200)
  @UseGuards(SurveyGuard)
  @SetMetadata('surveyId', 'body.surveyId')
  @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
  @UseGuards(Authentication)
  async remove(@Body() reqBody) {
    const { value, error } = Joi.object({
      surveyId: Joi.string().required(),
      ids: Joi.array().items(Joi.string()).min(1).required(),
    }).validate(reqBody);
    if (error) {
      this.logger.error(error.message);
      throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
    }
    const data = await this.surveyResponseManageService.removeResponses({
      surveyId: value.surveyId,
      ids: value.ids,
    });
    return { code: 200, data };
  }
}

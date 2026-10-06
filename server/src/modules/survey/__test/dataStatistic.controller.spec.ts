import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';

import { DataStatisticController } from '../controllers/dataStatistic.controller';
import { DataStatisticService } from '../services/dataStatistic.service';
import { SurveyMetaService } from '../services/surveyMeta.service';
import { ResponseSchemaService } from '../../surveyResponse/services/responseScheme.service';

import { PluginManagerProvider } from 'src/securityPlugin/pluginManager.provider';
import { PluginManager } from 'src/securityPlugin/pluginManager';
import { Logger } from 'src/logger';

import { UserService } from 'src/modules/auth/services/user.service';
import { ResponseSecurityPlugin } from 'src/securityPlugin/responseSecurityPlugin';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { HttpException } from 'src/exceptions/httpException';

jest.mock('../services/dataStatistic.service');
jest.mock('../services/surveyMeta.service');
jest.mock('../../surveyResponse/services/responseScheme.service');

jest.mock('src/guards/authentication.guard');
jest.mock('src/guards/survey.guard');

describe('DataStatisticController', () => {
  let controller: DataStatisticController;
  let dataStatisticService: DataStatisticService;
  let responseSchemaService: ResponseSchemaService;
  let pluginManager: PluginManager;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataStatisticController],
      providers: [
        DataStatisticService,
        SurveyMetaService,
        ResponseSchemaService,
        PluginManagerProvider,
        ConfigService,
        {
          provide: UserService,
          useClass: jest.fn().mockImplementation(() => ({
            getUserByUsername() {
              return {};
            },
          })),
        },
        {
          provide: AuthService,
          useClass: jest.fn().mockImplementation(() => ({
            varifytoken() {
              return {};
            },
          })),
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DataStatisticController>(DataStatisticController);
    dataStatisticService =
      module.get<DataStatisticService>(DataStatisticService);
    responseSchemaService = module.get<ResponseSchemaService>(
      ResponseSchemaService,
    );
    pluginManager = module.get<PluginManager>(PluginManager);
    logger = module.get<Logger>(Logger);

    pluginManager.registerPlugin(
      new ResponseSecurityPlugin('dataAesEncryptSecretKey'),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('data', () => {
    it('should return data table', async () => {
      const surveyId = new ObjectId().toString();
      const mockRequest = {
        query: {
          surveyId,
          isMasked: false,
          page: 1,
          pageSize: 10,
        },
        user: {
          username: 'testUser',
        },
      };

      const mockDataTable = {
        total: 10,
        listHead: [
          {
            field: 'xxx',
            title: 'xxx',
            type: 'xxx',
            diffTime: 'xxx',
            othersCode: 'xxx',
          },
        ],
        listBody: [
          { diffTime: '0.5', createdAt: '2024-02-11' },
          { diffTime: '0.5', createdAt: '2024-02-11' },
        ],
      };

      jest
        .spyOn(responseSchemaService, 'getResponseSchemaByPageId')
        .mockResolvedValueOnce({} as any);
      jest
        .spyOn(dataStatisticService, 'getDataTable')
        .mockResolvedValueOnce(mockDataTable);

      const result = await controller.data(mockRequest.query);

      expect(result).toEqual({
        code: 200,
        data: mockDataTable,
      });
    });

    it('should return data table with isMasked', async () => {
      const surveyId = new ObjectId().toString();
      const mockRequest = {
        query: {
          surveyId,
          isMasked: true,
          page: 1,
          pageSize: 10,
        },
        user: {
          username: 'testUser',
        },
      };

      const mockDataTable = {
        total: 10,
        listHead: [
          {
            field: 'xxx',
            title: 'xxx',
            type: 'xxx',
            diffTime: 'xxx',
            othersCode: 'xxx',
          },
        ],
        listBody: [
          { diffTime: '0.5', createdAt: '2024-02-11', data123: '15200000000' },
          { diffTime: '0.5', createdAt: '2024-02-11', data123: '13800000000' },
        ],
      };

      jest
        .spyOn(responseSchemaService, 'getResponseSchemaByPageId')
        .mockResolvedValueOnce({} as any);
      jest
        .spyOn(dataStatisticService, 'getDataTable')
        .mockResolvedValueOnce(mockDataTable);

      const result = await controller.data(mockRequest.query);

      expect(result).toEqual({
        code: 200,
        data: mockDataTable,
      });
    });

    it('should throw an exception if validation fails', async () => {
      const mockRequest = {
        query: {
          surveyId: '',
        },
        user: {
          username: 'testUser',
        },
      };

      await expect(controller.data(mockRequest.query)).rejects.toThrow(
        HttpException,
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('aggregationStatis', () => {
    it('应调用 aggregationStatisAll 并透传结果', async () => {
      const mockRequest = {
        query: {
          surveyId: new ObjectId().toString(),
        },
      };

      jest
        .spyOn(responseSchemaService, 'getResponseSchemaByPageId')
        .mockResolvedValueOnce({
          code: {
            dataConf: {
              dataList: [{ field: 'data1', type: 'radio', title: '性别' }],
            },
          },
        } as any);

      const aggregated = [
        {
          field: 'data1',
          title: '性别',
          type: 'radio',
          data: { aggregation: [], submitionCount: 0 },
        },
      ];
      jest
        .spyOn(dataStatisticService, 'aggregationStatisAll')
        .mockResolvedValueOnce(aggregated as any);

      const result = await controller.aggregationStatis(mockRequest.query);

      expect(result).toEqual({ code: 200, data: aggregated });
    });

    it('should return empty data if response schema does not exist', async () => {
      const mockRequest = {
        query: {
          surveyId: new ObjectId().toString(),
        },
      };

      jest
        .spyOn(responseSchemaService, 'getResponseSchemaByPageId')
        .mockResolvedValueOnce(null);

      const result = await controller.aggregationStatis(mockRequest.query);

      expect(result).toEqual({
        code: 200,
        data: [],
      });
    });
  });
});

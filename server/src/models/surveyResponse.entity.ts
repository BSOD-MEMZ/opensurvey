import { Entity, Column, BeforeInsert, AfterLoad } from 'typeorm';
import pluginManager from '../securityPlugin/pluginManager';
import { BaseEntity } from './base.entity';

@Entity({ name: 'surveySubmit' })
export class SurveyResponse extends BaseEntity {
  @Column()
  pageId: string;

  @Column()
  surveyPath: string;

  @Column('jsonb')
  data: Record<string, any>;

  @Column()
  diffTime: number;

  @Column()
  clientTime: number;

  @Column('jsonb')
  secretKeys: Array<string>;

  @Column('jsonb')
  optionTextAndId: Record<string, any>;

  @Column()
  channelId: string;

  /** 考试模式下的得分（未开启考试模式时不写入） */
  @Column({ nullable: true })
  score?: number;

  /** 考试模式下每题的对错明细 */
  @Column('jsonb', { nullable: true })
  examDetail?: any;

  @BeforeInsert()
  async onDataInsert() {
    return await pluginManager.triggerHook('encryptResponseData', this);
  }

  @AfterLoad()
  async onDataLoaded() {
    return await pluginManager.triggerHook('decryptResponseData', this);
  }
}

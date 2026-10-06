import { DataItem } from 'src/interfaces/survey';
import { QUESTION_TYPE } from 'src/enums/question';

/** 提交值是单个选项 hash 的题型 */
const SINGLE_HASH_TYPES: string[] = [
  QUESTION_TYPE.RADIO,
  QUESTION_TYPE.BINARY_CHOICE,
  QUESTION_TYPE.VOTE,
  QUESTION_TYPE.CASCADER,
  QUESTION_TYPE.SELECT,
  QUESTION_TYPE.IMAGE_RADIO,
];

/** 提交值是选项 hash 数组的题型 */
const MULTI_HASH_TYPES: string[] = [
  QUESTION_TYPE.CHECKBOX,
  QUESTION_TYPE.IMAGE_CHECKBOX,
  QUESTION_TYPE.SORT,
];

/** 提交值是纯文本的题型 */
const TEXT_TYPES: string[] = [
  QUESTION_TYPE.TEXT,
  QUESTION_TYPE.TEXTAREA,
];

export interface ExamQuestionResult {
  field: string;
  title: string;
  type: string;
  /** 该题满分 */
  fullScore: number;
  /** 实际得分 */
  score: number;
  correct: boolean;
  /** 标准答案（选项 hash 或文本），前端可据此还原文案 */
  answer: any;
  /** 考生作答 */
  got: any;
}

export interface ExamResult {
  score: number;
  fullScore: number;
  correctCount: number;
  gradedCount: number;
  /** 正确率（0~100，保留 1 位） */
  accuracy: number;
  detail: ExamQuestionResult[];
}

/** 判断一道题是否配置了标准答案 */
function hasAnswer(item: any): boolean {
  const answer = item?.examAnswer;
  if (answer === undefined || answer === null) {
    return false;
  }
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }
  return String(answer) !== '';
}

/** 数组按字符串排序后比较，忽略多选顺序 */
function sameSet(a: any[], b: any[]): boolean {
  const na = a.map(String).slice().sort();
  const nb = b.map(String).slice().sort();
  return na.length === nb.length && na.every((v, i) => v === nb[i]);
}

function isCorrect(item: DataItem, value: any): boolean {
  const answer = (item as any).examAnswer;

  if (SINGLE_HASH_TYPES.includes(item.type)) {
    return String(value) === String(Array.isArray(answer) ? answer[0] : answer);
  }

  if (MULTI_HASH_TYPES.includes(item.type)) {
    const expect = Array.isArray(answer) ? answer : [answer];
    const got = Array.isArray(value) ? value : value ? [value] : [];
    // 排序题对顺序敏感，多选只比集合
    if (item.type === QUESTION_TYPE.SORT) {
      return (
        got.length === expect.length &&
        got.every((v, i) => String(v) === String(expect[i]))
      );
    }
    return sameSet(got, expect);
  }

  if (TEXT_TYPES.includes(item.type)) {
    const expect = String(Array.isArray(answer) ? answer[0] : answer).trim();
    return String(value ?? '').trim() === expect;
  }

  // 其余题型暂不判分
  return false;
}

/** 该题型是否支持判分 */
function gradable(type: string): boolean {
  return (
    SINGLE_HASH_TYPES.includes(type) ||
    MULTI_HASH_TYPES.includes(type) ||
    TEXT_TYPES.includes(type)
  );
}

/**
 * 判分。
 *
 * 只在问卷开启考试模式时调用；标准答案与分值存在每道题的
 * `examAnswer` / `examScore` 上，所以不依赖额外的顶层配置。
 */
export function gradeAnswer(
  dataList: DataItem[],
  formValues: Record<string, any>,
): ExamResult {
  const detail: ExamQuestionResult[] = [];
  let score = 0;
  let fullScore = 0;
  let correctCount = 0;
  let gradedCount = 0;

  for (const item of dataList) {
    if (!gradable(item.type) || !hasAnswer(item)) {
      continue;
    }
    const full = Number((item as any).examScore);
    const itemFull = Number.isFinite(full) && full > 0 ? full : 1;
    const got = formValues[item.field];
    const correct = isCorrect(item, got);
    const gotScore = correct ? itemFull : 0;

    gradedCount += 1;
    fullScore += itemFull;
    score += gotScore;
    if (correct) {
      correctCount += 1;
    }
    detail.push({
      field: item.field,
      title: item.title,
      type: item.type,
      fullScore: itemFull,
      score: gotScore,
      correct,
      answer: (item as any).examAnswer,
      got: got === undefined ? null : got,
    });
  }

  const roundedScore = Number(score.toFixed(2));
  const roundedFull = Number(fullScore.toFixed(2));
  return {
    score: roundedScore,
    fullScore: roundedFull,
    correctCount,
    gradedCount,
    accuracy: gradedCount
      ? Number(((correctCount / gradedCount) * 100).toFixed(1))
      : 0,
    detail,
  };
}

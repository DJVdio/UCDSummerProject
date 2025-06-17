// 工具函数 —— 统一判断“是否晚于 now”
import type { TimeView } from '@mui/x-date-pickers';

/** 只要候选时间晚于 now 就返回 true（应禁用） */
export const isAfterNow = (candidate: Date, now: Date) =>
  candidate.getTime() > now.getTime();

/** Date 回调 */
export const makeShouldDisableDate =
  (now: Date) =>
  (candidate: Date | null): boolean =>
    !!candidate && isAfterNow(candidate, now);

/** Time 回调（hours / minutes / seconds / meridiem – 一律比较整 Date） */
export const makeShouldDisableTime =
  (now: Date) =>
  (candidate: Date | null, _view: TimeView): boolean =>
    !!candidate && isAfterNow(candidate, now);

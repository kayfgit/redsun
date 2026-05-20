import type { BrushConfig } from '@/types';

export const DEFAULT_BRUSH_CONFIG: BrushConfig = {
  minWidth: 1.5,
  maxWidth: 14,
  smoothing: 0.3,
  inkOpacity: 0.88,
  velocityScale: 0.7,
  thinning: 0.5,
};

export const CANVAS_SIZE = 400;

// Placeholder characters grouped by rough stroke count for simulated matching
export const COMMON_CHARACTERS: string[][] = [
  ['一', '乙', '二', '十', '丁', '七', '八', '人', '入', '九', '力', '又'],
  ['三', '大', '女', '子', '小', '山', '川', '工', '口', '土', '士', '千'],
  ['中', '水', '火', '木', '王', '天', '日', '月', '手', '心', '文', '方'],
  ['不', '五', '太', '云', '少', '长', '书', '见', '风', '今', '元', '公'],
  ['生', '白', '正', '本', '可', '用', '他', '出', '头', '北', '目', '东'],
  ['地', '在', '有', '年', '多', '自', '行', '名', '同', '光', '老', '先'],
  ['走', '花', '来', '作', '你', '我', '身', '没', '车', '学', '国', '明'],
  ['说', '话', '想', '知', '道', '爱', '谢', '意', '新', '路', '跟', '像'],
];

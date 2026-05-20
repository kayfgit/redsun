export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface BrushConfig {
  minWidth: number;
  maxWidth: number;
  smoothing: number;
  inkOpacity: number;
  velocityScale: number;
  thinning: number;
}

export type InputMode = 'draw' | 'type' | 'speak';

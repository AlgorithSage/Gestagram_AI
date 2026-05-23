export type ShapeType = 'freehand' | 'line' | 'arrow' | 'rect' | 'roundedRect' | 'ellipse' | 'text';

export interface RecognizedShape {
  id: string;
  type: ShapeType;
  confidence: number;
  color: string;
  brushWidth: number;
  bounds: { x: number; y: number; width: number; height: number };
  controlPoints: number[]; // Snapped control points (e.g. start/end for line, bounds for rect)
  label?: string; // Voice label or manual edit
}

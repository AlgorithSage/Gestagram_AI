import React from 'react';
import { Line } from 'react-konva';

interface Props {
  points: number[];
  color: string;
  tool: string;
  brushWidth: number;
}

export const ActiveStrokeLayer: React.FC<Props> = ({ points, color, tool, brushWidth }) => {
  // If points are empty, don't render anything
  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      stroke={color}
      strokeWidth={brushWidth}
      tension={0.5} 
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation={
        tool === 'eraser' ? 'destination-out' : 'source-over'
      }
      shadowColor={tool === 'eraser' ? undefined : color}
      shadowBlur={tool === 'eraser' ? 0 : 8}
      shadowOpacity={tool === 'eraser' ? 0 : 0.4}
    />
  );
};

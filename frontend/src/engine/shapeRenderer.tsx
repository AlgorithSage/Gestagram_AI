import React from 'react';
import { Rect, Ellipse, Line, Arrow, Text, Group } from 'react-konva';
import type { RecognizedShape } from './types';
import DOMPurify from 'dompurify';

interface ShapeRendererProps {
  shape: RecognizedShape;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (id: string, newBounds: { x: number; y: number; width: number; height: number }, newControlPoints: number[]) => void;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  isSelected = false,
  onSelect,
  onDragEnd
}) => {
  const { id, type, color, brushWidth, bounds, controlPoints, label } = shape;
  
  // Custom drag handler to update coordinates in store
  const handleDragEnd = (e: any) => {
    if (!onDragEnd) return;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    let updatedBounds = { ...bounds, x: newX, y: newY };
    let updatedControlPoints = [...controlPoints];

    if (type === 'rect' || type === 'roundedRect') {
      updatedControlPoints = [newX, newY, bounds.width, bounds.height];
    } else if (type === 'ellipse') {
      // Ellipse controlPoints are [centerX, centerY, radiusX, radiusY]
      const rx = controlPoints[2];
      const ry = controlPoints[3];
      updatedControlPoints = [newX, newY, rx, ry];
      updatedBounds = {
        x: newX - rx,
        y: newY - ry,
        width: rx * 2,
        height: ry * 2
      };
    } else if (type === 'line' || type === 'arrow') {
      // Offset all control points by drag delta
      const dx = newX - bounds.x;
      const dy = newY - bounds.y;
      updatedControlPoints = [
        controlPoints[0] + dx,
        controlPoints[1] + dy,
        controlPoints[2] + dx,
        controlPoints[3] + dy
      ];
    } else if (type === 'freehand') {
      const dx = newX - bounds.x;
      const dy = newY - bounds.y;
      updatedControlPoints = [];
      for (let i = 0; i < controlPoints.length; i += 2) {
        updatedControlPoints.push(controlPoints[i] + dx, controlPoints[i+1] + dy);
      }
    }

    onDragEnd(id, updatedBounds, updatedControlPoints);
  };

  const commonProps = {
    id,
    stroke: color,
    strokeWidth: brushWidth,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    opacity: isSelected ? 0.8 : 1,
    shadowColor: isSelected ? '#00e5ff' : 'transparent',
    shadowBlur: isSelected ? 8 : 0,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: isSelected ? 0.6 : 0
  };

  // Render centered text label if present
  const renderLabel = (centerX: number, centerY: number, maxWidth?: number) => {
    if (!label) return null;
    return (
      <Text
        text={DOMPurify.sanitize(label)}
        x={centerX - (maxWidth ? maxWidth / 2 : 100)}
        y={centerY - 10}
        width={maxWidth ? maxWidth : 200}
        align="center"
        fontSize={15}
        fontFamily="'Space Grotesk', sans-serif"
        fill="#2D2D2D"
        fontStyle="bold"
        listening={false}
      />
    );
  };

  switch (type) {
    case 'rect':
      const [rx, ry, rw, rh] = controlPoints;
      return (
        <Group x={rx} y={ry} draggable onDragEnd={handleDragEnd}>
          <Rect
            {...commonProps}
            x={0}
            y={0}
            width={rw}
            height={rh}
            fill="rgba(255, 255, 255, 0.45)"
          />
          {renderLabel(rw / 2, rh / 2, rw)}
        </Group>
      );

    case 'roundedRect':
      const [rrx, rry, rrw, rrh] = controlPoints;
      return (
        <Group x={rrx} y={rry} draggable onDragEnd={handleDragEnd}>
          <Rect
            {...commonProps}
            x={0}
            y={0}
            width={rrw}
            height={rrh}
            cornerRadius={10}
            fill="rgba(255, 255, 255, 0.45)"
          />
          {renderLabel(rrw / 2, rrh / 2, rrw)}
        </Group>
      );

    case 'ellipse':
      const [cx, cy, radX, radY] = controlPoints;
      return (
        <Group x={cx} y={cy} draggable onDragEnd={handleDragEnd}>
          <Ellipse
            {...commonProps}
            x={0}
            y={0}
            radiusX={radX}
            radiusY={radY}
            fill="rgba(255, 255, 255, 0.45)"
          />
          {renderLabel(0, 0, radX * 1.6)}
        </Group>
      );

    case 'line':
      const [x1, y1, x2, y2] = controlPoints;
      // For lines, group is positioned at start point
      return (
        <Group x={bounds.x} y={bounds.y} draggable onDragEnd={handleDragEnd}>
          <Line
            {...commonProps}
            x={-bounds.x}
            y={-bounds.y}
            points={[x1, y1, x2, y2]}
          />
          {renderLabel((x1 + x2) / 2 - bounds.x, (y1 + y2) / 2 - bounds.y)}
        </Group>
      );

    case 'arrow':
      const [ax1, ay1, ax2, ay2] = controlPoints;
      return (
        <Group x={bounds.x} y={bounds.y} draggable onDragEnd={handleDragEnd}>
          <Arrow
            {...commonProps}
            x={-bounds.x}
            y={-bounds.y}
            points={[ax1, ay1, ax2, ay2]}
            pointerLength={14}
            pointerWidth={14}
            fill={color}
          />
          {renderLabel((ax1 + ax2) / 2 - bounds.x, (ay1 + ay2) / 2 - bounds.y)}
        </Group>
      );

    case 'text':
      return (
        <Group x={bounds.x} y={bounds.y} draggable onDragEnd={handleDragEnd}>
          {/* Transparent hit box for easy dragging of raw text */}
          <Rect
            x={0}
            y={0}
            width={bounds.width || 120}
            height={bounds.height || 36}
            fill="transparent"
            onClick={onSelect}
            onTap={onSelect}
          />
          {renderLabel(bounds.width / 2, bounds.height / 2, bounds.width || 120)}
        </Group>
      );

    case 'freehand':
    default:
      return (
        <Group x={bounds.x} y={bounds.y} draggable onDragEnd={handleDragEnd}>
          <Line
            {...commonProps}
            x={-bounds.x}
            y={-bounds.y}
            points={controlPoints}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
          {renderLabel(bounds.width / 2, bounds.height / 2)}
        </Group>
      );
  }
};

import React from 'react';
import { Layer } from 'react-konva';
import { useCanvasStore } from '../../store/canvasStore';
import { ShapeRenderer } from '../../engine/shapeRenderer';
import { socket } from '../../socket';

export const ShapeLayer: React.FC = () => {
  const { shapes, selectedShapeId, setSelectedShapeId, updateShape } = useCanvasStore();

  const handleDragEnd = (id: string, newBounds: any, newControlPoints: number[]) => {
    updateShape(id, { bounds: newBounds, controlPoints: newControlPoints });
    
    // Sync the dragged shape to other users in the room
    const boardId = window.location.hash.replace('#', '');
    if (boardId) {
      const updatedShape = useCanvasStore.getState().shapes.find(s => s.id === id);
      if (updatedShape) {
        socket.emit('add_shape', {
          boardId,
          shape: updatedShape
        });
      }
    }
  };

  return (
    <Layer>
      {shapes.map((shape) => (
        <ShapeRenderer
          key={shape.id}
          shape={shape}
          isSelected={selectedShapeId === shape.id}
          onSelect={() => setSelectedShapeId(shape.id)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </Layer>
  );
};

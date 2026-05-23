import type { RecognizedShape } from './types';

// Helper: Calculate Euclidean distance
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Helper: Calculate total path length of a stroke
function getPathLength(points: number[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 2; i += 2) {
    length += getDistance(points[i], points[i+1], points[i+2], points[i+3]);
  }
  return length;
}

// Resample the stroke into N evenly spaced points
function resample(points: number[], n: number): number[] {
  if (points.length < 4) return points;
  const totalLength = getPathLength(points);
  const targetLen = totalLength / (n - 1);
  if (targetLen === 0) return points;
  
  const resampled: number[] = [points[0], points[1]];
  let accumulatedDist = 0;
  
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i], y1 = points[i+1];
    const x2 = points[i+2], y2 = points[i+3];
    const d = getDistance(x1, y1, x2, y2);
    
    if (accumulatedDist + d >= targetLen) {
      let currentDist = d;
      let prevX = x1, prevY = y1;
      while (accumulatedDist + currentDist >= targetLen) {
        const t = (targetLen - accumulatedDist) / currentDist;
        const newX = prevX + t * (x2 - prevX);
        const newY = prevY + t * (y2 - prevY);
        resampled.push(newX, newY);
        currentDist = getDistance(newX, newY, x2, y2);
        prevX = newX;
        prevY = newY;
        accumulatedDist = 0;
      }
      accumulatedDist = currentDist;
    } else {
      accumulatedDist += d;
    }
  }
  
  // Ensure we get exactly N points due to float precision
  while (resampled.length < n * 2) {
    resampled.push(points[points.length - 2], points[points.length - 1]);
  }
  if (resampled.length > n * 2) {
    resampled.splice(n * 2);
  }
  return resampled;
}

// Main recognizer class
export class ShapeRecognizer {
  /**
   * Classifies a freehand stroke represented as a flat array of points [x1, y1, x2, y2, ...]
   * Returns a RecognizedShape structure with the best matched shape and confidence score.
   */
  static recognize(points: number[], color: string, brushWidth: number): RecognizedShape {
    const originalPoints = [...points];
    const shapeId = 'shape_' + Math.random().toString(36).substring(2, 9);
    
    if (points.length < 4) {
      return {
        id: shapeId,
        type: 'freehand',
        confidence: 1.0,
        color,
        brushWidth,
        bounds: this.getBounds(points),
        controlPoints: originalPoints
      };
    }

    // Compute bounding box and dimensions
    const bounds = this.getBounds(points);
    const { x, y, width, height } = bounds;
    const diagonal = Math.sqrt(width ** 2 + height ** 2);
    
    if (diagonal < 10) {
      return {
        id: shapeId,
        type: 'freehand',
        confidence: 1.0,
        color,
        brushWidth,
        bounds,
        controlPoints: originalPoints
      };
    }

    // 1. Resample to 64 points for normalized geometric checks
    const N = 64;
    const resampledPoints = resample(points, N);
    const totalPathLen = getPathLength(points);
    
    const startX = points[0];
    const startY = points[1];
    const endX = points[points.length - 2];
    const endY = points[points.length - 1];
    const startEndDist = getDistance(startX, startY, endX, endY);
    
    // 2. Linearity Check
    const linearity = startEndDist / totalPathLen;
    
    // 3. Open vs Closed check
    const isClosed = startEndDist < 0.22 * Math.max(width, height);

    // --- LINE CLASSIFICATION ---
    if (linearity > 0.93) {
      return {
        id: shapeId,
        type: 'line',
        confidence: linearity,
        color,
        brushWidth,
        bounds,
        controlPoints: [startX, startY, endX, endY]
      };
    }

    // --- ARROW CLASSIFICATION ---
    // An arrow is usually drawn in a single stroke like a line, but then has a sharp double-back (V-shape) at one end.
    // Let's analyze the end of the stroke (last 20% of points) to see if there is a sharp corner and reversal of direction.
    const isArrow = this.detectArrowPattern(resampledPoints, linearity, isClosed);
    if (isArrow) {
      return {
        id: shapeId,
        type: 'arrow',
        confidence: 0.85,
        color,
        brushWidth,
        bounds,
        controlPoints: [startX, startY, endX, endY]
      };
    }

    // --- CLOSED SHAPES: Ellipse, Rect, RoundedRect ---
    if (isClosed) {
      // Calculate center of gravity
      let sumX = 0, sumY = 0;
      for (let i = 0; i < resampledPoints.length; i += 2) {
        sumX += resampledPoints[i];
        sumY += resampledPoints[i+1];
      }
      const centerX = sumX / N;
      const centerY = sumY / N;
      const radiusX = width / 2;
      const radiusY = height / 2;

      // Ellipse fit metric: (dx/rx)^2 + (dy/ry)^2 should be close to 1
      let ellipseDevSum = 0;
      for (let i = 0; i < resampledPoints.length; i += 2) {
        const dx = resampledPoints[i] - centerX;
        const dy = resampledPoints[i+1] - centerY;
        const val = (dx / (radiusX || 1)) ** 2 + (dy / (radiusY || 1)) ** 2;
        ellipseDevSum += Math.abs(val - 1);
      }
      const ellipseError = ellipseDevSum / N; // lower is better
      const ellipseConfidence = Math.max(0, 1 - ellipseError * 1.5);

      // Rect fit: distance to nearest bounding box boundary
      let rectDevSum = 0;
      for (let i = 0; i < resampledPoints.length; i += 2) {
        const px = resampledPoints[i];
        const py = resampledPoints[i+1];
        const dLeft = Math.abs(px - x);
        const dRight = Math.abs(px - (x + width));
        const dTop = Math.abs(py - y);
        const dBottom = Math.abs(py - (y + height));
        const minDist = Math.min(dLeft, dRight, dTop, dBottom);
        rectDevSum += minDist;
      }
      const averageRectDist = rectDevSum / N;
      const rectFillRatio = averageRectDist / (diagonal || 1);
      const rectConfidence = Math.max(0, 1 - rectFillRatio * 8.0);

      // Corner proximity check to distinguish perfect Rect from RoundedRect
      // Real rectangles have points that get very close to the extreme corners
      let hasTopLeft = false, hasTopRight = false, hasBottomLeft = false, hasBottomRight = false;
      const cornerThreshold = diagonal * 0.18;
      
      for (let i = 0; i < resampledPoints.length; i += 2) {
        const px = resampledPoints[i];
        const py = resampledPoints[i+1];
        if (getDistance(px, py, x, y) < cornerThreshold) hasTopLeft = true;
        if (getDistance(px, py, x + width, y) < cornerThreshold) hasTopRight = true;
        if (getDistance(px, py, x, y + height) < cornerThreshold) hasBottomLeft = true;
        if (getDistance(px, py, x + width, y + height) < cornerThreshold) hasBottomRight = true;
      }
      
      const cornerScore = (hasTopLeft ? 1 : 0) + (hasTopRight ? 1 : 0) + (hasBottomLeft ? 1 : 0) + (hasBottomRight ? 1 : 0);

      // Classification decision for closed shapes
      if (ellipseConfidence > 0.82 && ellipseConfidence > rectConfidence) {
        return {
          id: shapeId,
          type: 'ellipse',
          confidence: ellipseConfidence,
          color,
          brushWidth,
          bounds,
          controlPoints: [x + radiusX, y + radiusY, radiusX, radiusY]
        };
      }

      if (rectConfidence > 0.70) {
        // If it fits a rectangle well, but corners are rounded/missed (cornerScore < 4) or standard deviation of corner distance is high
        const isRounded = cornerScore < 4 || (rectConfidence > 0.75 && ellipseConfidence > 0.65);
        return {
          id: shapeId,
          type: isRounded ? 'roundedRect' : 'rect',
          confidence: rectConfidence,
          color,
          brushWidth,
          bounds,
          controlPoints: [x, y, width, height]
        };
      }
    }

    // Default to freehand if no geometric shape matches with high confidence
    return {
      id: shapeId,
      type: 'freehand',
      confidence: 1.0,
      color,
      brushWidth,
      bounds,
      controlPoints: originalPoints
    };
  }

  // Detects if a stroke is an arrow by looking for a sharp turn near the end
  private static detectArrowPattern(resampled: number[], linearity: number, isClosed: boolean): boolean {
    if (isClosed || linearity < 0.65) return false;
    
    // An arrow has a shaft and a head.
    // Let's look at the angles of segments in the last 20% of the points.
    // If there is a sharp angle (e.g. < 60 degrees) and then the path reverses back, it's likely an arrowhead.
    const N = resampled.length / 2;
    const lastSectionStart = Math.floor(N * 0.75) * 2;
    
    let hasSharpTurn = false;
    for (let i = lastSectionStart; i < resampled.length - 4; i += 2) {
      const x1 = resampled[i], y1 = resampled[i+1];
      const x2 = resampled[i+2], y2 = resampled[i+3];
      const x3 = resampled[i+4], y3 = resampled[i+5];
      
      const v1x = x2 - x1, v1y = y2 - y1;
      const v2x = x3 - x2, v2y = y3 - y2;
      
      const len1 = Math.sqrt(v1x**2 + v1y**2);
      const len2 = Math.sqrt(v2x**2 + v2y**2);
      if (len1 === 0 || len2 === 0) continue;
      
      const dot = v1x * v2x + v1y * v2y;
      const cosAngle = dot / (len1 * len2);
      
      // If angle between segments is very sharp (cosAngle < -0.4, meaning > 110 degrees turn)
      if (cosAngle < -0.4) {
        hasSharpTurn = true;
        break;
      }
    }
    
    return hasSharpTurn;
  }

  // Get bounding box of a stroke
  private static getBounds(points: number[]) {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    let minX = points[0], maxX = points[0];
    let minY = points[1], maxY = points[1];
    for (let i = 0; i < points.length; i += 2) {
      const px = points[i];
      const py = points[i+1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

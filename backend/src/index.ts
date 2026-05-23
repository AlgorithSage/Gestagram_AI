import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS lockdown origin validation
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  }
}));
app.use(express.json());

// ---------------- DATABASE PERSISTENCE LAYER ----------------
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gestagram';
const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 3000 // Fast fail if local database is inactive
});

let isDbConnected = false;

// Graceful Schema Initialization
pool.query('SELECT NOW()')
  .then(async () => {
    console.log('✅ PostgreSQL service connected successfully.');
    isDbConnected = true;
    
    // Auto-create shapes storage schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shapes (
        id VARCHAR(255) PRIMARY KEY,
        board_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        color VARCHAR(50) NOT NULL,
        brush_width INT NOT NULL,
        bounds JSONB NOT NULL,
        control_points DOUBLE PRECISION[] NOT NULL,
        label TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_shapes_board ON shapes(board_id);
    `);
    console.log('✅ PostgreSQL shapes table initialized.');
  })
  .catch((err) => {
    console.warn('⚠️ WARNING: PostgreSQL was not reached. Falling back to IN-MEMORY persistence.', err.message);
  });

// In-Memory Repository Fallback (Active if DB is offline)
const inMemoryShapes: Record<string, any[]> = {};

async function saveShape(boardId: string, shape: any) {
  if (isDbConnected) {
    try {
      await pool.query(`
        INSERT INTO shapes (id, board_id, type, color, brush_width, bounds, control_points, label)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE 
        SET type = $3, color = $4, brush_width = $5, bounds = $6, control_points = $7, label = $8
      `, [
        shape.id,
        boardId,
        shape.type,
        shape.color,
        shape.brushWidth,
        JSON.stringify(shape.bounds),
        shape.controlPoints,
        shape.label || null
      ]);
      return;
    } catch (err: any) {
      console.error('Failed to commit shape to Database:', err.message);
    }
  }

  // Memory fallback logic
  if (!inMemoryShapes[boardId]) {
    inMemoryShapes[boardId] = [];
  }
  const idx = inMemoryShapes[boardId].findIndex((s) => s.id === shape.id);
  if (idx > -1) {
    inMemoryShapes[boardId][idx] = shape;
  } else {
    inMemoryShapes[boardId].push(shape);
  }
}

async function getShapes(boardId: string): Promise<any[]> {
  if (isDbConnected) {
    try {
      const res = await pool.query('SELECT * FROM shapes WHERE board_id = $1', [boardId]);
      return res.rows.map((row) => ({
        id: row.id,
        type: row.type,
        color: row.color,
        brushWidth: row.brush_width,
        bounds: typeof row.bounds === 'string' ? JSON.parse(row.bounds) : row.bounds,
        controlPoints: row.control_points,
        label: row.label || undefined
      }));
    } catch (err: any) {
      console.error('Failed to query shapes from Database:', err.message);
    }
  }
  return inMemoryShapes[boardId] || [];
}

async function clearBoardShapes(boardId: string) {
  if (isDbConnected) {
    try {
      await pool.query('DELETE FROM shapes WHERE board_id = $1', [boardId]);
      return;
    } catch (err: any) {
      console.error('Failed to clear shapes from Database:', err.message);
    }
  }
  inMemoryShapes[boardId] = [];
}

// Basic Health Route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    dbConnected: isDbConnected,
    timestamp: new Date().toISOString() 
  });
});

// Real-Time Engine (Socket.IO)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_board', async (data: { boardId: string; userId: string }) => {
    // 1. Strict payload validation
    if (!data || typeof data.boardId !== 'string' || typeof data.userId !== 'string') {
      console.warn('Dropped malformed join_board payload:', data);
      return;
    }

    const { boardId, userId } = data;
    socket.join(boardId);
    console.log(`User ${userId} joined room ${boardId}`);

    // Broadcast join notification to others in the room
    socket.to(boardId).emit('user_joined', { userId });

    // 2. Fetch and feed historical shapes from persistence layer to the newly joined client
    const boardHistory = await getShapes(boardId);
    socket.emit('load_shapes', boardHistory);
  });

  socket.on('draw_stroke', (data: { 
    boardId: string; 
    points: number[]; 
    color: string; 
    tool: string; 
    brushWidth: number; 
    isFinished: boolean; 
  }) => {
    // Strict input validation
    if (!data || typeof data.boardId !== 'string' || !Array.isArray(data.points)) {
      return;
    }

    socket.to(data.boardId).emit('stroke_update', {
      userId: socket.id,
      points: data.points,
      color: data.color,
      tool: data.tool,
      brushWidth: data.brushWidth,
      isFinished: data.isFinished
    });
  });

  socket.on('add_shape', async (data: { boardId: string; shape: any }) => {
    // Strict input validation
    if (!data || typeof data.boardId !== 'string' || !data.shape || typeof data.shape.id !== 'string') {
      console.warn('Dropped malformed add_shape payload:', data);
      return;
    }

    // 3. Persist the snapping shape locally or inside PostgreSQL database
    await saveShape(data.boardId, data.shape);

    // Broadcast shapes update to the rest of the board subscribers
    socket.to(data.boardId).emit('shape_added', data.shape);
    console.log(`Shape ${data.shape.id} snapped and persisted on room ${data.boardId}`);
  });

  socket.on('sync_shape_label', async (data: { boardId: string; id: string; label: string }) => {
    // Strict input validation
    if (!data || typeof data.boardId !== 'string' || typeof data.id !== 'string' || typeof data.label !== 'string') {
      return;
    }

    // Fetch, update label, and persist changes
    const currentShapes = await getShapes(data.boardId);
    const target = currentShapes.find(s => s.id === data.id);
    if (target) {
      target.label = data.label;
      await saveShape(data.boardId, target);
    }

    socket.to(data.boardId).emit('shape_label_synced', { id: data.id, label: data.label });
  });

  socket.on('clear_board', async (data: { boardId: string }) => {
    // Strict input validation
    if (!data || typeof data.boardId !== 'string') {
      return;
    }

    // 4. Wipe persistent shape files or DB rows belonging to this room
    await clearBoardShapes(data.boardId);

    socket.to(data.boardId).emit('board_cleared');
    console.log(`Board ${data.boardId} cleared by client ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Gestagram AI Core Service Layer Active`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`========================================\n`);
});

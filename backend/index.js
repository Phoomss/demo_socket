const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// CREATE
app.post('/posts', async (req, res) => {
  const { title, content } = req.body;
  try {
    const post = await prisma.post.create({ data: { title, content } });
    io.emit('postCreated', post); // แจ้ง Client ว่ามีโพสต์ใหม่
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// READ (Real-time updates for all posts)
app.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany();
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// UPDATE
app.put('/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });
    io.emit('postUpdated', post); // แจ้ง Client ว่ามีโพสต์ที่ถูกแก้ไข
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE
app.delete('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.post.delete({ where: { id: parseInt(id) } });
    io.emit('postDeleted', parseInt(id)); // แจ้ง Client ว่ามีโพสต์ที่ถูกลบ
    res.json({ success: true, id: parseInt(id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(4000, () => console.log('Server running on port 4000'));

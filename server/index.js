const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const socketio = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// User and Message models (simplified)
const UserSchema = new mongoose.Schema({ username: String, password: String, online: Boolean });
const MessageSchema = new mongoose.Schema({ from: String, to: String, text: String, read: Boolean, timestamp: Date });
const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// JWT middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash, online: false });
  await user.save();
  res.json({ message: 'Registered' });
});

app.post('/auth/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.sendStatus(401);
  const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get('/users', authenticateToken, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

app.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const messages = await Message.find({
    $or: [
      { from: req.user.id, to: req.params.id },
      { from: req.params.id, to: req.user.id }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
});

// Socket.IO events
io.on('connection', (socket) => {
  socket.on('login', (userId) => {
    User.findByIdAndUpdate(userId, { online: true }).exec();
    socket.join(userId);
    io.emit('status:update', { userId, online: true });
  });

  socket.on('disconnect', async () => {
    // mark user offline (implement me)
    // io.emit('status:update', { userId, online: false });
  });

  socket.on('message:send', async (data) => {
    const msg = new Message({...data, read: false, timestamp: new Date()});
    await msg.save();
    io.to(data.to).emit('message:new', msg);
    socket.emit('message:new', msg);
  });

  socket.on('typing:start', (to) => io.to(to).emit('typing:start', socket.id));
  socket.on('typing:stop', (to) => io.to(to).emit('typing:stop', socket.id));

  socket.on('message:read', async (msgId) => {
    await Message.findByIdAndUpdate(msgId, {read: true});
    // Notify sender (implement if needed)
  });
});

server.listen(3000, () => console.log('Server started'));

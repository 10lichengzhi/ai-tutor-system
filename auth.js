/**
 * 用户认证模块
 * 处理注册、登录、JWT 令牌验证
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername, getUserById } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'ai-tutor-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * 生成 JWT 令牌
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 验证 JWT 令牌，返回用户信息或 null
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    // 支持 "Bearer xxx" 格式
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.id);
    return user || null;
  } catch (e) {
    return null;
  }
}

/**
 * 从请求中提取用户
 */
function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'];
  return verifyToken(authHeader);
}

/**
 * 注册
 */
function handleRegister(body) {
  const { username, password, nickname } = body;

  if (!username || !password) {
    return { status: 400, data: { code: -1, message: '用户名和密码不能为空' } };
  }

  if (username.length < 2 || username.length > 20) {
    return { status: 400, data: { code: -1, message: '用户名长度需为2-20个字符' } };
  }

  if (password.length < 6) {
    return { status: 400, data: { code: -1, message: '密码长度不能少于6位' } };
  }

  // 检查用户名是否已存在
  const existing = getUserByUsername(username);
  if (existing) {
    return { status: 409, data: { code: -1, message: '该用户名已被注册' } };
  }

  // 哈希密码
  const saltRounds = 10;
  const passwordHash = bcrypt.hashSync(password, saltRounds);

  // 创建用户
  const user = createUser(username, passwordHash, nickname);
  const token = generateToken(user);

  return {
    status: 200,
    data: {
      code: 0,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
    },
  };
}

/**
 * 登录
 */
function handleLogin(body) {
  const { username, password } = body;

  if (!username || !password) {
    return { status: 400, data: { code: -1, message: '用户名和密码不能为空' } };
  }

  const user = getUserByUsername(username);
  if (!user) {
    return { status: 401, data: { code: -1, message: '用户名或密码错误' } };
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return { status: 401, data: { code: -1, message: '用户名或密码错误' } };
  }

  const token = generateToken(user);

  return {
    status: 200,
    data: {
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
    },
  };
}

/**
 * 获取当前用户信息
 */
function handleMe(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return { status: 401, data: { code: -1, message: '未登录或登录已过期' } };
  }
  return {
    status: 200,
    data: {
      code: 0,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        created_at: user.created_at,
      },
    },
  };
}

module.exports = {
  generateToken,
  verifyToken,
  getUserFromRequest,
  handleRegister,
  handleLogin,
  handleMe,
};

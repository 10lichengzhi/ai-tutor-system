/**
 * SQLite 数据库模块
 * 使用 better-sqlite3 管理用户数据
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = process.env.TUTOR_DB_PATH
  ? (path.isAbsolute(process.env.TUTOR_DB_PATH) ? process.env.TUTOR_DB_PATH : path.join(__dirname, process.env.TUTOR_DB_PATH))
  : path.join(__dirname, 'data', 'users.db');

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// 启用 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');

// 初始化用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

/**
 * 生成唯一用户ID
 */
function generateUserId() {
  return 'u_' + crypto.randomUUID();
}

/**
 * 创建用户
 */
function createUser(username, passwordHash, nickname) {
  const id = generateUserId();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, nickname, avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, username, passwordHash, nickname || username, '', now, now);
  return { id, username, nickname: nickname || username, avatar: '', created_at: now };
}

/**
 * 根据用户名查找用户
 */
function getUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

/**
 * 根据ID查找用户
 */
function getUserById(id) {
  const stmt = db.prepare('SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * 更新用户信息
 */
function updateUser(id, updates) {
  const user = getUserById(id);
  if (!user) return null;
  const now = new Date().toISOString();
  const nickname = updates.nickname !== undefined ? updates.nickname : user.nickname;
  const avatar = updates.avatar !== undefined ? updates.avatar : user.avatar;
  const stmt = db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = ? WHERE id = ?');
  stmt.run(nickname, avatar, now, id);
  return getUserById(id);
}

module.exports = {
  db,
  generateUserId,
  createUser,
  getUserByUsername,
  getUserById,
  updateUser,
};

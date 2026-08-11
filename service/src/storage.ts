import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type Project = {
  id: string;
  name: string;
  folderPath: string;
  createdAt: string;
};

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  projects: Project[];
};

type SessionRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: number;
};

type StorageShape = {
  users: UserRecord[];
};

type SessionStorageShape = {
  sessions: SessionRecord[];
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const DATA_DIRECTORY = resolve(process.env.OUTREACH_DATA_DIR ?? join(process.cwd(), 'data'));
const USERS_FILE = join(DATA_DIRECTORY, 'users.json');
const SESSIONS_FILE = join(DATA_DIRECTORY, 'sessions.json');

function ensureDataDirectory() {
  mkdirSync(DATA_DIRECTORY, { recursive: true });
}

function readJson<T>(filePath: string, fallback: T): T {
  ensureDataDirectory();
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function writeJson<T>(filePath: string, value: T) {
  ensureDataDirectory();
  const temporaryPath = `${filePath}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryPath, filePath);
}

function readUsers(): StorageShape {
  return readJson<StorageShape>(USERS_FILE, { users: [] });
}

function writeUsers(storage: StorageShape) {
  writeJson(USERS_FILE, storage);
}

function readSessions(): SessionStorageShape {
  return readJson<SessionStorageShape>(SESSIONS_FILE, { sessions: [] });
}

function writeSessions(storage: SessionStorageShape) {
  writeJson(SESSIONS_FILE, storage);
}

export function publicUser(user: UserRecord) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [, salt, expectedHex] = passwordHash.split('$');
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const storage = readUsers();
  if (storage.users.some((user) => user.email === normalizedEmail)) return null;

  const user: UserRecord = {
    id: randomBytes(16).toString('hex'),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    projects: [],
  };
  storage.users.push(user);
  writeUsers(storage);
  return user;
}

export function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = readUsers().users.find((candidate) => candidate.email === normalizedEmail);
  return user && verifyPassword(password, user.passwordHash) ? user : null;
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const storage = readSessions();
  const now = Date.now();
  storage.sessions = storage.sessions.filter((session) => session.expiresAt > now);
  storage.sessions.push({
    tokenHash: createHash('sha256').update(token).digest('hex'),
    userId,
    expiresAt: now + SESSION_TTL_MS,
  });
  writeSessions(storage);
  return token;
}

export function getUserForSession(token: string | undefined) {
  if (!token) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = readSessions().sessions.find(
    (candidate) => candidate.tokenHash === tokenHash && candidate.expiresAt > Date.now(),
  );
  if (!session) return null;
  return readUsers().users.find((user) => user.id === session.userId) ?? null;
}

export function deleteSession(token: string | undefined) {
  if (!token) return;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const storage = readSessions();
  storage.sessions = storage.sessions.filter((session) => session.tokenHash !== tokenHash);
  writeSessions(storage);
}

export function listProjects(userId: string) {
  return readUsers().users.find((user) => user.id === userId)?.projects ?? [];
}

export function addProject(userId: string, name: string, folderPath: string) {
  const storage = readUsers();
  const user = storage.users.find((candidate) => candidate.id === userId);
  if (!user) return null;
  const project: Project = {
    id: randomBytes(12).toString('hex'),
    name: name.trim(),
    folderPath: folderPath.trim(),
    createdAt: new Date().toISOString(),
  };
  user.projects.push(project);
  writeUsers(storage);
  return project;
}

export function deleteProject(userId: string, projectId: string) {
  const storage = readUsers();
  const user = storage.users.find((candidate) => candidate.id === userId);
  if (!user) return false;
  const before = user.projects.length;
  user.projects = user.projects.filter((project) => project.id !== projectId);
  if (user.projects.length === before) return false;
  writeUsers(storage);
  return true;
}

export function getStoragePaths() {
  return { dataDirectory: DATA_DIRECTORY, usersFile: USERS_FILE, sessionsFile: SESSIONS_FILE };
}

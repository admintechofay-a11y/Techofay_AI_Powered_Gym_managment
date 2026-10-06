import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct mongodb-memory-server to use the already downloaded binary in workspace root
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../../../node_modules/.cache/mongodb-memory-server');
process.env.MONGOMS_SYSTEM_BINARY = path.resolve(__dirname, '../../../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe');
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_super_secure_32_characters_123';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_super_secure_32_characters_456';
process.env.COOKIE_SECRET = 'test_cookie_secret_super_secure_32_characters_789';

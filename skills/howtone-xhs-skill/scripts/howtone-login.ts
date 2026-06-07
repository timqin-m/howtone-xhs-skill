/**
 * Howtone 凭证保存脚本
 * 支持通过 Kimi WebBridge 控制用户的真实 Chrome 浏览器弹出「好痛 Howtone」登录页自动获取 Token，
 * 也支持直接接收用户提供的同步 Token，并保存到 .zion/credentials.yaml
 * 
 * 用法:
 *   自动登录获取: npx ts-node howtone-login.ts
 *   手动指定保存: npx ts-node howtone-login.ts --token="你的同步Token"
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_EX_ID = 'rmLyJ0ZJXK8';
const CRED_PATH = path.resolve(process.cwd(), '.zion', 'credentials.yaml');
const WEBBRIDGE_URL = 'http://127.0.0.1:10086/command';
const SESSION = 'howtone-login';

function send(action: string, args: Record<string, any>): any {
  const body = JSON.stringify({ action, args, session: SESSION });
  const tmpFile = `/tmp/howtone-wb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  fs.writeFileSync(tmpFile, body);
  try {
    const res = execSync(
      `curl -s -X POST ${WEBBRIDGE_URL} -H 'Content-Type: application/json' -d @${tmpFile}`,
      { encoding: 'utf-8', timeout: 60000 }
    );
    try {
      return JSON.parse(res);
    } catch {
      return { error: res };
    }
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureWebBridge(): Promise<boolean> {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? 'kimi-webbridge.exe' : 'kimi-webbridge';
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const wbPath = path.join(homeDir, '.kimi-webbridge', 'bin', binaryName);
  
  // 1. Check if executable exists
  if (!fs.existsSync(wbPath)) {
    console.log('🔍 未检测到 Kimi WebBridge 安装，正在为您自动下载并安装...');
    try {
      if (isWin) {
        execSync('powershell -Command "irm https://cdn.kimi.com/webbridge/install.ps1 | iex"', { stdio: 'inherit' });
      } else {
        execSync('curl -fsSL https://cdn.kimi.com/webbridge/install.sh | bash', { stdio: 'inherit' });
      }
      console.log('✅ Kimi WebBridge 安装成功！');
    } catch (err) {
      console.error('❌ 自动安装失败，请手动执行以下安装命令：');
      if (isWin) {
        console.error('   irm https://cdn.kimi.com/webbridge/install.ps1 | iex');
      } else {
        console.error('   curl -fsSL https://cdn.kimi.com/webbridge/install.sh | bash');
      }
      return false;
    }
  }

  // 2. Check status / Start WebBridge
  let statusOk = false;
  try {
    const status = execSync(`"${wbPath}" status`, { encoding: 'utf-8', timeout: 3000 });
    const parsed = JSON.parse(status);
    statusOk = parsed.running === true;
  } catch {}

  if (!statusOk) {
    console.log('🔌 Kimi WebBridge 处于关闭状态，正在为您启动后台服务...');
    try {
      execSync(`"${wbPath}" start`, { stdio: 'inherit' });
      await sleep(2000); // Wait for startup
    } catch (err) {
      console.error('❌ 启动 Kimi WebBridge 失败，请尝试在终端手动运行：');
      console.error(`   "${wbPath}" start`);
      return false;
    }
  }

  // 3. Check browser extension connection
  try {
    const status = execSync(`"${wbPath}" status`, { encoding: 'utf-8', timeout: 3000 });
    const parsed = JSON.parse(status);
    if (parsed.running === true && parsed.extension_connected === true) {
      return true;
    } else if (parsed.running === true && parsed.extension_connected !== true) {
      console.error('\n⚠️  Kimi WebBridge 已运行，但【未连接到浏览器插件】！');
      console.error('👉 请确保：');
      console.error('   1. 您已在 Chrome 浏览器安装 Kimi WebBridge 插件：');
      console.error('      https://chromewebstore.google.com/detail/kimi-webbridge/fldmhceldgbpfpkbgopacenieobmligc');
      console.error('   2. 您的 Chrome 浏览器处于打开状态');
      console.error('   3. 点击插件图标，确保其显示为“已连接”');
      return false;
    }
  } catch {}

  return false;
}

function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * 通过 WebBridge 自动捕获 Token
 */
async function acquireTokenViaWebBridge(): Promise<string> {
  console.log('Checking WebBridge status...');
  const healthy = await ensureWebBridge();
  if (!healthy) {
    throw new Error('WebBridge 未准备就绪，请先排查连接问题。');
  }
  console.log('✅ WebBridge 已连接');

  const url = 'https://howtone.cn/login';
  console.log('正在您的浏览器中打开「好痛 Howtone」登录页...');
  send('navigate', { url, newTab: true, group_title: '好痛登录' });
  await sleep(4000);

  // 辅助函数：从页面 storage 中提取 JWT
  const extractJwt = () => {
    try {
      const res = send('evaluate', {
        code: `(() => {
          const isJwt = (val) => {
            if (!val) return false;
            const parts = val.split('.');
            return parts.length === 3 && val.startsWith('eyJ');
          };

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const val = localStorage.getItem(key);
              if (isJwt(val)) return val;
            }
          }

          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key) {
              const val = sessionStorage.getItem(key);
              if (isJwt(val)) return val;
            }
          }
          return null;
        })()`
      });

      const foundToken = res.data?.value;
      if (foundToken) {
        const payload = decodeJwt(foundToken);
        if (payload && (payload.userId || payload.user_id || payload.sub)) {
          return foundToken;
        }
      }
    } catch {
      // 忽略
    }
    return null;
  };

  // 先检查是否已经登录
  let token = extractJwt();
  if (token) {
    console.log('✨ 检测到您的浏览器已处于登录状态，正在自动同步凭证...');
    send('close_session', {});
    return token;
  }

  console.log('\n👉 提示：未检测到登录状态，请在您的 Chrome 浏览器中登录「好痛 Howtone」');
  console.log('👉 登录成功后，系统会自动捕获 Token，无需手动复制。');
  console.log('（如已登录但未检测到，可以尝试在页面内点击刷新或重新登录）\n');

  // 轮询（最长等待 3 分钟）
  const startTime = Date.now();
  const timeoutMs = 180000;

  while (!token && (Date.now() - startTime) < timeoutMs) {
    await sleep(2000);
    token = extractJwt();
  }

  if (!token) {
    throw new Error('获取 Token 超时（180秒），请重试。');
  }

  // 关闭会话/标签页
  send('close_session', {});
  return token;
}

async function main() {
  const args = process.argv.slice(2);
  let token = args.find(a => a.startsWith('--token='))?.split('=')[1];

  if (!token) {
    console.log('💡 未检测到 --token 参数，将通过 Kimi WebBridge 自动登录您的 Chrome 浏览器并获取 Token...');
    try {
      token = await acquireTokenViaWebBridge();
    } catch (err) {
      console.error('❌ 自动获取 Token 失败:', (err as Error).message);
      console.log('\n💡 您仍然可以通过手动指定 Token 的方式登录：');
      console.log('   npx ts-node howtone-login.ts --token="你的同步Token"');
      process.exit(1);
    }
  }

  console.log(`正在保存「好痛 Howtone」同步 Token...`);

  // 解析 Token 获取基本信息
  const jwtPayload = decodeJwt(token);
  let username = '情报员';
  let userId = '';
  let expiryDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 默认 7 天

  if (jwtPayload) {
    userId = jwtPayload.userId || jwtPayload.user_id || jwtPayload.sub || '';
    if (jwtPayload.username) username = jwtPayload.username;
    else if (jwtPayload.name) username = jwtPayload.name;
    else if (jwtPayload.userId) username = `用户_${jwtPayload.userId}`;
    
    if (jwtPayload.exp) {
      expiryDate = new Date(jwtPayload.exp * 1000).toISOString();
    }
  }

  try {
    // 确保 .zion 目录存在
    if (!fs.existsSync(path.dirname(CRED_PATH))) {
      fs.mkdirSync(path.dirname(CRED_PATH), { recursive: true });
    }

    const newCreds = `
project:
  exId: "${PROJECT_EX_ID}"
  admin_token:
    token: "${token}"
    expiry: "${expiryDate}"
account:
  username: "${username}"
  user_id: "${userId}"
`;
    fs.writeFileSync(CRED_PATH, newCreds.trim());
    console.log(`\n✅ 同步 Token 保存成功！`);
    console.log(`🚀 弦外 Overtone 已就绪，准备好捕获商机了吗？`);
    console.log(`✨ 凭据已保存到: ${CRED_PATH}`);
  } catch (err) {
    console.error('❌ 保存凭证文件失败:', (err as Error).message);
    process.exit(1);
  }
}

main();
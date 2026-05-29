# deepseek-2api

将 DeepSeek 网页聊天接口转换为 OpenAI 兼容 API 的代理服务器。支持多 Token 池管理、动态添加令牌、Web 管理面板和 Docker 部署。

## 特性

- 🚀 **OpenAI 兼容** - 完全兼容 OpenAI API 格式，可无缝对接现有应用
- 🔄 **DeepSeek 原生格式** - 同时支持 DeepSeek 原生 API 格式
- 🎯 **多 Token 池管理** - 支持多个 DeepSeek Token，自动负载均衡
- 🔐 **账号密码登录** - 支持邮箱密码登录，自动获取 Token
- 🖥️ **Web 管理面板** - 可视化管理 Token，支持热添加/删除
- 🐳 **Docker 部署** - 一键容器化部署，支持 docker-compose
- 📊 **Token 健康检查** - 自动检测失效 Token，支持账号自动刷新
- 🎨 **视觉模型支持** - 支持图片上传和多模态对话
- 📈 **请求队列** - FIFO 队列管理，防止并发超限
- 🔒 **API 鉴权** - 支持自定义 API Key 保护服务
- 🌐 **代理支持** - 支持 HTTP/HTTPS 代理，绕过 IP 限速
- 💾 **持久化存储** - Token 自动保存到 .env 文件

## 快速开始

### Docker 部署（推荐）

#### 1. 克隆项目

```bash
git clone <repository-url>
cd deepseek-2api
```

#### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：

```bash
# DeepSeek 认证（三选一，可为空，后期通过 Web 面板添加）
DS_TOKENS=token1,token2,token3
DS_TOKEN=single_token
DS_ACCOUNTS=email1:password1,email2:password2

# 服务端口
PORT=3000

# API Key 鉴权（可选，留空则不鉴权）
API_KEY=your_api_key_here

# 代理配置（可选）
# HTTPS_PROXY=http://127.0.0.1:7890

# 是否合并 thinking 内容（默认 true）
# MERGE_THINKING=true
```

**注意**：可以不配置任何 Token 直接启动，然后通过 Web 管理面板动态添加。

#### 3. 启动服务

使用 docker-compose 启动：

```bash
docker compose up -d
```

或使用纯 Docker 命令：

```bash
# 构建镜像
docker build -t deepseek-2api .

# 启动容器
docker run -d \
  --name deepseek-2api \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env \
  -e NODE_ENV=production \
  deepseek-2api
```

#### 4. 验证服务

```bash
# 检查容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试健康检查
curl http://localhost:3000/
```

#### 5. 访问管理面板

打开浏览器访问：http://localhost:3000/admin

在管理面板中可以：
- 查看 Token 池状态和健康情况
- 添加新 Token（粘贴令牌字符串）
- 登录添加（输入邮箱密码自动获取 Token）
- 删除 Token（点击删除按钮）
- 查看会话缓存和请求日志

### 本地部署

#### 1. 环境要求

- Node.js 22+
- npm 或 yarn

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件
```

#### 4. 启动服务

```bash
# 生产环境
npm start

# 开发环境（热重载）
npm run dev
```

## API 使用

### 模型列表

| API 模型名 | DeepSeek 模型类型 | 说明 |
|-----------|------------------|------|
| `deepseek-v4-flash` | default | 默认模型，快速响应 |
| `deepseek-v4-pro` | expert | 深度思考模型，适合复杂任务 |
| `deepseek-v4-vision` | vision | 视觉模型，支持图片理解 |

### OpenAI 兼容格式

#### 非流式请求

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己"}
    ]
  }'
```

#### 流式请求（SSE）

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "deepseek-v4-pro",
    "stream": true,
    "messages": [
      {"role": "user", "content": "解释量子计算"}
    ]
  }'
```

#### 带思考过程（非流式）

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "deepseek-v4-pro",
    "messages": [
      {"role": "user", "content": "1+1=?请详细思考"}
    ],
    "thinking_enabled": true,
    "merge_thinking": true
  }'
```

响应中的 `content` 字段将包含 `<think>...</think>` 包裹的思考过程。

#### 图片理解（Vision 模型）

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "deepseek-v4-vision",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "这张图片里有什么？"},
          {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
        ]
      }
    ]
  }'
```

### DeepSeek 原生格式

#### 流式请求

```bash
curl http://localhost:3000/api/v0/chat/completion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model_type": "default",
    "prompt": "你好",
    "thinking_enabled": false,
    "search_enabled": false
  }'
```

### 查看可用模型

```bash
curl http://localhost:3000/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 健康检查

```bash
curl http://localhost:3000/
```

响应示例：

```json
{
  "status": "ok",
  "version": "2.0.0",
  "pool": [
    {
      "token": "abc123...",
      "email": null,
      "visionCapable": true,
      "errorCount": 0,
      "activeRequests": 0,
      "dead": false,
      "maxConcurrent": 2
    }
  ],
  "totalCapacity": 2,
  "queue": {
    "queued": 0,
    "maxQueueSize": 100
  }
}
```

## 管理面板 API

### 获取 Token 池信息

```bash
GET /admin/api/pool
```

### 添加 Token

```bash
POST /admin/api/token/add
Content-Type: application/json

{
  "token": "your_deepseek_token"
}
```

### 登录添加 Token

```bash
POST /admin/api/token/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "your_password"
}
```

### 删除 Token

```bash
POST /admin/api/token/remove
Content-Type: application/json

{
  "token": "token_to_remove"
}
```

### 删除账号

```bash
POST /admin/api/account/remove
Content-Type: application/json

{
  "email": "email_to_remove"
}
```

### 获取统计信息

```bash
GET /admin/api/stats
```

### 获取日志

```bash
GET /admin/api/logs?count=50
```

## 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DS_TOKENS` | 否 | - | 多个 Token，逗号分隔 |
| `DS_TOKEN` | 否 | - | 单个 Token |
| `DS_ACCOUNTS` | 否 | - | 多个账号，`email:password` 格式，逗号分隔 |
| `PORT` | 否 | `3000` | 服务监听端口 |
| `API_KEY` | 否 | - | API 鉴权密钥，留空则不鉴权 |
| `HTTPS_PROXY` | 否 | - | HTTP 代理地址，用于绕过 IP 限速 |
| `MERGE_THINKING` | 否 | `true` | 是否将思考过程合并到响应内容 |

**注意**：启动时可以不配置任何 Token，服务会正常启动，然后通过 Web 管理面板动态添加 Token。

## 架构说明

### 核心模块

```
src/
├── index.js        # 主入口，Express 路由
├── auth.js         # Token 池管理，健康检查，持久化
├── chat.js         # 核心聊天逻辑，SSE 流解析
├── openai.js       # OpenAI 格式适配
├── deepseek.js     # DeepSeek 原生格式适配
├── pow.js          # PoW 挑战求解（WASM + BigInt）
├── session.js      # 会话管理（3 天缓存 + 预热）
├── headers.js      # 请求头管理，HIF 令牌，代理
├── queue.js        # 请求队列（FIFO，100 上限）
├── upload.js       # 图片上传（Vision 模型）
└── logger.js       # 请求日志
```

### 请求流程

```
客户端请求
    ↓
Token 槽位获取（ acquireToken ）
    ↓
PoW 挑战求解（ solvePowChallenge ）
    ↓
会话获取/创建（ getSession ）
    ↓
HIF 令牌获取（ getHifHeaders ）
    ↓
DeepSeek API 请求
    ↓
SSE 流解析返回
    ↓
Token 槽位释放
```

### 并发模型

- **每 Token 并发**：2 个请求
- **Token 池容量**：Token 数量 × 2
- **队列上限**：100 个等待请求
- **队列超时**：30 秒
- **会话缓存**：3 天 TTL
- **健康检查**：每 10 分钟（仅检查空闲 > 30 分钟的 Token）

### 性能优化

1. **WASM PoW 求解器** - 50-200ms，BigInt 回退
2. **会话 3 天缓存** - 省 200-500ms/请求
3. **HIF 令牌缓存** - 省 100-300ms/请求
4. **最小负载选择** - 优先选择最少负载的 Token
5. **FIFO 请求队列** - 即时获取 + 排队等待

## 常见问题

### Token 获取方式

1. 访问 [DeepSeek 官网](https://chat.deepseek.com)
2. 登录账号
3. 打开浏览器开发者工具（F12）
4. 在 Network 选项卡中找到任意 API 请求
5. 复制 `Authorization: Bearer xxx` 中的 Token

### Token 失效处理

系统会自动检测失效 Token：
- 如果配置了账号密码，会自动登录刷新
- 如果没有账号，会标记为 DEAD 并移除出可用池
- 每 10 分钟健康检查会清理失效 Token

### 代理配置

如果 DeepSeek 对你的 IP 限速，可以配置代理：

```bash
# .env 文件
HTTPS_PROXY=http://127.0.0.1:7890
```

或使用环境变量：

```bash
export HTTPS_PROXY=http://127.0.0.1:7890
docker compose up -d
```

### 内存占用

- **无 WASM 文件**：~50MB（纯 HTTP 模式）
- **有 WASM 文件**：~60MB（含 PoW 求解器）
- **每 Token 会话缓存**：~1MB

### 视觉能力检测

系统会在启动时自动检测每个 Token 的视觉能力：
- `vision=YES` - 支持图片上传和理解
- `vision=NO` - 仅支持文本对话
- `vision=UNKNOWN` - 检测失败，重试后确定

## Docker 相关

### 镜像构建

```bash
docker build -t deepseek-2api .
```

### 运行容器

```bash
docker run -d \
  --name deepseek-2api \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env \
  -e NODE_ENV=production \
  deepseek-2api
```

### docker-compose 常用命令

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 重建容器
docker compose up -d --force-recreate

# 查看服务状态
docker compose ps

# 进入容器
docker compose exec deepseek-2api sh
```

### Docker 网络

如果需要与其他容器通信，可以创建自定义网络：

```yaml
# docker-compose.yml
networks:
  app-network:
    driver: bridge

services:
  deepseek-2api:
    # ...
    networks:
      - app-network
```

## 安全建议

1. **配置 API_KEY** - 保护服务不被未授权访问
2. **使用 HTTPS** - 通过反向代理（如 Nginx）启用 HTTPS
3. **限制访问** - 使用防火墙限制访问 IP
4. **定期更换 Token** - 避免 Token 长期泄露
5. **监控日志** - 定期检查 `/admin/api/logs` 发现异常请求

## 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 生产构建
npm start
```

### 代码规范

- 使用 ES Module 语法
- async/await 处理异步
- 错误需要捕获并记录日志
- Token 相关错误需要报告到 token pool

### 测试

```bash
# 测试单个流程
node test_single_flow.mjs

# 测试 WAF
node test_waf.js
```

## 许可证

MIT

## 免责声明

本项目仅供学习研究使用。请使用合法途径获取的 DeepSeek 账号和 Token。因使用本项目导致的任何账号封禁或其他损失，本项目不承担任何责任。

## 更新日志

### v2.0.0

- ✅ 支持 Web 管理面板动态添加/删除 Token
- ✅ 支持无 Token 启动
- ✅ 新增删除 Token API
- ✅ 新增删除账号 API
- ✅ 优化 Token 持久化逻辑
- ✅ 修复空池启动错误

### v1.0.0

- ✅ 初始版本
- ✅ OpenAI 兼容 API
- ✅ DeepSeek 原生 API
- ✅ 多 Token 池管理
- ✅ Web 管理面板
- ✅ Docker 支持

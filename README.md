# 一念一串后台管理系统

基于 NestJS + MongoDB + Redis + Vben Admin 的「一念一串」小程序后台管理系统，覆盖商品素材、主题推荐、DIY 报价、购物车、订单支付、售后评价、手串册、念卡、9:16 海报、内容审核和数据看板。

## 技术栈

- 后端：NestJS、Mongoose、Redis/ioredis、BullMQ、JWT、Swagger
- 后台：Vben Admin、Vue、Element Plus
- 数据：MongoDB、Redis
- 支付：微信支付 V3 接口结构，默认支持 mock 模式

## 本地启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备环境变量

```bash
cp .env.example .env
```

默认配置会连接本地 Docker Compose 暴露的 MongoDB 与 Redis：

```env
MONGODB_URI=mongodb://localhost:27017/crystal_diy
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. 启动 MongoDB 与 Redis

```bash
docker compose up -d mongodb redis
```

检查依赖状态：

```bash
docker compose ps
```

### 4. 启动后端

```bash
pnpm dev:backend
```

后端默认地址：

- API：`http://localhost:3000/api`
- Swagger：`http://localhost:3000/api/docs`
- 健康检查：`http://localhost:3000/api/health`
- 上传文件访问：`http://localhost:3000/uploads/...`

### 5. 启动 Vben Admin

```bash
pnpm --dir apps/admin -F @vben/web-ele run dev
```

默认管理员账号来自 `.env`：

- 用户名：`admin`
- 密码：`Admin@123456`

## 常用命令

```bash
pnpm test:backend
pnpm build:backend
pnpm check:admin-api
pnpm --dir apps/admin -F @vben/web-ele run typecheck
pnpm --dir apps/admin -F @vben/web-ele run build
pnpm verify:prod
pnpm verify:phases
```

## 前后端联调 Smoke

后端启动后可执行一期主链路接口联调，脚本会通过真实 HTTP 请求覆盖：管理员登录、小程序登录、商品/SKU、主题匹配、DIY 报价、购物车、地址、下单、微信支付 mock 回调、发货、确认收货、手串册、念卡生成/重写、9:16 海报和数据看板。

同时可执行后台接口契约检查，确保 Vben Admin 的 `crystalApi` 中声明的后台接口在 NestJS 控制器中存在，并提示未封装的后台路由：

```bash
pnpm check:admin-api
```

生产启动验证会使用构建产物 `apps/backend/dist/main.js` 在临时端口启动后端，并检查 `/api/health`：

```bash
pnpm build:backend
pnpm verify:prod
```

阶段统一验证入口会串行执行后端测试、后端构建、生产启动健康检查、后台接口契约检查、前端类型检查、Vben Admin 构建，并确认后端生产构建产物存在：

```bash
pnpm verify:phases
```

如果后端已启动，可打开真实 HTTP smoke 联调覆盖 Phase 3/4/5 主业务链路：

```bash
RUN_SMOKE=1 API_BASE_URL=http://localhost:3000/api pnpm verify:phases
```

```bash
pnpm dev:deps
pnpm dev:backend
API_BASE_URL=http://localhost:3000/api pnpm smoke:api
```

当前后端本地启动脚本使用 `ts-node` 运行 `src/main.ts`，适合开发联调；生产部署前可按目标平台补充独立构建产物启动配置。

联调脚本会写入一组带 `联调` 前缀的测试数据。若调整默认管理员账号，请同步设置：

```bash
ADMIN_DEFAULT_USERNAME=admin ADMIN_DEFAULT_PASSWORD=Admin@123456 pnpm smoke:api
```

每完成一个 Phase 并通过对应验证后，按要求提交并推送远程仓库：

```bash
git status
git add .
git commit -m "feat: complete phase <n>"
git push origin main
```

## 业务模块

- Phase 1：NestJS、Vben Admin、环境配置、MongoDB、Redis、登录、RBAC、文件上传
- Phase 2：商品素材、SKU、库存、主题推荐规则后台
- Phase 3：DIY 设计草稿、服务端报价、可制作性校验、购物车
- Phase 4：订单、微信支付、退款、物流、售后、评价
- Phase 5：手串册、念卡生成、模板管理、9:16 海报、内容审核、数据看板

## 微信支付说明

开发环境默认 `WECHAT_PAY_MOCK=true`，可通过后台“标记支付”或小程序支付回调模拟订单支付成功。接入真实微信支付时，需要配置：

```env
WECHAT_PAY_MCH_ID=
WECHAT_PAY_SERIAL_NO=
WECHAT_PAY_PRIVATE_KEY_PATH=
WECHAT_PAY_API_V3_KEY=
WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH=
WECHAT_PAY_MOCK=false
```

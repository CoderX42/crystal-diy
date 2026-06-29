# 一串一念 后台管理完整实现方案

> 本文档面向开发落地，描述每个模块的 Schema、Controller、Service、DTO、复杂度及依赖关系。

---

## 0. 术语与命名规范

| 层        | 命名规则                                                    |
| --------- | ----------------------------------------------------------- |
| Schema    | `{entity}.schema.ts` — Mongoose 9 class-decorator, `@Schema({ collection: 'xxx', timestamps: true })` |
| DTO       | `{entity}.dto.ts` — class-validator, 遵循已有 Create/Update/Query 模式 |
| Controller (admin) | `admin-{entity}.controller.ts` — `@Controller('admin/{prefix}')`, `@UseGuards(AdminAuthGuard)` |
| Controller (app)   | `app-{entity}.controller.ts` — `@Controller('app/{prefix}')` (WeChat miniprogram 端) |
| Service    | `{module}.service.ts` 或 `{entity}.service.ts` — 拆分条件见下 |
| Module     | `{module}.module.ts` — 导入 AuthModule + MongooseModule.forFeature |

**Service 拆分原则**: 当模块内牵涉 >=3 个不同聚合根的 CRUD 且逻辑可独立时，拆为多个 service 文件 (如 `orders.module` 拆为 `orders.service.ts` + `payment.service.ts`)。否则保持一个 service。

---

## 1. 全局 Cross-Cutting

这些基础设施需要在 Phase 1 前或与 Phase 1 并行搭建。

### 1.1 新 packages (npm)

| Package                                  | 用途                                      | 安装时机  |
| ---------------------------------------- | ----------------------------------------- | --------- |
| `@nestjs/bullmq` + `bullmq`              | BullMQ 任务队列 (Redis 驱动)              | Phase 1   |
| `@nestjs/schedule`                       | 定时任务 (cron)                           | Phase 3   |
| `@nestjs/throttler`                      | 速率限制                                  | Phase 1   |
| `pino` + `nestjs-pino`                   | 结构化日志                                | Phase 1   |
| `crypto-js` 或 Node 内置 `crypto`        | PII 字段加密 (手机号/身份证)              | Phase 2   |
| `dayjs`                                  | 日期操作 (已常用)                         | Phase 1   |
| `ioredis`                                | Redis 客户端 (BullMQ 自带，无额外依赖)     | 已预备    |
| `wechat-pay` 或 `wxpay-v3`              | 微信支付 APIv3 (WeChat Pay)               | Phase 4   |
| `axios`                                  | HTTP 客户端 (调微信 API)                  | Phase 3   |
| `@fastify/cookie`                        | Fastify cookie 解析                       | Phase 1   |
| `nanoid`                                 | 订单号/流水号生成                         | Phase 4   |

### 1.2 全局共享模块

```
backend/src/
  common/
    decorators/    ← 已有 CurrentAdmin
    guards/        ← 已有 AdminAuthGuard (在 auth module 内)
    interceptors/  ← 已有 ResponseInterceptor
    pipes/         ← 已有 ParseMongoIdPipe
    filters/        ← NEW: 全局异常过滤器 (统一中文错误响应)
  config/          ← 已有
  shared/           ← NEW: 共享工具模块
    encryption.service.ts   ← PII 加解密
    code-generator.service.ts ← 订单号/编号生成
    wechat-client.service.ts ← 微信 API 统一 Client
```

### 1.3 新增 AppModule 加载顺序建议

```
顺序优先级:
  1. HealthModule           — 存活检查
  2. SystemModule           — 系统信息
  3. AuthModule             — JWT + AdminAuthGuard
  4. RbacModule             — 角色权限 (AdminAuthGuard 依赖)
  5. AdminUsersModule       — 管理员管理 (依赖 RbacModule)
  6. FileModule             — OSS 文件 (独立, 可供其他模块引用)
  7. SystemConfigModule     — 全局配置 (独立)
  8. UsersModule            — C 端用户
  9. CatalogModule          — 商品 (已有)
  10. ThemesModule          — 主题推荐 (依赖 Catalog)
  11. DesignsModule         — DIY 设计稿
  12. BraceletsModule       — 手串记录
  13. ThoughtCardsModule    — 念卡 (依赖 Themes/Bracelets)
  14. OrdersModule          — 订单 (依赖 Catalog/Users/Cart)
  15. DashboardModule       — 数据看板 (依赖所有业务模块)
  16. AuditModule           — 审计日志 (独立, 切面注入)
  17. ContentModule         — 百科文章 (独立)
  18. HomeBlocksModule      — 首页配置 (独立)
  19. NotificationModule    — 通知推送
```

实际在 `app.module.ts` 中建议按依赖从底层到上层排列，与文件目录位置无关。

---

## 2. Phase 规划 (5 Phases)

### Phase 1 — 基础设施 + RBAC + 管理员 + 文件 (价值: 基石)

| 模块           | 复杂度 | 估文件数 | 前置依赖    |
| -------------- | ------ | -------- | ----------- |
| Infrastructure | M      | 6        | 无          |
| RbacModule     | M      | 7        | AuthModule  |
| AdminUsersModule | S    | 6        | RbacModule  |
| FileModule     | S      | 5        | 无          |
| SystemConfigModule | S  | 4        | 无          |

**可并行**: FileModule + SystemConfigModule 与 RbacModule 无依赖，可并行开始。

### Phase 2 — C端用户 + 内容 + 首页配置 (价值: 用户运营就绪)

| 模块              | 复杂度 | 估文件数 | 前置依赖                |
| ----------------- | ------ | -------- | ----------------------- |
| UsersModule       | L      | 10       | FileModule (头像上传)   |
| ContentModule     | S      | 5        | FileModule (文章图片)   |
| HomeBlocksModule  | S      | 5        | ContentModule (引用)    |
| AuditModule       | S      | 4        | 无 (切面可独立部署)     |

**可并行**: ContentModule + AuditModule 无依赖。UsersModule 需先确认 FileModule 稳定。

### Phase 3 — 主题推荐 + DIY 作品 (价值: 小程序核心功能)

| 模块             | 复杂度 | 估文件数 | 前置依赖                   |
| ---------------- | ------ | -------- | -------------------------- |
| ThemesModule     | L      | 9        | UsersModule (用户画像引用) |
| DesignsModule    | M      | 6        | CatalogModule (引用 SKU)   |
| BraceletsModule  | M      | 6        | ThemesModule | DesignsModule |
| ThoughtCardsModule | XL   | 12       | ThemesModule + OrdersModule (强依赖) |

**NOTE**: ThoughtCardsModule 需要 AI 生成文案能力，Phase 3 可先做模板和 CRUD，AI 集成延迟到 Phase 4。

**可并行**: ThemesModule + DesignsModule 可并行。BraceletsModule 需要等 ThemesModule。

### Phase 4 — 交易中心 (价值: 商业化闭环)

| 模块           | 复杂度 | 估文件数 | 前置依赖                            |
| -------------- | ------ | -------- | ----------------------------------- |
| CartModule     | M      | 5        | CatalogModule, UsersModule          |
| OrdersModule   | XL     | 16       | CartModule, UsersModule, CatalogModule |
| PaymentModule  | L      | 8        | OrdersModule (退款需订单状态)       |

**NOTE**: OrdersModule 是全局最复杂的模块，建议细拆为:
- `orders/` 主模块
- `payment/` 支付子模块 (微信支付 APIv3)
- `after-sales/` 售后 (退款/退货)
- `reviews/` 评价

### Phase 5 — 数据看板 + 通知 + 收尾 (价值: 运营决策 + 体验完整)

| 模块             | 复杂度 | 估文件数 | 前置依赖                             |
| ---------------- | ------ | -------- | ------------------------------------ |
| DashboardModule  | L      | 8        | OrdersModule, UsersModule, DesignsModule (所有业务) |
| NotificationModule | S   | 4        | UsersModule (Wx Subscribe)          |

**可并行**: NotificationModule 可在 Phase 4 后期开始。

---

## 3. 模块详细设计

### 3.1 Global Infrastructure (`common/` + `shared/`)

```
common/filters/all-exceptions.filter.ts
  → catch 所有异常, 返回 { code: error.status ?? 500, data: null, message: 中文, timestamp }

shared/encryption.service.ts
  → @Injectable({ global: true })
  → encrypt(text: string): string
  → decrypt(encrypted: string): string
  → 使用 AES-256-CBC + 环境变量 SECRET_KEY（新增 env）

shared/code-generator.service.ts
  → generateOrderCode(): string  — "OT" + yyyyMMdd + 6位流水
  → generateRefundCode(): string

shared/wechat-client.service.ts
  → getAccessToken(): Promise<string>
  → code2Session(code: string): Promise<WxSession>
  → 微信支付 SDK 封装

shared/shared.module.ts
  → 导出上述 service (global: true)
```

### 3.2 RbacModule — 角色权限

**Collection**: `roles`
**Schema (Role)**:
```
name: string           — 角色名称 (e.g. "运营主管")
code: string           — 唯一标识 (unique)
permissions: string[]  — 权限标识列表
status: 'active'|'disabled'
description: string
```
**Controllers**:
- `admin-rbac.controller.ts`
  - `GET    /admin/roles`              — 列表
  - `POST   /admin/roles`              — 创建
  - `PATCH  /admin/roles/:id`          — 更新
  - `DELETE /admin/roles/:id`          — 删除 (检查无管理员关联)
  - `GET    /admin/roles/permissions`  — 返回系统所有可用权限定义列表

**注意**: 将 AuthModule 中硬编码的 `SUPER_ADMIN_PERMISSIONS` 迁移到 RbacModule 管理。AuthModule 中的 AdminUser 的 `roles` 字段改为引用 Role 的 code。

**DTOs**: `CreateRoleDto`, `UpdateRoleDto`, `RoleQueryDto`

### 3.3 AdminUsersModule — 管理员账号管理

**复用 Schema**: AuthModule 的 `AdminUser` schema (admin_users collection)

**Controllers**:
- `admin-admin-users.controller.ts`
  - `GET    /admin/admin-users`               — 列表
  - `POST   /admin/admin-users`               — 新增 (含初始密码)
  - `PATCH  /admin/admin-users/:id`           — 编辑
  - `PATCH  /admin/admin-users/:id/reset-pwd`  — 重置密码
  - `DELETE /admin/admin-users/:id`           — 删除

**DTOs**: `CreateAdminUserDto`, `UpdateAdminUserDto`, `ResetPasswordDto`

**注意**: 此模块拆分后，AuthModule 的 `AdminAuthService` 仍然负责登录/Token/Profile，新增管理员由 `AdminUsersService` 管理。

### 3.4 FileModule — OSS 文件管理

**Collection**: `files`
**Schema (File)**:
```
originalName: string
mimeType: string
size: number            — bytes
ossUrl: string          — 阿里 OSS 完整路径
bucket: string
path: string            — OSS object key
uploadedBy: string      — adminUserId
```

**Controllers**:
- `admin-files.controller.ts`
  - `POST   /admin/files/upload`        — 单文件上传 (multipart)
  - `POST   /admin/files/uploads`       — 多文件上传
  - `GET    /admin/files`               — 文件列表 (分页)
  - `DELETE /admin/files/:id`           — 删除 (同步 OSS)

**依赖**: 已安装 `ali-oss` + `@fastify/multipart` + `@fastify/static`

**新增 ENV**:
```
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_OSS_BUCKET=one-thought
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 3.5 SystemConfigModule — 全局配置

**Collection**: `system_configs`
**Schema (SystemConfig)**:
```
key: string           — 唯一键 (unique)
value: Mixed          — 任意 JSON
description: string
updatedBy: string     — adminUserId
```

**Controllers**:
- `admin-system-config.controller.ts`
  - `GET    /admin/system-configs`       — 获取所有配置
  - `GET    /admin/system-configs/:key`  — 获取单个
  - `PUT    /admin/system-configs/:key`  — 更新/创建

**典型配置项**:
- `shipping_fee`: 运费模板
- `free_shipping_threshold`: 包邮门槛
- `wechat_payment_config`: 微信支付配置
- `store_info`: 店铺信息 (name, logo, phone)
- `ai_thought_card_prompt`: AI 念卡 prompt 模板

### 3.6 UsersModule — C 端用户

**Collection**: `users`
**Schema (User)**:
```
openid: string            — 微信 openid (unique)
unionid?: string
nickname: string
avatarUrl: string
gender: number            — 0:unknown, 1:male, 2:female
phoneEncrypted: string    — AES 加密手机号
birthDate?: string
wuxing?: string           — 五行偏好 (用户自选/计算)
pointBalance: number      — 积分
totalOrders: number
totalSpent: number        — 分 (cent)
status: 'active'|'banned'|'disabled'
lastLoginAt: Date
tags: string[]            — 用户标签
```

**Collection**: `addresses`
**Schema (Address)**:
```
userId: string
name: string
phoneEncrypted: string
province: string
city: string
district: string
detail: string
isDefault: boolean
```

**Controllers**:
- `admin-users.controller.ts` (后台)
  - `GET    /admin/users`                  — 列表 (分页/搜索)
  - `GET    /admin/users/:id`              — 详情
  - `PATCH  /admin/users/:id/status`       — 封禁/解封
  - `PATCH  /admin/users/:id/tags`         — 标签管理
  - `GET    /admin/users/:id/addresses`    — 地址列表

- `app-users.controller.ts` (小程序, Phase 3-4)
  - `POST   /app/auth/login`              — 微信 code -> openid + session
  - `POST   /app/auth/phone`              — 获取手机号 (wx.getPhoneNumber)
  - `GET    /app/users/profile`           — 获取个人资料
  - `PATCH  /app/users/profile`           — 更新资料
  - `GET    /app/users/addresses`         — 地址列表
  - `POST   /app/users/addresses`         — 新增地址
  - `PATCH  /app/users/addresses/:id`     — 编辑地址
  - `DELETE /app/users/addresses/:id`     — 删除地址

### 3.7 AuditModule — 操作审计日志

**Collection**: `audit_logs`
**Schema (AuditLog)**:
```
adminId: string
adminName: string
action: string            — 'create'|'update'|'delete'|'login'|'export'
resource: string          — 'product'|'order'|'user'|'role'
resourceId?: string
detail: string            — 操作描述
ip: string
userAgent: string
timestamp: Date
```

**Controllers**:
- `admin-audit.controller.ts`
  - `GET    /admin/audit-logs`            — 列表 (分页/时间/资源/操作人筛选)
  - `GET    /admin/audit-logs/export`     — 导出 CSV

**实现方式**: 使用 NestJS Provider 创建 `AuditService`，在各 Controller/Service 通过方法注入调用。也可用 AOP (decorator) 自动记录增删改。

### 3.8 ThemesModule — 主题与推荐规则

**Collection**: `themes`
**Schema (Theme)**:
```
name: string
code: string              — unique, e.g. 'wuxing', 'mbti', 'zodiac'
type: 'wuxing'|'mbti'|'zodiac'|'custom'
description: string
rules: [
  {
    condition: Mixed       — JSON 匹配条件
    priority: number
    recommendedProductIds: string[]   — 推荐商品
    recommendedSkuIds: string[]
  }
]
coverUrl: string
status: 'enabled'|'disabled'
sort: number
```

**Controllers**:
- `admin-themes.controller.ts`
  - `GET    /admin/themes`                    — 主题列表
  - `POST   /admin/themes`                    — 创建主题
  - `PATCH  /admin/themes/:id`                — 编辑主题
  - `DELETE /admin/themes/:id`                — 删除
  - `GET    /admin/themes/:id/rules`          — 获取推荐规则
  - `POST   /admin/themes/:id/rules`          — 添加规则
  - `PATCH  /admin/themes/:id/rules/:ruleId`  — 编辑规则

**注意**: 五行/星座/MBTI 的匹配逻辑是业务核心，实现时可：
- 五行: 根据生辰八字或用户选择
- 星座: 根据 birthDate
- MBTI: 用户测试结果
- rule.condition 使用灵活 JSON 结构，由小程序端解释执行

### 3.9 DesignsModule — DIY 设计稿

**Collection**: `designs`
**Schema (Design)**:
```
userId: string
name: string
coverUrl: string
status: 'draft'|'published'|'archived'
items: [
  {
    productId: string
    skuId: string
    productName: string
    skuName: string
    quantity: number
    salePrice: number      — 快照价格
  }
]
totalPrice: number         — 分
themeId?: string
themeType?: string
isPublic: boolean           — 是否公开
createdAt: Date
updatedAt: Date
```

**Controllers**:
- `admin-designs.controller.ts`
  - `GET    /admin/designs`                  — 列表 (分页/用户搜索)
  - `GET    /admin/designs/:id`              — 详情 (含 items 展开)
  - `DELETE /admin/designs/:id`              — 删除

- `app-designs.controller.ts` (小程序, Phase 3)
  - `POST   /app/designs`                   — 保存设计稿
  - `GET    /app/designs`                   — 我的设计稿列表
  - `GET    /app/designs/:id`               — 详情
  - `PATCH  /app/designs/:id`               — 更新
  - `GET    /app/designs/public`            — 公共作品

### 3.10 BraceletsModule — 手串记录

**Collection**: `bracelets`
**Schema (Bracelet)**:
```
userId: string
designId?: string          — 关联设计稿
name: string
coverUrl: string
skus: [                    — 实际手串使用的 SKU 快照
  {
    skuId: string
    productName: string
    skuName: string
    price: number
  }
]
totalPrice: number
photos: string[]           — 成品照片集
themeId?: string
description: string
status: 'active'|'archived'
```

**Controllers**:
- `admin-bracelets.controller.ts`
  - `GET    /admin/bracelets`               — 列表
  - `GET    /admin/bracelets/:id`           — 详情

- `app-bracelets.controller.ts` (小程序)
  - `POST   /app/bracelets`                — 记录手串
  - `GET    /app/bracelets`                — 我的手串
  - `GET    /app/bracelets/:id`
  - `DELETE /app/bracelets/:id`

### 3.11 ThoughtCardsModule — 念卡 (AI 生成的卡片)

**Collection**: `thought_card_templates`
**Schema (ThoughtCardTemplate)**:
```
name: string
code: string              — unique
description: string
backgroundColor: string
fontFamily: string
fontColor: string
layout: 'vertical'|'horizontal'
elements: [
  {
    type: 'title'|'body'|'quote'|'icon'|'border'
    config: Mixed
  }
]
coverUrl: string
status: 'active'|'disabled'
sort: number
```

**Collection**: `thought_cards`
**Schema (ThoughtCard)**:
```
userId: string
orderId?: string           — 来源订单
templateId?: string        — 模板
title: string
content: string
aiGenerated: boolean
aiPrompt?: string
backgroundImageUrl: string
fontStyle: Mixed
status: 'draft'|'published'|'deleted'
shareCount: number
generatedAt: Date
```

**Controllers**:
- `admin-thought-cards.controller.ts`
  - `GET    /admin/thought-cards`              — 念卡列表
  - `GET    /admin/thought-cards/:id`
  - `DELETE /admin/thought-cards/:id`

- `admin-thought-card-templates.controller.ts`
  - `GET    /admin/thought-card-templates`     — 模板列表
  - `POST   /admin/thought-card-templates`     — 创建模板
  - `PATCH  /admin/thought-card-templates/:id` — 编辑模板
  - `DELETE /admin/thought-card-templates/:id`

- `app-thought-cards.controller.ts` (小程序)
  - `POST   /app/thought-cards/generate`       — AI 生成念卡
  - `POST   /app/thought-cards`                — 手动创建
  - `GET    /app/thought-cards`                — 我的念卡

**AI 集成**: 可对接通义千问 API (阿里云) 或 OpenAI 兼容接口。建议:
```
新增 ENV:
AI_PROVIDER=qwen                # qwen | openai
AI_API_KEY=
AI_API_BASE_URL=
AI_THOUGHT_CARD_MODEL=qwen-max
```

### 3.12 OrdersModule — 交易中心

**拆分子模块** (所有文件在 `orders/` 目录内, 由一个 OrdersModule 聚合):

```
orders/
  orders.module.ts
  admin-orders.controller.ts
  app-orders.controller.ts
  orders.service.ts
  payment.service.ts
  after-sales.service.ts
  reviews.service.ts
  schemas/
    order.schema.ts
    refund.schema.ts
    review.schema.ts
    cart.schema.ts
  dto/
    create-order.dto.ts
    order-query.dto.ts
    create-refund.dto.ts
    create-review.dto.ts
    add-cart.dto.ts
```

#### 3.12.1 Cart (购物车)

**Collection**: `carts`
**Schema (Cart)**:
```
userId: string
items: [
  {
    skuId: string
    productId: string
    productName: string
    skuName: string
    quantity: number
    salePrice: number
    coverUrl: string
  }
]
updatedAt: Date
```

**Controllers**:
- `app-cart.controller.ts`
  - `GET    /app/cart`                    — 获取购物车
  - `POST   /app/cart/items`              — 添加
  - `PATCH  /app/cart/items/:skuId`       — 修改数量
  - `DELETE /app/cart/items/:skuId`       — 移除
  - `DELETE /app/cart/items`              — 清空

- **后台不提供购物车管理** (属用户私域)

#### 3.12.2 Orders (订单)

**Collection**: `orders`
**Schema (Order)**:
```
orderNo: string               — unique, "OT20260613000001"
userId: string
status: OrderStatus           — 复杂状态机
items: [
  {
    skuId: string
    productId: string
    productName: string
    skuName: string
    quantity: number
    unitPrice: number         — 分
    subtotal: number          — 分
    coverUrl: string
  }
]
totalAmount: number           — 分 (商品总额)
shippingFee: number
discountAmount: number
payAmount: number             — 实际支付
paymentMethod: 'wechat'|'balance'
paymentTime?: Date
prepayId?: string             — 微信支付 prepay_id
transactionId?: string        — 微信支付单号
shippingInfo: {
  name: string
  phoneEncrypted: string
  province: string
  city: string
  district: string
  detail: string
}
expressCompany?: string
expressNo?: string
deliveredAt?: Date
completedAt?: Date
closedAt?: Date
closeReason?: string
remark?: string
refundStatus?: RefundStatus
```

**OrderStatus 状态机**:
```
pending_payment → paid → shipped → delivered → completed
                                  └→ received  → completed
pending_payment → closed (用户取消)
paid → refunding → refunded
```
实现为 Mongoose `status` 字段 + 校验 (不允许非法跳转)。

**Controllers**:
- `admin-orders.controller.ts`
  - `GET    /admin/orders`                    — 列表 (多维度筛选)
  - `GET    /admin/orders/:id`                — 详情
  - `PATCH  /admin/orders/:id/shipping`       — 发货 (填物流)
  - `PATCH  /admin/orders/:id/remark`         — 添加备注
  - `PATCH  /admin/orders/:id/close`          — 关闭订单
  - `GET    /admin/orders/export`             — 导出

- `app-orders.controller.ts` (小程序)
  - `POST   /app/orders`                     — 创建订单
  - `POST   /app/orders/:id/pay`             — 发起支付
  - `GET    /app/orders`                     — 我的订单列表
  - `GET    /app/orders/:id`
  - `POST   /app/orders/:id/confirm-receive` — 确认收货
  - `POST   /app/orders/:id/close`           — 取消订单

#### 3.12.3 After-Sales / Refunds (售后/退款)

**Collection**: `refunds`
**Schema (Refund)**:
```
refundNo: string          — "RF" + yyyyMMdd + 流水
orderId: string
userId: string
status: RefundStatus      — 'pending'|'approved'|'rejected'|'completed'
type: 'refund_only'|'return_refund'
reason: string
amount: number            — 退款金额（分）
items: [{ skuId, quantity }]
adminRemark?: string
userRemark?: string
processedBy?: string      — adminUserId
processedAt?: Date
completedAt?: Date
```

**Controllers**:
- `admin-refunds.controller.ts`
  - `GET    /admin/refunds`                  — 退款列表
  - `GET    /admin/refunds/:id`
  - `PATCH  /admin/refunds/:id/approve`      — 同意退款
  - `PATCH  /admin/refunds/:id/reject`       — 拒绝退款

- `app-refunds.controller.ts`
  - `POST   /app/refunds`                   — 申请退款
  - `GET    /app/refunds`                   — 我的退款记录

#### 3.12.4 Reviews (评价)

**Collection**: `reviews`
**Schema (Review)**:
```
orderId: string
userId: string
skuId: string
productId: string
rating: number            — 1-5 星
content: string
images: string[]          — 图片 URL
isAnonymous: boolean
status: 'pending'|'approved'|'hidden'
replyContent?: string
replyAt?: Date
```

**Controllers**:
- `admin-reviews.controller.ts`
  - `GET    /admin/reviews`                 — 评价列表
  - `PATCH  /admin/reviews/:id/approve`     — 审核通过
  - `PATCH  /admin/reviews/:id/hide`        — 隐藏
  - `POST   /admin/reviews/:id/reply`       — 回复

### 3.13 DashboardModule — 数据看板

**只读模块**, 不写持久化数据。聚合多个 Collection 做统计。

**Controllers**:
- `admin-dashboard.controller.ts`
  - `GET    /admin/dashboard/summary`       — 总览数字 (今日订单/用户/收入)
  - `GET    /admin/dashboard/order-trends`  — 订单趋势 (按日/周/月)
  - `GET    /admin/dashboard/revenue`       — 收入统计
  - `GET    /admin/dashboard/top-products`  — 热销商品
  - `GET    /admin/dashboard/user-stats`    — 用户增长/活跃

### 3.14 ContentModule — 百科文章

**Collection**: `contents`
**Schema (Content)**:
```
title: string
summary: string
content: string               — 富文本 HTML/Markdown
coverUrl: string
category: string              — 'crystal_knowledge'|'care_guide'|'culture'|'news'
tags: string[]
author: string
status: 'draft'|'published'|'archived'
publishedAt: Date
viewCount: number
sort: number
```

**Controllers**:
- `admin-content.controller.ts`
  - `GET    /admin/contents`               — 列表
  - `POST   /admin/contents`               — 创建
  - `PATCH  /admin/contents/:id`           — 编辑
  - `DELETE /admin/contents/:id`
  - `PATCH  /admin/contents/:id/publish`   — 发布

### 3.15 HomeBlocksModule — 首页配置

**Collection**: `home_blocks`
**Schema (HomeBlock)**:
```
name: string
code: string          — unique
type: 'banner'|'icon_grid'|'product_row'|'article_list'|'custom'
config: Mixed         — 具体配置 (图片链接/商品ID列表/文章ID列表等)
sort: number
status: 'enabled'|'disabled'
startTime?: Date      — 定时展示
endTime?: Date
```

**Controllers**:
- `admin-home-blocks.controller.ts`
  - `GET    /admin/home-blocks`             — 配置列表
  - `POST   /admin/home-blocks`             — 新增区块
  - `PATCH  /admin/home-blocks/:id`         — 编辑
  - `DELETE /admin/home-blocks/:id`
  - `PATCH  /admin/home-blocks/:id/sort`    — 排序

- `app-home-blocks.controller.ts` (小程序)
  - `GET    /app/home-blocks`              — 获取首页配置+展开数据

### 3.16 NotificationModule — 通知管理

**Collection**: `notifications`
**Schema (Notification)**:
```
title: string
content: string
type: 'order'|'system'|'promotion'
targetUserIds: string[]       — [] 表示全部
status: 'draft'|'sent'
sentAt?: Date
createdBy: string
```

**Controllers**:
- `admin-notifications.controller.ts`
  - `GET    /admin/notifications`           — 通知列表
  - `POST   /admin/notifications`           — 创建并发送
  - `GET    /admin/notifications/:id`

---

## 4. 依赖图 (DAG)

```
                     ┌─────────────┐
                     │  AuthModule │ ← JWT + AdminAuthGuard
                     └──────┬──────┘
                            │
              ┌─────────────┼──────────────┐
              v             v              v
       ┌──────────┐  ┌───────────┐  ┌──────────────┐
       │RbacModule│  │FileModule │  │SystemConfig  │
       └────┬─────┘  └─────┬─────┘  └──────┬───────┘
            v              │               │
     ┌──────────────┐      │               │
     │AdminUsersMod │      │               │
     └──────────────┘      │               │
            v              v               v
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │ UsersModule │ │ContentModule│ │HomeBlocksMod│
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
            v               │               │
     ┌─────────────┐        │               │
     │ CartModule  │        │               │
     └──────┬──────┘        │               │
            v               │               │
     ┌─────────────┐        │               │
     │ThemesModule │        │               │
     └──────┬──────┘        │               │
            v               │               │
     ┌─────────────┐        │               │
     │DesignsModule│        │               │
     └──────┬──────┘        │               │
            v               │               │
     ┌────────────────┐     │               │
     │BraceletsModule │     │               │
     └───────┬────────┘     │               │
             v              │               │
     ┌──────────────────┐   │               │
     │ThoughtCardsModule◄┼───┘               │
     └────────┬─────────┘   │               │
              v             v               v
     ┌───────────────────────────────────────┐
     │          OrdersModule                 │
     │  (orders + payment + after-sales      │
     │   + reviews)                          │
     └──────────────────┬────────────────────┘
                        v
     ┌─────────────────────────────┐
     │      DashboardModule        │
     └─────────────────────────────┘
```

**独立模块 (无前置依赖, 可任意阶段开始)**:
- AuditModule
- NotificationModule

---

## 5. 平行工作机会

| 并行组 | 包含模块              | 前提条件           |
| ------ | --------------------- | ------------------ |
| A      | Infrastructure        | 无                 |
| A      | RbacModule            | 无 (依赖 AuthModule 已存在) |
| A      | FileModule            | 无                 |
| A      | SystemConfigModule    | 无                 |
| A      | AuditModule           | 无                 |
| B      | AdminUsersModule      | 需 A 组 RbacModule |
| B      | ContentModule         | 需 FileModule      |
| B      | HomeBlocksModule      | 需 FileModule      |
| C      | UsersModule           | 需 FileModule      |
| C      | ThemesModule          | 需 UsersModule     |
| C      | DesignsModule         | 需 CatalogModule (已有) |
| D      | BraceletsModule       | 需 Themes + Designs |
| D      | CartModule            | 需 Users + Catalog  |
| E      | OrdersModule          | 需 Cart + Users    |
| E      | ThoughtCardsModule    | 需 Themes + Orders |
| F      | DashboardModule       | 需所有业务模块     |
| F      | NotificationModule    | 需 UsersModule     |

**建议分配**:
- 2 人可在 Phase 1 并行覆盖 A 所有模块 + B 组
- 2 人可在 Phase 2 并行覆盖 C 组 (Users + Themes 一人, Designs + Cart 另一人)
- OrdersModule (Phase 3) 建议 1.5~2 人专注, 是全局最复杂模块
- DashboardModule + ThoughtCards AI 集成可放在最后阶段 1 人完成

---

## 6. 前端新路由映射

所有新页面遵循 `views/{module}/{entity}/index.vue` 模式, API 客户端在 `api/{module}.ts`。

| 新路由 Path                      | 标题       | View 文件路径                                    | 后端 API               |
| -------------------------------- | ---------- | ------------------------------------------------ | ---------------------- |
| `/system/admin-users`            | 管理员管理 | `views/system/admin-users/index.vue`             | /admin/admin-users     |
| `/system/system-config`          | 系统配置   | `views/system/system-config/index.vue`           | /admin/system-configs  |
| `/system/audit-logs`             | 操作日志   | `views/system/audit-logs/index.vue`              | /admin/audit-logs      |
| `/system/roles`                  | 角色权限   | `views/system/roles/index.vue`                   | /admin/roles           |
| `/operations/users`              | 用户管理   | `views/operations/users/index.vue`               | /admin/users           |
| `/operations/content`            | 内容管理   | `views/operations/content/index.vue`             | /admin/contents        |
| `/operations/notifications`      | 通知管理   | `views/operations/notifications/index.vue`       | /admin/notifications   |
| `/trade/orders`                  | 订单管理   | `views/trade/orders/index.vue`                   | /admin/orders          |
| `/trade/after-sales`             | 售后管理   | `views/trade/after-sales/index.vue`              | /admin/refunds         |
| `/trade/reviews`                 | 评价管理   | `views/trade/reviews/index.vue`                  | /admin/reviews         |
| `/themes/configs`                | 主题配置   | `views/themes/configs/index.vue`                 | /admin/themes          |
| `/themes/recommendation-rules`   | 推荐规则   | `views/themes/recommendation-rules/index.vue`    | /admin/themes/:id/rules|
| `/creations/designs`             | 设计稿     | `views/creations/designs/index.vue`              | /admin/designs         |
| `/creations/bracelets`           | 手串册     | `views/creations/bracelets/index.vue`            | /admin/bracelets       |
| `/creations/thought-cards`       | 念卡管理   | `views/creations/thought-cards/index.vue`       | /admin/thought-cards   |
| `/creations/thought-card-templates` | 念卡模板 | `views/creations/thought-card-templates/index.vue` | /admin/thought-card-templates |
| `/dashboard/overview`            | 经营概览   | `views/dashboard/overview/index.vue`             | /admin/dashboard/*     |
| `/file-manager`                  | 文件管理   | `views/file-manager/index.vue`                   | /admin/files           |
| `/home-blocks`                   | 首页配置   | `views/home-blocks/index.vue`                    | /admin/home-blocks     |

**新增 fronted route module 文件**:
```
router/routes/modules/
  dashboard.ts     ← 已有, 补充 overview
  business.ts      ← 已有, 补充新路由
  system.ts        ← NEW: admin-users, roles, audit-logs, system-config
  content.ts       ← NEW: encyclopedia, notifications
  file-manager.ts  ← NEW
  home-blocks.ts   ← NEW
```

---

## 7. 关键架构决策

### 7.1 订单号生成模式
- 使用 `nanoid` 生成短唯一 ID 作为订单号前缀 + 日期 + 流水
- 基于 Redis INCR 实现日流水 (每天从 1 开始, `key: order:incr:20260613`)
- 回退方案: MongoDB 自增计数器 Document

### 7.2 微信 OAuth 流程
```
小程序 wx.login() → code
  → POST /api/v1/app/auth/login { code }
  → 后端调微信 code2session → 获取 openid
  → 查找/创建用户 → 生成 JWT (小程序短时效 token)
  → 返回 { accessToken, user }
```

### 7.3 微信支付流程
```
用户点击支付
  → POST /api/v1/app/orders/:id/pay
  → OrdersService 验证订单状态
  → PaymentService 调微信统一下单 API
  → 返回 prepay_id + 小程序调起支付参数
  → 小程序 wx.requestPayment
  → 微信异步通知 /api/v1/payment/wechat-notify
  → 更新订单状态
```

### 7.4 PII 加密
- 手机号/姓名/地址使用 AES-256-CBC 加密存储
- 解密仅在后台管理、发货等必要场景
- 小程序端展示前 3 位 + 后 4 位脱敏

### 7.5 Throttler 速率限制
```
全局: 100 次/60 秒
登录: 5 次/60 秒 (防暴力)
小程序 API: 30 次/60 秒
念卡 AI 生成: 1 次/10 秒 (防滥用)
```

### 7.6 定时任务
| 任务                   | 频率       | 说明                      |
| ---------------------- | ---------- | ------------------------- |
| 自动关闭超时未支付订单 | 每 5 分钟  | 超时 30 分钟的 pending_payment |
| 自动确认收货           | 每天 2:00  | 已发货 15 天的订单        |
| Dashboard 缓存刷新     | 每 10 分钟 | Redis 缓存聚合数据        |
| 微信 AccessToken 刷新  | 每 110 分钟 | Token 有效期 2 小时       |

---

## 8. 估算总工作量

| Phase | 模块数 | 后端文件 | 前端文件 | 预估天 (单人) | 2 人并行天 |
| ----- | ------ | -------- | -------- | ------------- | ---------- |
| 1     | 4      | 22       | 4        | 10            | 6          |
| 2     | 4      | 25       | 5        | 10            | 6          |
| 3     | 4      | 33       | 7        | 15            | 8          |
| 4     | 1 (大)  | 40       | 8        | 20            | 12         |
| 5     | 2      | 14       | 4        | 8             | 5          |
| **合计** | **15** | **134** | **28**  | **63天**      | **37天**  |

**前端资源同步**: 后端每完成一个模块, 前端需要 1-2 天开发对应页面。建议 Phase 1 后端开始 3 天后前端开始并行开发。

---

## 9. 前端新增文件的完整清单

```
apps/web-ele/src/
  api/
    admin-users.ts
    roles.ts
    users.ts
    themes.ts
    designs.ts
    bracelets.ts
    thought-cards.ts
    orders.ts
    refunds.ts
    reviews.ts
    dashboard.ts
    contents.ts
    home-blocks.ts
    files.ts
    system-config.ts
    audit-logs.ts
    notifications.ts
  views/
    system/
      admin-users/index.vue
      system-config/index.vue
      audit-logs/index.vue
      roles/index.vue
    operations/
      users/index.vue
      content/index.vue
      notifications/index.vue
    trade/
      orders/index.vue
      after-sales/index.vue
      reviews/index.vue
    themes/
      configs/index.vue
      recommendation-rules/index.vue
    creations/
      designs/index.vue
      bracelets/index.vue
      thought-cards/index.vue
      thought-card-templates/index.vue
    dashboard/
      overview/index.vue          ← 已有, 需扩展
    file-manager/index.vue
    home-blocks/index.vue
  router/routes/modules/
    system.ts                     ← NEW
    content.ts                    ← NEW
    file-manager.ts               ← NEW
    home-blocks.ts                ← NEW
```

---

## 10. 阶段 Checkpoint 与测试策略

每个 Phase 结束时的验证标准:

**Phase 1**:
- [ ] Rbac 创建/编辑/删除角色正常
- [ ] 管理员 CRUD + 关联角色生效
- [ ] 文件上传至 OSS + 列表展示正常
- [ ] 系统配置读写正常

**Phase 2**:
- [ ] 用户列表 + 搜索 + 封禁功能正常
- [ ] 百科文章 CRUD + 发布正常
- [ ] 首页区块配置生效
- [ ] 审计日志自动记录并可查询

**Phase 3**:
- [ ] 主题创建 + 推荐规则配置正常
- [ ] 设计稿列表查看正常
- [ ] 手串记录查看正常
- [ ] 念卡模板 CRUD 正常

**Phase 4**:
- [ ] 购物车增删改查正常
- [ ] 订单创建/支付/发货/收货流程完整
- [ ] 售后申请/审批流程正常
- [ ] 评价审核正常

**Phase 5**:
- [ ] Dashboard 各指标数据聚合正确
- [ ] 通知创建/发送正常
- [ ] 压力测试: 100 并发订单创建通过
- [ ] E2E 流程: 登录 → 商品管理 → 用户运营 → 订单处理完整走通

---

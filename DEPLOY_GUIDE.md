# 项目部署指南 (Linux + Nginx + PM2)

> **核心优势：数据自托管与隐私保护**
>
> 本指南的核心目标是帮助您搭建一个 **完全私有** 的健康管理实例。通过遵循以下步骤，您的所有个人数据都将存储在您自己控制的服务器和数据库中，确保了最高级别的数据隐私和安全。

---

### **核心配置 (快速上手)**

对于熟悉部署流程的用户，您只需要关心以下两个文件：

1.  **后端配置**: `后端服务/.env`
    *   复制 `后端服务/.env.example` 创建此文件。
    *   填入您的数据库连接信息、JWT密钥、CORS白名单以及第三方登录凭据。

2.  **前端配置**: `前端开发/public/config.js` (或构建后的 `/var/www/health-hub/config.js`)
    *   在前端项目 **构建并上传到服务器后**，修改此文件。
    *   将 `API_BASE_URL` 指向您部署的后端服务公网地址。

---

### **第一步：准备服务器环境**

在您的 Linux 服务器上，确保已经安装了 `Node.js` (建议 LTS 版本, 如 v20.x)、`npm` 和 `Git`。

```bash
# (以 Ubuntu 为例) 安装所需软件
sudo apt-get update
sudo apt-get install -y nodejs npm git
```

---

### **第二步：数据库初始化**

在部署后端服务之前，您需要先创建数据库并初始化所有数据表。

1.  **创建数据库**:
    登录您的 MySQL 服务器，创建一个新的数据库。建议使用 `utf8mb4` 字符集。
    ```sql
    CREATE DATABASE health_hub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

2.  **创建数据表**:
    使用新创建的数据库，然后执行项目根目录下的 `database_schema.sql` 文件中的所有 `CREATE TABLE` 语句来初始化表结构。

    ```bash
    # 假设您的数据库用户有权限执行
    mysql -u YOUR_USERNAME -p health_hub_db < /path/to/your/project/database_schema.sql
    ```
    或者，您可以手动复制 `database_schema.sql` 的内容到您的数据库客户端中执行。

---

### **第三步：部署后端服务**

1.  **获取代码并安装依赖**:
    ```bash
    # 克隆项目到服务器
    git clone https://your-git-repository.com/health-hub.git /home/user/app
    
    # 进入后端目录并安装依赖
    cd /home/user/app/后端服务
    npm install
    ```

2.  **配置环境变量 (关键步骤)**:
    将 `.env.example` 文件复制一份并重命名为 `.env`，然后填入您的生产环境配置。

    ```bash
    # 在“后端服务”目录下
    cp .env.example .env
    nano .env
    ```
    
    请务必将 `.env` 文件中的所有占位符替换为真实的生产环境值：
    ```dotenv
    # =================================
    #      数据库配置
    # =================================
    DB_HOST=127.0.0.1
    DB_USER=YOUR_DATABASE_USER
    DB_PASSWORD=YOUR_DATABASE_PASSWORD
    DB_DATABASE=health_hub_db
    DB_PORT=3306

    # =================================
    #      安全与认证
    # =================================
    # 必须设置为一个非常复杂的随机字符串
    JWT_SECRET=change_this_to_a_very_long_and_secure_random_string

    # =================================
    #      服务器与域名配置
    # =================================
    # 后端服务运行的端口
    PORT=3000
    # 允许访问后端的的前端域名列表 (多个用逗号,分隔，不要有空格)
    # 例如: hb.jiankang.mom,www.another.com
    CORS_WHITELIST=hb.jiankang.mom
    # 您的前端主页地址，用于第三方登录成功后跳转
    FRONTEND_URL=https://hb.jiankang.mom

    # =================================
    #      第三方登录 (Linux.do)
    # =================================
    LINUX_DO_CLIENT_ID=YOUR_LINUX_DO_CLIENT_ID
    LINUX_DO_CLIENT_SECRET=YOUR_LINUX_DO_CLIENT_SECRET
    # 您的后端回调地址，必须与Linux.do后台配置完全一致
    LINUX_DO_REDIRECT_URI=https://api.jiankang.mom/api/linuxdo/callback
    # 以下地址通常无需修改
    LINUX_DO_AUTHORIZE_URL=https://connect.linux.do/oauth2/authorize
    LINUX_DO_TOKEN_URL=https://connect.linux.do/oauth2/token
    LINUX_DO_USER_INFO_URL=https://connect.linux.do/api/user
    ```

3.  **使用 PM2 启动服务**:
    `PM2` 是一个强大的 Node.js 进程管理器，可以保证服务在后台稳定运行。

    ```bash
    # 全局安装 PM2
    sudo npm install pm2 -g
    
    # 使用 PM2 启动后端应用
    # --name 参数为您的服务指定一个易于识别的名称
    pm2 start server.js --name health-hub-backend
    
    # 设置开机自启
    pm2 startup
    pm2 save
    ```
    现在，您的后端服务已在 `localhost:3000` 上运行。

---

### **第四步：部署前端应用**

前端应用采取“一次构建，多处部署”的策略，您只需在本地构建一次，即可通过修改服务器上的配置文件来适应不同环境。

1.  **本地构建**:
    在您 **本地电脑** 的 `前端开发` 目录下，安装依赖并运行构建命令。
    ```bash
    # 进入前端目录
    cd 前端开发
    
    # 安装依赖
    npm install
    
    # 构建生产环境文件
    npm run build
    ```
    这会在 `前端开发` 目录下生成一个 `dist` 文件夹。

2.  **上传文件**:
    在服务器上为前端文件创建一个目录，然后将本地 `dist` 目录下的 **所有内容** 上传到该目录。

    ```bash
    # 在服务器上创建目录
    sudo mkdir -p /var/www/health-hub
    
    # 从本地上传文件 (示例)
    # scp -r /path/to/your/project/前端开发/dist/* user@your_server_ip:/var/www/health-hub/
    ```

3.  **配置 API 地址 (关键步骤)**:
    上传完成后，**在服务器上** 编辑 `config.js` 文件，填入您的后端 API 地址。
    ```bash
    # 在服务器上编辑配置文件
    sudo nano /var/www/health-hub/config.js
    ```
    将其中的 `API_BASE_URL` 修改为您的后端服务的 **公网地址**：
    ```javascript
    // /var/www/health-hub/config.js
    window.APP_CONFIG = {
      // 将这里修改为您的后端 API 公网地址
      API_BASE_URL: 'https://api.jiankang.mom/api'
    };
    ```
    **优势**: 未来如果后端地址变更，您只需修改这一个文件并刷新浏览器，**无需重新打包和上传整个前端项目**。

---

### **第五步：安装并配置 Nginx**

Nginx 作为反向代理，将外部世界的域名请求转发到我们内部运行的服务上。

1.  **安装 Nginx**:
    ```bash
    sudo apt-get install -y nginx
    ```

2.  **创建 Nginx 配置文件**:
    ```bash
    sudo nano /etc/nginx/sites-available/health-hub
    ```

3.  **编辑配置文件**:
    将以下内容复制并粘贴到文件中，并 **替换为您自己的域名**。

    ```nginx
    # 后端服务 (例如: api.jiankang.mom)
    server {
        listen 80;
        server_name api.jiankang.mom; # 请替换为您的后端域名

        location / {
            proxy_pass http://127.0.0.1:3000; # 将所有请求转发给在3000端口运行的后端服务
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    # 前端服务 (例如: hb.jiankang.mom)
    server {
        listen 80;
        server_name hb.jiankang.mom; # 请替换为您的前端域名

        # 前端静态文件的根目录
        root /var/www/health-hub;
        index index.html;

        location / {
            # 对于单页应用(SPA)，所有未匹配到文件的请求都应重定向到 index.html
            try_files $uri $uri/ /index.html;
        }
    }
    ```
    **注意**: 上述配置是基于 HTTP (80端口)。对于生产环境，强烈建议您使用 `Certbot` 等工具为您的域名配置 HTTPS (SSL证书)。

4.  **启用站点并重启 Nginx**:
    ```bash
    # 创建符号链接以启用站点
    sudo ln -s /etc/nginx/sites-available/health-hub /etc/nginx/sites-enabled/
    
    # 测试 Nginx 配置是否有语法错误
    sudo nginx -t
    
    # 如果测试成功，则重启 Nginx 服务以应用新配置
    sudo systemctl restart nginx
    ```

---

### **第六步：DNS 配置**

最后，请确保您已经在您的域名提供商处设置了 DNS 记录：
-   `A` 记录 `api.jiankang.mom` (您的后端域名) 指向您的服务器 IP 地址。
-   `A` 记录 `hb.jiankang.mom` (您的前端域名) 指向您的服务器 IP 地址。

完成以上所有步骤后，您应该就可以通过 `https://hb.jiankang.mom` (您的前端域名) 访问您的应用了。

---

### **第七步：更新应用**

当项目发布新版本后，您可以按照以下步骤更新您已部署的应用。

1.  **更新后端服务**:
    ```bash
    # 进入后端代码目录
    cd /home/user/app/后端服务

    # 拉取最新的代码
    git pull

    # 重新安装依赖，以防有变动
    npm install

    # 重启后端服务
    pm2 restart health-hub-backend
    ```

2.  **更新前端应用**:
    ```bash
    # 在您的本地电脑上，进入前端代码目录
    cd path/to/your/project/前端开发

    # 拉取最新的代码
    git pull

    # 重新安装依赖并构建
    npm install
    npm run build

    # 将新生成的 dist 目录下的所有文件，重新上传到服务器的 /var/www/health-hub 目录，覆盖旧文件。
    # scp -r /path/to/your/project/前端开发/dist/* user@your_server_ip:/var/www/health-hub/
    ```
    前端更新完成后，用户只需刷新浏览器即可体验新版本。

---

### **附录：故障排查与管理**

- **查看后端日志**: 如果后端服务遇到问题，查看实时日志是定位问题的最佳方式。
  ```bash
  pm2 logs health-hub-backend
  ```

- **配置管理员账户**: 要指定一个用户为管理员，您需要手动修改数据库中的记录。
  1.  **找到用户ID**: 首先，通过用户名或邮箱在 `users` 表中找到您想设为管理员的用户记录，并获取其 `id`。
  2.  **更新权限**: 执行以下 SQL 命令，将该用户的 `is_admin` 字段设置为 `1`。
      ```sql
      -- 将 'YOUR_USER_ID' 替换为您要设为管理员的用户的实际 ID
      UPDATE users SET is_admin = 1 WHERE id = YOUR_USER_ID;
      ```
  3.  **访问后台**: 完成后，该用户重新登录，导航栏中将会出现“后台管理”链接。
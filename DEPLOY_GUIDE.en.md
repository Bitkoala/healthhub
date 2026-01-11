# Project Deployment Guide (Linux + Nginx + PM2)

> **Core Advantage: Data Self-Hosting & Privacy Protection**
>
> The primary goal of this guide is to help you set up a **completely private** instance of the health management application. By following these steps, all your personal data will be stored on your own server and database, ensuring the highest level of data privacy and security.

---

### **Core Configuration (Quick Start)**

For users familiar with deployment processes, you only need to focus on these two files:

1.  **Backend Config**: `后端服务/.env`
    *   Create this file by copying `后端服务/.env.example`.
    *   Fill in your database credentials, JWT secret, CORS whitelist, and third-party login credentials.

2.  **Frontend Config**: `前端开发/public/config.js` (or `/var/www/koala-health/config.js` after build)
    *   Modify this file **after** building and uploading the frontend project to your server.
    *   Point the `API_BASE_URL` to the public address of your deployed backend service.

---

### **Step 1: Prepare Server Environment**

On your Linux server, ensure that `Node.js` (LTS version recommended, e.g., v20.x), `npm`, and `Git` are installed.

```bash
# (Example for Ubuntu) Install required software
sudo apt-get update
sudo apt-get install -y nodejs npm git
```

---

### **Step 2: Database Initialization**

Before deploying the backend, you need to create the database and initialize all data tables.

1.  **Create Database**:
    Log in to your MySQL server and create a new database. Using the `utf8mb4` character set is recommended.
    ```sql
    CREATE DATABASE health_hub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

2.  **Create Tables**:
    Use the newly created database, then execute all `CREATE TABLE` statements from the `database_schema.sql` file in the project root to initialize the table structure.

    ```bash
    # Assuming your database user has execution permissions
    mysql -u YOUR_USERNAME -p health_hub_db < /path/to/your/project/database_schema.sql
    ```
    Alternatively, you can manually copy the contents of `database_schema.sql` and execute them in your database client.

---

### **Step 3: Deploy the Backend Service**

1.  **Get Code & Install Dependencies**:
    ```bash
    # Clone the project to your server
    git clone https://github.com/pandax-i/healthhub.git /home/user/app
    
    # Enter the backend directory and install dependencies
    cd /home/user/app/后端服务
    npm install
    ```

2.  **Configure Environment Variables (Crucial Step)**:
    Copy `.env.example` to a new file named `.env`, then fill in your production environment settings.

    ```bash
    # Inside the '后端服务' directory
    cp .env.example .env
    nano .env
    ```
    
    Be sure to replace all placeholders in the `.env` file with your actual production values:
    ```dotenv
    # =================================
    #      Database Configuration
    # =================================
    DB_HOST=127.0.0.1
    DB_USER=YOUR_DATABASE_USER
    DB_PASSWORD=YOUR_DATABASE_PASSWORD
    DB_DATABASE=health_hub_db
    DB_PORT=3306

    # =================================
    #      Security & Authentication
    # =================================
    # Must be set to a very long and complex random string
    JWT_SECRET=change_this_to_a_very_long_and_secure_random_string

    # =================================
    #      Server & Domain Config
    # =================================
    # Port the backend service will run on
    PORT=3000
    # Whitelist of frontend domains allowed to access the backend (comma-separated, no spaces)
    # Example: hb.jiankang.mom,www.another.com
    CORS_WHITELIST=a.joru.email
    # Your frontend's main page URL, for redirects after third-party login
    FRONTEND_URL=https://a.joru.email

    # =================================
    #      Third-Party Login (Linux.do)
    # =================================
    LINUX_DO_CLIENT_ID=YOUR_LINUX_DO_CLIENT_ID
    LINUX_DO_CLIENT_SECRET=YOUR_LINUX_DO_CLIENT_SECRET
    # Your backend's callback URL, must exactly match the one in your Linux.do app settings
    LINUX_DO_REDIRECT_URI=https://api.joru.email/api/linuxdo/callback
    # The following URLs usually do not need to be changed
    LINUX_DO_AUTHORIZE_URL=https://connect.linux.do/oauth2/authorize
    LINUX_DO_TOKEN_URL=https://connect.linux.do/oauth2/token
    LINUX_DO_USER_INFO_URL=https://connect.linux.do/api/user
    ```

3.  **Start Service with PM2**:
    `PM2` is a powerful Node.js process manager that keeps your service running reliably in the background.

    ```bash
    # Install PM2 globally
    sudo npm install pm2 -g
    
    # Start the backend app with PM2
    # The --name parameter gives your service an easy-to-identify name
    pm2 start server.js --name koala-health-backend
    
    # Set up startup script
    pm2 startup
    pm2 save
    ```
    Your backend service is now running on `localhost:3000`.

---

### **Step 4: Deploy the Frontend Application**

The frontend uses a "build once, deploy anywhere" strategy. You build the project locally once, then adapt it to different environments by modifying a config file on the server.

1.  **Build Locally**:
    On your **local machine**, navigate to the `前端开发` directory, install dependencies, and run the build command.
    ```bash
    # Enter the frontend directory
    cd 前端开发
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    ```
    This will create a `dist` folder inside the `前端开发` directory.

2.  **Upload Files**:
    On your server, create a directory for the frontend files, then upload **all contents** from your local `dist` folder to it.

    ```bash
    # Create directory on the server
    sudo mkdir -p /var/www/health-hub
    
    # Example of uploading files from local machine
    # scp -r /path/to/your/project/前端开发/dist/* user@your_server_ip:/var/www/health-hub/
    ```

3.  **Configure API Address (Crucial Step)**:
    After uploading, edit the `config.js` file **on the server** to point to your backend API.
    ```bash
    # Edit the configuration file on the server
    sudo nano /var/www/health-hub/config.js
    ```
    Change the `API_BASE_URL` to your backend service's **public address**:
    ```javascript
    // /var/www/health-hub/config.js
    window.APP_CONFIG = {
      // Change this to your backend API's public address
      API_BASE_URL: 'https://api.joru.email/api'
    };
    ```
    **Advantage**: If your backend address changes in the future, you only need to modify this single file and refresh the browser—**no need to rebuild and re-upload the entire frontend project**.

---

### **Step 5: Install and Configure Nginx**

Nginx acts as a reverse proxy, directing requests from the outside world to our internal services.

1.  **Install Nginx**:
    ```bash
    sudo apt-get install -y nginx
    ```

2.  **Create Nginx Config File**:
    ```bash
    sudo nano /etc/nginx/sites-available/health-hub
    ```

3.  **Edit Config File**:
    Copy and paste the following content into the file, **replacing the domains with your own**.

    ```nginx
    # Backend Service (e.g., api.jiankang.mom)
    server {
        listen 80;
        server_name api.joru.email; # Replace with your backend domain

        location / {
            proxy_pass http://127.0.0.1:3000; # Forward all requests to the backend service on port 3000
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    # Frontend Service (e.g., hb.jiankang.mom)
    server {
        listen 80;
        server_name a.joru.email; # Replace with your frontend domain

        # Root directory for frontend static files
        root /var/www/health-hub;
        index index.html;

        location / {
            # For a Single Page Application (SPA), all requests not matching a file should fall back to index.html
            try_files $uri $uri/ /index.html;
        }
    }
    ```
    **Note**: The above configuration is for HTTP (port 80). For a production environment, it is strongly recommended to configure HTTPS (SSL certificates) for your domains using a tool like `Certbot`.

4.  **Enable Site and Restart Nginx**:
    ```bash
    # Create a symbolic link to enable the site
    sudo ln -s /etc/nginx/sites-available/health-hub /etc/nginx/sites-enabled/
    
    # Test Nginx configuration for syntax errors
    sudo nginx -t
    
    # If the test is successful, restart Nginx to apply the new configuration
    sudo systemctl restart nginx
    ```

---

### **Step 6: DNS Configuration**

Finally, ensure you have set up the necessary DNS records at your domain provider:
-   An `A` record for `api.jiankang.mom` (your backend domain) pointing to your server's IP address.
-   An `A` record for `hb.jiankang.mom` (your frontend domain) pointing to your server's IP address.

After completing all these steps, you should be able to access your application at `https://hb.jiankang.mom` (your frontend domain).

---

### **Step 7: Updating the Application**

When a new version of the project is released, you can update your deployed application by following these steps.

1.  **Update the Backend Service**:
    ```bash
    # Navigate to the backend code directory
    cd /home/user/app/后端服务

    # Pull the latest code
    git pull

    # Re-install dependencies in case they have changed
    npm install

    # Restart the backend service
    pm2 restart health-hub-backend
    ```

2.  **Update the Frontend Application**:
    ```bash
    # On your local machine, navigate to the frontend code directory
    cd path/to/your/project/前端开发

    # Pull the latest code
    git pull

    # Re-install dependencies and build
    npm install
    npm run build

    # Re-upload all files from the newly generated dist directory to your server's /var/www/health-hub directory, overwriting the old files.
    # scp -r /path/to/your/project/前端开发/dist/* user@your_server_ip:/var/www/health-hub/
    ```
    After the frontend is updated, users just need to refresh their browser to experience the new version.

---

### **Appendix: Troubleshooting & Management**

- **Viewing Backend Logs**: If the backend service encounters issues, viewing the real-time logs is the best way to diagnose the problem.
  ```bash
  pm2 logs health-hub-backend
  ```

- **Configuring an Admin Account**: To designate a user as an administrator, you need to manually modify the record in the database.
  1.  **Find User ID**: First, find the user you want to make an admin in the `users` table by their username or email and get their `id`.
  2.  **Update Permissions**: Execute the following SQL command to set the user's `is_admin` field to `1`.
      ```sql
      -- Replace 'YOUR_USER_ID' with the actual ID of the user you want to make an admin
      UPDATE users SET is_admin = 1 WHERE id = YOUR_USER_ID;
      ```
  3.  **Access Panel**: After this, when the user logs in again, an "Admin Panel" link will appear in the navigation bar.
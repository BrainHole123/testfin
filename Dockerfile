# Build Stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# 接收构建参数 API_KEY
ARG API_KEY
ENV API_KEY=$API_KEY

# 构建 React 应用
RUN npm run build

# Production Stage
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建数据目录 (用于挂载后端生成的 JSON)
RUN mkdir -p /usr/share/nginx/html/data

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

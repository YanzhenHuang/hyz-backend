# 黄彦祯简历LLM后端

这个后端Express服务器用于为前端和Dify端提供通信，防止流量过载、API Key滥用等问题。

## Docker部署

1. 构建

```bash
docker build -t hyz-backend .
```

建议使用`bash`命令行，不使用`powershell`。因为`Dockerfile`中引入了`node`源，
可能需要代理才能够访问。如果提示无法访问到`node`源，请为`bash`设置代理：

```bash
export http_proxy=http://proxy_url:proxy_port
export https_proxy=http://proxy_url:proxy_port
```

2. 运行

```bash
docker run -d \
  -p 7016:your_port \
  --env SYSTEM_PORT=your_port \
  --env DIFY_URL=your_dify_url \
  --env DIFY_API_KEY=your_dify_api_key \
  hyz-backend
```

3. 部署

登录Docker Hub

```bash
docker login
```

链接本地和远程镜像

```bash
docker tag hyz-backend your_dockerhub_-_username/hyz-backend:latest
```

推送本地镜像

```bash
docker push your_dockerhub_username/hyz-backend:latest
```

拉取远程镜像

```bash
docker pull your_dockerhub_username/hyz-backend:latest
```
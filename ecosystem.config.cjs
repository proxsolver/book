module.exports = {
  apps: [
    {
      name: 'book-dev-server',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/ubuntu/book',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'book-cloudflare-tunnel',
      script: '/usr/local/bin/cloudflared',
      args: 'tunnel --url http://3.34.179.148:4000',
      autorestart: true,
      watch: false
    }
  ]
};

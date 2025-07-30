module.exports = {
  apps: [{
    name: 'futinfo-web',
    script: 'node_modules/.bin/next',
    args: 'dev',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '3G',
    env: {
      NODE_ENV: 'development',
      NODE_OPTIONS: '--max-old-space-size=4096'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
}
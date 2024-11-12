module.exports = {
  apps: [
    {
      name: 'FACE',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        TYPE_ENV: 'FACE',
      },
    },
    {
      name: 'REVERSE_GRID_BOTS',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        TYPE_ENV: 'REVERSE_GRID_BOTS',
      },
    },
    {
      name: 'SIMULATORS',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        TYPE_ENV: 'SIMULATORS',
      },
    },
  ],
};

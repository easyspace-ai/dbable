import LuckDB from '@easygrid/sdk';

// 创建 SDK 实例
export const luckdb = new LuckDB({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:2345',
  debug: true
});

export default luckdb;
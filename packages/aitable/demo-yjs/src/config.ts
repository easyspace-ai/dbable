/**
 * Demo 配置
 * 
 * 这里配置你的 LuckDB 后端地址和测试账号
 */

export const config = {
  // LuckDB API 地址
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:2345',

  // WebSocket 地址（可选）
  wsURL: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:2345',

  // 测试账号（仅用于演示）
  demo: {
    email: 'admin@126.com',
    password: 'Pmker123',
  },

  // 测试数据
  testBase: {
    baseId: (import.meta as any).env?.VITE_BASE_ID || '7ec1e878-91b9-4c1b-ad86-05cdf801318f',
    tableId: (import.meta as any).env?.VITE_TABLE_ID || 'tbl_Pweb3NpbtiUb4Fwbi90WP',
    viewId: (import.meta as any).env?.VITE_VIEW_ID || 'viw_FXNR0EDAlNxhxOIPylHZy',
  },

  // 是否启用调试模式
  debug: true,
};

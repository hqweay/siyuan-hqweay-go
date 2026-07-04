/**
 * 简单日志模块
 *
 * 默认关闭，避免生产环境暴露调试日志。
 * 在设置面板的「调试日志」开关开启后生效，无需引入外部依赖。
 */

let _enabled = false;

export function enableLogging(v: boolean) {
  _enabled = v;
}

export function isLoggingEnabled() {
  return _enabled;
}

export function getLogger(name: string) {
  const prefix = `[${name}]`;
  return {
    debug: (...args: any[]) => _enabled && console.debug(prefix, ...args),
    info:  (...args: any[]) => _enabled && console.info(prefix, ...args),
    warn:  (...args: any[]) => _enabled && console.warn(prefix, ...args),
    error: (...args: any[]) => _enabled && console.error(prefix, ...args),
  };
}

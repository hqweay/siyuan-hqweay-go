import { isArrayEmpty, isArrayNotEmpty } from "./array-util";


export class CacheUtil {


    private cache: Map<string, { value: any, expiry: number }> = new Map();

    /**
     * 设置缓存
     * @param key 缓存键
     * @param value 缓存值
     * @param ttl 缓存有效时间（毫秒）
     */
    set(key: string, value: any, ttl: number): void {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
    }


    setByPrefix(prefix: string, suffix: string, value: any, ttl: number) {
        let key = prefix + suffix;
        this.set(key, value, ttl);
    }


    /**
     * 获取缓存
     * @param key 缓存键
     * @returns 缓存值或 null
     */
    get(key: string): any | null {
        const cachedItem = this.cache.get(key);
        if (cachedItem) {
            if (cachedItem.expiry > Date.now()) {
                return cachedItem.value;
            } else {
                this.cache.delete(key);
            }
        }
        return null;
    }

    popByPrefix(prefix: string): any[] {
        let result: any[] = [];
        for (const [key, value] of this.cache.entries()) {
            if (key.startsWith(prefix)) {
                if (value.expiry > Date.now()) {
                    result.push(value);
                }
                this.cache.delete(key);
            }
        }
        return result;
    }



    /**
     * 主动丢弃缓存
     * @param key 缓存键
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * 清除所有过期的缓存项
     */
    cleanUp(): void {
        const now = Date.now();
        for (const [key, { expiry }] of this.cache) {
            if (expiry <= now) {
                this.cache.delete(key);
            }
        }
    }

    clearByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
}


export function generateKey(...parts: string[]): string {
    // 使用指定的分隔符连接所有字符串
    const separator = ':';
    return parts.join(separator);
}

export function getObjectSizeInKB(obj: any): number {
    try {
        // 将 JSON 对象转换为字符串
        const jsonString = JSON.stringify(obj);

        // 计算字符串的字节数
        const bytes = new Blob([jsonString]).size;

        // 将字节数转换为 KB
        const kilobytes = bytes / 1024;
        return kilobytes;
    } catch (err) {
        console.log("计算对象大小报错")
    }
    return 0;
}


export function isBoolean(value: any): value is boolean {
    return typeof value === 'boolean';
}

export function isObject(value: any): value is object {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}


/**
 * obj1 字段为空的值由 obj2 补上。
 * @param obj1 
 * @param obj2 默认配置对象
 * @returns 
 */
export function mergeObjects<T extends object, U extends object>(obj1: T, obj2: U): T & U {

    const result = { ...obj1 } as T & U;

    for (const key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            // 仅当 obj1[key] 为 null 或 undefined 时才覆盖
            if (result[key] === null || result[key] === undefined) {
                (result as any)[key] = obj2[key];
            }
        }
    }

    return result;
}


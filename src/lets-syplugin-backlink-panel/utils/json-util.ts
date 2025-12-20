// 自定义 replacer 函数，在序列化时将 Set 对象转换为数组
export function setReplacer(key, value) {
    if (value instanceof Set) {
        return {
            _type: 'Set',
            _value: [...value]
        };
    }
    return value;
}

// 自定义 reviver 函数，在反序列化时将数组转换回 Set 对象
export function setReviver(key, value) {
    if (value && value._type === 'Set') {
        return new Set(value._value);
    }
    return value;
}


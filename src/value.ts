import { TypeId, Type } from './type';

function toBoolean(value: unknown, convert?: boolean): boolean {
    if (value == null) {
        return false;
    }
    const t = typeof value;
    if (t === 'boolean') {
        return value as boolean;
    } else if (convert && t === 'string') {
        if ((value as string).length === 0) {
            return false;
        }
        const lowerCaseValue = (value as string).toLowerCase();
        if (lowerCaseValue === 'true') {
            return true;
        }
        if (lowerCaseValue === 'false') {
            return false;
        }
    }
    throw new Error(`Invalid boolean value: ${value}`);
}

function toNumber(value: unknown, convert?: boolean): number {
    if (value == null) {
        return 0;
    }
    const t = typeof value;
    if (t === 'number') {
        if (!isNaN(value as number) && isFinite(value as number)) {
            return value as number;
        }
    } else if (convert && t === 'string') {
        if ((value as string).length === 0) {
            return 0;
        }
        const num = Number(value);
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
    }
    throw new Error(`Invalid number value: ${value}`);
}

function toInt(value: unknown, convert?: boolean): number {
    if (value == null) {
        return 0;
    }
    const t = typeof value;
    if (t === 'number') {
        if (!isNaN(value as number) && isFinite(value as number)) {
            return Math.trunc(value as number);
        }
    } else if (convert && t === 'string') {
        if ((value as string).length === 0) {
            return 0;
        }
        const num = Number(value);
        if (!isNaN(num) && isFinite(num)) {
            return Math.trunc(num);
        }
    }
    throw new Error(`Invalid int value: ${value}`);
}

function toString(value: unknown, convert?: boolean): string {
    if (value == null) {
        return '';
    }
    const t = typeof value;
    if (t === 'string') {
        return value as string;
    } else if (convert) {
        return String(value);
    }
    throw new Error(`Invalid string value: ${value}`);
}

function toObject(value: unknown, fields: Record<string, Type>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    let obj: Record<string, unknown> | undefined = undefined;
    if (value != null) {
        if (typeof value !== 'object') {
            throw new Error(`Invalid object value: ${value}`);
        }
        obj = value as Record<string, unknown>;
    }
    for (let key in fields) {
        const fieldType = fields[key];
        if (fieldType.typeId === TypeId.Boolean) {
            result[key] = toBoolean(obj && obj[key]);
        } else if (fieldType.typeId === TypeId.Number) {
            result[key] = toNumber(obj && obj[key]);
        } else if (fieldType.typeId === TypeId.Int) {
            result[key] = toInt(obj && obj[key]);
        } else if (fieldType.typeId === TypeId.String) {
            result[key] = toString(obj && obj[key]);
        } else if (fieldType.typeId === TypeId.Object) {
            result[key] = toObject(obj && obj[key], fieldType.fields!);
        } else if (fieldType.typeId === TypeId.Array) {
            result[key] = toArray(obj && obj[key], fieldType.elemType!);
        } else {
            throw new Error(`Invalid type: ${fieldType}`);
        }
    }
    return result;
}

function toArray(value: unknown, elemType: Type): unknown[] {
    if (value == null) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Invalid array value: ${value}`);
    }
    const result: unknown[] = [];
    if (elemType.typeId === TypeId.Boolean) {
        for (let elem of value) {
            result.push(toBoolean(elem));
        }
    } else if (elemType.typeId === TypeId.Number) {
        for (let elem of value) {
            result.push(toNumber(elem));
        }
    } else if (elemType.typeId === TypeId.Int) {
        for (let elem of value) {
            result.push(toInt(elem));
        }
    } else if (elemType.typeId === TypeId.String) {
        for (let elem of value) {
            result.push(toString(elem));
        }
    } else if (elemType.typeId === TypeId.Object) {
        for (let elem of value) {
            result.push(toObject(elem, elemType.fields!));
        }
    } else if (elemType.typeId === TypeId.Array) {
        for (let elem of value) {
            result.push(toArray(elem, elemType.elemType!));
        }
    } else {
        throw new Error(`Invalid type: ${elemType}`);
    }
    return result;
}

function parseValue(value: unknown, type: Type): unknown {
    if (type.typeId === TypeId.Boolean) {
        return toBoolean(value, true);
    } else if (type.typeId === TypeId.Number) {
        return toNumber(value, true);
    } else if (type.typeId === TypeId.Int) {
        return toInt(value, true);
    } else if (type.typeId === TypeId.String) {
        return toString(value, true);
    } else if (type.typeId === TypeId.Object) {
        if (value == null || value === '') {
            return toObject(null, type.fields!);
        }
        if (typeof value !== 'string') {
            throw new Error(`Invalid object value: ${value}`);
        }
        let ret: unknown;
        try {
            ret = eval(`(${value})`);
        } catch {
            throw new Error(`Invalid object value: ${value}`);
        }
        return toObject(ret, type.fields!);
    } else if (type.typeId === TypeId.Array) {
        if (value == null || value === '') {
            return toArray(null, type.elemType!);
        }
        if (typeof value !== 'string') {
            throw new Error(`Invalid array value: ${value}`);
        }
        let ret: unknown;
        try {
            ret = eval(`(${value})`);
        } catch {
            throw new Error(`Invalid array value: ${value}`);
        }
        return toArray(ret, type.elemType!);
    } else {
        throw new Error(`Invalid type: ${type}`);
    }
}

export { parseValue };
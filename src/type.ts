enum TypeId {
    Boolean,
    Number,
    Int,
    String,
    Object,
    Array,
}

interface Type {
    typeId: TypeId;
    fields?: Record<string, Type>;
    elemType?: Type;
}

enum ParseTypeState {
    Init,
    MaybeBoolean,
    MaybeNumber,
    MaybeInt,
    MaybeString,
    MaybeObject,
    GotType,
}

function parseType(define: string, start: number): { type: Type; len: number; } {
    let type: Type | undefined = undefined;
    let state = ParseTypeState.Init;
    let pos = start;
    while (pos < define.length) {
        const c = define[pos++];
        if (state === ParseTypeState.Init) {
            if (c === 'b') {
                state = ParseTypeState.MaybeBoolean;
            } else if (c === 'n') {
                state = ParseTypeState.MaybeNumber;
            } else if (c === 'i') {
                state = ParseTypeState.MaybeInt;
            } else if (c === 's') {
                state = ParseTypeState.MaybeString;
            } else if (c === 'o') {
                state = ParseTypeState.MaybeObject;
            } else if (!/\s/.test(c)) {
                throw new Error(`Unknown type at ${pos - 1}`);
            }
        } else if (state === ParseTypeState.MaybeBoolean) {
            if (c === 'o' && define.length - pos >= 5 && define.slice(pos, pos + 5) === 'olean') {
                pos += 5;
                type = { typeId: TypeId.Boolean };
                state = ParseTypeState.GotType;
                if (pos === define.length) {
                    return { type: type, len: pos - start };
                }
            } else {
                throw new Error(`Do you mean 'boolean' at ${pos - 2}?`);
            }
        } else if (state === ParseTypeState.MaybeNumber) {
            if (c === 'u' && define.length - pos >= 4 && define.slice(pos, pos + 4) === 'mber') {
                pos += 4;
                type = { typeId: TypeId.Number };
                state = ParseTypeState.GotType;
                if (pos === define.length) {
                    return { type: type, len: pos - start };
                }
            } else {
                throw new Error(`Do you mean 'number' at ${pos - 2}?`);
            }
        } else if (state === ParseTypeState.MaybeInt) {
            if (c === 'n' && define.length - pos >= 1 && define[pos] === 't') {
                pos++;
                type = { typeId: TypeId.Int };
                state = ParseTypeState.GotType;
                if (pos === define.length) {
                    return { type: type, len: pos - start };
                }
            } else {
                throw new Error(`Do you mean 'int' at ${pos - 2}?`);
            }
        } else if (state === ParseTypeState.MaybeString) {
            if (c === 't' && define.length - pos >= 4 && define.slice(pos, pos + 4) === 'ring') {
                pos += 4;
                type = { typeId: TypeId.String };
                state = ParseTypeState.GotType;
                if (pos === define.length) {
                    return { type: type, len: pos - start };
                }
            } else {
                throw new Error(`Do you mean 'string' at ${pos - 2}?`);
            }
        } else if (state === ParseTypeState.MaybeObject) {
            if (c === 'b' && define.length - pos >= 5 && define.slice(pos, pos + 5) === 'ject{') {
                const fields: Record<string, Type> = {};
                pos += 5;
                pos += parseObjectFields(define, pos, fields);
                type = { typeId: TypeId.Object, fields: fields };
                state = ParseTypeState.GotType;
                if (pos === define.length) {
                    return { type: type, len: pos - start };
                }
            } else {
                throw new Error(`Do you mean 'object{' at ${pos - 2}?`);
            }
        } else if (state === ParseTypeState.GotType) {
            if (c === '[') {
                if (define.length - pos >= 1 && define[pos] === ']') {
                    pos++;
                    type = { typeId: TypeId.Array, elemType: type };
                    if (pos === define.length) {
                        return { type: type, len: pos - start };
                    }
                } else {
                    throw new Error(`']' expected at ${pos}`);
                }
            } else {
                return { type: type!, len: pos - 1 - start };
            }
        } else {
            throw new Error('State error');
        }
    }
    throw new Error(`Parse type failed from ${start} to ${pos}`);
}

enum ParseObjectTypeState {
    KeyOrOver,
    Key,
    KeyEnd,
    TypeEnd,
}

function parseObjectFields(define: string, start: number, fields: Record<string, Type>): number {
    let key: string = '';
    let state = ParseObjectTypeState.KeyOrOver;
    let pos = start;
    while (pos < define.length) {
        const c = define[pos++];
        if (state === ParseObjectTypeState.KeyOrOver) {
            if (c === '}') {
                return pos - start;
            } else if (/[a-zA-Z_$]/.test(c)) {
                key = c;
                state = ParseObjectTypeState.Key;
            } else if (!/\s/.test(c)) {
                throw new Error(`Illegal first character of key at ${pos - 1}`);
            }
        } else if (state === ParseObjectTypeState.Key) {
            if (c === ':') {
                const result = parseType(define, pos);
                fields[key] = result.type;
                pos += result.len;
                state = ParseObjectTypeState.TypeEnd;
            } else if (/[a-zA-Z0-9_$]/.test(c)) {
                key += c;
            } else if (/\s/.test(c)) {
                state = ParseObjectTypeState.KeyEnd;
            } else {
                throw new Error(`Illegal character of key at ${pos - 1}`);
            }
        } else if (state === ParseObjectTypeState.KeyEnd) {
            if (c === ':') {
                const result = parseType(define, pos);
                fields[key] = result.type;
                pos += result.len;
                state = ParseObjectTypeState.TypeEnd;
            } else if (!/\s/.test(c)) {
                throw new Error(`':' expected at ${pos - 1}`);
            }
        } else if (state === ParseObjectTypeState.TypeEnd) {
            if (c === ';') {
                state = ParseObjectTypeState.KeyOrOver;
            } else if (!/\s/.test(c)) {
                throw new Error(`';' expected at ${pos - 1}`);
            }
        } else {
            throw new Error('ParseObjectTypeState error');
        }
    }
    throw new Error(`Parse object field failed from ${start} to ${pos}`);
}

function parseTypeDefine(define: string): Type {
    const result = parseType(define, 0);
    if (result.len !== define.length) {
        throw new Error(`Unexpected chatacter at ${result.len}`);
    }
    return result.type;
}

export { TypeId, Type, parseTypeDefine };
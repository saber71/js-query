import deepEqual from 'deep-equal';

/**
 * 根据提供的数据和过滤条件，检查数据是否匹配条件。
 * @param data 要检查的数据项，它必须包含一个名为"_id"的字符串属性和任意数量的其他属性。
 * @param condition 过滤条件，一个描述如何过滤数据的对象。
 * @returns 布尔值，表示数据是否匹配过滤条件。
 */ function matchQueryCondition(data, condition) {
    const filterPredicates = parseQueryCondition(condition);
    return filterPredicates.every((fn)=>fn(data));
}
/**
 * 创建一个过滤函数，用于根据提供的过滤条件过滤数据。
 * @param condition 过滤条件，一个描述如何过滤数据的对象。此参数为可选。
 * @returns 过滤函数，该函数接受一个值作为输入并返回一个布尔值，表示该值是否通过过滤条件。
 */ function query(condition) {
    const arr = parseQueryCondition(condition);
    return (value)=>arr.every((fn)=>fn(value));
}
/**
 * 解析过滤条件，将其转换为一系列函数，每个函数用于检查一个项目是否满足特定的过滤条件。
 *
 * @param condition 可选的过滤条件对象，可以包含多个条件，如等于、不等于、或、非等操作。
 * @returns 返回一个数组，其中每个函数接受一个项目（item）并返回一个布尔值，表示该项目是否满足条件。
 */ function parseQueryCondition(condition) {
    if (!condition) return [] // 如果没有提供条件，则直接返回空数组
    ;
    const filterPredicates = [];
    for(let keyOrPropName in condition){
        const conditionValue = condition[keyOrPropName];
        // 处理逻辑运算符（$or, $nor，$and）
        if (keyOrPropName === "$or" || keyOrPropName === "$nor" || keyOrPropName === "$and") {
            const filterConditions = conditionValue;
            const conditions = filterConditions.map(parseQueryCondition);
            // 处理"$and"条件
            if (keyOrPropName === "$and") {
                filterPredicates.push((item)=>{
                    for (let fnArray of conditions){
                        if (!fnArray.every((fn)=>fn(item))) return false // 如果有条件不满足，则返回false
                        ;
                    }
                    return true // 如果条件都满足，则返回true
                    ;
                });
            } else if (keyOrPropName === "$or") {
                filterPredicates.push((item)=>{
                    for (let fnArray of conditions){
                        if (fnArray.every((fn)=>fn(item))) return true // 如果有条件都满足，则返回true
                        ;
                    }
                    return false // 如果没有条件都满足，则返回false
                    ;
                });
            } else {
                // 处理"$nor"条件
                filterPredicates.push((item)=>{
                    for (let fnArray of conditions){
                        if (fnArray.every((fn)=>fn(item))) return false // 如果有条件满足，则返回false
                        ;
                    }
                    return true // 如果没有条件满足，则返回true
                    ;
                });
            }
        } else {
            // 处理简单条件和嵌套条件
            if (isCondition(conditionValue)) {
                parseCondition(keyOrPropName, conditionValue, filterPredicates);
            } else {
                if (typeof conditionValue === "object" && conditionValue) {
                    const subFilterPredicates = parseQueryCondition(conditionValue);
                    filterPredicates.push((item)=>{
                        if (item[keyOrPropName] === undefined || item[keyOrPropName] === null) return false // 如果项目中没有该属性或属性值为null，则返回false
                        ;
                        return subFilterPredicates.every((fn)=>fn(item[keyOrPropName])) // 检查嵌套条件是否都满足
                        ;
                    });
                } else {
                    // 处理基本的相等性条件
                    filterPredicates.push((item)=>item[keyOrPropName] === conditionValue);
                }
            }
        }
    }
    return filterPredicates;
}
/**
 * 解析条件，生成基于给定条件的筛选谓词数组。
 * @param propName 属性名，用于条件中访问对象的属性。
 * @param condition 一个对象，包含要应用的条件。
 * @param filterPredicates 筛选谓词的数组，每个谓词是一个函数，用于根据条件筛选项目。
 */ function parseCondition(propName, condition, filterPredicates) {
    // 遍历条件对象的所有键
    for(let conditionKey in condition){
        let conditionValue = condition[conditionKey];
        if (conditionValue === undefined) continue;
        // 根据不同的条件键，添加相应的筛选谓词到filterPredicates数组中
        if (conditionKey === "$less") filterPredicates.push((item)=>item[propName] < conditionValue);
        else if (conditionKey === "$greater") filterPredicates.push((item)=>item[propName] > conditionValue);
        else if (conditionKey === "$lessEqual") filterPredicates.push((item)=>item[propName] <= conditionValue);
        else if (conditionKey === "$greaterEqual") filterPredicates.push((item)=>item[propName] >= conditionValue);
        else if (conditionKey === "$not") filterPredicates.push((item)=>!deepEqual(item[propName], conditionValue, {
                strict: true
            }));
        else if (conditionKey === "$equal") filterPredicates.push((item)=>deepEqual(item[propName], conditionValue, {
                strict: true
            }));
        else if (conditionKey === "$dateBefore") {
            // 处理日期条件，判断日期是否在某个时间点之前
            if (conditionValue instanceof Date) conditionValue = conditionValue.getTime();
            filterPredicates.push((item)=>{
                let value = item[propName];
                if (value instanceof Date) value = value.getTime();
                else if (typeof value === "string") value = new Date(value).getTime();
                return value < conditionValue;
            });
        } else if (conditionKey === "$dateAfter") {
            // 处理日期条件，判断日期是否在某个时间点之后
            if (conditionValue instanceof Date) conditionValue = conditionValue.getTime();
            filterPredicates.push((item)=>{
                let value = item[propName];
                if (value instanceof Date) value = value.getTime();
                else if (typeof value === "string") value = new Date(value).getTime();
                return value > conditionValue;
            });
        } else if (conditionKey === "$or") {
            // 处理或条件，至少满足其中一个子条件
            const conditions = [];
            conditionValue.forEach((condition)=>parseCondition(propName, condition, conditions));
            filterPredicates.push((item)=>{
                for (let predicate of conditions){
                    if (predicate(item)) return true;
                }
                return false;
            });
        } else if (conditionKey === "$and") {
            // 处理与条件，要满足全部
            const conditions = [];
            conditionValue.forEach((condition)=>parseCondition(propName, condition, conditions));
            filterPredicates.push((item)=>{
                for (let predicate of conditions){
                    if (!predicate(item)) return false;
                }
                return true;
            });
        } else if (conditionKey === "$nor") {
            // 处理非或条件，所有子条件都不满足
            const conditions = [];
            conditionValue.forEach((condition)=>parseCondition(propName, condition, conditions));
            filterPredicates.push((item)=>{
                for (let predicate of conditions){
                    if (predicate(item)) return false;
                }
                return true;
            });
        } else if (conditionKey === "$in") {
            // 判断属性值是否在给定数组中
            filterPredicates.push((item)=>includes(conditionValue, item[propName]));
        } else if (conditionKey === "$notIn") {
            // 判断属性值是否不在给定数组中
            filterPredicates.push((item)=>!includes(conditionValue, item[propName]));
        } else if (conditionKey === "$contains") {
            // 判断属性值（数组或字符串）是否包含给定的值
            filterPredicates.push((item)=>{
                const value = item[propName];
                if (value instanceof Array) {
                    if (conditionValue instanceof Array) {
                        for (let cond of conditionValue){
                            if (!includes(value, cond)) return false;
                        }
                        return true;
                    } else return includes(value, conditionValue);
                } else if (typeof value === "string") {
                    if (conditionValue instanceof Array) {
                        for (let cond of conditionValue){
                            if (!includes(value, cond)) return false;
                        }
                        return true;
                    } else return includes(value, conditionValue);
                }
                return false;
            });
        } else if (conditionKey === "$notContains") {
            // 判断属性值（数组或字符串）是否不包含给定的值
            filterPredicates.push((item)=>{
                const value = item[propName];
                if (value instanceof Array) {
                    if (conditionValue instanceof Array) {
                        for (let cond of conditionValue){
                            if (includes(value, cond)) return false;
                        }
                        return true;
                    } else return !includes(value, conditionValue);
                } else if (typeof value === "string") {
                    if (conditionValue instanceof Array) {
                        for (let cond of conditionValue){
                            if (includes(value, cond)) return false;
                        }
                        return true;
                    } else return !includes(value, conditionValue);
                }
                return false;
            });
        } else if (conditionKey === "$match") {
            // 判断属性值是否与正则表达式匹配
            if (typeof conditionValue === "string") conditionValue = new RegExp(conditionValue);
            filterPredicates.push((item)=>conditionValue.test(item[propName]));
        }
    }
}
function isCondition(arg) {
    if (!arg || typeof arg !== "object") return false;
    const keys = [
        "$less",
        "$lessEqual",
        "$greater",
        "$greaterEqual",
        "$equal",
        "$not",
        "$dateBefore",
        "$dateAfter",
        "$or",
        "$nor",
        "$and",
        "$in",
        "$notIn",
        "$contains",
        "$notContains",
        "$match"
    ];
    for (let key of keys){
        if (key in arg) return true;
    }
    return false;
}
function includes(arr, value) {
    if (typeof arr === "string") return arr.includes(value);
    else return arr.find((item)=>deepEqual(item, value, {
            strict: true
        }));
}
function sortData(array, sortOrders) {
    const sortPredicates = sortOrders.map((item)=>{
        if (item.order === "asc") return (a, b)=>a[item.field] - b[item.field];
        else return (a, b)=>b[item.field] - a[item.field];
    });
    array.sort((a, b)=>{
        for (let sortPredicate of sortPredicates){
            const value = sortPredicate(a, b);
            if (value) return value;
        }
        return 0;
    });
}

export { matchQueryCondition, parseQueryCondition, query, sortData };

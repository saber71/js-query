export declare interface Condition<Value> {
    $less?: Value;
    $lessEqual?: Value;
    $greater?: Value;
    $greaterEqual?: Value;
    $equal?: Value;
    $not?: Value;
    $dateBefore?: Date | number;
    $dateAfter?: Date | number;
    $or?: Partial<Condition<Value>>[];
    $nor?: Partial<Condition<Value>>[];
    $and?: Partial<Condition<Value>>[];
    $in?: Value[];
    $notIn?: Value[];
    $contains: Value[] | Value;
    $notContains: Value[] | Value;
    $match: RegExp | string;
}

/**
 * 根据提供的数据和过滤条件，检查数据是否匹配条件。
 * @param data 要检查的数据项，它必须包含一个名为"_id"的字符串属性和任意数量的其他属性。
 * @param condition 过滤条件，一个描述如何过滤数据的对象。
 * @returns 布尔值，表示数据是否匹配过滤条件。
 */
export declare function matchQueryCondition<T extends {
    _id: string;
    [key: string]: any;
}>(data: T, condition: QueryCondition<T>): boolean;

/**
 * 解析过滤条件，将其转换为一系列函数，每个函数用于检查一个项目是否满足特定的过滤条件。
 *
 * @param condition 可选的过滤条件对象，可以包含多个条件，如等于、不等于、或、非等操作。
 * @returns 返回一个数组，其中每个函数接受一个项目（item）并返回一个布尔值，表示该项目是否满足条件。
 */
export declare function parseQueryCondition(condition?: QueryCondition<any> | null): Array<(item: any) => boolean>;

/**
 * 创建一个过滤函数，用于根据提供的过滤条件过滤数据。
 * @param condition 过滤条件，一个描述如何过滤数据的对象。此参数为可选。
 * @returns 过滤函数，该函数接受一个值作为输入并返回一个布尔值，表示该值是否通过过滤条件。
 */
export declare function query<T extends QueryItem>(condition?: QueryCondition<T> | null): (value: any) => boolean;

export declare type QueryCondition<TSchema extends QueryItem> = Partial<{
    [P in keyof TSchema]: TSchema[P] | QueryCondition<TSchema[P]> | Partial<Condition<TSchema[P]>>;
}> & Partial<{
    $or: QueryCondition<TSchema>[];
    $nor: QueryCondition<TSchema>[];
}>;

export declare interface QueryItem {
    _id: string;
    [key: string]: any;
}

export declare function sortData(array: any[], sortOrders: SortOrders): void;

export declare type SortOrders<T = any> = Array<{
    order: "asc" | "desc";
    field: keyof T;
}>;

export { }

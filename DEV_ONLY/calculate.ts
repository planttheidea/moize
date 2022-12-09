import { get, isEmpty, isNil, omitBy, set, union } from 'lodash';
import moize from '../src';
import { log, logCache } from './environment';

const AGG_TYPE = {
    AVG: 'AVG',
    COUNT: 'COUNT',
    INCLUSIVE: 'INCLUSIVE',
    SUM: 'SUM',
};

const { INCLUSIVE, SUM, AVG, COUNT } = AGG_TYPE;

export const getFieldValue = (item, field) => {
    let value = typeof field === 'string' ? item[field] : get(item, field);

    if (typeof value === 'object' && value !== null) {
        value = value.value;
    }

    return value;
};

export const setFieldValue = (item, field, value) => {
    if (typeof field === 'string') {
        item[field] = value;
    } else {
        set(item, field, value);
    }
};

export const getFieldAggValue = (item, field) => {
    const value = typeof field === 'string' ? item[field] : get(item, field);

    if (typeof value === 'object' && value !== null) {
        return value.agg;
    }

    return undefined;
};

export const unionInclusiveObject = (objA, objB) => {
    if (isNil(objA) && isNil(objB)) {
        return undefined;
    } else if (isNil(objA) && !isNil(objB)) {
        return typeof objB === 'object' ? { ...objB } : undefined;
    } else if (!isNil(objA) && isNil(objB)) {
        return typeof objA === 'object' ? { ...objA } : undefined;
    } else if (typeof objA !== 'object' || typeof objB !== 'object') {
        return undefined;
    }

    const sum = {};
    const objAKeys = Object.keys(objA);
    const objBKeys = Object.keys(objB);
    const keys = union(objAKeys, objBKeys);

    keys.forEach((key) => {
        sum[key] = (objA[key] || 0) + (objB[key] || 0);
    });

    return sum;
};

export const sumWithNil = (a, b) => {
    if (isNil(a) && isNil(b)) {
        return undefined;
    } else if (isNil(a) && !isNil(b)) {
        return b;
    } else if (!isNil(a) && isNil(b)) {
        return a;
    }

    return a + b;
};

// export const aggregateData = memoize(
// export const aggregateData = memoizee(
export const aggregateData = moize(
    (data, aggMetadata) => {
        const AGG_NAMES = Object.keys(aggMetadata);
        const { children } = data;

        if (isEmpty(children)) {
            return data;
        }

        // Recursion
        const newChildren = children.map((row) =>
            row.children ? aggregateData(row, aggMetadata) : row
        );

        const aggData = {};

        AGG_NAMES.forEach((aggName) => {
            const {
                ref: field = aggName,
                type,
                rounding,
            } = aggMetadata[aggName];

            let inclusiveAgg;

            let sumAgg;

            let avgAgg;

            let countAgg;

            newChildren.forEach((row) => {
                const rowAggValue = getFieldAggValue(row, field);
                const rowValue = getFieldValue(row, field);

                // Determine if it aggregates on aggregated value or on primitive value
                // Aggregate on aggregated: group row aggregated from group rows
                // Aggregate on primitive: group row aggregated from element rows

                const isAggOnAgg = !isNil(rowAggValue);
                const canAggOnPri = !isNil(rowValue);

                if (isAggOnAgg) {
                    countAgg = sumWithNil(countAgg, rowAggValue[COUNT]);
                } else if (canAggOnPri) {
                    countAgg = sumWithNil(countAgg, 1);
                }

                if (type === INCLUSIVE) {
                    if (isAggOnAgg) {
                        inclusiveAgg = unionInclusiveObject(
                            inclusiveAgg,
                            rowAggValue[INCLUSIVE]
                        );
                    } else if (canAggOnPri) {
                        inclusiveAgg = unionInclusiveObject(inclusiveAgg, {
                            [rowValue]: 1,
                        });
                    }
                } else if (type === SUM || type === AVG) {
                    if (isAggOnAgg) {
                        sumAgg = sumWithNil(sumAgg, rowAggValue[SUM]);
                    } else if (canAggOnPri) {
                        sumAgg = sumWithNil;

                        // document.body.style.margin(sumAgg, rowValue);
                    }
                }
            });

            if (type === AVG && countAgg && !isNil(sumAgg)) {
                avgAgg = sumAgg / countAgg;
                if (rounding) {
                    const { strategy } = rounding;

                    if (strategy === 'truncate') {
                        avgAgg = Math.trunc(avgAgg);
                    }
                }
            }

            setFieldValue(aggData, field, {
                agg: omitBy(
                    {
                        [AVG]: avgAgg,
                        [COUNT]: countAgg,
                        [INCLUSIVE]: inclusiveAgg,
                        [SUM]: sumAgg,
                    },
                    isNil
                ),
            });
        });

        return {
            ...data,
            ...aggData,
            children: newChildren,
        };
    },
    { profileName: 'aggregateData' }
);

const aggMetadata = {
    a: { type: COUNT },
    b: { type: SUM },
    c: { type: AVG },
    d: { type: INCLUSIVE },
};
const el1 = {
    a: 'sku_1',
    b: 1,
    c: 2,
    d: 'cat_1',
};
const el2 = {
    a: 'sku_2',
    b: 3,
    c: 4,
    d: 'cat_1',
};
const el3 = {
    a: 'sku_3',
    b: 5,
    c: undefined,
    d: 'cat_2',
};
const el4 = {
    a: 'sku_4',
    b: null,
    c: 0,
    d: 'cat_2',
};
const el5 = {
    a: 'sku_5',
    b: undefined,
    c: null,
    d: 'cat_2',
};

const dataToAggregate = {
    children: [{ children: [el1, el2] }, { children: [el3, el4, el5] }],
};

const calc = moize(
    (object, metadata) =>
        Object.keys(object).reduce((totals, key) => {
            if (Array.isArray(object[key])) {
                totals[key] = object[key].map((subObject) =>
                    calc(subObject, metadata)
                );
            } else {
                totals[key] = object[key].a + object[key].b + metadata.c;
            }

            return totals;
        }, {}),
    { profileName: 'calc', maxSize: 5 }
);

const data = {
    fifth: {
        a: 4,
        b: 5,
    },
    first: [
        {
            second: {
                a: 1,
                b: 2,
            },
        },
        {
            third: [
                {
                    fourth: {
                        a: 2,
                        b: 3,
                    },
                },
            ],
        },
    ],
};
const metadata = {
    c: 6,
};

export function aggregate() {
    const aggData1 = aggregateData(dataToAggregate, aggMetadata);
    const aggData2 = aggregateData(dataToAggregate, aggMetadata);

    log(
        'are aggregations equal',
        [dataToAggregate, aggMetadata],
        aggData1 === aggData2
    );

    return aggregateData;
}

export function calculate() {
    const result1 = calc(data, metadata);
    const result2 = calc(data, metadata);

    log('result 1', [data, metadata], result1);
    log('result 2', [data, metadata], result2);
    log(
        'are complex calculations equal',
        [data, metadata],
        result1 === result2
    );

    logCache(calc);

    return calc;
}

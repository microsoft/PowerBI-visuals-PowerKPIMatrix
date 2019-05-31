/*
*  Power BI Visualizations
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

import powerbi from "powerbi-visuals-api";

import { getRandomNumbers, testDataViewBuilder } from "powerbi-visuals-utils-testutils";
import { valueType } from "powerbi-visuals-utils-typeutils";

import { actualValueColumn } from "../src/columns/actualValueColumn";
import { comparisonValueColumn } from "../src/columns/comparisonValueColumn";
import { dateColumn } from "../src/columns/dateColumn";
import { kpiIndicatorIndexColumn } from "../src/columns/kpiIndicatorIndexColumn";
import { IVisualDataColumn } from "../src/columns/visualDataColumn";

import { getDateRange } from "./helpers";

interface IColumnDefinition {
    column: IVisualDataColumn;
    min: number;
    max: number;
}

interface IValuesSet {
    [columnName: string]: number[][];
}

export enum DataViewType {
    DEFAULT,
    CATEGORICAL_CONTINUOUS_SAMPLE,
}

export abstract class DataBuilder extends testDataViewBuilder.TestDataViewBuilder {
    public dates: Date[];
    public values: IValuesSet = {};

    protected amountOfValues: number;
    protected amountOfSeries: number;

    private columns: IColumnDefinition[] = [
        {
            column: actualValueColumn,
            max: 99999999,
            min: -99999999,
        }, {
            column: comparisonValueColumn,
            max: 99999999,
            min: -99999999,
        }, {
            column: kpiIndicatorIndexColumn,
            max: 5,
            min: 0,
        },
    ];

    constructor(amountOfValues: number, amountOfSeries: number, caseType: DataViewType = DataViewType.DEFAULT) {
        super();

        if (caseType === DataViewType.CATEGORICAL_CONTINUOUS_SAMPLE) {
            this.amountOfValues = 28;
            this.amountOfSeries = 1;

            const endDate: Date = new Date(2019, 3, 12);

            endDate.setDate(endDate.getDate() + this.amountOfValues);

            this.dates = [
                new Date(2019, 3, 14),
                new Date(2019, 3, 28),
                new Date(2019, 4, 2),
                new Date(2019, 4, 3),
                new Date(2019, 4, 4),
                new Date(2019, 4, 7),
            ];

            const activeValuesSet: number[][] = [[57, 6, 75, 57, 54, 57]];

            this.values[actualValueColumn.name] = activeValuesSet;
            this.values[comparisonValueColumn.name] = this.getRandomValuesSet(-99999999, 99999999);
            this.values[kpiIndicatorIndexColumn.name] = this.getRandomValuesSet(-99999999, 99999999);
        } else {
            this.amountOfValues = amountOfValues;
            this.amountOfSeries = amountOfSeries;

            const endDate: Date = new Date(1970, 0, 1);

            endDate.setDate(endDate.getDate() + this.amountOfValues);

            this.dates = getDateRange(
                new Date(1970, 0, 1),
                endDate,
                8.64e+7,
            );

            this.columns.forEach((column: IColumnDefinition) => {
                this.values[column.column.name] = this.getRandomValuesSet(column.max, column.max);
            });
        }
    }

    protected getRandomValuesSet(min: number, max: number): number[][] {
        const values: number[][] = [];

        for (let i: number = 0; i < this.amountOfSeries; i++) {
            values.push(getRandomNumbers(this.amountOfValues, min, max));
        }

        return values;
    }

    protected getDataViewCore(
        columnNames?: string[],
        extraValuesCategories = [],
    ): powerbi.DataView {
        const datesCategory = {
            source: {
                displayName: dateColumn.displayName as string,
                format: "%M/%d/yyyy",
                roles: { [dateColumn.name]: true },
                type: valueType.ValueType.fromDescriptor({ dateTime: true }),
            },
            values: this.dates,
        };

        const valuesCategories = [];

        this.columns.forEach((column: IColumnDefinition) => {
            this.values[column.column.name].forEach((values: number[], valuesIndex: number) => {
                valuesCategories.push({
                    source: {
                        displayName: `${column.column.displayName}#${valuesIndex}`,
                        roles: { [column.column.name]: true },
                        type: valueType.ValueType.fromDescriptor({ integer: true }),
                    },
                    values,
                });
            });
        });

        return this.createCategoricalDataViewBuilder(
            [datesCategory],
            valuesCategories.concat(extraValuesCategories),
            columnNames,
        ).build();
    }
}

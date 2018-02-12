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
/// <reference path="_references.ts"/>

namespace powerbi.extensibility.visual.test {
    // powerbi
    import DataView = powerbi.DataView;
    import ValueType = powerbi.extensibility.utils.type.ValueType;

    // powerbi.data
    import DataViewBuilderValuesColumnOptions = powerbi.extensibility.utils.test.dataViewBuilder.DataViewBuilderValuesColumnOptions;
    import DataViewBuilderCategoryColumnOptions = powerbi.extensibility.utils.test.dataViewBuilder.DataViewBuilderCategoryColumnOptions;
    import PowerKPIMatrix = powerbi.extensibility.visual.powerKPIMatrix62829589A9925A388A4404946E71C1FF.PowerKPIMatrix;
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // powerKPIMatrix
    import dateColumn = powerbi.extensibility.visual.dateColumn;
    import VisualDataColumn = powerbi.extensibility.visual.VisualDataColumn;
    import actualValueColumn = powerbi.extensibility.visual.actualValueColumn;
    import comparisonValueColumn = powerbi.extensibility.visual.comparisonValueColumn;
    import kpiIndicatorIndexColumn = powerbi.extensibility.visual.kpiIndicatorIndexColumn;
    import DataViewBuilder = powerbi.extensibility.utils.test.dataViewBuilder.TestDataViewBuilder;
    import helpers = powerbi.extensibility.utils.test.helpers;


    export interface ColumnDefinition {
        column: VisualDataColumn;
        min: number;
        max: number;
    }

    export interface ValuesSet {
        [columnName: string]: number[][];
    }

    export abstract class PowerKPIMatrixData extends DataViewBuilder {
        protected amountOfValues: number;
        protected amountOfSeries: number;

        private columns: ColumnDefinition[] = [
            {
                column: actualValueColumn,
                min: -99999999,
                max: 99999999
            }, {
                column: comparisonValueColumn,
                min: -99999999,
                max: 99999999
            }, {
                column: kpiIndicatorIndexColumn,
                min: 0,
                max: 5
            },
        ];

        public dates: Date[];
        public values: ValuesSet = {};

        constructor(amountOfValues: number, amountOfSeries: number) {
            super();

            this.amountOfValues = amountOfValues;
            this.amountOfSeries = amountOfSeries;

            const endDate: Date = new Date(1970, 0, 1);

            endDate.setDate(endDate.getDate() + this.amountOfValues);

            this.dates = helpers.getDateRange(
                new Date(1970, 0, 1),
                endDate,
                8.64e+7);

            this.columns.forEach((column: ColumnDefinition) => {
                this.values[column.column.name] = this.getRandomValuesSet(column.max, column.max);
            });
        }

        protected getRandomValuesSet(min: number, max: number): number[][] {
            const values: number[][] = [];

            for (let i: number = 0; i < this.amountOfSeries; i++) {
                values.push(helpers.getRandomNumbers(this.amountOfValues, min, max));
            }

            return values;
        }

        protected getDataViewCore(
            columnNames?: string[],
            extraValuesCategories: DataViewBuilderValuesColumnOptions[] = []
        ): DataView {
            const datesCategory: DataViewBuilderCategoryColumnOptions = {
                source: {
                    displayName: dateColumn.displayName as string,
                    format: "%M/%d/yyyy",
                    type: ValueType.fromDescriptor({ dateTime: true }),
                    roles: { [dateColumn.name]: true }
                },
                values: this.dates
            };

            const valuesCategories: DataViewBuilderValuesColumnOptions[] = [];

            this.columns.forEach((column: ColumnDefinition) => {
                this.values[column.column.name].forEach((values: number[], valuesIndex: number) => {
                    valuesCategories.push({
                        values,
                        source: {
                            displayName: `${column.column.displayName}#${valuesIndex}`,
                            type: ValueType.fromDescriptor({ integer: true }),
                            roles: { [column.column.name]: true }
                        }
                    });
                });
            });

            return this.createCategoricalDataViewBuilder(
                [datesCategory],
                valuesCategories.concat(extraValuesCategories),
                columnNames
            ).build();
        }
    }

    export class PowerKPIMatrixColumnBasedData extends PowerKPIMatrixData {
        constructor() {
            super(1000, 5);
        }

        public getDataView(columnNames?: string[]): DataView {
            return this.getDataViewCore(columnNames, []);
        }
    }


    export function getTestDOMElement(): d3.Selection<any> {
        return d3.select(helpers.testDom("1024", "1280").get(0));
    }

    export class PowerKPIMatrixTestWrapper {
        public dataView: DataView;
        public dataViewBuilder: DataViewBuilder;
        public visualBuilder: PowerKPIMatrixBuilder;

        constructor(dataViewBuilder: DataViewBuilder) {
            this.visualBuilder = new PowerKPIMatrixBuilder(1024, 768);
            this.dataViewBuilder = dataViewBuilder;

            this.dataView = this.dataViewBuilder.getDataView();
        }

        public static createWithColumnBasedData(): PowerKPIMatrixTestWrapper {
            return new PowerKPIMatrixTestWrapper(new PowerKPIMatrixColumnBasedData());
        }
    }

    export class PowerKPIMatrixBuilder extends VisualBuilderBase<PowerKPIMatrix> {
        constructor(width: number, height: number) {
            super(width, height);
        }

        protected build(): PowerKPIMatrix {
            return new PowerKPIMatrix({
                element: d3.selection().node() as HTMLElement,
                host: {
                    createSelectionIdBuilder: () => { }
                } as IVisualHost
            });
        }

        public get instance(): PowerKPIMatrix {
            return this.visual;
        }

        public get $root(): JQuery {
            return this.element;
            // return this.element.children(".powerKPIMatrix_rootComponent");
        }

        public get $cells(): JQuery {
            return this.$root//.find(".cellComponent");
        }
    }
}
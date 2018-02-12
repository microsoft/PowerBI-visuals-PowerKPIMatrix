/**
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

namespace powerbi.extensibility.visual {
    // powerbi

    export class ColumnSetConverter implements Converter<DataRepresentationColumnSet> {
        public convert(options: ConverterOptions): DataRepresentationColumnSet {
            const { dataView } = options;

            const dataMapping: DataRepresentationColumnSet = this.getDefaultColumnSet();

            if (!dataView
                || !dataView.table
                || !dataView.table.columns
            ) {
                return dataMapping;
            }

            dataView.table.columns.forEach((column: DataViewMetadataColumn) => {
                Object.keys(column.roles).forEach((roleName: string) => {
                    if (dataMapping[roleName]) {
                        dataMapping[roleName].push(column.displayName);

                        dataMapping[roleName].sort();
                    }
                });
            });

            return dataMapping;
        }

        private getDefaultColumnSet(): DataRepresentationColumnSet {
            const dataMapping: DataRepresentationColumnSet = {};

            [
                actualValueColumn,
                comparisonValueColumn,
                kpiIndicatorIndexColumn,
                kpiIndicatorValueColumn,
                secondComparisonValueColumn,
                secondKPIIndicatorValueColumn,
                rowBasedMetricNameColumn,
            ].forEach((column: VisualDataRole) => {
                dataMapping[column.name] = [];
            });

            return dataMapping;
        }
    }
}
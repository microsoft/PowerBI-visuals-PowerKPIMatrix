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
    export class DataRepresentationSeriesUtils {
        private static _instance: DataRepresentationSeriesUtils;

        constructor() {
            if (DataRepresentationSeriesUtils._instance) {
                return DataRepresentationSeriesUtils._instance;
            }

            DataRepresentationSeriesUtils._instance = this;
        }

        public static get instance(): DataRepresentationSeriesUtils {
            if (DataRepresentationSeriesUtils._instance) {
                return DataRepresentationSeriesUtils._instance;
            }

            return new DataRepresentationSeriesUtils();
        }

        public toArray(columnSet: DataRepresentationSeriesSet): DataRepresentationSeries[] {
            return Object.keys(columnSet).map((columnName: string) => {
                return columnSet[columnName];
            });
        }

        public sortSeriesBySortOrder(
            series: DataRepresentationSeries[],
            sortOrder: SortOrder
        ): DataRepresentationSeries[] {
            return series.sort((
                firstSeries: DataRepresentationSeries,
                secondSeries: DataRepresentationSeries
            ) => {
                let firstSeriesSortOrder = this.getSortOrder(firstSeries.sortOrder);
                let secondSeriesSortOrder = this.getSortOrder(secondSeries.sortOrder);

                if (sortOrder === SortOrder.Descending) {
                    [firstSeriesSortOrder, secondSeriesSortOrder] = [secondSeriesSortOrder, firstSeriesSortOrder];
                }

                if (firstSeriesSortOrder < secondSeriesSortOrder) {
                    return -1;
                } else if (firstSeriesSortOrder > secondSeriesSortOrder) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }

        private getSortOrder(order: DataRepresentationAxisValueType): DataRepresentationAxisValueType {
            return order || 0;
        }
    }
}
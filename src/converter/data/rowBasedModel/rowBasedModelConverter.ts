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

namespace powerbi.visuals.samples.powerKPIMatrix {
    export class RowBasedModelConverter extends DataConverter {
        protected converterStep(options: IConverterStepOptions): void {
            const {
                dataRepresentation,
                columnValues,
                identities,
                identityQueryName,
                rows,
                rowIndex,
                settings,
                settingsState,
                levels,
                viewMode,
            } = options;

            let axisValue: DataRepresentationAxisValueType;

            if (columnValues[dateColumn.name]) {
                const dateColumnName: string = Object.keys(columnValues[dateColumn.name])[0];

                axisValue =
                    dateColumnName
                    && columnValues[dateColumn.name][dateColumnName]
                    && columnValues[dateColumn.name][dateColumnName].value;
            }

            if (NumericValueUtils.isValueDefined(axisValue)) {
                const seriesColumnName: string = columnValues[rowBasedMetricNameColumn.name]
                    && Object.keys(columnValues[rowBasedMetricNameColumn.name])[0];

                const seriesName: string = seriesColumnName
                    && columnValues[rowBasedMetricNameColumn.name][seriesColumnName]
                    && columnValues[rowBasedMetricNameColumn.name][seriesColumnName].value
                    || undefined;

                if (seriesName) {
                    const series: DataRepresentationSeries
                        = this.getSeriesByDisplayName(
                            dataRepresentation.series,
                            dataRepresentation.seriesArray,
                            levels,
                            seriesName,
                            identities,
                            rowIndex,
                            identityQueryName,
                            rows,
                            settings,
                            settingsState,
                            dataRepresentation.type,
                            viewMode,
                        );

                    let currentValue: number;
                    let currentFormat: string;

                    let comparisonValue: number = NaN;
                    let comparisonFormat: string;
                    let isComparisonValueSpecified: boolean = false;
                    let comparisonValueColumnName: string;

                    let kpiIndicatorIndex: number = NaN;
                    let isKPIIndicatorIndexSpecified: boolean = false;

                    let kpiIndicatorValue: number = NaN;
                    let kpiIndicatorValueFormat: string;
                    let isKPIIndicatorValueSpecified: boolean = false;

                    let secondComparisonValue: number = NaN;
                    let secondComparisonValueFormat: string;
                    let isSecondComparisonValueSpecified: boolean = false;
                    let secondComparisonValueColumnName: string;

                    let secondKPIIndicatorValue: number = NaN;
                    let secondKPIIndicatorValueFormat: string;
                    let isSecondKPIIndicatorValueSpecified: boolean = false;

                    for (const columnName in columnValues) {
                        if (columnValues[columnName]) {
                            const currentColumnName: string = Object.keys(columnValues[columnName])[0];

                            const columnValue: ColumnValue = columnValues[columnName][currentColumnName];
                            const value = columnValue && columnValue.value;
                            const format: string = columnValue && columnValue.format;

                            switch (columnName) {
                                case actualValueColumn.name: {
                                    currentValue = value;
                                    currentFormat = format;

                                    break;
                                }
                                case comparisonValueColumn.name: {
                                    comparisonValue = value;
                                    comparisonFormat = format;
                                    comparisonValueColumnName = currentColumnName;

                                    isComparisonValueSpecified = true;

                                    break;
                                }
                                case kpiIndicatorIndexColumn.name: {
                                    kpiIndicatorIndex = value;

                                    isKPIIndicatorIndexSpecified = true;

                                    break;
                                }
                                case kpiIndicatorValueColumn.name: {
                                    kpiIndicatorValue = value;
                                    kpiIndicatorValueFormat = format;

                                    isKPIIndicatorValueSpecified = true;

                                    break;
                                }
                                case secondComparisonValueColumn.name: {
                                    secondComparisonValue = value;
                                    secondComparisonValueFormat = format;
                                    secondComparisonValueColumnName = currentColumnName;

                                    isSecondComparisonValueSpecified = true;

                                    break;
                                }
                                case secondKPIIndicatorValueColumn.name: {
                                    secondKPIIndicatorValue = value;
                                    secondKPIIndicatorValueFormat = format;

                                    isSecondKPIIndicatorValueSpecified = true;

                                    break;
                                }
                            }
                        }
                    }

                    this.applyDataToCurrentSeries({
                        series,
                        dataRepresentation,
                        axisValue,
                        currentValue,
                        currentFormat,
                        currentValueColumnName: series.name,
                        comparisonValue,
                        comparisonFormat,
                        isComparisonValueSpecified,
                        comparisonValueColumnName,
                        kpiIndicatorIndex,
                        isKPIIndicatorIndexSpecified,
                        kpiIndicatorValue,
                        kpiIndicatorValueFormat,
                        isKPIIndicatorValueSpecified,
                        secondComparisonValue,
                        secondComparisonValueFormat,
                        isSecondComparisonValueSpecified,
                        secondKPIIndicatorValue,
                        secondKPIIndicatorValueFormat,
                        isSecondKPIIndicatorValueSpecified,
                        secondComparisonValueColumnName,
                    });
                }
            }
        }

        public deepSearchSeries(
            seriesSet: DataRepresentationSeriesSet,
            levels: string[] = []
        ): DataRepresentationSeries {
            const restLevels: string[] = levels.slice(); // Copies an array in order not to modify the original one

            const currentLevel: string = restLevels.shift();

            const series: DataRepresentationSeries = seriesSet && seriesSet[currentLevel];

            if (!series) {
                return null;
            }

            if (!restLevels.length) {
                return series;
            }

            return this.deepSearchSeries(series.childrenSet, restLevels);
        }
    }
}

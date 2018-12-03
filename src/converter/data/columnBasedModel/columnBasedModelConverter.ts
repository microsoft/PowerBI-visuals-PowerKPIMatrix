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
    /**
     * TODO: This converter looks very heavy
     * TODO: Let's revisit and optimize this once you have a chance to improve this
     */
    export class ColumnBasedModelConverter extends DataConverter {
        constructor() {
            super(true);
        }

        protected converterStep(options: IConverterStepOptions): void {
            const {
                dataRepresentation,
                columnValues,
                identities,
                identityQueryName,
                columnMapping,
                rows,
                settings,
                settingsState,
                viewMode,
            } = options;

            let axisValue: DataRepresentationAxisValueType;

            if (columnValues[dateColumn.name]) {
                const dateColumnName: string = Object.keys(columnValues[dateColumn.name])[0];

                axisValue = (
                    dateColumnName
                    && columnValues[dateColumn.name][dateColumnName]
                    && columnValues[dateColumn.name][dateColumnName].value) || undefined;
            }

            if (NumericValueUtils.isValueDefined(axisValue)) {
                if (columnValues[actualValueColumn.name]) {
                    Object.keys(columnValues[actualValueColumn.name]).forEach((columnName: string, columnIndex: number) => {
                        if (columnMapping[columnName]) {
                            const series: DataRepresentationSeries
                                = this.getSeriesByDisplayName(
                                    dataRepresentation.series,
                                    dataRepresentation.seriesArray,
                                    [columnName],
                                    columnName,
                                    identities,
                                    columnIndex,
                                    identityQueryName,
                                    rows,
                                    settings,
                                    settingsState,
                                    dataRepresentation.type,
                                    viewMode,
                                );

                            const columnValue: ColumnValue = columnValues[actualValueColumn.name][columnName];

                            const currentValue: number = columnValue && columnValue.value;
                            const currentFormat: string = columnValue && columnValue.format;
                            const currentValueColumnName: string = columnName;

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

                            Object.keys(columnMapping[columnName]).forEach((roleName: string) => {
                                const mappedColumnName: string = columnMapping[columnName][roleName];

                                if (mappedColumnName !== undefined && mappedColumnName !== null && columnValues[roleName]) {
                                    const columnValue: ColumnValue = columnValues[roleName][mappedColumnName];
                                    const value: any = columnValue && columnValue.value;
                                    const format: string = columnValue && columnValue.format;

                                    switch (roleName) {
                                        case comparisonValueColumn.name: {
                                            comparisonValue = value;
                                            comparisonFormat = format;
                                            comparisonValueColumnName = mappedColumnName;

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
                                            secondComparisonValueColumnName = mappedColumnName;

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
                            });

                            this.applyDataToCurrentSeries({
                                series,
                                dataRepresentation,
                                axisValue,
                                currentValue,
                                currentFormat,
                                currentValueColumnName,
                                comparisonValue,
                                comparisonFormat,
                                comparisonValueColumnName,
                                isComparisonValueSpecified,
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
                    });
                }
            }
        }

        public deepSearchSeries(
            seriesSet: DataRepresentationSeriesSet,
            levels: string[] = []
        ): DataRepresentationSeries {
            const [seriesName] = levels;

            if (seriesSet[seriesName]) {
                return seriesSet[seriesName];
            }

            for (const seriesSetName in seriesSet) {
                const currentSeries: DataRepresentationSeries = seriesSet[seriesSetName];

                if (currentSeries && currentSeries.childrenSet) {
                    const series: DataRepresentationSeries = this.deepSearchSeries(currentSeries.childrenSet, levels);

                    if (series) {
                        return series;
                    }
                }
            }

            return null;
        }
    }
}

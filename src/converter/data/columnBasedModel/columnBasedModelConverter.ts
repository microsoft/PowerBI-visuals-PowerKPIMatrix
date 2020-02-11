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

import powerbi from "powerbi-visuals-api";

import {
    DataConverter,
    IColumnValue,
    IConverterStepOptions,
} from "../dataConverter";

import { actualValueColumn } from "../../../columns/actualValueColumn";
import { comparisonValueColumn } from "../../../columns/comparisonValueColumn";
import { dateColumn } from "../../../columns/dateColumn";
import { kpiIndicatorIndexColumn } from "../../../columns/kpiIndicatorIndexColumn";
import { kpiIndicatorValueColumn } from "../../../columns/kpiIndicatorValueColumn";
import { secondComparisonValueColumn } from "../../../columns/secondComparisonValueColumn";
import { secondKPIIndicatorIndexColumn } from "../../../columns/secondKPIIndicatorIndexColumn";
import { secondKPIIndicatorValueColumn } from "../../../columns/secondKPIIndicatorValueColumn";

import { NumericValueUtils } from "../../../utils/numericValueUtils";

import { DataRepresentationAxisValueType } from "../dataRepresentation/dataRepresentationAxisValueType";
import { IDataRepresentationSeries } from "../dataRepresentation/dataRepresentationSeries";
import { IDataRepresentationSeriesSet } from "../dataRepresentation/dataRepresentationSeriesSet";

/**
 * TODO: This converter looks very heavy
 * TODO: Let's revisit and optimize this once you have a chance to improve this
 */
export class ColumnBasedModelConverter extends DataConverter {
    constructor(protected createSelectionIdBuilder: () => powerbi.visuals.ISelectionIdBuilder) {
        super(true);
    }

    public deepSearchSeries(
        seriesSet: IDataRepresentationSeriesSet,
        levels: string[] = [],
    ): IDataRepresentationSeries {
        const [seriesName] = levels;

        if (seriesSet[seriesName]) {
            return seriesSet[seriesName];
        }

        for (const seriesSetName in seriesSet) {
            const currentSeries: IDataRepresentationSeries = seriesSet[seriesSetName];

            if (currentSeries && currentSeries.childrenSet) {
                const series: IDataRepresentationSeries = this.deepSearchSeries(currentSeries.childrenSet, levels);

                if (series) {
                    return series;
                }
            }
        }

        return null;
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
                        const series: IDataRepresentationSeries
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
                                this.createSelectionIdBuilder,
                            );

                        const columnValue: IColumnValue = columnValues[actualValueColumn.name][columnName];

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

                        let secondKPIIndicatorIndex: number = NaN;
                        let isSecondKPIIndicatorIndexSpecified: boolean = false;

                        let secondKPIIndicatorValue: number = NaN;
                        let secondKPIIndicatorValueFormat: string;
                        let isSecondKPIIndicatorValueSpecified: boolean = false;

                        Object.keys(columnMapping[columnName]).forEach((roleName: string) => {
                            const mappedColumnName: string = columnMapping[columnName][roleName];

                            if (mappedColumnName !== undefined && mappedColumnName !== null && columnValues[roleName]) {
                                const currentColumnValue: IColumnValue = columnValues[roleName][mappedColumnName];
                                const value: any = currentColumnValue && currentColumnValue.value;
                                const format: string = currentColumnValue && currentColumnValue.format;

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
                                    case secondKPIIndicatorIndexColumn.name: {
                                        secondKPIIndicatorIndex = value;

                                        isSecondKPIIndicatorIndexSpecified = true;

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
                            axisValue,
                            comparisonFormat,
                            comparisonValue,
                            comparisonValueColumnName,
                            currentFormat,
                            currentValue,
                            currentValueColumnName,
                            dataRepresentation,
                            isComparisonValueSpecified,
                            isKPIIndicatorIndexSpecified,
                            isKPIIndicatorValueSpecified,
                            isSecondComparisonValueSpecified,
                            isSecondKPIIndicatorIndexSpecified,
                            isSecondKPIIndicatorValueSpecified,
                            kpiIndicatorIndex,
                            kpiIndicatorValue,
                            kpiIndicatorValueFormat,
                            secondComparisonValue,
                            secondComparisonValueColumnName,
                            secondComparisonValueFormat,
                            secondKPIIndicatorIndex,
                            secondKPIIndicatorValue,
                            secondKPIIndicatorValueFormat,
                            series,
                        });
                    }
                });
            }
        }
    }
}

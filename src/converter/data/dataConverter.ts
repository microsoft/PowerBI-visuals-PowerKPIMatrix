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
import { AxisType } from "powerbi-visuals-powerkpi/src/settings/descriptors/axis/axisDescriptor";

import { actualValueColumn } from "../../columns/actualValueColumn";
import { categoryColumn } from "../../columns/categoryColumn";
import { comparisonValueColumn } from "../../columns/comparisonValueColumn";
import { dateColumn } from "../../columns/dateColumn";
import { hyperlinkColumn } from "../../columns/hyperlinkColumn";
import { imageColumn } from "../../columns/imageColumn";
import { kpiIndicatorValueColumn } from "../../columns/kpiIndicatorValueColumn";
import { secondComparisonValueColumn } from "../../columns/secondComparisonValueColumn";
import { sortOrderColumn } from "../../columns/sortOrderColumn";
import { IVisualDataColumn } from "../../columns/visualDataColumn";
import { SettingsState } from "../../services/state/settingsState";
import { IKPIIndicatorSettings } from "../../settings/descriptors/kpi/kpiIndicatorSettings";
import { NumberSettingsBase } from "../../settings/descriptors/numberSettingsBase";
import { SettingsPropertyBase } from "../../settings/descriptors/settingsPropertyBase";
import { LineStyle } from "../../settings/descriptors/sparklineSettings";
import { SubtotalSettings, SubtotalType } from "../../settings/descriptors/subtotalSettings";
import { TableStyle } from "../../settings/descriptors/tableSettings";
import { SeriesSettings } from "../../settings/seriesSettings";
import { Settings } from "../../settings/settings";
import { NumericValueUtils } from "../../utils/numericValueUtils";
import {
    IDataRepresentationColumnMapping,
} from "../columnMapping/dataRepresentation/dataRepresentationColumnMapping";
import { IConverter } from "../converter";
import { IConverterOptions } from "../converterOptions";
import { IDataRepresentation } from "./dataRepresentation/dataRepresentation";
import {
    IDataRepresentationAxis, IDataRepresentationAxisWithScale,
} from "./dataRepresentation/dataRepresentationAxis";
import {
    DataRepresentationAxisValueType,
} from "./dataRepresentation/dataRepresentationAxisValueType";
import { IDataRepresentationColumns } from "./dataRepresentation/dataRepresentationColumns";
import { IDataRepresentationPointSet } from "./dataRepresentation/dataRepresentationPointSet";
import { DataRepresentationScale } from "./dataRepresentation/dataRepresentationScale";
import { IDataRepresentationSeries } from "./dataRepresentation/dataRepresentationSeries";
import { IDataRepresentationSeriesSet } from "./dataRepresentation/dataRepresentationSeriesSet";
import { DataRepresentationSeriesUtils } from "./dataRepresentation/dataRepresentationSeriesUtils";
import { DataRepresentationTypeEnum } from "./dataRepresentation/dataRepresentationType";
import { VarianceStrategy } from "./variance/varianceStrategy";

export interface IHyperlinkSet {
    [metricName: string]: string;
}

export interface IColumnValue {
    value?: any;
    format?: string;
}

export interface IColumnValues {
    [columnName: string]: {
        [displayName: string]: IColumnValue;
    };
}

export interface ICategoryHyperlink {
    name: string;
    hyperlink: string;
    sortOrder: DataRepresentationAxisValueType;
    image: string;
}

export interface ICurrentSeriesData {
    dataRepresentation: IDataRepresentation;
    series: IDataRepresentationSeries;

    axisValue: DataRepresentationAxisValueType;

    currentValue: number;
    currentFormat: string;
    currentValueColumnName: string;

    comparisonValue: number;
    comparisonFormat: string;
    isComparisonValueSpecified: boolean;
    comparisonValueColumnName: string;

    kpiIndicatorIndex: number;
    isKPIIndicatorIndexSpecified: boolean;

    kpiIndicatorValue: number;
    kpiIndicatorValueFormat: string;
    isKPIIndicatorValueSpecified: boolean;

    secondComparisonValue: number;
    secondComparisonValueFormat: string;
    isSecondComparisonValueSpecified: boolean;
    secondComparisonValueColumnName: string;

    secondKPIIndicatorValue: number;
    secondKPIIndicatorValueFormat: string;
    isSecondKPIIndicatorValueSpecified: boolean;
}

export interface IConverterStepOptions {
    dataRepresentation: IDataRepresentation;
    columnValues: IColumnValues;
    identities: powerbi.visuals.CustomVisualOpaqueIdentity[];
    identityQueryName: string;
    columnMapping: IDataRepresentationColumnMapping;
    rows: powerbi.DataViewTableRow[];
    rowIndex: number;
    settings: Settings;
    settingsState: SettingsState;
    levels: string[];
    viewMode: powerbi.ViewMode;
}

export abstract class DataConverter implements IConverter<IDataRepresentation> {
    public static applyYArguments(
        axis: IDataRepresentationAxis,
        value: number,
    ): void {
        if (!NumericValueUtils.isValueFinite(value)) {
            return;
        }

        if (axis.min === undefined) {
            axis.min = value;
        }

        if (axis.max === undefined) {
            axis.max = value;
        }

        if (value < axis.min) {
            axis.min = value;
        }

        if (value > axis.max) {
            axis.max = value;
        }
    }

    public static applyYArgumentsToAxisSet(
        axisSet: IDataRepresentationAxis[],
        value: number,
    ): void {
        axisSet.forEach((axis: IDataRepresentationAxis) => {
            this.applyYArguments(axis, value);
        });
    }

    protected varianceStrategy: VarianceStrategy = new VarianceStrategy();

    protected seriesUtils: DataRepresentationSeriesUtils = new DataRepresentationSeriesUtils();

    private defaultValue: number = 0;

    private isDataColumnBasedModel: boolean;

    private amountOfFilledSeries: number = 0;

    constructor(isDataColumnBasedModel: boolean = false) {
        this.isDataColumnBasedModel = isDataColumnBasedModel;
    }

    public abstract deepSearchSeries(
        seriesSet: IDataRepresentationSeriesSet,
        levels: string[],
    ): IDataRepresentationSeries;

    public convert(options: IConverterOptions): IDataRepresentation {
        const {
            dataView,
            columnMapping,
            settings,
            settingsState,
            viewMode,
        } = options;

        this.amountOfFilledSeries = 0;

        const dataRepresentation: IDataRepresentation = this.getDefaultData();

        if (!this.isDataViewValid(dataView)) {
            return dataRepresentation;
        }

        const xAxisMetadataColumn: powerbi.DataViewMetadataColumn = this.getColumnByRoleName(
            dataView.table.columns,
            dateColumn.name,
        );

        dataRepresentation.columns = this.getColumns(
            dataView.table.columns,
            [
                actualValueColumn,
                comparisonValueColumn,
                kpiIndicatorValueColumn,
                secondComparisonValueColumn,
            ]);

        dataRepresentation.type = this.getTypeOfColumn(xAxisMetadataColumn, settings.powerKPISettings.xAxis.type);
        dataRepresentation.metadata = xAxisMetadataColumn;

        settings.asOfDate.parseByType(dataRepresentation.type);

        if (!this.isDataColumnBasedModel) {
            settings.table.forceToUseDefaultSortOrderByName();
        }

        settings.asOfDate.columnFormat = xAxisMetadataColumn
            && xAxisMetadataColumn.format;

        settings.currentValue.columnFormat = dataRepresentation.columns[actualValueColumn.name]
            && dataRepresentation.columns[actualValueColumn.name].format;

        settings.comparisonValue.columnFormat = dataRepresentation.columns[comparisonValueColumn.name]
            && dataRepresentation.columns[comparisonValueColumn.name].format;

        settings.kpiIndicatorValue.columnFormat = dataRepresentation.columns[kpiIndicatorValueColumn.name]
            && dataRepresentation.columns[kpiIndicatorValueColumn.name].format;

        settings.secondComparisonValue.columnFormat = dataRepresentation.columns[secondComparisonValueColumn.name]
            && dataRepresentation.columns[secondComparisonValueColumn.name].format;

        if (!dataRepresentation.columns[secondComparisonValueColumn.name]) {
            settings.secondComparisonValue.show = false;
            settings.secondKPIIndicatorValue.show = false;
        }

        const defaultUnmappedCategoryName: string = settings.table.getDefaultUnmappedCategoryName();

        dataView.table.rows.forEach((row: powerbi.DataViewTableRow, rowIndex: number) => {
            const columnValues: IColumnValues = this.getColumnValues(dataView.table.columns, row);

            const categorySet: ICategoryHyperlink[] = this.parseCategorySet(columnValues, defaultUnmappedCategoryName);

            dataRepresentation.seriesDeep = Math.max(
                dataRepresentation.seriesDeep,
                categorySet.length,
            );

            this.applyCategorySet(
                categorySet,
                dataRepresentation.series,
                dataRepresentation.seriesArray,
                undefined,
                !settings.table.isDefaultSortOrderByName(),
            );

            const levels: string[] = categorySet.map((categoryHyperlink: ICategoryHyperlink) => {
                return categoryHyperlink.name;
            });

            this.converterStep({
                columnMapping,
                columnValues,
                dataRepresentation,
                identities: dataView.table.identity || [],
                identityQueryName: dataView.table.columns[0].queryName,
                levels,
                rowIndex,
                rows: dataView.table.rows,
                settings,
                settingsState,
                viewMode,
            });
        });

        this.replaceTheFilledSeriesAtFirstLevel(dataRepresentation, defaultUnmappedCategoryName);

        dataRepresentation.seriesArray = this.postProcess(
            dataRepresentation.seriesArray,
            settings.subtotal,
            settings.table.style,
            settings,
            dataRepresentation.type,
            dataRepresentation.y,
        );

        settings.hideDescriptors(dataRepresentation.seriesDeep);

        return dataRepresentation;
    }

    protected abstract converterStep(options: IConverterStepOptions): void;

    protected getDefaultData(): IDataRepresentation {
        return {
            columns: {},
            isDataColumnBasedModel: this.isDataColumnBasedModel,
            series: {},
            seriesArray: [],
            seriesDeep: 0,
            type: DataRepresentationTypeEnum.None,
            y: {
                max: undefined,
                min: undefined,
            },
        };
    }

    protected isDataViewValid(dataView: powerbi.DataView): boolean {
        return !!(dataView
            && dataView.table
            && dataView.table.rows
            && dataView.table.columns
        );
    }

    protected getColumnByRoleName(
        columns: powerbi.DataViewMetadataColumn[],
        roleName: string,
    ): powerbi.DataViewMetadataColumn {
        for (const column of columns) {
            if (column.roles && column.roles[roleName]) {
                return column;
            }
        }

        return undefined;
    }

    protected getTypeOfColumn(column: powerbi.DataViewMetadataColumn, forcedXAxisType: AxisType): DataRepresentationTypeEnum {
        if (column) {
            if (column.type.text || forcedXAxisType === AxisType.categorical) {
                return DataRepresentationTypeEnum.StringType;
            } else if (column.type.dateTime) {
                return DataRepresentationTypeEnum.DateType;
            } else if (column.type.integer || column.type.numeric) {
                return DataRepresentationTypeEnum.NumberType;
            }
        }

        return DataRepresentationTypeEnum.None;
    }

    protected getColumnValues(
        columns: powerbi.DataViewMetadataColumn[],
        row: powerbi.DataViewTableRow,
    ): IColumnValues {
        const columnValues: IColumnValues = {};

        row.forEach((value: any, valueIndex: number) => {
            const column: powerbi.DataViewMetadataColumn = columns[valueIndex];

            if (columns[valueIndex].roles) {
                Object.keys(columns[valueIndex].roles)
                    .forEach((roleName: string) => {
                        if (!columnValues[roleName]) {
                            columnValues[roleName] = {};
                        }

                        if (!columnValues[roleName][column.displayName]) {
                            columnValues[roleName][column.displayName] = {
                                format: column.format,
                            };
                        }

                        if (column.type && column.type.dateTime && typeof value === "string") {
                            columnValues[roleName][column.displayName].value = new Date(value);
                        } else {
                            columnValues[roleName][column.displayName].value = value;
                        }
                    });
            }
        });

        return columnValues;
    }

    protected getXAxisScale(
        scale: DataRepresentationScale,
        min: DataRepresentationAxisValueType,
        max: DataRepresentationAxisValueType,
        type: DataRepresentationTypeEnum,
        categoryValues: any[]): DataRepresentationScale {

        let values: any[];

        switch (type) {
            case DataRepresentationTypeEnum.DateType:
            case DataRepresentationTypeEnum.NumberType: {
                values = [min, max];

                break;
            }
            case DataRepresentationTypeEnum.StringType: {
                values = categoryValues;

                break;
            }
        }

        return scale.domain(values, type);
    }

    protected applyXArguments(
        series: IDataRepresentationSeries,
        axisValue: DataRepresentationAxisValueType,
        type: DataRepresentationTypeEnum,
    ): void {
        if (series.x.min === undefined) {
            series.x.min = axisValue;
        }

        if (series.x.max === undefined) {
            series.x.max = axisValue;
        }

        if (type === DataRepresentationTypeEnum.DateType
            || type === DataRepresentationTypeEnum.NumberType) {

            if (axisValue < series.x.min) {
                series.x.min = axisValue;
            }

            if (axisValue > series.x.max) {
                series.x.max = axisValue;
            }
        } else if (type === DataRepresentationTypeEnum.StringType) {
            const textLength: number = this.getLength(axisValue as string);

            if (textLength < this.getLength(series.x.min as string)) {
                series.x.min = axisValue;
            }

            if (textLength > this.getLength(series.x.max as string)) {
                series.x.max = axisValue;
            }
        }
    }

    protected getLength(text: string): number {
        if (!text || !text.length) {
            return 0;
        }

        return text.length;
    }

    protected updateXScale(
        series: IDataRepresentationSeries,
        type: DataRepresentationTypeEnum,
    ): void {
        series.x.scale = this.getXAxisScale(
            series.x.scale,
            series.x.min,
            series.x.max,
            type,
            series.axisValues);
    }

    protected updateYScale(
        series: IDataRepresentationSeries,
        commonAxis: IDataRepresentationAxis,
    ): void {
        if (series.settings && series.settings.sparklineSettings) {
            if (series.settings.sparklineSettings.shouldUseCommonScale) {
                series.y.min = commonAxis.min;
                series.y.max = commonAxis.max;
            }

            if (NumericValueUtils.isValueFinite(series.settings.sparklineSettings.yMin)) {
                series.y.min = series.settings.sparklineSettings.yMin;
            }

            if (NumericValueUtils.isValueFinite(series.settings.sparklineSettings.yMax)) {
                series.y.max = series.settings.sparklineSettings.yMax;
            }
        }

        series.y.scale.domain(
            [series.y.min, series.y.max],
            DataRepresentationTypeEnum.NumberType,
        );
    }

    protected getPointSet(
        name: string,
        color: string,
        thickness: number,
        lineStyle: LineStyle,
        settings: NumberSettingsBase,
        isShown: boolean,
    ): IDataRepresentationPointSet {
        return {
            color,
            colors: [],
            isShown,
            kpiIndicatorIndexes: [],
            lineStyle,
            max: undefined,
            min: undefined,
            name,
            points: [],
            settings,
            thickness,
        };
    }

    protected applyDataToCurrentSeries(data: ICurrentSeriesData): void {
        if (!data) {
            return;
        }

        const {
            dataRepresentation,
            series,
            series: { settings },
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
            isSecondKPIIndicatorValueSpecified,
            secondComparisonValueColumnName,
            secondKPIIndicatorValue,
            secondKPIIndicatorValueFormat,
        } = data;

        const isCurrentValueValid: boolean = settings.currentValue.shouldTreatZeroValuesAsNulls
            ? NumericValueUtils.isValueValid(currentValue)
            : NumericValueUtils.isValueFinite(currentValue);

        if (axisValue !== undefined && axisValue !== null && isCurrentValueValid) {
            this.applyXArguments(series, axisValue, dataRepresentation.type);

            series.axisValue = axisValue;
            series.axisValues.push(axisValue);

            series.currentValue = currentValue;

            series.points[0] = this.updatePointSet(
                series.points[0],
                currentValueColumnName,
                series.settings.currentValue,
                settings.sparklineSettings.isActualVisible,
                axisValue,
                currentValue,
                series.settings.sparklineSettings.actualColor,
                series.settings.sparklineSettings.actualThickness,
                series.settings.sparklineSettings.actualLineStyle,
                dataRepresentation.y,
            );

            series.comparisonValue = NumericValueUtils.isValueValid(comparisonValue)
                ? comparisonValue
                : NaN;

            if (isComparisonValueSpecified) {
                series.points[1] = this.updatePointSet(
                    series.points[1],
                    comparisonValueColumnName,
                    series.settings.comparisonValue,
                    settings.sparklineSettings.isTargetVisible,
                    axisValue,
                    series.comparisonValue,
                    series.settings.sparklineSettings.targetColor,
                    series.settings.sparklineSettings.targetThickness,
                    series.settings.sparklineSettings.targetLineStyle,
                    dataRepresentation.y,
                );
            }

            series.secondComparisonValue = NumericValueUtils.isValueValid(secondComparisonValue)
                ? secondComparisonValue
                : NaN;

            if (isSecondComparisonValueSpecified) {
                series.points[2] = this.updatePointSet(
                    series.points[2],
                    secondComparisonValueColumnName,
                    series.settings.secondComparisonValue,
                    settings.sparklineSettings.isSecondComparisonValueVisible,
                    axisValue,
                    series.secondComparisonValue,
                    series.settings.sparklineSettings.secondComparisonValueColor,
                    series.settings.sparklineSettings.secondComparisonValueThickness,
                    series.settings.sparklineSettings.secondComparisonValueLineStyle,
                    dataRepresentation.y,
                );
            }

            if (settings.sparklineSettings.isActualVisible) {
                DataConverter.applyYArguments(series.y, series.currentValue);
            }

            if (settings.sparklineSettings.isTargetVisible) {
                DataConverter.applyYArguments(series.y, series.comparisonValue);
            }

            if (settings.sparklineSettings.isSecondComparisonValueVisible) {
                DataConverter.applyYArguments(series.y, series.secondComparisonValue);
            }

            series.kpiIndicatorIndex = NumericValueUtils.isValueFinite(kpiIndicatorIndex)
                ? kpiIndicatorIndex
                : NaN;

            if (isKPIIndicatorIndexSpecified) {
                series.points[0].kpiIndicatorIndexes.push(kpiIndicatorIndex);

                if (series.settings.sparklineSettings.isActualVisible
                    && series.settings.sparklineSettings.shouldActualUseKPIColors
                    && series.points[0]
                ) {
                    const currentKPI: IKPIIndicatorSettings = settings
                        .kpiIndicator
                        .getCurrentKPI(kpiIndicatorIndex);

                    const color: string = currentKPI && currentKPI.color
                        || series.points[0].color;

                    series.points[0].colors.push(color);
                }
            }

            series.kpiIndicatorValue = this.getVariance(
                isKPIIndicatorValueSpecified,
                kpiIndicatorValue,
                series.currentValue,
                series.comparisonValue,
            );

            series.secondKPIIndicatorValue = this.getVariance(
                isSecondKPIIndicatorValueSpecified,
                secondKPIIndicatorValue,
                series.currentValue,
                series.secondComparisonValue,
            );

            series.varianceSet[0] = this.updateVariance(
                series.varianceSet[0],
                series.kpiIndicatorValue,
            );

            series.varianceSet[1] = this.updateVariance(
                series.varianceSet[1],
                series.secondKPIIndicatorValue,
            );
        }

        settings.currentValue.setColumnFormat(currentFormat);
        settings.comparisonValue.setColumnFormat(comparisonFormat);
        settings.kpiIndicatorValue.setColumnFormat(kpiIndicatorValueFormat);
        settings.secondComparisonValue.setColumnFormat(secondComparisonValueFormat);
        settings.secondKPIIndicatorValue.setColumnFormat(secondKPIIndicatorValueFormat);
    }

    protected getSeriesByDisplayName(
        seriesSet: IDataRepresentationSeriesSet,
        seriesArray: IDataRepresentationSeries[],
        levels: string[],
        displayName: string,
        identities: powerbi.visuals.CustomVisualOpaqueIdentity[],
        identityIndex: number,
        identityQueryName: string,
        rows: powerbi.DataViewTableRow[],
        defaultSettings: Settings,
        settingsState: SettingsState,
        type: DataRepresentationTypeEnum,
        viewMode: powerbi.ViewMode,
        createSelectionIdBuilder: () => powerbi.visuals.ISelectionIdBuilder,
    ): IDataRepresentationSeries {
        let series: IDataRepresentationSeries = this.deepSearchSeries(
            seriesSet,
            levels,
        );

        if (!series) {
            series = this.createOrGetExistingSeries(
                displayName,
                seriesSet,
                seriesArray,
                undefined,
                undefined,
                undefined,
                undefined,
                !defaultSettings.table.isDefaultSortOrderByName(),
            );
        }

        if (series && !series.hasBeenFilled) {
            const selectionId: powerbi.visuals.ISelectionId = createSelectionIdBuilder()
                .withCategory(
                    {
                        identity: identities || [],
                        source: {
                            displayName: series.name || identityQueryName,
                            queryName: identityQueryName,
                        },
                        values: [],
                    },
                    identityIndex,
                )
                .withMeasure(identityQueryName)
                .createSelectionId();

            const settings: SeriesSettings = SeriesSettings.getDefault() as SeriesSettings;

            for (const propertyName in settings) {
                const descriptor: SettingsPropertyBase = settings[propertyName];
                const defaultDescriptor: SettingsPropertyBase = defaultSettings[propertyName];

                if (descriptor && descriptor.applyDefault && defaultDescriptor) {
                    descriptor.applyDefault(defaultDescriptor);
                }
            }

            const parsedObjects: powerbi.DataViewObjects = (rows
                && rows[identityIndex]
                && rows[identityIndex].objects
                && rows[identityIndex].objects[0])
                || {};

            const serializedObjects: powerbi.DataViewObjects = settingsState.getSeriesSettings(series.name)
                || parsedObjects
                || {};

            const shouldUseSerializedSeriesSettings: boolean = viewMode === powerbi.ViewMode.View
                || defaultSettings.table.keepSeriesSettingOnFilteringInEditMode;

            const mergedObjects: powerbi.DataViewObjects = shouldUseSerializedSeriesSettings
                ? { ...serializedObjects }
                : { ...parsedObjects };

            settings.parseObjects(mergedObjects);

            settings.asOfDate.parseByType(type);

            settingsState.setSeriesSettings(
                series.name,
                settings,
            );

            series.settings = settings;
            series.selectionId = selectionId;
            series.axisValue = undefined;
            series.name = displayName;
            series.points = [];
            series.varianceSet = [];
            series.kpiIndicatorIndex = NaN;
            series.kpiIndicatorValue = NaN;
            series.currentValue = NaN;
            series.comparisonValue = NaN;
            series.secondComparisonValue = NaN;
            series.secondKPIIndicatorValue = NaN;

            series.x = this.getDefaultAxis();
            series.y = this.getDefaultAxis();

            series.hasBeenFilled = true;
        }

        return series;
    }

    private postProcess(
        seriesArray: IDataRepresentationSeries[],
        subtotalSettings: SubtotalSettings,
        tableStyle: TableStyle,
        settings: Settings,
        type: DataRepresentationTypeEnum,
        baseAxis: IDataRepresentationAxis,
    ): IDataRepresentationSeries[] {
        let filteredSeries: IDataRepresentationSeries[] = [];
        let areThereAnyFilledSeries: boolean = false;

        seriesArray.forEach((series: IDataRepresentationSeries, seriesIndex: number) => {
            if (series.hasBeenFilled) {
                this.updateYScale(series, baseAxis);

                this.updateXScale(
                    series,
                    type,
                );

                areThereAnyFilledSeries = true;

                if (series.settings && series.settings.metricName) {
                    if (series.hyperlink) {
                        series.settings.metricName.hideCommonProperties();
                        settings.metricName.updateHyperlinkVisibility(true);
                    }

                    if (series.image) {
                        settings.metricName.updateImageVisibility(true);
                    }
                }

                filteredSeries.push(series);
            } else {
                series.children = this.postProcess(
                    series.children,
                    subtotalSettings,
                    tableStyle,
                    settings,
                    type,
                    baseAxis,
                );

                if (subtotalSettings.show) {
                    this.countSubtotal(series, subtotalSettings.type);
                }

                if (series.children && series.children.length) {
                    filteredSeries.push(series);
                }
            }
        });

        filteredSeries = this.seriesUtils.sortSeriesBySortOrder(filteredSeries, settings.table.sortOrder);

        if (areThereAnyFilledSeries) {
            filteredSeries.forEach((series: IDataRepresentationSeries) => {
                if (series.hasBeenFilled) {
                    if ((tableStyle === TableStyle.AlternatingMetrics || tableStyle === TableStyle.BoldHeaderAndAlternatingMetrics)
                        && this.amountOfFilledSeries % 2
                    ) {
                        series.settings.applyAlternativeBackgroundColor();
                    }

                    this.amountOfFilledSeries++;
                }
            });
        }

        return filteredSeries;
    }

    private countSubtotal(series: IDataRepresentationSeries, type: SubtotalType): void {
        if (!series
            || !series.children
            || !series.children.length
        ) {
            return;
        }

        series.children.forEach((childSeries: IDataRepresentationSeries) => {
            const {
                currentValue,
                comparisonValue,
                secondComparisonValue,
            } = childSeries;

            switch (type) {
                case SubtotalType.CountOfItems: {
                    series.currentValue = this.countValues(series.currentValue, currentValue);
                    series.comparisonValue = this.countValues(series.comparisonValue, comparisonValue);
                    series.secondComparisonValue = this.countValues(series.secondComparisonValue, secondComparisonValue);

                    break;
                }
                case SubtotalType.SumOfItems:
                default: {
                    series.currentValue = this.addValues(series.currentValue, currentValue);
                    series.comparisonValue = this.addValues(series.comparisonValue, comparisonValue);
                    series.secondComparisonValue = this.addValues(series.secondComparisonValue, secondComparisonValue);

                    break;
                }
            }
        });
    }

    private addValues(currentSum: number, additionalValue: number): number {
        if (NumericValueUtils.isValueFinite(additionalValue)) {
            if (!NumericValueUtils.isValueFinite(currentSum)) {
                currentSum = this.defaultValue;
            }

            return currentSum + additionalValue;
        } else {
            return currentSum;
        }
    }

    private countValues(currentSum: number, currentValue: number): number {
        if (NumericValueUtils.isValueFinite(currentValue)) {
            if (!NumericValueUtils.isValueFinite(currentSum)) {
                currentSum = this.defaultValue;
            }

            return currentSum + 1;
        } else {
            return currentSum;
        }
    }

    private replaceTheFilledSeriesAtFirstLevel(
        dataRepresentation: IDataRepresentation,
        defaultCategoryName: string,
    ): void {
        if (dataRepresentation.seriesDeep <= 1) {
            return;
        }

        const seriesArray: IDataRepresentationSeries[] = [];

        dataRepresentation.seriesArray
            .forEach((series: IDataRepresentationSeries, seriesIndex: number) => {
                if (series && series.hasBeenFilled && series.level === 0) {
                    delete dataRepresentation.series[series.name];

                    if (defaultCategoryName) {
                        const newSeries: IDataRepresentationSeries = this.deepSeriesCreation(
                            defaultCategoryName,
                            dataRepresentation.series,
                            seriesArray,
                            dataRepresentation.seriesDeep - 1,
                            0,
                        );

                        series.level = newSeries.level + 1;

                        newSeries.childrenSet[series.name] = series;
                        newSeries.children.push(series);
                    }
                } else {
                    seriesArray.push(series);
                }
            });

        dataRepresentation.seriesArray = seriesArray;
    }

    private deepSeriesCreation(
        name: string,
        seriesSet: IDataRepresentationSeriesSet,
        seriesArray: IDataRepresentationSeries[],
        deep: number = 0,
        level: number = 0,
    ): IDataRepresentationSeries {

        const series: IDataRepresentationSeries = this.createOrGetExistingSeries(
            name,
            seriesSet,
            seriesArray,
            level,
            undefined,
            undefined,
        );

        const currentDeep: number = deep - 1;

        if (currentDeep > 0) {
            return this.deepSeriesCreation(name, series.childrenSet, series.children, currentDeep, level + 1);
        }

        return series;
    }

    private parseCategorySet(
        columnValues: IColumnValues,
        defaultCategoryName: string,
    ): ICategoryHyperlink[] {
        const categorySet: ICategoryHyperlink[] = [];

        if (columnValues[categoryColumn.name]) {
            const hyperlinks: string[] = this.getValuesByColumnName(columnValues, hyperlinkColumn.name);
            const sortOrders: DataRepresentationAxisValueType[] = this.getValuesByColumnName(columnValues, sortOrderColumn.name);
            const images: string[] = this.getValuesByColumnName(columnValues, imageColumn.name);

            Object.keys(columnValues[categoryColumn.name]).forEach((categoryName: string, categoryIndex: number) => {
                const category: IColumnValue = columnValues[categoryColumn.name][categoryName];
                const hyperlink: string = hyperlinks[categoryIndex] || null;
                const sortOrder: DataRepresentationAxisValueType = sortOrders[categoryIndex] || null;
                const image: string = images[categoryIndex] || null;

                if (category && category.value !== undefined && category.value !== null) {
                    categorySet.push({
                        hyperlink,
                        image,
                        name: category.value,
                        sortOrder,
                    });
                } else if (category
                    && categorySet[0] !== undefined
                    && categorySet[0] !== null
                    && defaultCategoryName
                ) {
                    categorySet.push({
                        hyperlink,
                        image,
                        name: defaultCategoryName,
                        sortOrder,
                    });
                }
            });
        }

        return categorySet.reverse();
    }

    private getValuesByColumnName<T>(
        columnValues: IColumnValues,
        name: string,
    ): T[] {
        const column = columnValues[name];

        if (!column) {
            return [];
        }

        return Object.keys(column)
            .map((columnName: string) => {
                const columnValue: IColumnValue = column[columnName];

                return (columnValue && columnValue.value) || null;
            });
    }

    private applyCategorySet(
        categorySet: ICategoryHyperlink[],
        seriesSet: IDataRepresentationSeriesSet,
        seriesArray: IDataRepresentationSeries[],
        misplacedCategory?: IDataRepresentationSeries,
        shouldUseSeriesIndexAsDefaultSortOrder: boolean = false,
        level: number = 0,
    ): void {
        const category: ICategoryHyperlink = categorySet && categorySet[0];

        if (!category) {
            return;
        }

        let currentMisplacedCategory: IDataRepresentationSeries = misplacedCategory;

        if (level === 0) {
            const metricName: ICategoryHyperlink = categorySet
                && categorySet.length
                && categorySet[categorySet.length - 1];

            if (metricName
                && metricName.name !== null
                && metricName.name !== undefined
                && seriesSet[metricName.name]
                && seriesSet[metricName.name].hasBeenFilled
                && category
                && category.name !== null
                && category.name !== undefined
            ) {
                if (category.name !== metricName.name) {
                    currentMisplacedCategory = seriesSet[metricName.name];

                    delete seriesSet[metricName.name];

                    const seriesIndex: number = seriesArray.indexOf(currentMisplacedCategory);

                    if (seriesIndex > -1) {
                        seriesArray.splice(seriesIndex, 1);
                    }
                } else {
                    const existingSeries: IDataRepresentationSeries = seriesSet[metricName.name];

                    existingSeries.hyperlink = existingSeries.hyperlink || category.hyperlink;
                }
            }
        }

        const series: IDataRepresentationSeries = misplacedCategory && misplacedCategory.name === category.name
            ? this.applyExistingSeries(
                category.name,
                seriesSet,
                seriesArray,
                currentMisplacedCategory,
                level,
                category.hyperlink,
                category.sortOrder,
                category.image,
            )
            : this.createOrGetExistingSeries(
                category.name,
                seriesSet,
                seriesArray,
                level,
                category.hyperlink,
                category.sortOrder,
                category.image,
                shouldUseSeriesIndexAsDefaultSortOrder,
            );

        this.applyCategorySet(
            categorySet.slice(1),
            series.childrenSet,
            series.children,
            currentMisplacedCategory,
            shouldUseSeriesIndexAsDefaultSortOrder,
            level + 1);
    }

    private createOrGetExistingSeries(
        name: string,
        seriesSet: IDataRepresentationSeriesSet,
        seriesArray: IDataRepresentationSeries[],
        level: number = 0,
        hyperlink?: string,
        sortOrder?: DataRepresentationAxisValueType,
        image?: string,
        shouldUseSeriesIndexAsDefaultSortOrder?: boolean,
    ): IDataRepresentationSeries {
        const existingSeries: IDataRepresentationSeries = seriesSet[name];

        if (existingSeries) {
            this.updateSeriesProperties(
                existingSeries,
                level,
                hyperlink,
                sortOrder,
                image,
            );

            return existingSeries;
        }

        const currentSortOrder: DataRepresentationAxisValueType = NumericValueUtils.isValueDefined(sortOrder)
            ? sortOrder
            : shouldUseSeriesIndexAsDefaultSortOrder
                ? seriesArray.length
                : name;

        const series: IDataRepresentationSeries = {
            axisValues: [],
            children: [],
            childrenSet: {},
            hyperlink,
            image,
            level,
            name,
            sortOrder: currentSortOrder,
        };

        seriesSet[name] = series;
        seriesArray.push(series);

        return series;
    }

    private applyExistingSeries(
        name: string,
        seriesSet: IDataRepresentationSeriesSet,
        seriesArray: IDataRepresentationSeries[],
        series: IDataRepresentationSeries,
        level: number = 0,
        hyperlink?: string,
        sortOrder?: DataRepresentationAxisValueType,
        image?: string,
    ): IDataRepresentationSeries {
        this.updateSeriesProperties(
            series,
            level,
            hyperlink,
            sortOrder,
            image,
        );

        if (seriesSet[name]) {
            return seriesSet[name];
        }

        seriesSet[name] = series;
        seriesArray.push(series);

        return series;
    }

    private updateSeriesProperties(
        series: IDataRepresentationSeries,
        level: number = 0,
        hyperlink?: string,
        sortOrder?: DataRepresentationAxisValueType,
        image?: string,
    ): void {
        series.hyperlink = hyperlink || series.hyperlink;
        series.image = image || series.image;

        if (NumericValueUtils.isValueDefined(sortOrder)) {
            series.sortOrder = sortOrder;
        }

        if (NumericValueUtils.isValueFinite(level)) {
            series.level = level;
        }
    }

    private getColumns(
        columns: powerbi.DataViewMetadataColumn[],
        visualColumns: IVisualDataColumn[],
    ): IDataRepresentationColumns {
        const columnSet = {};

        visualColumns.forEach((column: IVisualDataColumn) => {
            const columnMetadata: powerbi.DataViewMetadataColumn = this.getColumnByRoleName(columns, column.name);

            if (columnMetadata) {
                columnSet[column.name] = columnMetadata;
            }
        });

        return columnSet;
    }

    private getDefaultAxis(): IDataRepresentationAxisWithScale {
        return {
            max: undefined,
            min: undefined,
            scale: DataRepresentationScale.create(),
        };
    }

    private updateVariance(variances: number[], variance: number): number[] {
        const currentVarianceSet: number[] = variances || [];

        currentVarianceSet.push(variance);

        return currentVarianceSet;
    }

    private getVariance(
        isKPIIndicatorValueSpecified: boolean,
        kpiIndicatorValue: number,
        currentValue: number,
        comparisonValue: number,
    ): number {
        if (isKPIIndicatorValueSpecified && NumericValueUtils.isValueFinite(kpiIndicatorValue)) {
            return kpiIndicatorValue;
        } else if (!isKPIIndicatorValueSpecified && NumericValueUtils.isValueValid(comparisonValue)) {
            return this.varianceStrategy.getVariance(currentValue, comparisonValue);
        }

        return NaN;
    }

    private updatePointSet(
        pointSet: IDataRepresentationPointSet,
        name: string,
        settings: NumberSettingsBase,
        isShown: boolean,
        axisValue: DataRepresentationAxisValueType,
        value: number,
        color: string,
        thickness: number,
        lineStyle: LineStyle,
        y: IDataRepresentationAxis,
    ): IDataRepresentationPointSet {
        const currentPointSet: IDataRepresentationPointSet = pointSet
            || this.getPointSet(
                name,
                color,
                thickness,
                lineStyle,
                settings,
                isShown,
            );

        currentPointSet.points.push({
            axisValue,
            value,
        });

        DataConverter.applyYArgumentsToAxisSet(
            [
                currentPointSet,
                y,
            ],
            value,
        );

        return currentPointSet;
    }
}

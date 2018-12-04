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

export interface HyperlinkSet {
    [metricName: string]: string;
}

export interface ColumnValue {
    value?: any;
    format?: string;
}

export interface ColumnValues {
    [columnName: string]: {
        [displayName: string]: ColumnValue;
    };
}

export interface CategoryHyperlink {
    name: string;
    hyperlink: string;
    sortOrder: DataRepresentationAxisValueType;
    image: string;
}

export interface CurrentSeriesData {
    dataRepresentation: DataRepresentation;
    series: DataRepresentationSeries;

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
    dataRepresentation: DataRepresentation;
    columnValues: ColumnValues;
    identities: DataViewScopeIdentity[];
    identityQueryName: string;
    columnMapping: DataRepresentationColumnMapping;
    rows: DataViewTableRow[];
    rowIndex: number;
    settings: Settings;
    settingsState: SettingsState;
    levels: string[];
    viewMode: ViewMode;
}

export abstract class DataConverter implements Converter<DataRepresentation> {
    protected varianceStrategy: VarianceStrategy = new VarianceStrategy();

    protected seriesUtils: DataRepresentationSeriesUtils = new DataRepresentationSeriesUtils();

    private defaultValue: number = 0;

    private isDataColumnBasedModel: boolean;

    private amountOfFilledSeries: number = 0;

    constructor(isDataColumnBasedModel: boolean = false) {
        this.isDataColumnBasedModel = isDataColumnBasedModel;
    }

    public abstract deepSearchSeries(
        seriesSet: DataRepresentationSeriesSet,
        levels: string[]
    ): DataRepresentationSeries;

    public convert(options: ConverterOptions): DataRepresentation {
        const {
            dataView,
            columnMapping,
            settings,
            settingsState,
            viewMode,
        } = options;

        this.amountOfFilledSeries = 0;

        const dataRepresentation: DataRepresentation = this.getDefaultData();

        if (!this.isDataViewValid(dataView)) {
            return dataRepresentation;
        }

        const xAxisMetadataColumn: DataViewMetadataColumn = this.getColumnByRoleName(
            dataView.table.columns,
            dateColumn.name
        );

        dataRepresentation.columns = this.getColumns(
            dataView.table.columns,
            [
                actualValueColumn,
                comparisonValueColumn,
                kpiIndicatorValueColumn,
                secondComparisonValueColumn,
            ]);

        dataRepresentation.type = this.getTypeOfColumn(xAxisMetadataColumn);
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

        dataView.table.rows.forEach((row: DataViewTableRow, rowIndex: number) => {
            const columnValues: ColumnValues = this.getColumnValues(dataView.table.columns, row);

            const categorySet: CategoryHyperlink[] = this.parseCategorySet(columnValues, defaultUnmappedCategoryName);

            dataRepresentation.seriesDeep = Math.max(
                dataRepresentation.seriesDeep,
                categorySet.length
            );

            this.applyCategorySet(
                categorySet,
                dataRepresentation.series,
                dataRepresentation.seriesArray,
                undefined,
                !settings.table.isDefaultSortOrderByName(),
            );

            const levels: string[] = categorySet.map((categoryHyperlink: CategoryHyperlink) => {
                return categoryHyperlink.name;
            });

            this.converterStep({
                dataRepresentation,
                columnValues,
                columnMapping,
                rowIndex,
                settings,
                settingsState,
                levels,
                viewMode,
                rows: dataView.table.rows,
                identities: dataView.table.identity || [],
                identityQueryName: dataView.table.columns[0].queryName,
            });
        });

        this.replaceTheFilledSeriesAtFirstLevel(dataRepresentation, defaultUnmappedCategoryName);

        dataRepresentation.seriesArray = this.postProcess(
            dataRepresentation.seriesArray,
            settings.subtotal,
            settings.table.style,
            settings,
            dataRepresentation.type,
            dataRepresentation.y
        );

        settings.hideDescriptors(dataRepresentation.seriesDeep);

        return dataRepresentation;
    }

    protected abstract converterStep(options: IConverterStepOptions): void;

    private postProcess(
        seriesArray: DataRepresentationSeries[],
        subtotalSettings: SubtotalSettings,
        tableStyle: TableStyle,
        settings: Settings,
        type: DataRepresentationTypeEnum,
        baseAxis: DataRepresentationAxis,
    ): DataRepresentationSeries[] {
        let filteredSeries: DataRepresentationSeries[] = [];
        let areThereAnyFilledSeries: boolean = false;

        seriesArray.forEach((series: DataRepresentationSeries, seriesIndex: number) => {
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
                    baseAxis
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
            filteredSeries.forEach((series: DataRepresentationSeries) => {
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

    private countSubtotal(series: DataRepresentationSeries, type: SubtotalType): void {
        if (!series
            || !series.children
            || !series.children.length
        ) {
            return;
        }

        series.children.forEach((childSeries: DataRepresentationSeries) => {
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
        dataRepresentation: DataRepresentation,
        defaultCategoryName: string
    ): void {
        if (dataRepresentation.seriesDeep <= 1) {
            return;
        }

        const seriesArray: DataRepresentationSeries[] = [];

        dataRepresentation.seriesArray
            .forEach((series: DataRepresentationSeries, seriesIndex: number) => {
                if (series && series.hasBeenFilled && series.level === 0) {
                    delete dataRepresentation.series[series.name];

                    if (defaultCategoryName) {
                        const newSeries: DataRepresentationSeries = this.deepSeriesCreation(
                            defaultCategoryName,
                            dataRepresentation.series,
                            seriesArray,
                            dataRepresentation.seriesDeep - 1,
                            0
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
        seriesSet: DataRepresentationSeriesSet,
        seriesArray: DataRepresentationSeries[],
        deep: number = 0,
        level: number = 0
    ): DataRepresentationSeries {

        const series: DataRepresentationSeries = this.createOrGetExistingSeries(
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
        columnValues: ColumnValues,
        defaultCategoryName: string
    ): CategoryHyperlink[] {
        const categorySet: CategoryHyperlink[] = [];

        if (columnValues[categoryColumn.name]) {
            const hyperlinks: string[] = this.getValuesByColumnName(columnValues, hyperlinkColumn.name);
            const sortOrders: DataRepresentationAxisValueType[] = this.getValuesByColumnName(columnValues, sortOrderColumn.name);
            const images: string[] = this.getValuesByColumnName(columnValues, imageColumn.name);

            Object.keys(columnValues[categoryColumn.name]).forEach((categoryName: string, categoryIndex: number) => {
                const category: ColumnValue = columnValues[categoryColumn.name][categoryName];
                const hyperlink: string = hyperlinks[categoryIndex] || null;
                const sortOrder: DataRepresentationAxisValueType = sortOrders[categoryIndex] || null;
                const image: string = images[categoryIndex] || null;

                if (category && category.value !== undefined && category.value !== null) {
                    categorySet.push({
                        image,
                        sortOrder,
                        hyperlink,
                        name: category.value,
                    });
                } else if (category
                    && categorySet[0] !== undefined
                    && categorySet[0] !== null
                    && defaultCategoryName
                ) {
                    categorySet.push({
                        image,
                        sortOrder,
                        hyperlink,
                        name: defaultCategoryName,
                    });
                }
            });
        }

        return categorySet.reverse();
    }

    private getValuesByColumnName<T>(
        columnValues: ColumnValues,
        name: string
    ): T[] {
        const column = columnValues[name];

        if (!column) {
            return [];
        }

        return Object.keys(column)
            .map((columnName: string) => {
                const columnValue: ColumnValue = column[columnName];

                return (columnValue && columnValue.value) || null;
            });
    }

    private applyCategorySet(
        categorySet: CategoryHyperlink[],
        seriesSet: DataRepresentationSeriesSet,
        seriesArray: DataRepresentationSeries[],
        misplacedCategory?: DataRepresentationSeries,
        shouldUseSeriesIndexAsDefaultSortOrder: boolean = false,
        level: number = 0
    ): void {
        const category: CategoryHyperlink = categorySet && categorySet[0];

        if (!category) {
            return;
        }

        let currentMisplacedCategory: DataRepresentationSeries = misplacedCategory;

        if (level === 0) {
            const metricName: CategoryHyperlink = categorySet
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
                    const existingSeries: DataRepresentationSeries = seriesSet[metricName.name];

                    existingSeries.hyperlink = existingSeries.hyperlink || category.hyperlink;
                }
            }
        }

        const series: DataRepresentationSeries = misplacedCategory && misplacedCategory.name === category.name
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
                shouldUseSeriesIndexAsDefaultSortOrder
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
        seriesSet: DataRepresentationSeriesSet,
        seriesArray: DataRepresentationSeries[],
        level: number = 0,
        hyperlink?: string,
        sortOrder?: DataRepresentationAxisValueType,
        image?: string,
        shouldUseSeriesIndexAsDefaultSortOrder?: boolean
    ): DataRepresentationSeries {
        const existingSeries: DataRepresentationSeries = seriesSet[name];

        if (existingSeries) {
            this.updateSeriesProperties(
                existingSeries,
                level,
                hyperlink,
                sortOrder,
                image
            );

            return existingSeries;
        }

        const currentSortOrder: DataRepresentationAxisValueType = NumericValueUtils.isValueDefined(sortOrder)
            ? sortOrder
            : shouldUseSeriesIndexAsDefaultSortOrder
                ? seriesArray.length
                : name;

        const series: DataRepresentationSeries = {
            name,
            image,
            level,
            hyperlink,
            children: [],
            axisValues: [],
            childrenSet: {},
            sortOrder: currentSortOrder,
        };

        seriesSet[name] = series;
        seriesArray.push(series);

        return series;
    }

    private applyExistingSeries(
        name: string,
        seriesSet: DataRepresentationSeriesSet,
        seriesArray: DataRepresentationSeries[],
        series: DataRepresentationSeries,
        level: number = 0,
        hyperlink?: string,
        sortOrder?: DataRepresentationAxisValueType,
        image?: string,
    ): DataRepresentationSeries {
        this.updateSeriesProperties(
            series,
            level,
            hyperlink,
            sortOrder,
            image
        );

        if (seriesSet[name]) {
            return seriesSet[name];
        }

        seriesSet[name] = series;
        seriesArray.push(series);

        return series;
    }

    private updateSeriesProperties(
        series: DataRepresentationSeries,
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
        columns: DataViewMetadataColumn[],
        visualColumns: VisualDataColumn[]
    ): DataRepresentationColumns {
        const columnSet = {};

        visualColumns.forEach((column: VisualDataColumn) => {
            const columnMetadata: DataViewMetadataColumn = this.getColumnByRoleName(columns, column.name);

            if (columnMetadata) {
                columnSet[column.name] = columnMetadata;
            }
        });

        return columnSet;
    }

    protected getDefaultData(): DataRepresentation {
        return {
            isDataColumnBasedModel: this.isDataColumnBasedModel,
            series: {},
            seriesArray: [],
            columns: {},
            seriesDeep: 0,
            type: DataRepresentationTypeEnum.None,
            y: {
                min: undefined,
                max: undefined
            },
        };
    }

    protected isDataViewValid(dataView: DataView): boolean {
        return !!(dataView
            && dataView.table
            && dataView.table.rows
            && dataView.table.columns);
    }

    protected getColumnByRoleName(columns: DataViewMetadataColumn[], roleName: string): DataViewMetadataColumn {
        for (let column of columns) {
            if (column.roles && column.roles[roleName]) {
                return column;
            }
        }

        return undefined;
    }

    protected getTypeOfColumn(column: DataViewMetadataColumn): DataRepresentationTypeEnum {
        if (column) {
            if (column.type.dateTime) {
                return DataRepresentationTypeEnum.DateType;
            } else if (column.type.integer || column.type.numeric) {
                return DataRepresentationTypeEnum.NumberType;
            } else if (column.type.text) {
                return DataRepresentationTypeEnum.StringType;
            }
        }

        return DataRepresentationTypeEnum.None;
    }

    protected getColumnValues(columns: DataViewMetadataColumn[], row: DataViewTableRow): ColumnValues {
        const columnValues: ColumnValues = {};

        row.forEach((value: any, valueIndex: number) => {
            const column: DataViewMetadataColumn = columns[valueIndex];

            if (columns[valueIndex].roles) {
                Object.keys(columns[valueIndex].roles)
                    .forEach((roleName: string) => {
                        if (!columnValues[roleName]) {
                            columnValues[roleName] = {};
                        }

                        if (!columnValues[roleName][column.displayName]) {
                            columnValues[roleName][column.displayName] = {
                                format: column.format
                            };
                        }

                        columnValues[roleName][column.displayName].value = value;
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

    protected getSeriesByDisplayName(
        seriesSet: DataRepresentationSeriesSet,
        seriesArray: DataRepresentationSeries[],
        levels: string[],
        displayName: string,
        identities: DataViewScopeIdentity[],
        identityIndex: number,
        identityQueryName: string,
        rows: DataViewTableRow[],
        defaultSettings: Settings,
        settingsState: SettingsState,
        type: DataRepresentationTypeEnum,
        viewMode: ViewMode
    ): DataRepresentationSeries {
        let series: DataRepresentationSeries = this.deepSearchSeries(
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
            const selectionId: SelectionId = SelectionId.createWithIdAndMeasure(
                identities && identities[identityIndex],
                identityQueryName
            );

            const settings: SeriesSettings = SeriesSettings.getDefault() as SeriesSettings;

            for (const propertyName in settings) {
                const descriptor: SettingsPropertyBase = settings[propertyName];
                const defaultDescriptor: SettingsPropertyBase = defaultSettings[propertyName];

                if (descriptor && descriptor.applyDefault && defaultDescriptor) {
                    descriptor.applyDefault(defaultDescriptor);
                }
            }

            const parsedObjects: DataViewObjects = (rows
                && rows[identityIndex]
                && rows[identityIndex].objects
                && rows[identityIndex].objects[0])
                || {};

            const serializedObjects: DataViewObjects = settingsState.getSeriesSettings(series.name)
                || parsedObjects
                || {};

            const shouldUseSerializedSeriesSettings: boolean = viewMode === ViewMode.View
                || defaultSettings.table.keepSeriesSettingOnFilteringInEditMode;

            const mergedObjects: DataViewObjects = shouldUseSerializedSeriesSettings
                ? { ...serializedObjects }
                : { ...parsedObjects };

            settings.parseObjects(mergedObjects);

            settings.asOfDate.parseByType(type);

            settingsState.setSeriesSettings(
                series.name,
                settings
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

    private getDefaultAxis(): DataRepresentationAxisWithScale {
        return {
            min: undefined,
            max: undefined,
            scale: DataRepresentationScale.create(),
        };
    }

    protected applyXArguments(
        series: DataRepresentationSeries,
        axisValue: DataRepresentationAxisValueType,
        type: DataRepresentationTypeEnum
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
        series: DataRepresentationSeries,
        type: DataRepresentationTypeEnum
    ): void {
        series.x.scale = this.getXAxisScale(
            series.x.scale,
            series.x.min,
            series.x.max,
            type,
            series.axisValues);
    }

    protected updateYScale(
        series: DataRepresentationSeries,
        commonAxis: DataRepresentationAxis
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
            DataRepresentationTypeEnum.NumberType
        );
    }

    public static applyYArguments(
        axis: DataRepresentationAxis,
        value: number
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
        axisSet: DataRepresentationAxis[],
        value: number
    ): void {
        axisSet.forEach((axis: DataRepresentationAxis) => {
            this.applyYArguments(axis, value);
        });
    }

    protected applyDataToCurrentSeries(data: CurrentSeriesData): void {
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
                dataRepresentation.y
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
                    dataRepresentation.y
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
                    dataRepresentation.y
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
                series.comparisonValue
            );

            series.secondKPIIndicatorValue = this.getVariance(
                isSecondKPIIndicatorValueSpecified,
                secondKPIIndicatorValue,
                series.currentValue,
                series.secondComparisonValue
            );

            series.varianceSet[0] = this.updateVariance(
                series.varianceSet[0],
                series.kpiIndicatorValue
            );

            series.varianceSet[1] = this.updateVariance(
                series.varianceSet[1],
                series.secondKPIIndicatorValue
            );
        }

        settings.currentValue.setColumnFormat(currentFormat);
        settings.comparisonValue.setColumnFormat(comparisonFormat);
        settings.kpiIndicatorValue.setColumnFormat(kpiIndicatorValueFormat);
        settings.secondComparisonValue.setColumnFormat(secondComparisonValueFormat);
        settings.secondKPIIndicatorValue.setColumnFormat(secondKPIIndicatorValueFormat);
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
        comparisonValue: number
    ): number {
        if (isKPIIndicatorValueSpecified && NumericValueUtils.isValueFinite(kpiIndicatorValue)) {
            return kpiIndicatorValue;
        } else if (!isKPIIndicatorValueSpecified && NumericValueUtils.isValueValid(comparisonValue)) {
            return this.varianceStrategy.getVariance(currentValue, comparisonValue);
        }

        return NaN;
    }

    private updatePointSet(
        pointSet: DataRepresentationPointSet,
        name: string,
        settings: NumberSettingsBase,
        isShown: boolean,
        axisValue: DataRepresentationAxisValueType,
        value: number,
        color: string,
        thickness: number,
        lineStyle: LineStyle,
        y: DataRepresentationAxis
    ): DataRepresentationPointSet {
        const currentPointSet: DataRepresentationPointSet = pointSet
            || this.getPointSet(
                name,
                color,
                thickness,
                lineStyle,
                settings,
                isShown
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
            value
        );

        return currentPointSet;
    }

    protected getPointSet(
        name: string,
        color: string,
        thickness: number,
        lineStyle: LineStyle,
        settings: NumberSettingsBase,
        isShown: boolean
    ): DataRepresentationPointSet {
        return {
            name,
            color,
            settings,
            isShown,
            thickness,
            lineStyle,
            colors: [],
            points: [],
            kpiIndicatorIndexes: [],
            min: undefined,
            max: undefined,
        };
    }
}

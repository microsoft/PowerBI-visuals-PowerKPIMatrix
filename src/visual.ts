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

import "../styles/styles.less";

import powerbi from "powerbi-visuals-api";

export class PowerKPIMatrix implements powerbi.extensibility.visual.IVisual {
    private columnSetConverter: Converter<DataRepresentationColumnSet>;
    private dataDirector: DataDirector<DataRepresentation>;
    private stateService: StateService;

    private hyperlinkAdapter: HyperlinkAdapter;

    private converterOptions: ConverterOptions;
    private renderOptions: VisualComponentRenderOptions;

    private scaleService: ScaleService;
    private settingsService: SettingsService;
    private powerKPIModalWindowService: ModalWindowService;

    private component: VisualComponent;

    private rootElement: D3.Selection;

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        this.columnSetConverter = new ColumnSetConverter();

        this.stateService = new StateService(
            {
                columnMapping: new ColumnMappingState(),
                table: new TableInternalState(),
                settings: new SettingsState(),
            },
            this.saveState.bind(this),
        );

        this.hyperlinkAdapter = new HyperlinkAdapter();

        this.scaleService = new ScaleService();
        this.settingsService = new SettingsService();

        this.dataDirector = new DataDirector(
            rowBasedMetricNameColumn,
            new RowBasedModelConverter(),
            new ColumnBasedModelConverter()
        );

        // const { style, host } = options;

        this.rootElement = d3.select(options.element);

        this.scaleService.element = this.rootElement.node();

        this.settingsService.host = options.host;
        this.hyperlinkAdapter.host = options.host;

        this.powerKPIModalWindowService = new ModalWindowService({
            componentCreators: [
                (options: VisualComponentConstructorOptions) => {
                    // return new PowerKPIComponent({
                    //     ...options,
                    //     host,
                    //     style,
                    // });

                    return null;
                },
            ],
            element: this.rootElement,
        });

        this.component = new LazyRootComponent({
            element: this.rootElement,
            powerKPIModalWindowService: this.powerKPIModalWindowService,
            scaleService: this.scaleService,
            stateService: this.stateService,
        });
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions): void {
        const dataView: powerbi.DataView = options
            && options.dataViews
            && options && options.dataViews[0];

        if (!dataView) {
            return;
        }

        const viewport: powerbi.IViewport = options && options.viewport
            ? { ...options.viewport }
            : { height: 0, width: 0 };

        const settings: Settings = (Settings.getDefault() as Settings).parse(dataView);

        this.stateService.parse(settings.internalState);

        this.converterOptions = {
            dataView,
            viewport,
            settings,
            columnMapping: this.stateService.states.columnMapping.getColumnMapping(),
            settingsState: this.stateService.states.settings,
            viewMode: options.viewMode,
        };

        const columnSet: DataRepresentationColumnSet = this.columnSetConverter.convert(this.converterOptions);

        this.stateService.states.columnMapping.applyDefaultRows(columnSet[actualValueColumn.name]);

        const dataRepresentation: DataRepresentation = this.dataDirector.convert(this.converterOptions);

        const isAdvancedEditModeTurnedOn: boolean = options.editMode === powerbi.EditMode.Advanced
            && dataRepresentation.isDataColumnBasedModel;

        if (this.renderOptions
            && this.settingsService
            && this.renderOptions.isAdvancedEditModeTurnedOn === true
            && isAdvancedEditModeTurnedOn === false
        ) {
            /**
             * This is a workaround for Edit button issue. This line forces Power BI to update data-model and internal state
             * Edit button disappears once we turn this mode on and go back to common mode by clicking Back to Report
             *
             * Please visit https://pbix.visualstudio.com/DefaultCollection/PaaS/_workitems/edit/21334 to find out more about this issue
             */
            this.settingsService.save([{
                objectName: "internalState",
                properties: {
                    "_#_apply_a_workaround_for_edit_mode_issue_#_": `${Math.random()}`,
                },
                selectionId: null,
            }]);
        }

        this.renderOptions = {
            columnSet,
            data: dataRepresentation,
            hyperlinkAdapter: this.hyperlinkAdapter,
            isAdvancedEditModeTurnedOn,
            settings,
            viewport,
        };

        this.component.render(this.renderOptions);

        if (this.stateService.states.settings.hasBeenUpdated
            && (options.viewMode === powerbi.ViewMode.Edit || options.viewMode === powerbi.ViewMode.InFocusEdit)
        ) {
            // We save state once rendering is done to save current series settings because they might be lost after filtering.
            this.stateService.save();
        }
    }

    public destroy(): void {
        this.dataDirector = null;
        this.converterOptions = null;
        this.renderOptions = null;
        this.stateService = null;

        this.scaleService.destroy();
        this.scaleService = null;

        this.settingsService.destroy();
        this.settingsService = null;

        this.powerKPIModalWindowService.destroy();
        this.powerKPIModalWindowService = null;

        this.component.clear();
        this.component.destroy();
        this.component = null;
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        let instances: VisualObjectInstance[] = (this.renderOptions
            && this.renderOptions.settings
            && (Settings.enumerateObjectInstances(this.renderOptions.settings, options) as VisualObjectInstanceEnumerationObject).instances)
            || [];

        const enumerationBuilder: ObjectEnumerationBuilder = new ObjectEnumerationBuilder();

        const { objectName } = options;

        switch (objectName) {
            case "asOfDate":
            case "metricName":
            case "kpiIndicator":
            case "currentValue":
            case "kpiIndicatorValue":
            case "comparisonValue":
            case "secondComparisonValue":
            case "secondKPIIndicatorValue":
            case "metricSpecific": {
                this.enumerateSettings(
                    enumerationBuilder,
                    objectName,
                    this.getSettings.bind(this));
                break;
            }
            case "sparklineSettings": {
                this.enumerateSettings(
                    enumerationBuilder,
                    objectName,
                    this.getSparklineSettingsProperties.bind(this));
                break;
            }
        }

        const instance: VisualObjectInstanceEnumeration = enumerationBuilder.complete();

        if (!instance || !instance.instances) {
            return instances;
        }

        instance.instances.push(...instances);

        return instance;
    }

    private enumerateSettings(
        enumerationBuilder: ObjectEnumerationBuilder,
        objectName: string,
        getSettings: (
            settings: SettingsPropertyBase,
            areExtraPropertiesSpecified?: boolean
        ) => { [propertyName: string]: DataViewPropertyValue }
    ): void {
        this.applySettings(
            objectName,
            "[All Metrics]",
            null,
            enumerationBuilder,
            getSettings(this.renderOptions.settings[objectName], true));

        this.enumerateSettingsDeep(
            this.renderOptions.data.seriesArray,
            objectName,
            enumerationBuilder,
            getSettings);
    }

    private getSettings(
        settings: SettingsPropertyBase,
        areExtraPropertiesSpecified: boolean = false
    ): { [propertyName: string]: DataViewPropertyValue } {
        const properties: { [propertyName: string]: DataViewPropertyValue; } = {};

        for (const descriptor in settings) {
            if (!areExtraPropertiesSpecified
                && (descriptor === "show" || descriptor === "label" || descriptor === "order")
            ) {
                continue;
            }

            const value: any = descriptor === "format" && (settings as NumberSettingsBase).getFormat
                ? (settings as NumberSettingsBase).getFormat()
                : settings[descriptor];

            const typeOfValue: string = typeof value;

            if (typeOfValue === "undefined"
                || typeOfValue === "number"
                || typeOfValue === "string"
                || typeOfValue === "boolean"
            ) {
                properties[descriptor] = value;
            }
        }

        return properties;
    }

    private applySettings(
        objectName: string,
        displayName: string,
        selector: Selector,
        enumerationBuilder: ObjectEnumerationBuilder,
        properties: { [propertyName: string]: DataViewPropertyValue }
    ): void {
        enumerationBuilder.pushContainer({ displayName });

        const instance: VisualObjectInstance = {
            selector,
            objectName,
            properties,
        };

        enumerationBuilder.pushInstance(instance);
        enumerationBuilder.popContainer();
    }

    private enumerateSettingsDeep(
        seriesArray: IDataRepresentationSeries[],
        objectName: string,
        enumerationBuilder: ObjectEnumerationBuilder,
        getSettings: (
            settings: SettingsPropertyBase,
            areExtraPropertiesSpecified?: boolean
        ) => { [propertyName: string]: DataViewPropertyValue }
    ): void {
        for (let series of seriesArray) {
            if (series.hasBeenFilled) {
                this.applySettings(
                    objectName,
                    series.name,
                    series.selectionId.getSelector(),
                    enumerationBuilder,
                    getSettings(series.settings[objectName]));
            } else if (series.children && series.children.length) {
                this.enumerateSettingsDeep(series.children, objectName, enumerationBuilder, getSettings);
            }
        }
    }

    private getSparklineSettingsProperties(
        settings: SparklineSettings,
        areExtraPropertiesSpecified: boolean = false
    ): { [propertyName: string]: DataViewPropertyValue } {
        const properties: { [propertyName: string]: DataViewPropertyValue; } = {};

        if (areExtraPropertiesSpecified) {
            properties["show"] = settings.show;
            properties["label"] = settings.label;
            properties["order"] = settings.order;
        }

        properties["isActualVisible"] = settings.isActualVisible;

        if (settings.isActualVisible) {
            properties["shouldActualUseKPIColors"] = settings.shouldActualUseKPIColors;
        }

        properties["actualColor"] = settings.actualColor;
        properties["actualThickness"] = settings.actualThickness;
        properties["actualLineStyle"] = settings.actualLineStyle;

        if (this.renderOptions.data.columns[comparisonValueColumn.name]) {
            properties["isTargetVisible"] = settings.isTargetVisible;
            properties["targetColor"] = settings.targetColor;
            properties["targetThickness"] = settings.targetThickness;
            properties["targetLineStyle"] = settings.targetLineStyle;
        }

        if (this.renderOptions.data.columns[secondComparisonValueColumn.name]) {
            properties["isSecondComparisonValueVisible"] = settings.isSecondComparisonValueVisible;
            properties["secondComparisonValueColor"] = settings.secondComparisonValueColor;
            properties["secondComparisonValueThickness"] = settings.secondComparisonValueThickness;
            properties["secondComparisonValueLineStyle"] = settings.secondComparisonValueLineStyle;
        }

        properties.backgroundColor = settings.backgroundColor;

        properties.shouldUseCommonScale = settings.shouldUseCommonScale;
        properties.yMin = settings.yMin;
        properties.yMax = settings.yMax;

        properties.verticalReferenceLineColor = settings.verticalReferenceLineColor;
        properties.verticalReferenceLineThickness = settings.verticalReferenceLineThickness;

        return properties;
    }

    private saveState(items: ISettingsServiceItem[], isRenderRequired: boolean): void {
        this.settingsService.save(items);

        if (isRenderRequired) {
            this.updateWithMapping();
        }
    }

    private updateWithMapping(): void {
        this.converterOptions = {
            ...this.converterOptions,
            columnMapping: this.stateService.states.columnMapping.getColumnMapping(),
            settingsState: this.stateService.states.settings,
        };

        this.renderOptions.data = this.dataDirector.convert(this.converterOptions);

        this.component.render(this.renderOptions);
    }
}

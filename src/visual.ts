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

module powerbi.extensibility.visual {
    // powerbi
    import EditMode = powerbi.EditMode;
    // import VisualCapabilities = powerbi.VisualCapabilities;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;

    import IVisualStyle = powerbi.extensibility.visual.powerKPI.IVisualStyle;

    // powerbi.data
    import Selector = powerbi.data.Selector;

    export class PowerKPIMatrix implements IVisual {
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

        private rootElement: d3.Selection<any>;

        private isFirstUpdate: boolean = true;

        private instances: powerbi.VisualObjectInstance[];
        private containers: VisualObjectInstanceContainer[];
        private containerIdx: number;

        constructor(options: VisualConstructorOptions) {
            this.columnSetConverter = new ColumnSetConverter();

            this.stateService = new StateService(
                {
                    columnMapping: new ColumnMappingState(),
                    table: new TableInternalState(),
                },
                this.saveState.bind(this),
            );

            this.hyperlinkAdapter = new HyperlinkAdapter();

            this.scaleService = new ScaleService();
            this.settingsService = new SettingsService();
            const selectionIdBuilder = options.host.createSelectionIdBuilder();
            this.dataDirector = new DataDirector(
                rowBasedMetricNameColumn,
                new RowBasedModelConverter(selectionIdBuilder),
                new ColumnBasedModelConverter(selectionIdBuilder)
            );

            this.rootElement = d3.select(options.element);

            this.scaleService.element = this.rootElement.node() as HTMLElement;

            this.settingsService.host = options.host;
            this.hyperlinkAdapter.host = options.host;

            const style: IVisualStyle = {
                colorPalette: options.host.colorPalette,
                isHighContrast: false,
                labelText: {
                    color: {
                        value: options.element.style.color
                    }
                },
                subTitleText: {
                    color: {
                        value: options.element.style.color
                    }
                },
                titleText: {
                    color: {
                        value: options.element.style.color
                    }
                }
            }
            const host = options.host;
            this.powerKPIModalWindowService = new ModalWindowService({
                element: this.rootElement,
                host,
                componentCreators: [ (o: VisualComponentConstructorOptions) => new PowerKPIComponent({ element: o.element, host }) ]
            });

            this.component = new RootComponent({
                element: this.rootElement,
                scaleService: this.scaleService,
                stateService: this.stateService,
                powerKPIModalWindowService: this.powerKPIModalWindowService,
            });
        }

        public update(options: VisualUpdateOptions): void {
            let dataView: DataView = null
                , viewport: IViewport = { height: 0, width: 0 };

            if (options && options.dataViews) {
                dataView = options.dataViews[0];
            }

            if (options && options.viewport) {
                viewport = { ...options.viewport };
            }

            const settings: Settings = (Settings.getDefault() as Settings).parse(dataView);

            if (this.isFirstUpdate
                && settings
                && settings.internalState
                && settings.internalState.value
            ) {
                this.stateService.parse(settings.internalState.value);

                this.isFirstUpdate = false; // we don't want to parse column mapping more than once
            }

            this.converterOptions = {
                dataView,
                viewport,
                settings,
                columnMapping: this.stateService.states.columnMapping.getColumnMapping(),
            };

            const columnSet: DataRepresentationColumnSet = this.columnSetConverter.convert(this.converterOptions);

            this.stateService.states.columnMapping.applyDefaultRows(columnSet[actualValueColumn.name]);
            const dataRepresentation: DataRepresentation = this.dataDirector.convert(this.converterOptions);

            const isAdvancedEditModeTurnedOn: boolean = options.editMode === EditMode.Advanced
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
                this.settingsService.save("_#_apply_a_workaround_for_edit_mode_issue_#_", `${Math.random()}`);
            }

            this.renderOptions = {
                viewport,
                settings,
                columnSet,
                isAdvancedEditModeTurnedOn,
                data: dataRepresentation,
                hyperlinkAdapter: this.hyperlinkAdapter,
            };

            this.component.render(this.renderOptions);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let instances: VisualObjectInstance[] = (this.renderOptions
                && this.renderOptions.settings
                && (Settings.enumerateObjectInstances(this.renderOptions.settings, options) as VisualObjectInstanceEnumerationObject).instances)
                || [];

            this.instances = [];
            this.containers = [];

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
                        objectName,
                        this.getSettings.bind(this));
                    break;
                }
                case "sparklineSettings": {
                    this.enumerateSettings(
                        objectName,
                        this.getSparklineSettingsProperties.bind(this));
                    break;
                }
            }
            let instance: VisualObjectInstanceEnumerationObject;
            if (this.instances && this.instances.length > 0) {
                instance = { instances: this.instances, };

                let containers = this.containers;
                if (containers && containers.length > 0) {
                    instance.containers = containers;
                }
            }

            if (!instance || !instance.instances) {
                return instances;
            }

            instance.instances.push(...instances);
            return instance;
        }

        private enumerateSettings(
            objectName: string,
            getSettings: (settings: SettingsPropertyBase, areExtraPropertiesSpecified?: boolean) => { [propertyName: string]: DataViewPropertyValue }
        ): void {
            this.applySettings(
                objectName,
                "[All Metrics]",
                null,
                getSettings(this.renderOptions.settings[objectName], true));

            this.enumerateSettingsDeep(
                this.renderOptions.data.seriesArray,
                objectName,
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
            properties: { [propertyName: string]: DataViewPropertyValue }
        ): void {
            const containerIdx = this.containers.push({ displayName }) - 1;

            const instance: VisualObjectInstance = {
                selector,
                objectName,
                properties,
                containerIdx
            };

            this.instances.push(instance);
        }

        private enumerateSettingsDeep(
            seriesArray: DataRepresentationSeries[],
            objectName: string,
            getSettings: (settings: SettingsPropertyBase, areExtraPropertiesSpecified?: boolean) => { [propertyName: string]: DataViewPropertyValue }
        ): void {
            for (let series of seriesArray) {
                if (series.hasBeenFilled) {
                    this.applySettings(
                        objectName,
                        series.name,
                        series.selectionId.getSelector(),
                        getSettings(series.settings[objectName]));
                } else if (series.children && series.children.length) {
                    this.enumerateSettingsDeep(series.children, objectName, getSettings);
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

            properties['backgroundColor'] = settings.backgroundColor;

            properties['shouldUseCommonScale'] = settings.shouldUseCommonScale;
            properties['yMin'] = settings.yMin;
            properties['yMax'] = settings.yMax;

            properties['verticalReferenceLineColor'] = settings.verticalReferenceLineColor;
            properties['verticalReferenceLineThickness'] = settings.verticalReferenceLineThickness;

            return properties;
        }

        private saveState(state: string, isRenderRequired: boolean): void {
            this.settingsService.save("internalState", state);

            if (isRenderRequired) {
                this.updateWithMapping();
            }
        }

        private updateWithMapping(): void {
            this.converterOptions = {
                viewport: this.converterOptions.viewport,
                dataView: this.converterOptions.dataView,
                settings: this.converterOptions.settings,
                columnMapping: this.stateService.states.columnMapping.getColumnMapping(),
            };

            this.renderOptions.data = this.dataDirector.convert(this.converterOptions);

            this.component.render(this.renderOptions);
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

        private pushInstanceWithContainer(instance: VisualObjectInstance, container: VisualObjectInstanceContainer) {
            this.instances.push(instance);
            this.containerIdx = this.containers.push(container) - 1;
            instance.containerIdx = this.containerIdx;

            for (let existingInstance of this.instances) {
                if (this.equalInstances(existingInstance, instance)) {
                    for (let propertyName of ['properties', 'validValues']) {
                        let sourceValues = instance[propertyName];
                        if (!sourceValues)
                            return;

                        let targetValues = existingInstance[propertyName];
                        if (!targetValues)
                            targetValues = existingInstance[propertyName] = {};

                        for (let valuePropertyName in sourceValues) {
                            if (targetValues[valuePropertyName]) {
                                // Properties have first-writer-wins semantics.
                                continue;
                            }

                            targetValues[valuePropertyName] = sourceValues[valuePropertyName];
                        }
                    }
                }
            }
        }

        private equalInstances(x: VisualObjectInstance, y: VisualObjectInstance) {
            return x.objectName === y.objectName
                && x.containerIdx === y.containerIdx
        }
    }
}
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

import "@babel/polyfill";

import "../styles/styles.less";

import {
    select as d3Select,
    Selection,
} from "d3-selection";

import powerbi from "powerbi-visuals-api";

import { actualValueColumn } from "./columns/actualValueColumn";
import { comparisonValueColumn } from "./columns/comparisonValueColumn";
import { rowBasedMetricNameColumn } from "./columns/rowBasedMetricNameColumn";
import { secondComparisonValueColumn } from "./columns/secondComparisonValueColumn";

import { ColumnSetConverter } from "./converter/columnSet/columnSetConverter";
import { IDataRepresentationColumnSet } from "./converter/columnSet/dataRepresentation/dataRepresentationColumnSet";
import { IConverter } from "./converter/converter";
import { IConverterOptions } from "./converter/converterOptions";
import { IDataRepresentation } from "./converter/data/dataRepresentation/dataRepresentation";
import { IDataRepresentationSeries } from "./converter/data/dataRepresentation/dataRepresentationSeries";
import { DataDirector } from "./converter/data/director/dataDirector";

import { ColumnBasedModelConverter } from "./converter/data/columnBasedModel/columnBasedModelConverter";
import { RowBasedModelConverter } from "./converter/data/rowBasedModel/rowBasedModelConverter";

import { IVisualComponent } from "./visualComponent/visualComponent";
import { IVisualComponentConstructorOptions } from "./visualComponent/visualComponentConstructorOptions";
import { IVisualComponentRenderOptions } from "./visualComponent/visualComponentRenderOptions";

import { ModalWindowService } from "./services/modalWindowService";
import { ScaleService } from "./services/scaleService";
import { ColumnMappingState } from "./services/state/columnMappingState";
import { SettingsState } from "./services/state/settingsState";
import { StateService } from "./services/state/stateService";
import { TableInternalState } from "./services/state/tableInternalState";

import {
    ISettingsServiceItem,
    SettingsService,
} from "./services/settingsService";

import { LazyRootComponent } from "./visualComponent/lazyRootComponent";

import { HyperlinkAdapter } from "./hyperlink/hyperlinkAdapter";

import { NumberSettingsBase } from "./settings/descriptors/numberSettingsBase";
import { SettingsPropertyBase } from "./settings/descriptors/settingsPropertyBase";
import { SparklineSettings } from "./settings/descriptors/sparklineSettings";
import { Settings } from "./settings/settings";

import { PowerKPIComponent } from "./visualComponent/dynamic/powerKPIComponent";

export class PowerKPIMatrix implements powerbi.extensibility.visual.IVisual {
    private columnSetConverter: IConverter<IDataRepresentationColumnSet>;
    private dataDirector: DataDirector<IDataRepresentation>;
    private stateService: StateService;

    private hyperlinkAdapter: HyperlinkAdapter;

    private converterOptions: IConverterOptions;
    private renderOptions: IVisualComponentRenderOptions;

    private scaleService: ScaleService;
    private settingsService: SettingsService;
    private powerKPIModalWindowService: ModalWindowService;

    private component: IVisualComponent;

    private rootElement: Selection<any, any, any, any>;

    constructor(constructorOptions: powerbi.extensibility.visual.VisualConstructorOptions) {
        this.columnSetConverter = new ColumnSetConverter();

        this.stateService = new StateService(
            {
                columnMapping: new ColumnMappingState(),
                settings: new SettingsState(),
                table: new TableInternalState(),
            },
            this.saveState.bind(this),
        );

        this.hyperlinkAdapter = new HyperlinkAdapter();

        this.scaleService = new ScaleService();
        this.settingsService = new SettingsService();

        const { host } = constructorOptions;

        this.dataDirector = new DataDirector(
            rowBasedMetricNameColumn,
            new RowBasedModelConverter(host.createSelectionIdBuilder.bind(host)),
            new ColumnBasedModelConverter(host.createSelectionIdBuilder.bind(host)),
        );

        this.rootElement = d3Select(constructorOptions.element);

        this.scaleService.element = this.rootElement.node();

        this.settingsService.host = constructorOptions.host;
        this.hyperlinkAdapter.host = constructorOptions.host;

        this.powerKPIModalWindowService = new ModalWindowService({
            componentCreators: [
                (options: IVisualComponentConstructorOptions) => {
                    return new PowerKPIComponent({
                        ...options,
                        host,
                        rootElement: this.rootElement,
                    });
                },
            ],
            element: this.rootElement,
        });

        this.component = new LazyRootComponent({
            element: this.rootElement,
            powerKPIModalWindowService: this.powerKPIModalWindowService,
            rootElement: this.rootElement,
            scaleService: this.scaleService,
            stateService: this.stateService,
            tooltipService: host.tooltipService,
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
            columnMapping: this.stateService.states.columnMapping.getColumnMapping(),
            dataView,
            settings,
            settingsState: this.stateService.states.settings,
            viewMode: options.viewMode,
            viewport,
        };

        const columnSet: IDataRepresentationColumnSet = this.columnSetConverter.convert(this.converterOptions);

        this.stateService.states.columnMapping.applyDefaultRows(columnSet[actualValueColumn.name]);

        const dataRepresentation: IDataRepresentation = this.dataDirector.convert(this.converterOptions);

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
                objectName: "editButtonHack",
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

    public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
        const instances: powerbi.VisualObjectInstance[] = (this.renderOptions
            && this.renderOptions.settings
            && (Settings.enumerateObjectInstances(
                this.renderOptions.settings,
                options,
            ) as powerbi.VisualObjectInstanceEnumerationObject).instances)
            || [];

        const enumerationObject: powerbi.VisualObjectInstanceEnumerationObject = {
            containers: [],
            instances: [],
        };

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
                    enumerationObject,
                    objectName,
                    this.getSettings.bind(this));
                break;
            }
            case "sparklineSettings": {
                this.enumerateSettings(
                    enumerationObject,
                    objectName,
                    this.getSparklineSettingsProperties.bind(this));
                break;
            }
        }

        enumerationObject.instances.push(...instances);

        return enumerationObject;
    }

    private enumerateSettings(
        enumerationObject: powerbi.VisualObjectInstanceEnumerationObject,
        objectName: string,
        getSettings: (
            settings: SettingsPropertyBase,
            areExtraPropertiesSpecified?: boolean,
        ) => { [propertyName: string]: powerbi.DataViewPropertyValue },
    ): void {
        this.applySettings(
            objectName,
            "[All Metrics]",
            null,
            enumerationObject,
            getSettings(this.renderOptions.settings[objectName], true));

        this.enumerateSettingsDeep(
            this.renderOptions.data.seriesArray,
            objectName,
            enumerationObject,
            getSettings);
    }

    private getSettings(
        settings: SettingsPropertyBase,
        areExtraPropertiesSpecified: boolean = false,
    ): { [propertyName: string]: powerbi.DataViewPropertyValue } {
        const properties: { [propertyName: string]: powerbi.DataViewPropertyValue; } = {};

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
                || value === null
            ) {
                properties[descriptor] = value;
            }
        }

        return properties;
    }

    private applySettings(
        objectName: string,
        displayName: string,
        selector: powerbi.data.Selector,
        enumerationObject: powerbi.VisualObjectInstanceEnumerationObject,
        properties: { [propertyName: string]: powerbi.DataViewPropertyValue },
    ): void {
        const containerIdx = enumerationObject.containers.push({ displayName }) - 1;

        enumerationObject.instances.push({
            containerIdx,
            objectName,
            properties,
            selector,
        });
    }

    private enumerateSettingsDeep(
        seriesArray: IDataRepresentationSeries[],
        objectName: string,
        enumerationObject: powerbi.VisualObjectInstanceEnumerationObject,
        getSettings: (
            settings: SettingsPropertyBase,
            areExtraPropertiesSpecified?: boolean,
        ) => { [propertyName: string]: powerbi.DataViewPropertyValue },
    ): void {
        for (const series of seriesArray) {
            if (series.hasBeenFilled) {
                this.applySettings(
                    objectName,
                    series.name,
                    series.selectionId && series.selectionId.getSelector && series.selectionId.getSelector(),
                    enumerationObject,
                    getSettings(series.settings[objectName]));
            } else if (series.children && series.children.length) {
                this.enumerateSettingsDeep(series.children, objectName, enumerationObject, getSettings);
            }
        }
    }

    private getSparklineSettingsProperties(
        settings: SparklineSettings,
        areExtraPropertiesSpecified: boolean = false,
    ): { [propertyName: string]: powerbi.DataViewPropertyValue } {
        const properties: { [propertyName: string]: powerbi.DataViewPropertyValue; } = {};

        if (areExtraPropertiesSpecified) {
            properties.show = settings.show;
            properties.label = settings.label;
            properties.order = settings.order;
        }

        properties.isActualVisible = settings.isActualVisible;

        if (settings.isActualVisible) {
            properties.shouldActualUseKPIColors = settings.shouldActualUseKPIColors;
        }

        properties.actualColor = settings.actualColor;
        properties.actualThickness = settings.actualThickness;
        properties.actualLineStyle = settings.actualLineStyle;

        if (this.renderOptions.data.columns[comparisonValueColumn.name]) {
            properties.isTargetVisible = settings.isTargetVisible;
            properties.targetColor = settings.targetColor;
            properties.targetThickness = settings.targetThickness;
            properties.targetLineStyle = settings.targetLineStyle;
        }

        if (this.renderOptions.data.columns[secondComparisonValueColumn.name]) {
            properties.isSecondComparisonValueVisible = settings.isSecondComparisonValueVisible;
            properties.secondComparisonValueColor = settings.secondComparisonValueColor;
            properties.secondComparisonValueThickness = settings.secondComparisonValueThickness;
            properties.secondComparisonValueLineStyle = settings.secondComparisonValueLineStyle;
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

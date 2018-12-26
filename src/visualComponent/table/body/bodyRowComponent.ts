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

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import { CategorySettings } from "../../../settings/descriptors/categorySettings";
import { GridSettings } from "../../../settings/descriptors/gridSettings";
import { NumberSettingsBase } from "../../../settings/descriptors/numberSettingsBase";
import { TableType } from "../../../settings/descriptors/tableSettings";

import {
    IGeneratedCategory,
    SettingsBase,
} from "../../../settings/settingsBase";

import {
    BaseBodyRowComponent,
    BodyRowComponentViewMode,
} from "./baseBodyRowComponent";

import { FormattingUtils } from "../../../utils/formattingUtils";

import { IDataRepresentationSeries } from "../../../converter/data/dataRepresentation/dataRepresentationSeries";

import { CollapsedBodyRowComponent } from "./collapsedBodyRowComponent";

import { IBodyRowConstructorOptions } from "./bodyRowConstructorOptions";
import { IBodyRowRenderOptions } from "./bodyRowRenderOptions";

import { ModalWindowService } from "../../../services/modalWindowService";

import { CellComponent } from "../cell/cellComponent";
import { ICellState } from "../cell/cellState";
import { CollapserCellComponent } from "../cell/collapser/collapserCellComponent";
import { ICollapserCellRenderOptions } from "../cell/collapser/collapserCellRenderOptions";
import { KPIIndicatorCellComponent } from "../cell/kpiIndicator/kpiIndicatorCellComponent";
import { IKPIIndicatorCellRenderOptions } from "../cell/kpiIndicator/kpiIndicatorCellRenderOptions";
import { SparklineCellComponent } from "../cell/sparkline/sparklineCellComponent";
import { ISparklineCellRenderOptions } from "../cell/sparkline/sparklineCellRenderOptions";
import { TextCellComponent } from "../cell/text/textCellComponent";
import { ITextCellRenderOptions } from "../cell/text/textCellRenderOptions";

import { BaseComponent } from "../../baseComponent";
import { IVisualComponent } from "../../visualComponent";
import { DraggableComponent } from "../draggable/draggableComponent";
import { RowComponent } from "../row/rowComponent";

import {
    IRowState,
    IRowStateSet,
} from "../row/rowState";

export class BodyRowComponent extends BaseBodyRowComponent {
    private isContainerShown: boolean = true;

    private viewMode: BodyRowComponentViewMode = BodyRowComponentViewMode.common;

    private bodyRowComponentClickActionClassName: string = "bodyRowComponent_clickAction";

    private amountOfSubRows: number = 1;

    private powerKPIModalWindowService: ModalWindowService;
    private powerKPIModalWindowServiceRenderData: ISparklineCellRenderOptions;

    private cellConstructors = [
        TextCellComponent, // As of Date
        TextCellComponent, // Metric Name
        TextCellComponent, // Current Value
        KPIIndicatorCellComponent, // KPI Indicator
        TextCellComponent, // Comparison Value
        SparklineCellComponent, // Sparkline
        TextCellComponent, // Second Comparison Value
        TextCellComponent, // Second KPI Indicator Value
    ];

    private tabularViewCellConstructors = [CollapserCellComponent];

    constructor(constructorOptions: IBodyRowConstructorOptions) {
        super(constructorOptions);

        this.cellOptions.onChangeHandler = this.changeContainerStateAndKeepState.bind(this);
        this.powerKPIModalWindowService = constructorOptions.powerKPIModalWindowService;
    }

    public render(options: IBodyRowRenderOptions): void {
        const {
            series,
            settings,
            rowStateSet,
            originRowStateSet,
        } = options;

        this.name = series.name;
        this.level = series.level;
        this.tableType = settings.table.type;

        const rowState: IRowState =
            (rowStateSet && rowStateSet[this.name])
            ||
            (originRowStateSet && originRowStateSet[this.name]);

        if (series.children && series.children.length) {
            const isContainerShown: boolean = rowState
                ? rowState.isShown === true || rowState.isShown === undefined
                : true;

            this.setViewMode(BodyRowComponentViewMode.tabular);

            this.renderContainer(
                options,
                this.tabularViewCellConstructors,
                isContainerShown,
                rowState,
                0,
                0,
            );

            this.verticalDraggableComponents.forEach((component: DraggableComponent) => {
                this.updateComponentOrder(component, 0);
            });

            this.updateContainerGrid(this.tableType === TableType.RowBasedKPIS
                ? settings.horizontalGrid
                : settings.verticalGrid,
            );

            this.changeContainerState(isContainerShown);

            this.bindClickEventToOpenModalWindow(null);
        } else if (series.hasBeenFilled) {
            this.setViewMode(BodyRowComponentViewMode.common);

            if (!this.components.length) {
                this.initCells(
                    this.cellConstructors,
                    this.bodyOptions,
                    this.cellOptions);

                this.initHorizontalDraggableComponent(this.options);
            }

            this.applyContainerClassName(false);

            this.renderCells(options);

            this.updateContainerGrid(null);
            this.updateAlignment(this.containerElement, undefined, undefined);
        }

        this.updateClassNamesBasedOnViewMode(this.viewMode);

        this.updateGrid(settings.horizontalGrid, settings.verticalGrid);

        this.applyState(rowState);

        this.postRender();
    }

    public getWidth(): number {
        if (this.viewMode === BodyRowComponentViewMode.common) {
            return super.getWidth();
        }

        return this.getWidthOfChildren();
    }

    public getHeight(shouldConsiderSplitter: boolean = false): number {
        if (this.viewMode === BodyRowComponentViewMode.common) {
            return super.getHeight(shouldConsiderSplitter);
        }

        return this.getHeightOfChildren(shouldConsiderSplitter);
    }

    public updateSizeOfCellByIndex(width: number, height: number, cellIndex: number): void {
        switch (this.viewMode) {
            case BodyRowComponentViewMode.common: {
                super.updateSizeOfCellByIndex(width, height, cellIndex);

                break;
            }
            case BodyRowComponentViewMode.tabular: {
                const constructorsLength: number = this.tabularViewCellConstructors.length;

                const currentCellIndex: number = cellIndex - constructorsLength;

                if (currentCellIndex >= 0) {
                    this.components
                        .slice(constructorsLength)
                        .forEach((component: RowComponent) => {
                            component.updateSizeOfCellByIndex(width, height, currentCellIndex);
                        });
                }

                super.updateSizeOfCellByIndex(width, height, cellIndex);

                break;
            }
        }
    }

    public getState(): IRowState {
        switch (this.viewMode) {
            case BodyRowComponentViewMode.common: {
                return super.getState();
            }
            case BodyRowComponentViewMode.tabular: {
                return this.getContainerState(this.tabularViewCellConstructors.length);
            }
        }
    }

    public destroy(): void {
        this.powerKPIModalWindowServiceRenderData = null;

        super.destroy();
    }

    public updateVisibility(visibilities: boolean[]): void {
        switch (this.viewMode) {
            case BodyRowComponentViewMode.common: {
                super.updateVisibility(visibilities);

                break;
            }
            case BodyRowComponentViewMode.tabular: {
                const cellConstructorsLength: number = this.tabularViewCellConstructors.length;

                this.updateContainerVisibility(
                    visibilities,
                    visibilities.slice(cellConstructorsLength),
                    cellConstructorsLength);

                break;
            }
        }
    }

    protected updateSize(width: number, height: number): void {
        if (this.viewMode === BodyRowComponentViewMode.tabular) {
            super.updateSize(width, undefined);
        } else {
            super.updateSize(width, height);
        }
    }

    protected onChildrenSizeChange(): void {
        if (this.viewMode === BodyRowComponentViewMode.tabular) {
            const childrenSize: number = this.getHeight();

            switch (this.tableType) {
                case TableType.ColumnBasedKPIS: {
                    this.updateCellComponentSizeByIndex(childrenSize, undefined, 0);

                    break;
                }
                case TableType.RowBasedKPIS: {
                    this.updateCellComponentSizeByIndex(undefined, childrenSize, 0);

                    if (this.verticalDraggableComponents
                        && this.verticalDraggableComponents[0]
                    ) {
                        this.verticalDraggableComponents[0].updateSize(undefined, childrenSize, true);
                    }

                    break;
                }
            }
        }

        super.onChildrenSizeChange();
    }

    private bindClickEventToOpenModalWindow(data: ISparklineCellRenderOptions): void {
        this.powerKPIModalWindowServiceRenderData = data;

        const isInteractable: boolean = this.powerKPIModalWindowServiceRenderData
            && this.powerKPIModalWindowServiceRenderData.settings
            && this.powerKPIModalWindowServiceRenderData.settings.popOutGeneralSettings
            && this.powerKPIModalWindowServiceRenderData.settings.popOutGeneralSettings.show;

        this.element
            .on("click", isInteractable
                ? () => {
                    this.powerKPIModalWindowService.render(this.powerKPIModalWindowServiceRenderData);
                }
                : null,
            )
            .classed(this.bodyRowComponentClickActionClassName, isInteractable);

        if (this.powerKPIModalWindowService && this.powerKPIModalWindowService.isShown) {
            const currentData: ISparklineCellRenderOptions =
                this.powerKPIModalWindowService.getRenderOptions() as ISparklineCellRenderOptions;

            if (currentData
                && this.powerKPIModalWindowServiceRenderData
                && currentData.series
                && this.powerKPIModalWindowServiceRenderData.series
                && currentData.series.name === this.powerKPIModalWindowServiceRenderData.series.name
            ) {
                this.powerKPIModalWindowService.render(this.powerKPIModalWindowServiceRenderData);
            }
        }
    }

    private postRender(): void {
        if (this.viewMode === BodyRowComponentViewMode.tabular) {
            this.onChildrenSizeChange();
        }
    }

    private updateContainerGrid(gridSettings: GridSettings): void {
        if (!this.containerElement) {
            return;
        }

        const border: string = this.getStringRepresentationOfBorderByGridSettings(gridSettings);

        this.containerElement
            .style("border-bottom", this.tableType === TableType.RowBasedKPIS
                ? border
                : null,
            )
            .style("border-right", this.tableType === TableType.ColumnBasedKPIS
                ? border
                : null,
            );
    }

    private updateComponentOrder(component: BaseComponent, order: number): void {
        if (!component || !component.updateOrder) {
            return;
        }

        component.updateOrder(order);
    }

    private initSubRows(
        preComponentsLength: number,
        subRowConstructor,
        amountOfComponents: number,
    ): void {
        this.components
            .splice(preComponentsLength + amountOfComponents)
            .forEach((component: IVisualComponent) => {
                component.clear();
                component.destroy();
            });

        if (this.components.length - preComponentsLength < amountOfComponents) {
            for (
                let index: number = this.components.length - preComponentsLength;
                index < amountOfComponents;
                index++
            ) {
                this.components.push(new subRowConstructor(this.bodyOptions));
            }
        }
    }

    private renderContainer(
        options: IBodyRowRenderOptions,
        cellConstructors: any[],
        isContainerShown: boolean,
        rowState: IRowState,
        collapserIndex: number,
        collapserOrder: number,
    ): void {
        const {
            hyperlinkAdapter,
            series,
            settings,
            originRowStateSet,
            seriesDeep,
            viewport,
        } = options;

        const cellsLength: number = cellConstructors.length;

        const expectedAmountOfComponents: number = this.amountOfSubRows + cellsLength + options.series.children.length;

        if (this.components.length !== expectedAmountOfComponents || !this.components.length) {
            this.destroyComponents();

            this.initCells(
                cellConstructors,
                this.bodyOptions,
                this.cellOptions,
            );

            this.initSubRows(
                cellsLength,
                CollapsedBodyRowComponent,
                this.amountOfSubRows,
            );

            this.initSubRows(
                this.amountOfSubRows + cellsLength,
                BodyRowComponent,
                options.series.children.length,
            );
        }

        const category: IGeneratedCategory = SettingsBase.getCategoryByIndex(series.level);

        const fontSettings: CategorySettings = settings[category.name] || settings.metricName;

        this.components[collapserIndex].render({
            fontSettings,
            hyperlink: series.hyperlink,
            hyperlinkAdapter,
            image: series.image,
            isExpandCollapseShown: fontSettings.isExpandCollapseShown,
            isShown: isContainerShown,
            order: collapserOrder,
            value: series.name,
        } as ICollapserCellRenderOptions);

        this.components[collapserIndex + this.amountOfSubRows].render(options);

        this.applyContainerClassName();

        if ((this.viewMode === BodyRowComponentViewMode.tabular || this.viewMode === BodyRowComponentViewMode.common)
            && fontSettings
        ) {
            this.updateAlignment(this.containerElement, fontSettings.alignment, fontSettings.verticalAlignment);
        } else {
            this.updateAlignment(this.containerElement, undefined, undefined);
        }

        options.series.children.forEach((childSeries: IDataRepresentationSeries, childSeriesIndex: number) => {
            const component: BodyRowComponent
                = this.components[childSeriesIndex + cellConstructors.length + this.amountOfSubRows] as BodyRowComponent;

            if (component) {
                component.render({
                    hyperlinkAdapter: options.hyperlinkAdapter,
                    metadata: options.metadata,
                    originRowStateSet,
                    rowStateSet: rowState && rowState.rowSet,
                    series: childSeries,
                    seriesDeep,
                    seriesSettings: options.seriesSettings,
                    settings: options.settings,
                    type: options.type,
                    viewport,
                    y: options.y,
                });
            }
        });
    }

    private applyContainerClassName(isContainer: boolean = true): void {
        if (!this.containerElement) {
            return;
        }

        this.containerElement.classed(this.rootContainerClassName, isContainer);
    }

    private getContainerState(cellsLength: number): IRowState {
        const cells: ICellState[] = this.components
            .slice(0, cellsLength)
            .map((component: CellComponent) => {
                return component.getState();
            });

        const rowSet: IRowStateSet = {};

        this.components
            .slice(cellsLength)
            .forEach((component: BodyRowComponent) => {
                const state: IRowState = component.getState();

                rowSet[state.name] = state;
            });

        return {
            cellSet: { [this.tableType]: cells },
            isShown: this.isContainerShown,
            name: this.name,
            rowSet,
        };
    }

    private updateContainerVisibility(
        originalVisibilities: boolean[],
        componentVisibilities: boolean[],
        cellsLength: number,
    ): void {
        this.updateVisibilityOfComponents(
            originalVisibilities,
            this.components.slice(0, cellsLength),
            this.verticalDraggableComponents);

        this.components
            .slice(cellsLength)
            .forEach((component: BodyRowComponent) => {
                if (component && component.updateVisibility) {
                    component.updateVisibility(componentVisibilities);
                }
            });
    }

    private setViewMode(viewMode: BodyRowComponentViewMode): void {
        if (viewMode === this.viewMode) {
            return;
        }

        this.viewMode = viewMode;

        this.destroyComponents();
    }

    private getWidthOfChildren(): number {
        return this.components.reduce((width: number, rowComponent: RowComponent) => {
            if (rowComponent && rowComponent.isShown && rowComponent.getWidth) {
                return Math.max(width, rowComponent.getWidth());
            }

            return width;
        }, 0);
    }

    private getHeightOfChildren(shouldConsiderSplitter: boolean = false): number {
        return this.components
            .filter((component: BaseBodyRowComponent) => {
                return component
                    && (component instanceof BaseBodyRowComponent)
                    && component.isShown
                    && component.getHeight;
            })
            .reduce((
                height: number,
                component: BodyRowComponent,
                componentIndex: number,
                components: BaseBodyRowComponent[],
            ) => {
                return height + component.getHeight(componentIndex !== components.length - 1 || shouldConsiderSplitter);
            }, 0);
    }

    private changeContainerStateAndKeepState(state: boolean): void {
        this.changeContainerState(state);

        this.onChildrenSizeChange();

        if (this.options) {
            this.options.onSaveState();
        }
    }

    private changeContainerState(state: boolean): void {
        if (!this.components || this.isContainerShown === state) {
            return;
        }

        const cellConstructors = this.viewMode === BodyRowComponentViewMode.tabular
            ? this.tabularViewCellConstructors
            : [];

        this.changeComponentsState(
            this.components.slice(cellConstructors.length, cellConstructors.length + this.amountOfSubRows),
            !state,
        );

        this.changeComponentsState(
            this.components.slice(cellConstructors.length + this.amountOfSubRows),
            state,
        );

        this.isContainerShown = state;
    }

    private changeComponentsState(components: IVisualComponent[], state: boolean) {
        components.forEach((component: IVisualComponent) => {
            if (component) {
                if (state) {
                    component.show();
                } else {
                    component.hide();
                }
            }
        });
    }

    private renderCells(options: IBodyRowRenderOptions): void {
        const {
            y,
            series,
            settings,
            hyperlinkAdapter,
            type,
            metadata,
            viewport,
        } = options;

        // As of Date's formatter
        const asOfDateFormatter: valueFormatter.IValueFormatter = FormattingUtils.getFormatterOfAxisValue(
            series.x.min,
            series.x.max,
            type,
            metadata,
            series.settings.asOfDate);

        // As of Date
        const formattedValue: string = series.axisValue === undefined
            ? ""
            : asOfDateFormatter.format(series.axisValue);

        this.components[0].render({
            fontSettings: series.settings.asOfDate,
            order: settings.asOfDate.order,
            value: formattedValue,
        } as ITextCellRenderOptions);

        this.verticalDraggableComponents[0].updateOrder(settings.asOfDate.order);

        // Metric Name
        this.components[1].render({
            fontSettings: series.settings.metricName,
            hyperlink: series.hyperlink,
            hyperlinkAdapter,
            image: series.image,
            order: settings.metricName.order,
            value: series.name,
        } as ITextCellRenderOptions);

        this.verticalDraggableComponents[1].updateOrder(settings.metricName.order);

        // Current Value
        this.components[2].render({
            fontSettings: series.settings.currentValue,
            order: settings.currentValue.order,
            value: this.getFormattedValueBySettings(series.currentValue, series.settings.currentValue),
        } as ITextCellRenderOptions);

        this.verticalDraggableComponents[2].updateOrder(settings.currentValue.order);

        // KPI Indicator
        this.components[3].render({
            fontSettings: series.settings.kpiIndicatorValue,
            kpiIndicatorIndex: series.kpiIndicatorIndex,
            kpiIndicatorSettings: series.settings.kpiIndicator,
            order: settings.kpiIndicatorValue.order,
            value: this.getFormattedValueBySettings(series.kpiIndicatorValue, series.settings.kpiIndicatorValue),
        } as IKPIIndicatorCellRenderOptions);

        this.verticalDraggableComponents[3].updateOrder(settings.kpiIndicatorValue.order);

        // Comparison Value
        this.components[4].render({
            fontSettings: series.settings.comparisonValue,
            order: settings.comparisonValue.order,
            value: this.getFormattedValueBySettings(series.comparisonValue, series.settings.comparisonValue),
        } as ITextCellRenderOptions);

        this.verticalDraggableComponents[4].updateOrder(settings.comparisonValue.order);

        const sparklineCellRenderOptions: ISparklineCellRenderOptions = {
            kpiIndicatorIndex: series.kpiIndicatorIndex,
            kpiIndicatorSettings: settings.kpiIndicator,
            metadata,
            offset: settings.sparklineSettings.getOffset(),
            order: settings.sparklineSettings.order,
            series,
            settings,
            viewport,
            y,
        };

        // Sparkline
        this.components[5].render(sparklineCellRenderOptions);

        this.verticalDraggableComponents[5].updateOrder(settings.sparklineSettings.order);

        this.bindClickEventToOpenModalWindow(sparklineCellRenderOptions);

        this.components[6].render({
            fontSettings: series.settings.secondComparisonValue,
            order: settings.secondComparisonValue.order,
            value: this.getFormattedValueBySettings(series.secondComparisonValue, series.settings.secondComparisonValue),
        } as ITextCellRenderOptions);

        this.verticalDraggableComponents[6].updateOrder(settings.secondComparisonValue.order);

        this.components[7].render({
            fontSettings: series.settings.secondKPIIndicatorValue,
            order: settings.secondKPIIndicatorValue.order,
            value: this.getFormattedValueBySettings(series.secondKPIIndicatorValue, series.settings.secondKPIIndicatorValue),
        } as ITextCellRenderOptions);

        this.verticalDraggableComponents[7].updateOrder(settings.secondKPIIndicatorValue.order);
    }

    private getFormattedValueBySettings(value: number, settings: NumberSettingsBase): string {
        if (settings.textReplacement) {
            return settings.textReplacement;
        } else {
            const currentValueFormatter: valueFormatter.IValueFormatter = FormattingUtils.getValueFormatter(
                settings.displayUnits || value || 0,
                undefined,
                undefined,
                settings.precision,
                settings.getFormat(),
            );

            return FormattingUtils.getFormattedValue(value, currentValueFormatter);
        }
    }
}

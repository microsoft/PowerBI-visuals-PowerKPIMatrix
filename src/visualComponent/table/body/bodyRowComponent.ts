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

export class BodyRowComponent extends BaseBodyRowComponent {
    private isContainerShown: boolean = true;

    private viewMode: BodyRowComponentViewMode = BodyRowComponentViewMode.common;

    private bodyRowComponentClickActionClassName: string = "bodyRowComponent_clickAction";

    private amountOfSubRows: number = 1;

    private powerKPIModalWindowService: ModalWindowService;
    private powerKPIModalWindowServiceRenderData: SparklineCellRenderOptions;

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

    constructor(options: BodyRowConstructorOptions) {
        super(options);

        this.cellOptions.onChangeHandler = this.changeContainerStateAndKeepState.bind(this);
        this.powerKPIModalWindowService = options.powerKPIModalWindowService;
    }



    public render(options: BodyRowRenderOptions): void {
        const {
            series,
            settings,
            rowStateSet,
            originRowStateSet,
        } = options;

        this.name = series.name;
        this.level = series.level;
        this.tableType = settings.table.type;

        const rowState: RowState =
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
                0
            );

            this.verticalDraggableComponents.forEach((component: DraggableComponent) => {
                this.updateComponentOrder(component, 0);
            });

            this.updateContainerGrid(this.tableType === TableType.RowBasedKPIS
                ? settings.horizontalGrid
                : settings.verticalGrid
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

    public getState(): RowState {
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

    private bindClickEventToOpenModalWindow(data: SparklineCellRenderOptions): void {
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
                : null
            )
            .classed(this.bodyRowComponentClickActionClassName, isInteractable);

        if (this.powerKPIModalWindowService && this.powerKPIModalWindowService.isShown) {
            const currentData: SparklineCellRenderOptions =
                this.powerKPIModalWindowService.getRenderOptions() as SparklineCellRenderOptions;

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

        this.containerElement.style({
            "border-bottom": this.tableType === TableType.RowBasedKPIS
                ? border
                : null,
            "border-right": this.tableType === TableType.ColumnBasedKPIS
                ? border
                : null,
        });
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
        amountOfComponents: number
    ): void {
        this.components
            .splice(preComponentsLength + amountOfComponents)
            .forEach((component: VisualComponent) => {
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
        options: BodyRowRenderOptions,
        cellConstructors: any[],
        isContainerShown: boolean,
        rowState: RowState,
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
                this.cellOptions);

            this.initSubRows(
                cellsLength,
                CollapsedBodyRowComponent,
                this.amountOfSubRows
            );

            this.initSubRows(
                this.amountOfSubRows + cellsLength,
                BodyRowComponent,
                options.series.children.length
            );
        }

        const category: GeneratedCategory = SettingsBase.getCategoryByIndex(series.level);

        const fontSettings: CategorySettings = settings[category.name] || settings.metricName;

        this.components[collapserIndex].render({
            fontSettings,
            hyperlinkAdapter,
            image: series.image,
            value: series.name,
            order: collapserOrder,
            isShown: isContainerShown,
            isExpandCollapseShown: fontSettings.isExpandCollapseShown,
            hyperlink: series.hyperlink,
        } as CollapserCellRenderOptions);

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
            const component: BodyRowComponent = this.components[childSeriesIndex + cellConstructors.length + this.amountOfSubRows] as BodyRowComponent;

            if (component) {
                component.render({
                    viewport,
                    seriesDeep,
                    originRowStateSet,
                    y: options.y,
                    type: options.type,
                    series: childSeries,
                    metadata: options.metadata,
                    settings: options.settings,
                    seriesSettings: options.seriesSettings,
                    rowStateSet: rowState && rowState.rowSet,
                    hyperlinkAdapter: options.hyperlinkAdapter,
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

    private getContainerState(cellsLength: number): RowState {
        const cells: CellState[] = this.components
            .slice(0, cellsLength)
            .map((component: CellComponent) => {
                return component.getState();
            });

        const rowSet: RowStateSet = {};

        this.components
            .slice(cellsLength)
            .forEach((component: BodyRowComponent) => {
                const state: RowState = component.getState();

                rowSet[state.name] = state;
            });

        return {
            cellSet: { [this.tableType]: cells },
            rowSet,
            name: this.name,
            isShown: this.isContainerShown,
        };
    }

    private updateContainerVisibility(
        originalVisibilities: boolean[],
        componentVisibilities: boolean[],
        cellsLength: number
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
                components: BaseBodyRowComponent[]
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

        let cellConstructors = this.viewMode === BodyRowComponentViewMode.tabular
            ? this.tabularViewCellConstructors
            : [];

        this.changeComponentsState(
            this.components.slice(cellConstructors.length, cellConstructors.length + this.amountOfSubRows),
            !state
        );

        this.changeComponentsState(
            this.components.slice(cellConstructors.length + this.amountOfSubRows),
            state
        );

        this.isContainerShown = state;
    }

    private changeComponentsState(components: VisualComponent[], state: boolean) {
        components.forEach((component: VisualComponent) => {
            if (component) {
                if (state) {
                    component.show();
                } else {
                    component.hide();
                }
            }
        });
    }

    private renderCells(options: BodyRowRenderOptions): void {
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
        const asOfDateFormatter: IValueFormatter = FormattingUtils.getFormatterOfAxisValue(
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
            value: formattedValue,
            order: settings.asOfDate.order,
            fontSettings: series.settings.asOfDate,
        } as TextCellRenderOptions);

        this.verticalDraggableComponents[0].updateOrder(settings.asOfDate.order);

        // Metric Name
        this.components[1].render({
            hyperlinkAdapter,
            image: series.image,
            value: series.name,
            hyperlink: series.hyperlink,
            order: settings.metricName.order,
            fontSettings: series.settings.metricName,
        } as TextCellRenderOptions);

        this.verticalDraggableComponents[1].updateOrder(settings.metricName.order);

        // Current Value
        this.components[2].render({
            order: settings.currentValue.order,
            fontSettings: series.settings.currentValue,
            value: this.getFormattedValueBySettings(series.currentValue, series.settings.currentValue),
        } as TextCellRenderOptions);

        this.verticalDraggableComponents[2].updateOrder(settings.currentValue.order);

        // KPI Indicator
        this.components[3].render({
            order: settings.kpiIndicatorValue.order,
            kpiIndicatorIndex: series.kpiIndicatorIndex,
            kpiIndicatorSettings: series.settings.kpiIndicator,
            value: this.getFormattedValueBySettings(series.kpiIndicatorValue, series.settings.kpiIndicatorValue),
            fontSettings: series.settings.kpiIndicatorValue,
        } as KPIIndicatorCellRenderOptions);

        this.verticalDraggableComponents[3].updateOrder(settings.kpiIndicatorValue.order);

        // Comparison Value
        this.components[4].render({
            order: settings.comparisonValue.order,
            fontSettings: series.settings.comparisonValue,
            value: this.getFormattedValueBySettings(series.comparisonValue, series.settings.comparisonValue),
        } as TextCellRenderOptions);

        this.verticalDraggableComponents[4].updateOrder(settings.comparisonValue.order);

        const sparklineCellRenderOptions: SparklineCellRenderOptions = {
            y,
            series,
            settings,
            metadata,
            viewport,
            order: settings.sparklineSettings.order,
            kpiIndicatorIndex: series.kpiIndicatorIndex,
            kpiIndicatorSettings: settings.kpiIndicator,
            offset: settings.sparklineSettings.getOffset(),
        };

        // Sparkline
        this.components[5].render(sparklineCellRenderOptions);

        this.verticalDraggableComponents[5].updateOrder(settings.sparklineSettings.order);

        this.bindClickEventToOpenModalWindow(sparklineCellRenderOptions);

        this.components[6].render({
            order: settings.secondComparisonValue.order,
            fontSettings: series.settings.secondComparisonValue,
            value: this.getFormattedValueBySettings(series.secondComparisonValue, series.settings.secondComparisonValue),
        } as TextCellRenderOptions);

        this.verticalDraggableComponents[6].updateOrder(settings.secondComparisonValue.order);

        this.components[7].render({
            order: settings.secondKPIIndicatorValue.order,
            fontSettings: series.settings.secondKPIIndicatorValue,
            value: this.getFormattedValueBySettings(series.secondKPIIndicatorValue, series.settings.secondKPIIndicatorValue),
        } as TextCellRenderOptions);

        this.verticalDraggableComponents[7].updateOrder(settings.secondKPIIndicatorValue.order);
    }

    private getFormattedValueBySettings(value: number, settings: NumberSettingsBase): string {
        if (settings.textReplacement) {
            return settings.textReplacement;
        } else {
            const currentValueFormatter: IValueFormatter = FormattingUtils.getValueFormatter(
                settings.displayUnits || value || 0,
                undefined,
                undefined,
                settings.precision,
                settings.getFormat()
            );

            return FormattingUtils.getFormattedValue(value, currentValueFormatter);
        }
    }
}

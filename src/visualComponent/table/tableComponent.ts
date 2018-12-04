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

export class TableComponent extends TableBaseComponent {
    private className: string = "tableComponent";
    private columnClassName: string = "tableComponent_column";
    private rowClassName: string = "tableComponent_row";

    private defaultMargin: number = 0;

    private stateService: StateService;

    private headerRowComponent: HeaderRowComponent;
    private bodyComponent: BodyComponent;

    constructor(options: VisualComponentConstructorOptions) {
        super();

        this.element = options.element
            .append("div")
            .classed(this.className, true);

        this.stateService = options.stateService;

        const headerRowComponent: HeaderRowComponent = new HeaderRowComponent({
            element: this.element,
            defaultMargin: this.defaultMargin,
            scaleService: options.scaleService,
            stateService: options.stateService,
            onCellSizeChange: this.updateSizeOfCellByIndex.bind(this),
            onSaveState: this.onSaveState.bind(this),
        });

        const bodyComponent: BodyComponent = new BodyComponent({
            element: this.element,
            scaleService: options.scaleService,
            stateService: options.stateService,
            defaultMargin: this.defaultMargin,
            onCellSizeChange: this.updateSizeOfCellByIndex.bind(this),
            powerKPIModalWindowService: options.powerKPIModalWindowService,
            onScroll: (headerRowComponent as HeaderRowComponent)
                .scrollTo
                .bind(headerRowComponent),
            getCellStates: () => {
                return (headerRowComponent as RowComponent).getState().cellSet[this.tableType];
            },
            onSaveState: this.onSaveState.bind(this),
        });

        this.headerRowComponent = headerRowComponent;
        this.bodyComponent = bodyComponent;

        this.components = [
            headerRowComponent,
            bodyComponent,
        ];
    }

    private onSaveState(): void {
        this.stateService.states.table.set(this.getState());
        this.stateService.save();
    }

    public render(options: VisualComponentRenderOptions): void {
        const {
            settings,
            settings: {
                table: {
                    type
                }
            },
            data: {
                seriesDeep
            }
        } = options;

        if (this.tableType !== type) {
            this.components.forEach((component: VisualComponent) => {
                if (component && component.resetScroll) {
                    component.resetScroll();
                }
            });
        }

        this.tableType = type;

        const extendedOptions: HeaderRowRenderOptions = options as HeaderRowRenderOptions;

        const columnNames: string[] = [];
        const columnOrders: number[] = [];
        const visibilities: boolean[] = [];

        for (let index: number = 0; index < seriesDeep - 1; index++) {
            const category: GeneratedCategory = SettingsBase.getCategoryByIndex(index);

            const categorySettings: FontSettings = settings[category.name];

            if (categorySettings) {
                columnNames.push(categorySettings.label);
                visibilities.push(categorySettings.show);
                columnOrders.push(categorySettings.order);
            }
        }

        [
            settings.asOfDate,
            settings.metricName,
            settings.currentValue,
            settings.kpiIndicatorValue,
            settings.comparisonValue,
            settings.sparklineSettings,
            settings.secondComparisonValue,
            settings.secondKPIIndicatorValue,
        ].forEach((particularSettings: LabelSettings) => {
            visibilities.push(particularSettings.show);
            columnNames.push(particularSettings.label);
            columnOrders.push(particularSettings.order);
        });

        extendedOptions.columnNames = columnNames;
        extendedOptions.columnOrders = columnOrders;

        this.updateTableType();

        super.render(extendedOptions);

        this.updateVisibility(visibilities);

        this.synchronizeCellWidth();
    }

    /**
     * This method allow us to synchronize widths of header and body rows.
     * TODO: Let's revisit it later in order to make a better solution
     */
    private synchronizeCellWidth(): void {
        if (!this.headerRowComponent || !this.bodyComponent) {
            return;
        }

        const headerState: RowState = this.headerRowComponent.getState();

        if (!headerState
            || !headerState.cellSet
            || !headerState.cellSet[this.tableType]
            || !headerState.cellSet[this.tableType].length
        ) {
            return;
        }

        headerState.cellSet[this.tableType].forEach((cellState: CellState, cellIndex: number) => {
            if (cellState) {
                const width: number = this.tableType === TableType.RowBasedKPIS
                    ? cellState.width
                    : undefined;

                const height: number = this.tableType === TableType.ColumnBasedKPIS
                    ? cellState.height
                    : undefined;

                this.bodyComponent.updateSizeOfCellByIndex(width, height, cellIndex);
            }
        });
    }

    private updateTableType(): void {
        if (!this.element) {
            return;
        }

        this.element
            .classed(this.columnClassName, this.tableType === TableType.ColumnBasedKPIS)
            .classed(this.rowClassName, this.tableType === TableType.RowBasedKPIS);
    }

    public destroy(): void {
        this.headerRowComponent = null;
        this.bodyComponent = null;

        super.destroy();
    }
}

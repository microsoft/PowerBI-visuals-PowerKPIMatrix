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
    export class CollapsedBodyRowComponent extends BaseBodyRowComponent {
        private emptyCellConstructor = CellComponent;
        private amountOfPreCells: number = 0;

        private cellConstructors = [
            CellComponent, // As of Date
            TextCellComponent, // Metric Name
            TextCellComponent, // Current Value
            CellComponent, // KPI Indicator
            TextCellComponent, // Comparison Value
            CellComponent, // Sparkline
            TextCellComponent, // Second Comparison Value
            TextCellComponent, // Second KPI Indicator Value
        ];

        constructor(options: BodyRowConstructorOptions) {
            super(options);

            this.name = "__##__collapsedBodyRowComponent__##__"; // Don't change this value. This value is used for state mapping

            this.hide(); // This component must be hidden by default
        }

        private getCellConstructors(amountOfPreCells: number) {
            const cellConstructors = [];

            for (let i: number = 0; i < amountOfPreCells; i++) {
                cellConstructors.push(this.emptyCellConstructor);
            }

            return cellConstructors.concat(this.cellConstructors);
        }

        public render(options: BodyRowRenderOptions): void {
            const {
                series,
                settings,
                seriesDeep,
                rowStateSet,
                originRowStateSet,
            } = options;

            this.tableType = settings.table.type;

            this.level = series.level + 1;

            const rowState: RowState =
                (rowStateSet
                    && rowStateSet[series.name]
                    && rowStateSet[series.name].rowSet
                    && rowStateSet[series.name].rowSet[this.name]
                )
                ||
                (originRowStateSet
                    && originRowStateSet[series.name]
                    && originRowStateSet[series.name].rowSet
                    && originRowStateSet[series.name].rowSet[this.name]
                );

            const amountOfPreCells: number = seriesDeep - this.level - 1;

            if (this.amountOfPreCells !== amountOfPreCells || !this.components.length) {
                this.destroyComponents();

                this.initCells(
                    this.getCellConstructors(amountOfPreCells),
                    this.bodyOptions,
                    this.cellOptions);

                this.initHorizontalDraggableComponent(this.options);
            }

            this.amountOfPreCells = amountOfPreCells;

            this.renderCells(options);

            this.updateClassNamesBasedOnViewMode(BodyRowComponentViewMode.common);

            this.updateGrid(settings.horizontalGrid, settings.verticalGrid);

            this.applyState(rowState);
        }

        private renderCells(options: BodyRowRenderOptions): void {
            const {
                series,
                settings,
            } = options;

            // As of Date
            this.updateOrderByIndex(0, settings.asOfDate.order);

            // Metric Name
            const metricNameOrder: number = this.getOrder(settings.metricName.order);

            this.components[this.amountOfPreCells + 1].render({
                order: metricNameOrder,
                value: this.getLabel(series),
                fontSettings: settings.metricName,
            } as TextCellRenderOptions);

            this.verticalDraggableComponents[this.amountOfPreCells + 1].updateOrder(metricNameOrder);

            // Current Value's formatter
            const currentValueFormatter: IValueFormatter = FormattingUtils.getValueFormatter(
                settings.currentValue.displayUnits || series.currentValue || 0,
                undefined,
                undefined,
                settings.currentValue.precision,
                settings.currentValue.getFormat()
            );

            // Current Value
            const currentValueOrder: number = this.getOrder(settings.currentValue.order);

            this.components[this.amountOfPreCells + 2].render({
                order: currentValueOrder,
                fontSettings: settings.currentValue,
                value: FormattingUtils.getFormattedValue(series.currentValue, currentValueFormatter),
            } as TextCellRenderOptions);

            this.verticalDraggableComponents[this.amountOfPreCells + 2].updateOrder(currentValueOrder);

            // KPI Indicator
            this.updateOrderByIndex(3, settings.kpiIndicatorValue.order);

            // Comparison Value's formatter
            const comparisonValueFormatter: IValueFormatter = FormattingUtils.getValueFormatter(
                settings.comparisonValue.displayUnits || series.comparisonValue || 0,
                undefined,
                undefined,
                settings.comparisonValue.precision,
                settings.comparisonValue.getFormat()
            );

            // Comparison Value
            const comparisonValueOrder: number = this.getOrder(settings.comparisonValue.order);

            this.components[this.amountOfPreCells + 4].render({
                order: comparisonValueOrder,
                fontSettings: settings.comparisonValue,
                value: FormattingUtils.getFormattedValue(series.comparisonValue, comparisonValueFormatter),
            } as TextCellRenderOptions);

            this.verticalDraggableComponents[this.amountOfPreCells + 4].updateOrder(comparisonValueOrder);

            // Sparkline
            this.updateOrderByIndex(5, settings.sparklineSettings.order);

            // Second Comparison Value's formatter
            const secondComparisonValueFormatter: IValueFormatter = FormattingUtils.getValueFormatter(
                settings.secondComparisonValue.displayUnits || series.secondComparisonValue || 0,
                undefined,
                undefined,
                settings.secondComparisonValue.precision,
                settings.secondComparisonValue.getFormat()
            );

            // Second Comparison Value
            const secondComparisonValueOrder: number = this.getOrder(settings.secondComparisonValue.order);

            this.components[this.amountOfPreCells + 6].render({
                order: secondComparisonValueOrder,
                fontSettings: settings.secondComparisonValue,
                value: FormattingUtils.getFormattedValue(series.secondComparisonValue, secondComparisonValueFormatter),
            } as TextCellRenderOptions);

            this.verticalDraggableComponents[this.amountOfPreCells + 6].updateOrder(secondComparisonValueOrder);

            this.updateOrderByIndex(7, settings.secondKPIIndicatorValue.order);
        }

        private getOrder(order: number): number {
            return this.amountOfPreCells + order;
        }

        private updateOrderByIndex(index: number, order: number): void {
            const componentIndex: number = this.amountOfPreCells + index;
            const componentOrder: number = this.getOrder(order);

            this.components[componentIndex].updateOrder(componentOrder);
            this.verticalDraggableComponents[componentIndex].updateOrder(componentOrder);
        }

        private getLabel(series: DataRepresentationSeries): string {
            const amountOfHiddenItems: number = series.children.length;

            const amountOfHiddenSubCategories: number = series.children
                .reduce((currentAmount: number, currentSeries: DataRepresentationSeries) => {
                    return currentAmount + currentSeries.children.length;
                }, 0);

            return amountOfHiddenSubCategories
                ? `${amountOfHiddenSubCategories} Items hidden across ${amountOfHiddenItems} subcategories`
                : `${amountOfHiddenItems} Items hidden`;
        }

    }
}
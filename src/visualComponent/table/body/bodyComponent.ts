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
    export class BodyComponent extends TableBaseComponent {
        private className: string = "bodyComponent";

        private getCellStatesHandler: () => CellState[];

        private onSaveState: () => void;
        private onCellSizeChange: OnCellSizeChangeHandler;

        private scaleService: ScaleService;
        private stateService: StateService;

        private powerKPIModalWindowService: ModalWindowService;

        private defaultMargin: number;

        constructor(options: BodyConstructorOptions) {
            super();

            this.getCellStatesHandler = options.getCellStates;

            this.onSaveState = options.onSaveState;
            this.onCellSizeChange = options.onCellSizeChange;
            this.powerKPIModalWindowService = options.powerKPIModalWindowService;

            this.scaleService = options.scaleService;
            this.stateService = options.stateService;

            this.defaultMargin = options.defaultMargin;

            this.element = options.element
                .append("div")
                .classed(this.className, true)
                .on("scroll", options.onScroll
                    ? () => {
                        const element: HTMLDivElement = d3.event.target as HTMLDivElement;

                        options.onScroll(
                            element.scrollLeft,
                            element.scrollTop,
                            element.offsetWidth - element.clientWidth,
                            element.offsetHeight - element.clientHeight);
                    }
                    : null
                );

            this.components = [];
        }

        public render(options: VisualComponentRenderOptions) {
            const {
                settings,
                data: {
                    y,
                    seriesArray,
                    seriesDeep,
                    type,
                    metadata,
                },
                hyperlinkAdapter,
            } = options;

            this.components
                .splice(seriesArray.length)
                .forEach((component: VisualComponent) => {
                    component.clear();
                    component.destroy();
                });

            if (this.components.length < seriesArray.length) {
                for (let index: number = this.components.length; index < seriesArray.length; index++) {
                    this.components.push(new BodyRowComponent({
                        element: this.element,
                        onSaveState: this.onSaveState,
                        scaleService: this.scaleService,
                        stateService: this.stateService,
                        defaultMargin: this.defaultMargin,
                        onCellSizeChange: this.onCellSizeChange,
                        powerKPIModalWindowService: this.powerKPIModalWindowService,
                        cellStates: this.getCellStatesHandler && this.getCellStatesHandler() || [],
                    }));
                }
            }

            const rowStateSet: RowStateSet = this.stateService.states.table.getRowStateSet();

            seriesArray.forEach((series: DataRepresentationSeries, rowIndex: number) => {
                const rowRenderOptions: BodyRowRenderOptions = {
                    y,
                    type,
                    series,
                    metadata,
                    settings,
                    seriesDeep,
                    rowStateSet,
                    hyperlinkAdapter,
                    viewport: options.viewport,
                    originRowStateSet: rowStateSet,
                    seriesSettings: series.settings,
                };

                this.components[rowIndex].render(rowRenderOptions);
            });
        }

        public resetScroll(): void {
            ScrollUtils.resetScroll(this.element);
        }
    }
}
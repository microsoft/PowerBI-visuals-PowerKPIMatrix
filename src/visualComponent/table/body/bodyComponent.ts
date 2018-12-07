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

import { TableBaseComponent } from "../tableBaseComponent";

import { ICellState } from "../cell/cellState";
import { OnCellSizeChangeHandler } from "../row/rowComponentConstructorOptions";
import { IRowStateSet } from "../row/rowState";

import { ModalWindowService } from "../../../services/modalWindowService";
import { ScaleService } from "../../../services/scaleService";
import { StateService } from "../../../services/state/stateService";

import { IVisualComponent } from "../../visualComponent";
import { IVisualComponentRenderOptions } from "../../visualComponentRenderOptions";
import { IBodyConstructorOptions } from "./bodyConstructorOptions";
import { BodyRowComponent } from "./bodyRowComponent";
import { IBodyRowRenderOptions } from "./bodyRowRenderOptions";

import { IDataRepresentationSeries } from "../../../converter/data/dataRepresentation/dataRepresentationSeries";

import { ScrollUtils } from "../../../utils/scrollUtils";

export class BodyComponent extends TableBaseComponent {
    private className: string = "bodyComponent";

    private getCellStatesHandler: () => ICellState[];

    private onSaveState: () => void;
    private onCellSizeChange: OnCellSizeChangeHandler;

    private scaleService: ScaleService;
    private stateService: StateService;

    private powerKPIModalWindowService: ModalWindowService;

    private defaultMargin: number;

    constructor(options: IBodyConstructorOptions) {
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
                    const element: HTMLDivElement = require("d3").event.target as HTMLDivElement;

                    options.onScroll(
                        element.scrollLeft,
                        element.scrollTop,
                        element.offsetWidth - element.clientWidth,
                        element.offsetHeight - element.clientHeight);
                }
                : null,
            );

        this.components = [];
    }

    public render(options: IVisualComponentRenderOptions) {
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
            .forEach((component: IVisualComponent) => {
                component.clear();
                component.destroy();
            });

        if (this.components.length < seriesArray.length) {
            for (let index: number = this.components.length; index < seriesArray.length; index++) {
                this.components.push(new BodyRowComponent({
                    cellStates: this.getCellStatesHandler && this.getCellStatesHandler() || [],
                    defaultMargin: this.defaultMargin,
                    element: this.element,
                    onCellSizeChange: this.onCellSizeChange,
                    onSaveState: this.onSaveState,
                    powerKPIModalWindowService: this.powerKPIModalWindowService,
                    scaleService: this.scaleService,
                    stateService: this.stateService,
                }));
            }
        }

        const rowStateSet: IRowStateSet = this.stateService.states.table.getRowStateSet();

        seriesArray.forEach((series: IDataRepresentationSeries, rowIndex: number) => {
            const rowRenderOptions: IBodyRowRenderOptions = {
                hyperlinkAdapter,
                metadata,
                originRowStateSet: rowStateSet,
                rowStateSet,
                series,
                seriesDeep,
                seriesSettings: series.settings,
                settings,
                type,
                viewport: options.viewport,
                y,
            };

            this.components[rowIndex].render(rowRenderOptions);
        });
    }

    public resetScroll(): void {
        ScrollUtils.resetScroll(this.element);
    }
}

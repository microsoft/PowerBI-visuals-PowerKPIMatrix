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

import {
    drag as d3Drag,
    DragBehavior,
} from "d3-drag";

import powerbi from "powerbi-visuals-api";

import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { BaseComponent } from "../../baseComponent";
import { IVisualComponentRenderOptions } from "../../visualComponentRenderOptions";
import { ICellState } from "../cell/cellState";

import {
    IDraggableConstructorOptions,
    IPoint,
} from "./draggableConstructorOptions";

export class DraggableComponent extends BaseComponent {

    private className: string = "draggableComponent";

    private width: number;
    private height: number;

    constructor(options: IDraggableConstructorOptions) {
        super();

        this.width = options.width || 0;
        this.height = options.height || 0;

        const drag: DragBehavior<any, any, any> = d3Drag()
            .subject(() => {
                const point: IPoint = options.onDragStart
                    ? options.onDragStart()
                    : { x: 0, y: 0 };

                const scale: powerbi.IViewport = options.scaleService.getScale();

                point.x *= scale.width;
                point.y *= scale.height;

                return point;
            })
            .on("start", () => {
                // We should stop propagation of this event in order to stop moving entire custom visual
                this.stopEventPropagation(require("d3").event.sourceEvent);
            })
            .on("drag", options.onDrag
                ? () => {
                    const event: MouseEvent = require("d3").event;

                    const scale: powerbi.IViewport = options.scaleService.getScale();

                    options.onDrag(
                        event.x / scale.width,
                        event.y / scale.height,
                    );
                }
                : null,
            )
            .on("end", options.onSaveState || null);

        this.element = options.element
            .append("div")
            .classed(this.className, true)
            .on("pointerdown", () => { // We should stop propagation of this event in order to stop moving entire custom visual
                this.stopEventPropagation(require("d3").event);
            })
            .on("click", () => {
                this.stopEventPropagation(require("d3").event);
            })
            .call(drag);

        this.updateSize(options.width, options.height);
    }

    public getState(): ICellState {
        return {
            height: this.height,
            width: this.width,
        };
    }

    public updateSize(width: number, height: number, shouldKeepCurrentSize: boolean = false): void {
        if (!this.element) {
            return;
        }

        let widthInPx: string = null;
        let heightInPx: string = null;

        if (!isNaN(width) && isFinite(width)) {
            this.width = width;

            widthInPx = pixelConverter.toString(width);
        } else if (shouldKeepCurrentSize) {
            widthInPx = pixelConverter.toString(this.width);
        }

        if (!isNaN(height) && isFinite(height)) {
            this.height = height;

            heightInPx = pixelConverter.toString(height);
        } else if (shouldKeepCurrentSize) {
            heightInPx = pixelConverter.toString(this.height);
        }

        this.element
            .style("width", widthInPx)
            .style("min-width", widthInPx)
            .style("max-width", widthInPx)
            .style("height", heightInPx)
            .style("min-height", heightInPx)
            .style("max-height", heightInPx);
    }

    public updateColor(color: string): void {
        if (!this.element) {
            return;
        }

        this.element.style("background-color", color || null);
    }

    public render(options: IVisualComponentRenderOptions) {
        // No need to render
    }

    private stopEventPropagation(event: Event): void {
        if (!event || !event.stopPropagation) {
            return;
        }

        event.stopPropagation();
    }
}

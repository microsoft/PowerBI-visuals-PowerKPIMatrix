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

namespace powerbi.extensibility.visual {
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi
    import IViewport = powerbi.IViewport;

    export class DraggableComponent extends BaseComponent {

        private className: string = "draggableComponent";

        private width: number;
        private height: number;

        constructor(options: DraggableConstructorOptions) {
            super();

            this.width = options.width || 0;
            this.height = options.height || 0;

            const drag: d3.behavior.Drag<any> = d3.behavior.drag()
                .origin(() => {
                    const point = options.onDragStart
                        ? options.onDragStart()
                        : { x: 0, y: 0 };

                    const scale: IViewport = options.scaleService.getScale();

                    point.x *= scale.width;
                    point.y *= scale.height;

                    return point;
                })
                .on("dragstart", () => {
                    this.stopEventPropagation((d3.event as d3.DragEvent).sourceEvent); // We should stop propagation of this event in order to stop moving entire custom visual
                })
                .on("drag", options.onDrag
                    ? () => {
                        const event: d3.DragEvent = d3.event as d3.DragEvent;

                        const scale: IViewport = options.scaleService.getScale();

                        options.onDrag(
                            event.x / scale.width,
                            event.y / scale.height
                        );
                    }
                    : null
                )
                .on("dragend", options.onSaveState || null);

            this.element = options.element
                .append("div")
                .classed(this.className, true)
                .on("pointerdown", () => { // We should stop propagation of this event in order to stop moving entire custom visual
                    this.stopEventPropagation(d3.event as Event);
                })
                .on("click", () => {
                    this.stopEventPropagation(d3.event as Event);
                })
                .call(drag);

            this.updateSize(options.width, options.height);
        }

        private stopEventPropagation(event: Event): void {
            if (!event || !event.stopPropagation) {
                return;
            }

            event.stopPropagation();
        }

        public getState(): CellState {
            return {
                width: this.width,
                height: this.height,
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

                widthInPx = PixelConverter.toString(width);
            } else if (shouldKeepCurrentSize) {
                widthInPx = PixelConverter.toString(this.width);
            }

            if (!isNaN(height) && isFinite(height)) {
                this.height = height;

                heightInPx = PixelConverter.toString(height);
            } else if (shouldKeepCurrentSize) {
                heightInPx = PixelConverter.toString(this.height);
            }

            this.element.style({
                "width": widthInPx,
                "min-width": widthInPx,
                "max-width": widthInPx,
                "height": heightInPx,
                "min-height": heightInPx,
                "max-height": heightInPx,
            });
        }

        public updateColor(color: string): void {
            if (!this.element) {
                return;
            }

            this.element.style("background-color", color || null);
        }

        public render(options: VisualComponentRenderOptions) { }
    }
}
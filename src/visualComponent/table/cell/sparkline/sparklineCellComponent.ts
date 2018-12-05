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
    export class SparklineCellComponent extends CellContainerComponent {
        private extraClassName: string = "sparklineCellComponent";
        private svgClassName: string = "sparklineCellComponent_svg";

        private svgElement: D3.Selection;
        private mainGroupElement: D3.Selection;

        private scaleService: ScaleService;
        private renderOptions: SparklineCellRenderOptions;

        private positions: number[];

        private dynamicComponents: VisualComponent[];

        constructor(options: VisualComponentConstructorOptions) {
            super(options);

            this.scaleService = options.scaleService;

            this.element.classed(this.extraClassName, true);

            this.svgElement = this.element
                .append("svg")
                .classed(this.svgClassName, true);

            this.mainGroupElement = this.svgElement.append("g");

            this.updateSize(this.width, this.height);

            this.bindEvents(this.svgElement);

            const dynamicOptions: VisualComponentConstructorOptions = {
                element: this.svgElement,
                scaleService: options.scaleService,
                stateService: options.stateService
            };

            this.dynamicComponents = [
                new VerticalReferenceLineComponent(dynamicOptions),
                new ReferenceDotsComponent(dynamicOptions),
                TooltipComponent.instance(),
            ];
        }

        private bindEvents(element: D3.Selection): void {
            element.on("mousemove", () => this.pointerMoveEvent(this.renderOptions));
            element.on("touchmove", () => this.pointerMoveEvent(this.renderOptions));

            element.on("mouseleave", () => this.pointerLeaveHandler());
            element.on("touchend", () => this.pointerLeaveHandler());
        }

        private pointerMoveEvent(options: SparklineCellRenderOptions): void {
            const event: MouseEvent | TouchEvent = d3.event as any;

            let offsetX: number = Number.MAX_VALUE;
            let offsetY: number = Number.MAX_VALUE;

            let originalXPosition: number = Number.MAX_VALUE;
            let originalYPosition: number = Number.MAX_VALUE;

            const viewportScale: IViewport = this.scaleService.getScale();

            const elementRect: ClientRect = this.element
                .node()
                .getBoundingClientRect();

            switch (event.type) {
                case "mousemove": {
                    offsetX = (event as MouseEvent).offsetX;
                    offsetY = (event as MouseEvent).offsetY;

                    originalXPosition = (event as MouseEvent).pageX;
                    originalYPosition = elementRect.top + offsetY;

                    break;
                }
                case "touchmove": {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    const touch: TouchEvent = event as TouchEvent;

                    if (touch && touch.touches && touch.touches[0]) {
                        originalXPosition = touch.touches[0].pageX;
                        originalYPosition = touch.touches[0].pageY;

                        offsetX = (originalXPosition - elementRect.left) / viewportScale.width;
                        offsetY = (originalYPosition - elementRect.top);
                    }

                    break;
                }
            }

            this.renderDynamicComponentByPosition(
                offsetX,
                offsetY,
                originalXPosition,
                originalYPosition,
                viewportScale,
                options
            );
        }

        private pointerLeaveHandler(): void {
            this.clearDynamicComponents();
        }

        private clearDynamicComponents(): void {
            this.clearComponents(this.dynamicComponents);
        }

        private clearComponents(components: VisualComponent[]): void {
            components.forEach((component: VisualComponent) => {
                component.clear();
            });
        }

        private renderDynamicComponentByPosition(
            offsetX: number,
            offsetY: number,
            xPosition: number,
            yPosition: number,
            scale: IViewport,
            baseOptions: SparklineCellRenderOptions
        ) {
            const { series } = baseOptions;

            const amountOfPoints: number = series.axisValues.length;

            let dataPointIndex: number = this.getIndexByPosition(offsetX);

            dataPointIndex = Math.min(Math.max(0, dataPointIndex), amountOfPoints);

            const axisValue: DataRepresentationAxisValueType = series.axisValues[dataPointIndex];

            const particularSeries: IDataRepresentationSeries = {
                axisValue,
                x: series.x,
                y: series.y,
                children: [],
                childrenSet: null,
                name: series.name,
                level: series.level,
                settings: series.settings,
                axisValues: [axisValue],
            };

            particularSeries.points = series.points
                .map((pointSet: DataRepresentationPointSet) => {
                    return {
                        ...pointSet,
                        points: [pointSet.points[dataPointIndex]],
                        colors: [pointSet.colors[dataPointIndex]],
                        kpiIndicatorIndexes: [pointSet.kpiIndicatorIndexes[dataPointIndex]],
                    };
                });

            particularSeries.varianceSet = series.varianceSet.map((variances: number[]) => {
                return [variances[dataPointIndex]];
            });

            const dynamicOptions: DynamicComponentRenderOptions = {
                scale,
                y: baseOptions.y,
                order: baseOptions.order,
                series: particularSeries,
                offset: baseOptions.offset,
                viewport: this.getViewport(),
                metadata: baseOptions.metadata,
                settings: baseOptions.settings,
                position: {
                    x: xPosition,
                    offsetX,
                    y: yPosition,
                    offsetY,
                },
                kpiIndicatorIndex: baseOptions.kpiIndicatorIndex,
                kpiIndicatorSettings: baseOptions.kpiIndicatorSettings,
            };

            this.dynamicComponents.forEach((component: VisualComponent) => {
                component.render(dynamicOptions);
            });
        }

        public render(options: SparklineCellRenderOptions): void {
            this.renderOptions = options;

            const {
                order,
                series,
                offset,
                series: {
                    settings,
                },
            } = options;

            this.updateOrder(order);

            this.updateBackgroundColor(
                this.element,
                settings.sparklineSettings.backgroundColor
            );

            const viewport: IViewport = this.getViewport();

            const filteredPoints: DataRepresentationPointSet[] = series.points
                .filter((pointSet: DataRepresentationPointSet, pointSetIndex: number) => {
                    return pointSet && pointSet.isShown;
                });

            this.positions = this.getPositions(
                viewport,
                series.x.scale,
                series.axisValues,
                offset
            );

            const amountOfLines: number = filteredPoints.length;

            this.components
                .splice(amountOfLines)
                .forEach((component: VisualComponent) => {
                    component.clear();
                    component.destroy();
                });

            if (this.components.length < amountOfLines) {
                for (let index: number = this.components.length; index < amountOfLines; index++) {
                    this.components.push(new LineComponent({
                        element: this.mainGroupElement,
                        dataPointFilter: DataRepresentationPointFilter.create(),
                    }));
                }
            }

            filteredPoints.forEach((pointSet: DataRepresentationPointSet, index: number) => {
                this.components[index].render({
                    offset,
                    viewport,
                    x: series.x,
                    y: series.y,
                    points: pointSet,
                } as LineRenderOptions);
            });
        }

        private getIndexByPosition(position: number): number {
            if (!this.positions) {
                return NaN;
            }

            const length: number = this.positions.length;

            for (let index: number = 0; index < length; index++) {
                const condition: boolean =
                    (index === 0
                        && position <= this.positions[index])
                    || (index === 0
                        && this.positions[index + 1] !== undefined
                        && position <= this.positions[index] + (this.positions[index + 1] - this.positions[index]) / 2)
                    || (index === length - 1
                        && position >= this.positions[index])
                    || (index === length - 1
                        && this.positions[index - 1] !== undefined
                        && position >= this.positions[index] - (this.positions[index] - this.positions[index - 1]) / 2)
                    || (this.positions[index - 1] !== undefined
                        && this.positions[index] !== undefined
                        && this.positions[index + 1] !== undefined
                        && (position >= (this.positions[index] - Math.abs(this.positions[index] - this.positions[index - 1]) / 2))
                        && (position <= (this.positions[index] + Math.abs(this.positions[index + 1] - this.positions[index]) / 2)));

                if (condition) {
                    return index;
                }
            }

            return NaN;
        }

        private getViewport(): IViewport {
            return {
                width: this.width,
                height: this.height,
            };
        }

        private getPositions(
            viewport: IViewport,
            originalScale: DataRepresentationScale,
            points: DataRepresentationAxisValueType[],
            offset: number
        ): number[] {
            const scale: DataRepresentationScale = originalScale
                .copy()
                .range([offset, viewport.width - offset]);

            return points.map((value: DataRepresentationAxisValueType) => {
                return scale.scale(value);
            });
        }

        public updateSize(width: number, height: number): void {
            super.updateSize(width, height);

            if (this.renderOptions) {
                this.render(this.renderOptions);
            }
        }

        public clear(): void {
            this.svgElement
                .selectAll("*")
                .remove();

            super.clear();
        }

        public destroy(): void {
            this.renderOptions = null;

            if (this.svgElement) {
                this.svgElement.remove();
            }

            this.mainGroupElement = null;

            super.destroy();
        }
    }
}
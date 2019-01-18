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

import powerbi from "powerbi-visuals-api";

import { Selection } from "d3-selection";

import { CellContainerComponent } from "../cellContainerComponent";

import { DataRepresentationAxisValueType } from "../../../../converter/data/dataRepresentation/dataRepresentationAxisValueType";
import { DataRepresentationPointFilter } from "../../../../converter/data/dataRepresentation/dataRepresentationPointFilter";
import { IDataRepresentationPointSet } from "../../../../converter/data/dataRepresentation/dataRepresentationPointSet";
import { DataRepresentationScale } from "../../../../converter/data/dataRepresentation/dataRepresentationScale";
import { IDataRepresentationSeries } from "../../../../converter/data/dataRepresentation/dataRepresentationSeries";
import { ScaleService } from "../../../../services/scaleService";
import { IVisualComponent } from "../../../visualComponent";
import { IVisualComponentConstructorOptions } from "../../../visualComponentConstructorOptions";

import { IDynamicComponentRenderOptions } from "./dynamic/dynamicComponentRenderOptions";
import { ReferenceDotsComponent } from "./dynamic/referenceDotsComponent";
import { TooltipComponent } from "./dynamic/tooltipComponent";
import { VerticalReferenceLineComponent } from "./dynamic/verticalReferenceLineComponent";
import { LineComponent } from "./lineComponent";
import { ILineRenderOptions } from "./lineRenderOptions";
import { ISparklineCellRenderOptions } from "./sparklineCellRenderOptions";

export class SparklineCellComponent extends CellContainerComponent {
    private extraClassName: string = "sparklineCellComponent";
    private svgClassName: string = "sparklineCellComponent_svg";

    private svgElement: Selection<any, any, any, any>;
    private mainGroupElement: Selection<any, any, any, any>;

    private scaleService: ScaleService;
    private renderOptions: ISparklineCellRenderOptions;

    private positions: number[];

    private dynamicComponents: IVisualComponent[];

    constructor(options: IVisualComponentConstructorOptions) {
        super(options);

        this.scaleService = options.scaleService;

        this.element.classed(this.extraClassName, true);

        this.svgElement = this.element
            .append("svg")
            .classed(this.svgClassName, true);

        this.mainGroupElement = this.svgElement.append("g");

        this.updateSize(this.width, this.height);

        this.bindEvents(this.svgElement);

        const dynamicOptions: IVisualComponentConstructorOptions = {
            ...options,
            element: this.svgElement,
        };

        this.dynamicComponents = [
            new VerticalReferenceLineComponent(dynamicOptions),
            new ReferenceDotsComponent(dynamicOptions),
            new TooltipComponent(dynamicOptions),
        ];
    }

    public render(options: ISparklineCellRenderOptions): void {
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
            settings.sparklineSettings.backgroundColor,
        );

        const viewport: powerbi.IViewport = this.getViewport();

        const filteredPoints: IDataRepresentationPointSet[] = series.points
            .filter((pointSet: IDataRepresentationPointSet, pointSetIndex: number) => {
                return pointSet && pointSet.isShown;
            });

        this.positions = this.getPositions(
            viewport,
            series.x.scale,
            series.axisValues,
            offset,
        );

        const amountOfLines: number = filteredPoints.length;

        this.components
            .splice(amountOfLines)
            .forEach((component: IVisualComponent) => {
                component.clear();
                component.destroy();
            });

        if (this.components.length < amountOfLines) {
            for (let index: number = this.components.length; index < amountOfLines; index++) {
                this.components.push(new LineComponent({
                    dataPointFilter: DataRepresentationPointFilter.create(),
                    element: this.mainGroupElement,
                }));
            }
        }

        filteredPoints.forEach((pointSet: IDataRepresentationPointSet, index: number) => {
            this.components[index].render({
                offset,
                points: pointSet,
                viewport,
                x: series.x,
                y: series.y,
            } as ILineRenderOptions);
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

    private getViewport(): powerbi.IViewport {
        return {
            height: this.height,
            width: this.width,
        };
    }

    private getPositions(
        viewport: powerbi.IViewport,
        originalScale: DataRepresentationScale,
        points: DataRepresentationAxisValueType[],
        offset: number,
    ): number[] {
        const scale: DataRepresentationScale = originalScale
            .copy()
            .range([offset, viewport.width - offset]);

        return points.map((value: DataRepresentationAxisValueType) => {
            return scale.scale(value);
        });
    }

    private bindEvents(element: Selection<any, any, any, any>): void {
        element.on("mousemove", () => this.pointerMoveEvent(this.renderOptions));
        element.on("touchmove", () => this.pointerMoveEvent(this.renderOptions));

        element.on("mouseleave", () => this.pointerLeaveHandler());
        element.on("touchend", () => this.pointerLeaveHandler());
    }

    private pointerMoveEvent(options: ISparklineCellRenderOptions): void {
        const event: MouseEvent | TouchEvent = require("d3-selection").event;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        let offsetX: number = Number.MAX_VALUE;
        let offsetY: number = Number.MAX_VALUE;

        let originalXPosition: number = Number.MAX_VALUE;
        let originalYPosition: number = Number.MAX_VALUE;

        const viewportScale: powerbi.IViewport = this.scaleService.getScale();

        switch (event.type) {
            case "mousemove": {
                offsetX = (event as MouseEvent).offsetX;
                offsetY = (event as MouseEvent).offsetY;

                originalXPosition = (event as MouseEvent).pageX;
                originalYPosition = (event as MouseEvent).pageY;

                break;
            }
            case "touchmove": {
                const touch: TouchEvent = event as TouchEvent;

                if (touch && touch.touches && touch.touches[0]) {
                    originalXPosition = touch.touches[0].pageX;
                    originalYPosition = touch.touches[0].pageY;

                    const element: SVGElement = this.element.node() as SVGElement;

                    offsetX = (originalXPosition - element.getBoundingClientRect().left) / viewportScale.width;
                    offsetY = originalYPosition;
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
            options,
        );
    }

    private pointerLeaveHandler(): void {
        this.clearDynamicComponents();
    }

    private clearDynamicComponents(): void {
        this.clearComponents(this.dynamicComponents);
    }

    private clearComponents(components: IVisualComponent[]): void {
        components.forEach((component: IVisualComponent) => {
            component.clear();
        });
    }

    private renderDynamicComponentByPosition(
        offsetX: number,
        offsetY: number,
        xPosition: number,
        yPosition: number,
        scale: powerbi.IViewport,
        baseOptions: ISparklineCellRenderOptions,
    ) {
        const { series } = baseOptions;

        const amountOfPoints: number = series.axisValues.length;

        let dataPointIndex: number = this.getIndexByPosition(offsetX);

        dataPointIndex = Math.min(Math.max(0, dataPointIndex), amountOfPoints);

        const axisValue: DataRepresentationAxisValueType = series.axisValues[dataPointIndex];

        const particularSeries: IDataRepresentationSeries = {
            axisValue,
            axisValues: [axisValue],
            children: [],
            childrenSet: null,
            level: series.level,
            name: series.name,
            settings: series.settings,
            x: series.x,
            y: series.y,
        };

        particularSeries.points = series.points
            .map((pointSet: IDataRepresentationPointSet) => {
                return {
                    ...pointSet,
                    colors: [pointSet.colors[dataPointIndex]],
                    kpiIndicatorIndexes: [pointSet.kpiIndicatorIndexes[dataPointIndex]],
                    points: [pointSet.points[dataPointIndex]],
                };
            });

        particularSeries.varianceSet = series.varianceSet.map((variances: number[]) => {
            return [variances[dataPointIndex]];
        });

        const dynamicOptions: IDynamicComponentRenderOptions = {
            kpiIndicatorIndex: baseOptions.kpiIndicatorIndex,
            kpiIndicatorSettings: baseOptions.kpiIndicatorSettings,
            metadata: baseOptions.metadata,
            offset: baseOptions.offset,
            order: baseOptions.order,
            position: {
                offsetX,
                offsetY,
                x: xPosition,
                y: yPosition,
            },
            scale,
            series: particularSeries,
            settings: baseOptions.settings,
            viewport: this.getViewport(),
            y: baseOptions.y,

        };

        this.dynamicComponents.forEach((component: IVisualComponent) => {
            component.render(dynamicOptions);
        });
    }
}

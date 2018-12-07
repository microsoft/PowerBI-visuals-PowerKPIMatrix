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

import { Selection } from "d3-selection";

import { CssConstants } from "powerbi-visuals-utils-svgutils";

import { DataRepresentationPointFilter } from "../../../../../converter/data/dataRepresentation/dataRepresentationPointFilter";
import { IDataRepresentationPointSet } from "../../../../../converter/data/dataRepresentation/dataRepresentationPointSet";
import { DataRepresentationScale } from "../../../../../converter/data/dataRepresentation/dataRepresentationScale";
import { IDataRepresentationSeries } from "../../../../../converter/data/dataRepresentation/dataRepresentationSeries";
import { BaseComponent } from "../../../../baseComponent";
import { IVisualComponentConstructorOptions } from "../../../../visualComponentConstructorOptions";

import { IDynamicComponentRenderOptions } from "./dynamicComponentRenderOptions";

export class ReferenceDotsComponent extends BaseComponent {
    private className: string = "referenceDotsComponent";
    private dotsSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("dots");
    private dotSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("dot");

    private dataPointFilter: DataRepresentationPointFilter = DataRepresentationPointFilter.create();

    private radiusFactor: number = 1.4;

    constructor(options: IVisualComponentConstructorOptions) {
        super();

        this.element = options.element
            .append("g")
            .classed(this.className, true);
    }

    public render(options: IDynamicComponentRenderOptions): void {
        const {
            series,
            offset,
            viewport,
        } = options;

        const xScale: DataRepresentationScale = series.x.scale
            .copy()
            .range([offset, viewport.width - offset]);

        const yScale: DataRepresentationScale = series.y.scale
            .copy()
            .range([viewport.height - offset, offset]);

        const dotGroupSelection: Selection<any, IDataRepresentationSeries, any, any> = this.element
            .selectAll(this.dotsSelector.selectorName)
            .data(series ? [series] : []);

        dotGroupSelection
            .exit()
            .remove();

        const mergedDotGroupSelection: Selection<any, IDataRepresentationSeries, any, any> = dotGroupSelection
            .enter()
            .append("g")
            .classed(this.dotsSelector.className, true)
            .merge(dotGroupSelection);

        const dotSelection: Selection<any, IDataRepresentationPointSet, any, any> = mergedDotGroupSelection
            .selectAll(this.dotSelector.selectorName)
            .data((dataSeries: IDataRepresentationSeries) => {
                return dataSeries.points.filter((pointSet: IDataRepresentationPointSet) => {
                    return pointSet.isShown && this.dataPointFilter.filter(pointSet.points || []).length > 0;
                });
            });

        dotSelection
            .exit()
            .remove();

        dotSelection
            .enter()
            .append("circle")
            .classed(this.dotSelector.className, true)
            .merge(dotSelection)
            .attr("cx", (pointSet: IDataRepresentationPointSet) => xScale.scale(pointSet.points[0].axisValue))
            .attr("cy", (pointSet: IDataRepresentationPointSet) => yScale.scale(pointSet.points[0].value))
            .attr("r", (pointSet: IDataRepresentationPointSet) => pointSet.thickness * this.radiusFactor)
            .style("fill", (pointSet: IDataRepresentationPointSet) => (pointSet.colors && pointSet.colors[0]) || pointSet.color);
    }
}

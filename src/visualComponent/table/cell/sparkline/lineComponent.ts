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
    line as d3Line,
    Line as ID3Line,
} from "d3-shape";

import { Selection } from "d3-selection";

import { CssConstants } from "powerbi-visuals-utils-svgutils";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { BaseComponent } from "../../../baseComponent";
import { IVisualComponent } from "../../../visualComponent";

import { IDataRepresentationPoint } from "../../../../converter/data/dataRepresentation/dataRepresentationPoint";
import { DataRepresentationPointFilter } from "../../../../converter/data/dataRepresentation/dataRepresentationPointFilter";
import { IDataRepresentationPointGradientColor } from "../../../../converter/data/dataRepresentation/dataRepresentationPointGradientColor";
import { DataRepresentationScale } from "../../../../converter/data/dataRepresentation/dataRepresentationScale";

import { LineStyle } from "../../../../settings/descriptors/sparklineSettings";

import { ILineConstructorOptions } from "./lineConstructorOptions";
import { ILineRenderOptions } from "./lineRenderOptions";

export class LineComponent extends BaseComponent implements IVisualComponent {

    private className: string = "lineComponent";

    private lineClassName: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("lineComponent_line");

    private dataPointFilter: DataRepresentationPointFilter;

    constructor(options: ILineConstructorOptions) {
        super();

        this.dataPointFilter = options.dataPointFilter;

        this.element = options.element
            .append("g")
            .classed(this.className, true);
    }

    public render(options: ILineRenderOptions): void {
        const {
            x,
            y,
            offset,
            points,
            viewport,
            points: { thickness, lineStyle },
        } = options;

        const xScale: DataRepresentationScale = x.scale
            .copy()
            .range([
                offset,
                viewport.width - offset,
            ]);

        const yScale: DataRepresentationScale = y.scale
            .copy()
            .range([
                viewport.height - offset,
                offset,
            ]);

        const line: ID3Line<IDataRepresentationPoint> = this.getLine(xScale, yScale);

        const lineSelection: Selection<any, IDataRepresentationPointGradientColor, any, any> = this.element
            .selectAll(this.lineClassName.selectorName)
            .data(this.dataPointFilter.groupAndFilterByColor(
                points.points,
                points.colors,
                points.color,
            ));

        lineSelection
            .exit()
            .remove();

        lineSelection
            .enter()
            .append("svg:path")
            .classed(this.lineClassName.className, true)
            .merge(lineSelection)
            .attr("d", (gradientColorOptions: IDataRepresentationPointGradientColor) => {
                return line(gradientColorOptions.points);
            })
            .attr("class", () => {
                return `${this.lineClassName.className}`;
            })
            .style("stroke", (gradientColorOptions: IDataRepresentationPointGradientColor) => gradientColorOptions.color)
            .style("stroke-width", pixelConverter.toString(thickness))
            .classed(LineStyle[LineStyle.dashedLine], lineStyle === LineStyle.dashedLine)
            .classed(LineStyle[LineStyle.dottedLine], lineStyle === LineStyle.dottedLine)
            .classed(LineStyle[LineStyle.dotDashedLine], lineStyle === LineStyle.dotDashedLine);
    }

    private getLine(
        xScale: DataRepresentationScale,
        yScale: DataRepresentationScale,
    ): ID3Line<IDataRepresentationPoint> {
        return d3Line<IDataRepresentationPoint>()
            .x((data: IDataRepresentationPoint) => {
                return xScale.scale(data.axisValue);
            })
            .y((data: IDataRepresentationPoint) => {
                return yScale.scale(data.value);
            });
    }
}

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
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { DataRepresentationAxisValueType } from "../../../../../converter/data/dataRepresentation/dataRepresentationAxisValueType";
import { DataRepresentationScale } from "../../../../../converter/data/dataRepresentation/dataRepresentationScale";
import { NumericValueUtils } from "../../../../../utils/numericValueUtils";
import { BaseComponent } from "../../../../baseComponent";
import { IVisualComponentConstructorOptions } from "../../../../visualComponentConstructorOptions";

import { IDynamicComponentRenderOptions } from "./dynamicComponentRenderOptions";

export class VerticalReferenceLineComponent extends BaseComponent {
    private className: string = "verticalLineComponent";
    private lineSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("verticalLine");

    constructor(options: IVisualComponentConstructorOptions) {
        super();

        this.element = options.element
            .append("g")
            .classed(this.className, true);
    }

    public render(options: IDynamicComponentRenderOptions): void {
        const {
            offset,
            viewport,
            series: { x, axisValue, settings: { sparklineSettings } },
        } = options;

        const xScale: DataRepresentationScale = x.scale
            .copy()
            .range([offset, viewport.width - offset]);

        const xPosition: number = xScale.scale(axisValue);

        const lineSelection: Selection<any, DataRepresentationAxisValueType, any, any> = this.element
            .selectAll(this.lineSelector.selectorName)
            .data(NumericValueUtils.isValueDefined(axisValue)
                && (sparklineSettings.isActualVisible
                    || sparklineSettings.isTargetVisible
                    || sparklineSettings.isSecondComparisonValueVisible
                )
                ? [axisValue]
                : [],
            );

        lineSelection
            .exit()
            .remove();

        lineSelection
            .enter()
            .append("line")
            .classed(this.lineSelector.className, true)
            .merge(lineSelection)
            .attr("x1", xPosition)
            .attr("y1", 0)
            .attr("x2", xPosition)
            .attr("y2", viewport.height)
            .style("stroke", sparklineSettings.verticalReferenceLineColor)
            .style("stroke-width", pixelConverter.toString(sparklineSettings.verticalReferenceLineThickness));
    }
}

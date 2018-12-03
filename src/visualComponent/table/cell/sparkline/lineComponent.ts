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
    // jsCommon
    import PixelConverter = jsCommon.PixelConverter;

    // jsCommon.CssConstants
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

    export class LineComponent extends BaseComponent
        implements VisualComponent {

        private className: string = "lineComponent";

        private lineClassName: ClassAndSelector = createClassAndSelector("lineComponent_line");

        private dataPointFilter: DataRepresentationPointFilter;

        constructor(options: LineConstructorOptions) {
            super();

            this.dataPointFilter = options.dataPointFilter;

            this.element = options.element
                .append("g")
                .classed(this.className, true);
        }

        public render(options: LineRenderOptions): void {
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
                    viewport.width - offset
                ]);

            const yScale: DataRepresentationScale = y.scale
                .copy()
                .range([
                    viewport.height - offset,
                    offset
                ]);

            const line: D3.Svg.Line = this.getLine(xScale, yScale);

            const lineSelection: D3.UpdateSelection = this.element
                .selectAll(this.lineClassName.selector)
                .data(this.dataPointFilter.groupAndFilterByColor(
                    points.points,
                    points.colors,
                    points.color));

            lineSelection.enter()
                .append("svg:path")
                .classed(this.lineClassName.class, true);

            lineSelection
                .attr({
                    d: (options: DataRepresentationPointGradientColor) => {
                        return line(options.points);
                    },
                    "class": () => {
                        return `${this.lineClassName.class}`;
                    }
                })
                .style({
                    "stroke": (options: DataRepresentationPointGradientColor) => options.color,
                    "stroke-width": PixelConverter.toString(thickness),
                })
                .classed(LineStyle[LineStyle.dashedLine], lineStyle === LineStyle.dashedLine)
                .classed(LineStyle[LineStyle.dottedLine], lineStyle === LineStyle.dottedLine)
                .classed(LineStyle[LineStyle.dotDashedLine], lineStyle === LineStyle.dotDashedLine);

            lineSelection
                .exit()
                .remove();
        }

        private getLine(
            xScale: DataRepresentationScale,
            yScale: DataRepresentationScale
        ): D3.Svg.Line {
            return d3.svg.line()
                .x((data: DataRepresentationPoint) => {
                    return xScale.scale(data.axisValue);
                })
                .y((data: DataRepresentationPoint) => {
                    return yScale.scale(data.value);
                });
        }
    }
}

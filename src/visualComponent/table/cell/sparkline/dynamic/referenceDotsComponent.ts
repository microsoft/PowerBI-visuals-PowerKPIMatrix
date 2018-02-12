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
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    export class ReferenceDotsComponent extends BaseComponent {
        private className: string = "referenceDotsComponent";
        private dotsSelector: ClassAndSelector = createClassAndSelector("dots");
        private dotSelector: ClassAndSelector = createClassAndSelector("dot");

        private dataPointFilter: DataRepresentationPointFilter = DataRepresentationPointFilter.create();

        private radiusFactor: number = 1.4;

        constructor(options: VisualComponentConstructorOptions) {
            super();

            this.element = options.element
                .append("g")
                .classed(this.className, true);
        }

        public render(options: DynamicComponentRenderOptions): void {
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

            const dotGroupSelection: d3.selection.Update<any> = this.element
                .selectAll(this.dotsSelector.selectorName)
                .data(series ? [series] : []);

            dotGroupSelection
                .enter()
                .append("g")
                .classed(this.dotsSelector.className, true);

            const dotSelection: d3.selection.Update<any> = dotGroupSelection
                .selectAll(this.dotSelector.selectorName)
                .data((series: DataRepresentationSeries) => {
                    return series.points.filter((pointSet: DataRepresentationPointSet) => {
                        return pointSet.isShown && this.dataPointFilter.filter(pointSet.points || []).length > 0;
                    });
                });

            dotSelection
                .enter()
                .append("circle")
                .classed(this.dotSelector.className, true);

            dotSelection
                .attr({
                    cx: (pointSet: DataRepresentationPointSet) => xScale.scale(pointSet.points[0].axisValue),
                    cy: (pointSet: DataRepresentationPointSet) => yScale.scale(pointSet.points[0].value),
                    r: (pointSet: DataRepresentationPointSet) => pointSet.thickness * this.radiusFactor
                })
                .style({
                    fill: (pointSet: DataRepresentationPointSet) => (pointSet.colors && pointSet.colors[0]) || pointSet.color
                });

            dotSelection
                .exit()
                .remove();

            dotGroupSelection
                .exit()
                .remove();
        }
    }
}

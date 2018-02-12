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

    interface HeaderElement {
        value: string;
        clickHandler?: () => void;
    }

    export class ColumnMappingHeaderComponent extends BaseComponent {
        private className: string = "columnMappingHeaderComponent";

        private textHeaderSelector: ClassAndSelector = createClassAndSelector("columnMappingHeaderComponent_headerElement");

        constructor(options: VisualComponentConstructorOptions) {
            super();

            this.element = options.element
                .append("div")
                .classed(this.className, true);
        }

        public render(options: VisualComponentRenderOptions): void {
            this.renderHeaderElements([
                { value: "Column Mapping" },
            ]);
        }

        private renderHeaderElements(elements: HeaderElement[]): void {
            const textSelection: d3.selection.Update<any> = this.element
                .selectAll(this.textHeaderSelector.selectorName)
                .data(elements);

            textSelection
                .enter()
                .append("div")
                .classed(this.textHeaderSelector.className, true);

            textSelection
                .text((element: HeaderElement) => element.value)
                .on("click", (element: HeaderElement) => {
                    if (element.clickHandler) {
                        element.clickHandler();
                    }
                });

            textSelection
                .exit()
                .remove();
        }
    }
}
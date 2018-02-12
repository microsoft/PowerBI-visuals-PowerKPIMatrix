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
    // 
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    export class ColumnMappingButtonComponent extends BaseComponent {
        private className: string = "columnMappingButtonComponent";

        private buttonSelector: ClassAndSelector = createClassAndSelector("columnMappingButtonComponent_button");

        private onClick: (options: VisualComponentRenderOptionsBase) => void;
        private buttonText: string;

        constructor(options: ColumnMappingButtonConstructorOptions) {
            super();

            this.onClick = options.onClick;
            this.buttonText = options.buttonText;

            this.element = options.element
                .append("div")
                .classed(this.className, true);
        }

        public render(options: VisualComponentRenderOptionsBase): void {
            const buttonSelection: d3.selection.Update<any> = this.element
                .selectAll(this.buttonSelector.selectorName)
                .data([this.buttonText]);

            buttonSelection
                .enter()
                .append("button")
                .classed(this.buttonSelector.className, true);

            buttonSelection
                .text((value: string) => value)
                .on("click", () => {
                    this.onClick(options);
                });

            buttonSelection
                .exit()
                .remove();
        }
    }
}
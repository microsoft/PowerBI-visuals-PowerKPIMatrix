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

import { BaseComponent } from "../baseComponent";
import { IVisualComponentRenderOptionsBase } from "../VisualComponentRenderOptionsBase";

import { IColumnMappingButtonConstructorOptions } from "./columnMappingButtonConstructorOptions";

export class ColumnMappingButtonComponent extends BaseComponent {
    private className: string = "columnMappingButtonComponent";

    private buttonSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("columnMappingButtonComponent_button");

    private onClick: (options: IVisualComponentRenderOptionsBase) => void;
    private buttonText: string;

    constructor(options: IColumnMappingButtonConstructorOptions) {
        super();

        this.onClick = options.onClick;
        this.buttonText = options.buttonText;

        this.element = options.element
            .append("div")
            .classed(this.className, true);
    }

    public render(options: IVisualComponentRenderOptionsBase): void {
        const buttonSelection: Selection<any, string, any, any> = this.element
            .selectAll(this.buttonSelector.selectorName)
            .data([this.buttonText]);

        buttonSelection
            .enter()
            .append("button")
            .classed(this.buttonSelector.className, true)
            .merge(buttonSelection)
            // .text((value: string) => [value]) TODO
            .text((value: string) => value)
            .on("click", () => {
                this.onClick(options);
            });

        buttonSelection
            .exit()
            .remove();
    }
}

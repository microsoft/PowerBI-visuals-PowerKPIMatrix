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

import { TextCellComponent } from "../text/textCellComponent";

import {
    CollapserCellOnChangeHandler,
    ICollapserCellConstructorOptions,
} from "./collapserCellConstructorOptions";

import { ICollapserCellRenderOptions } from "./collapserCellRenderOptions";

export class CollapserCellComponent extends TextCellComponent {
    private onChangeHandler: CollapserCellOnChangeHandler;

    private extraClassName: string = "collapserCellComponent";

    private collapserSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("collapserCellComponent_collapserSign");

    private glyphClassName: string = "powervisuals-glyph";

    private chevronDownClassName: string = "chevron-down";
    private chevronUpClassName: string = "chevron-up";

    constructor(options: ICollapserCellConstructorOptions) {
        super(options);

        this.element.classed(this.extraClassName, true);

        this.onChangeHandler = options.onChangeHandler;
    }

    public render(options: ICollapserCellRenderOptions): void {
        const {
            isShown,
            isExpandCollapseShown,
        } = options;

        super.render(options);

        this.renderCollapser(isShown, isExpandCollapseShown);
    }

    private renderCollapser(state: boolean, isExpandCollapseShown: boolean): void {
        const collapserSelection: Selection<any, boolean, any, any> = this.element
            .selectAll(this.collapserSelector.selectorName)
            .data(isExpandCollapseShown ? [state] : []);

        collapserSelection
            .exit()
            .remove();

        collapserSelection
            .enter()
            .append("div")
            .classed(this.collapserSelector.className, true)
            .classed(this.glyphClassName, true)
            .on("click", (currentState: boolean) => {
                const newState: boolean = !currentState;

                this.renderCollapser(newState, true);
                this.onChangeHandler(newState);
            })
            .merge(collapserSelection)
            .classed(this.chevronDownClassName, !state)
            .classed(this.chevronUpClassName, state);
    }
}

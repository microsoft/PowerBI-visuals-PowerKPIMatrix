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

import { IVisualComponent } from "./visualComponent";
import { IVisualComponentRenderOptionsBase } from "./visualComponentRenderOptionsBase";

import {
    HorizontalTextAlignment,
    VerticalTextAlignment,
    WrapText,
} from "../settings/descriptors/fontSettings";

export abstract class BaseComponent implements IVisualComponent {
    protected italicClassName: string = "italicStyle";
    protected boldClassName: string = "boldStyle";

    protected element: Selection<any, any, any, any>;

    private isComponentShown: boolean = true;

    private horizontalAlignmentClassNamePrefix: string = "horizontalAlignment";
    private verticalAlignmentClassNamePrefix: string = "verticalAlignment";

    private wrapTextClassNamePrefix: string = "text";

    public abstract render(options: IVisualComponentRenderOptionsBase): void;

    public clear(): void {
        if (!this.element) {
            return;
        }

        this.element
            .selectAll("*")
            .remove();
    }

    public destroy(): void {
        if (this.element) {
            this.element.remove();
        }

        this.element = null;
    }

    public hide(): void {
        if (!this.element || !this.isComponentShown) {
            return;
        }

        this.element.style("display", "none");

        this.isComponentShown = false;
    }

    public show(): void {
        if (!this.element || this.isComponentShown) {
            return;
        }

        this.element.style("display", null);

        this.isComponentShown = true;
    }

    public toggle(): void {
        if (this.isComponentShown) {
            this.hide();
        } else {
            this.show();
        }
    }

    public get isShown(): boolean {
        return this.isComponentShown;
    }

    public updateOrder(order: number): void {
        this.updateElementOrder(this.element, order);
    }

    protected updateElementOrder(element: Selection<any, any, any, any>, order: number): void {
        if (!element) {
            return;
        }

        const browserSpecificOrder: number = order + 1;

        element
            .style("-webkit-box-ordinal-group", browserSpecificOrder)
            .style("-ms-flex-order", order)
            .style("order", order);
    }

    protected updateAlignment(
        element: Selection<any, any, any, any>,
        horizontalAlignment: HorizontalTextAlignment,
        verticalAlignment: VerticalTextAlignment,
    ): void {
        if (!element) {
            return;
        }

        element
            .classed(`${this.horizontalAlignmentClassNamePrefix}_left`, horizontalAlignment === HorizontalTextAlignment.left)
            .classed(`${this.horizontalAlignmentClassNamePrefix}_center`, horizontalAlignment === HorizontalTextAlignment.center)
            .classed(`${this.horizontalAlignmentClassNamePrefix}_right`, horizontalAlignment === HorizontalTextAlignment.right)
            .classed(`${this.verticalAlignmentClassNamePrefix}_top`, verticalAlignment === VerticalTextAlignment.top)
            .classed(`${this.verticalAlignmentClassNamePrefix}_center`, verticalAlignment === VerticalTextAlignment.center)
            .classed(`${this.verticalAlignmentClassNamePrefix}_bottom`, verticalAlignment === VerticalTextAlignment.bottom);
    }

    protected updateTextWrapping(
        element: Selection<any, any, any, any>,
        wrapText: WrapText,
    ): void {
        if (!element) {
            return;
        }

        element
            .classed(`${this.wrapTextClassNamePrefix}NoWrap`, wrapText === WrapText.NoWrap)
            .classed(`${this.wrapTextClassNamePrefix}Wrap`, wrapText === WrapText.Wrap)
            .classed(`${this.wrapTextClassNamePrefix}BreakWord `, wrapText === WrapText.BreakWord);
    }

    protected updateBackgroundColor(
        element: Selection<any, any, any, any>,
        color: string,
    ): void {
        if (!element) {
            return;
        }

        element.style("background-color", color || null);
    }
}

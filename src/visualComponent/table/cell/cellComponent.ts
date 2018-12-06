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

export class CellComponent extends BaseContainerComponent {

    private className: string = "cellComponent";

    protected minWidth: number = 20;
    protected width: number = 120;

    protected minHeight: number = 20;
    protected height: number = 55;

    constructor(options: VisualComponentConstructorOptions) {
        super();

        this.element = options.element
            .append("div")
            .classed(this.className, true);
    }

    public updateSize(width: number, height: number): void {
        if (!isNaN(width) && isFinite(width)) {
            this.width = Math.max(this.minWidth, width);
        }

        if (!isNaN(height) && isFinite(height)) {
            this.height = Math.max(this.minHeight, height);
        }

        this.updateSizeOfElement(this.width, this.height);
    }

    protected updateSizeOfElement(width: number, height: number): void {
        if (!this.element) {
            return;
        }

        const styleObject: any = {};

        styleObject["width"]
            = styleObject["min-width"]
            = styleObject["max-width"]
            = width !== undefined && width !== null
                ? PixelConverter.toString(width)
                : null;

        styleObject["height"]
            = styleObject["min-height"]
            = styleObject["max-height"]
            = height !== undefined && height !== null
                ? PixelConverter.toString(height)
                : null;

        this.element.style(styleObject);
    }

    public getState(): CellState {
        return {
            width: this.width,
            height: this.height,
        };
    }
}

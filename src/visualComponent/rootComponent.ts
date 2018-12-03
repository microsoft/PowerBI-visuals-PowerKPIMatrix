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

export class RootComponent extends BaseContainerComponent {
    private className: string = "powerKPIMatrix_rootComponent";

    constructor(options: VisualComponentConstructorOptions) {
        super();

        this.element = options.element
            .append("div")
            .classed(this.className, true);

        const componentOptions: VisualComponentConstructorOptions = {
            ...options,
            element: this.element,
        };

        this.components = [
            new ColumnMappingComponent(componentOptions),
            new TableComponent(componentOptions),
        ];
    }

    public render(options: VisualComponentRenderOptions): void {
        const { viewport } = options;

        this.updateViewport(viewport);

        super.render(options);
    }

    private updateViewport(viewport: IViewport): void {
        this.element.style({
            width: PixelConverter.toString(viewport.width),
            height: PixelConverter.toString(viewport.height)
        });
    }
}

export class LazyRootComponent extends LazyComponent {
    protected createInstance(options: VisualComponentConstructorOptions): RootComponent {
        return new RootComponent(options);
    }
}

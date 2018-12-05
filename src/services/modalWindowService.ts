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

export interface IModalWindowServiceInitOptions {
    element: D3.Selection;
    componentCreators: ((options: VisualComponentConstructorOptions) => VisualComponent)[];
}

export class ModalWindowService extends BaseContainerComponent {
    private className: string = "modalWindow_rootElement";
    private innerElementClassName: string = "modalWindow_rootElement-innerElement";

    private innerElement: D3.Selection;

    private renderOptions: VisualComponentRenderOptionsBase;

    constructor(options: IModalWindowServiceInitOptions) {
        super();

        this.element = options.element
            .append("div")
            .classed(this.className, true)
            .on("click", this.toggle.bind(this));

        this.innerElement = this.element
            .append("div")
            .classed(this.innerElementClassName, true)
            .on("click", () => {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                d3.event.stopImmediatePropagation();
            });

        const componentOptions: VisualComponentConstructorOptions = {
            element: this.innerElement,
        };

        this.hide();

        this.components = options.componentCreators.map((componentCreator) => {
            return componentCreator(componentOptions);
        });
    }

    public render(options: VisualComponentRenderOptionsBase): void {
        const shouldBeShown: boolean = options
            && options.settings
            && options.settings.popOutGeneralSettings
            && options.settings.popOutGeneralSettings.show;

        if (!shouldBeShown) {
            if (this.isShown) {
                this.hide();
            }

            return;
        }

        if (!this.isShown) {
            this.show();
        }

        this.renderComponent(options);
    }

    private renderComponent(options: VisualComponentRenderOptionsBase): void {
        const { settings: { popOutGeneralSettings } } = options;

        const viewport: IViewport = this.getInnerViewport(
            options.viewport,
            popOutGeneralSettings.getViewportSizeInPercent()
        );

        const extendedOptions: VisualComponentRenderOptionsBase = {
            ...options,
            viewport,
        };

        this.updateElementSize(this.element, options.viewport);
        this.updateElementSize(this.innerElement, viewport);
        this.updateBackgroundColor(this.innerElement, popOutGeneralSettings.backgroundColor);

        this.renderOptions = extendedOptions;

        super.render(extendedOptions);
    }

    private getInnerViewport(baseViewport: IViewport, innerElementSize: number): IViewport {
        return {
            width: baseViewport.width * innerElementSize,
            height: baseViewport.height * innerElementSize,
        };
    }

    private updateElementSize(element: D3.Selection, viewport: IViewport): void {
        if (!element) {
            return;
        }

        element.style({
            width: PixelConverter.toString(viewport.width),
            height: PixelConverter.toString(viewport.height),
        });
    }

    public getRenderOptions(): VisualComponentRenderOptionsBase {
        return this.renderOptions;
    }

    public destroy() {
        this.renderOptions = null;
        this.innerElement = null;

        super.destroy();
    }
}

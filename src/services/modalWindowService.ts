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

import powerbi from "powerbi-visuals-api";

import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { BaseContainerComponent } from "../visualComponent/baseContainerComponent";
import { IVisualComponent } from "../visualComponent/visualComponent";
import { IVisualComponentConstructorOptions } from "../visualComponent/visualComponentConstructorOptions";
import { IVisualComponentRenderOptionsBase } from "../visualComponent/visualComponentRenderOptionsBase";

export interface IModalWindowServiceInitOptions {
    element: Selection<any, any, any, any>;
    componentCreators: Array<((options: IVisualComponentConstructorOptions) => IVisualComponent)>;
}

export class ModalWindowService extends BaseContainerComponent {
    private className: string = "modalWindow_rootElement";
    private innerElementClassName: string = "modalWindow_rootElement-innerElement";

    private innerElement: Selection<any, any, any, any>;

    private renderOptions: IVisualComponentRenderOptionsBase;

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
                const event: Event = require("d3").event;

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            });

        const componentOptions: IVisualComponentConstructorOptions = {
            element: this.innerElement,
        };

        this.hide();

        this.components = options.componentCreators.map((componentCreator) => {
            return componentCreator(componentOptions);
        });
    }

    public render(options: IVisualComponentRenderOptionsBase): void {
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

    public getRenderOptions(): IVisualComponentRenderOptionsBase {
        return this.renderOptions;
    }

    public destroy() {
        this.renderOptions = null;
        this.innerElement = null;

        super.destroy();
    }

    private renderComponent(options: IVisualComponentRenderOptionsBase): void {
        const { settings: { popOutGeneralSettings } } = options;

        const viewport: powerbi.IViewport = this.getInnerViewport(
            options.viewport,
            popOutGeneralSettings.getViewportSizeInPercent(),
        );

        const extendedOptions: IVisualComponentRenderOptionsBase = {
            ...options,
            viewport,
        };

        this.updateElementSize(this.element, options.viewport);
        this.updateElementSize(this.innerElement, viewport);
        this.updateBackgroundColor(this.innerElement, popOutGeneralSettings.backgroundColor);

        this.renderOptions = extendedOptions;

        super.render(extendedOptions);
    }

    private getInnerViewport(baseViewport: powerbi.IViewport, innerElementSize: number): powerbi.IViewport {
        return {
            height: baseViewport.height * innerElementSize,
            width: baseViewport.width * innerElementSize,
        };
    }

    private updateElementSize(
        element: Selection<any, any, any, any>,
        viewport: powerbi.IViewport,
    ): void {
        if (!element) {
            return;
        }

        element
            .style("height", pixelConverter.toString(viewport.height))
            .style("width", pixelConverter.toString(viewport.width));
    }
}

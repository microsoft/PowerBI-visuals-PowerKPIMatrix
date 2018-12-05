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

import powerbi from "powerbi-visuals-api";

export class ScaleService {
    private rootElement: HTMLElement;

    public set element(element: HTMLElement) {
        this.rootElement = element;
    }

    public getScale(): powerbi.IViewport {
        if (!this.rootElement) {
            return {
                height: 1,
                width: 1,
            };
        }

        const rect: ClientRect = this.rootElement.getBoundingClientRect();

        let clientWidth: number;
        let clientHeight: number;

        if (!this.rootElement.clientWidth || !this.rootElement.clientHeight) {
            const $container: JQuery = $(this.rootElement);

            clientWidth = $container.width();
            clientHeight = $container.height();
        } else {
            clientWidth = this.rootElement.clientWidth;
            clientHeight = this.rootElement.clientHeight;
        }

        return {
            height: rect.height / clientHeight,
            width: rect.width / clientWidth,
        };
    }

    public destroy(): void {
        this.rootElement = null;
    }
}

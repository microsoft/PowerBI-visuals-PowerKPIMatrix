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

import { IVisualComponent } from "./visualComponent";
import { IVisualComponentConstructorOptions } from "./visualComponentConstructorOptions";
import { IVisualComponentRenderOptionsBase } from "./visualComponentRenderOptionsBase";

export abstract class LazyComponent implements IVisualComponent {
    private _instance: IVisualComponent;

    constructor(private options: IVisualComponentConstructorOptions) { }

    public render(options: IVisualComponentRenderOptionsBase): void {
        this.component.render(options);
    }

    public clear(): void {
        this.component.clear();
    }

    public destroy(): void {
        if (this._instance) {
            this._instance.destroy();
        }

        this._instance = null;
    }

    protected abstract createInstance(options: IVisualComponentConstructorOptions): IVisualComponent;

    private get component() {
        if (!this._instance) {
            this._instance = this.createInstance(this.options);
        }

        return this._instance;
    }
}

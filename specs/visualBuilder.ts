/*
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

import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";

import { PowerKPIMatrix } from "../src/visual";

export class VisualBuilder extends VisualBuilderBase<PowerKPIMatrix> {
    protected build(): PowerKPIMatrix {
        return new PowerKPIMatrix({
            element: this.element.get(0),
            host: this.visualHost,
        });
    }

    public get instance(): PowerKPIMatrix {
        return this.visual;
    }

    public get $root(): JQuery {
        return this.element.children(".powerKPIMatrix_rootComponent");
    }

    public get $cells(): JQuery {
        return this.$root.find(".cellComponent");
    }
}

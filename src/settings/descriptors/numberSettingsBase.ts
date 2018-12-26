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

import { FontSettings } from "./fontSettings";

export class NumberSettingsBase extends FontSettings {
    public format: string = null;
    public defaultFormat: string = null;
    public columnFormat: string = null;

    public displayUnits: number = 0;
    public precision: number = null;

    public textReplacement: string = null;

    protected minPrecision: number = 0;
    protected maxPrecision: number = 17;

    public parse() {
        this.precision = this.getValidPrecision(this.precision);

        super.parse();
    }

    public getFormat(): string {
        return this.format || this.columnFormat || this.defaultFormat;
    }

    public setColumnFormat(format: string) {
        if (!format) {
            return;
        }

        this.columnFormat = format;
    }

    protected getValidPrecision(precision: number): number {
        if (isNaN(precision) || precision == null) {
            return precision;
        }

        return Math.min(
            Math.max(this.minPrecision, precision),
            this.maxPrecision);
    }

    protected hideNumericProperties(): void {
        Object.defineProperties(this, {
            displayUnits: {
                configurable: true,
                enumerable: false,
            },
            precision: {
                configurable: true,
                enumerable: false,
            },
        });
    }

    protected hideFormatProperty(): void {
        Object.defineProperty(
            this,
            "format", {
                configurable: true,
                enumerable: false,
            },
        );
    }
}

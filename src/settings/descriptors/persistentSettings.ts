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

export class PersistentSettings extends SettingsPropertyBase implements SettingsWithParser {
    public show: boolean = false;
    public value: string = "";

    public columnMapping: string = "";
    public table: string = "";
    public settings: string = "";

    constructor() {
        super();

        this.isEnumerable = false;
    }

    public parse() {
        if (!this.columnMapping
            && !this.table
            && !this.settings
            && this.value
        ) {
            try {
                const parsedValue: PersistentSettings = JSON.parse(this.value);

                this.columnMapping = this.getSerializedObject(parsedValue && parsedValue.columnMapping);
                this.table = this.getSerializedObject(parsedValue && parsedValue.table);
            } catch (_) { }
        }
    }

    private getSerializedObject(originObject: any): string {
        if (!originObject) {
            return "";
        }

        try {
            return JSON.stringify(originObject) || "";
        } catch (_) {
            return "";
        }
    }

}

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

export class ColumnMappingState extends State<DataRepresentationColumnMapping> {
    private currentRowName: string;

    constructor() {
        super();

        this.state = {};
    }

    public setRow(rowName: string): ColumnMappingState {
        this.state[rowName] = this.state[rowName]
            ? this.state[rowName]
            : {};

        return this;
    }

    public isCurrentRowSet(): boolean {
        return this.currentRowName !== undefined
            && this.currentRowName !== null;
    }

    public setCurrentRowName(rowName: string): ColumnMappingState {
        this.currentRowName = rowName;

        return this;
    }

    public setColumn(columnName: string, displayName: string): ColumnMappingState {
        this.state[this.currentRowName][columnName] = displayName || undefined;

        return this;
    }

    public getSelectedValueByColumnName(columnName: string): string {
        if (!this.currentRowName || !this.state[this.currentRowName]) {
            return null;
        }

        return this.state[this.currentRowName][columnName] || null;
    }

    public getColumnMapping(): DataRepresentationColumnMapping {
        return this.state;
    }

    public applyDefaultRows(rowNames: string[]): ColumnMappingState {
        (rowNames || []).forEach((rowName: string) => {
            this.setRow(rowName);
        });

        return this;
    }

    public save(): ISettingsServiceItem[] {
        return [{
            objectName: "internalState",
            selectionId: null,
            properties: {
                columnMapping: this.serializeState(),
            }
        }];
    }
}

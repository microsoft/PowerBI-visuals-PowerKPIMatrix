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

import { IVisualDataColumn } from "../../../columns/visualDataColumn";
import { IConverter } from "../../converter";
import { IConverterOptions } from "../../converterOptions";

export class DataDirector<DataType> {
    private dataColumn: IVisualDataColumn;

    private rowBasedModelConverter: IConverter<DataType>;
    private columnBasedModelConverter: IConverter<DataType>;

    constructor(
        dataColumn: IVisualDataColumn,
        rowBasedModelConverter: IConverter<DataType>,
        columnBasedModelConverter: IConverter<DataType>,
    ) {
        this.dataColumn = dataColumn;

        this.rowBasedModelConverter = rowBasedModelConverter;
        this.columnBasedModelConverter = columnBasedModelConverter;
    }

    public convert(options: IConverterOptions): DataType {
        const converter: IConverter<DataType> =
            this.getConverter(options
                && options.dataView
                && options.dataView.table
                && options.dataView.table.columns
                || [],
            );

        return converter && converter.convert(options);
    }

    private getConverter(columns: powerbi.DataViewMetadataColumn[] = []): IConverter<DataType> {
        for (const column of columns) {
            if (column.roles && column.roles[this.dataColumn.name]) {
                return this.rowBasedModelConverter;
            }
        }

        return this.columnBasedModelConverter;
    }
}

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

import { actualValueColumn } from "../../columns/actualValueColumn";
import { comparisonValueColumn } from "../../columns/comparisonValueColumn";
import { kpiIndicatorIndexColumn } from "../../columns/kpiIndicatorIndexColumn";
import { kpiIndicatorValueColumn } from "../../columns/kpiIndicatorValueColumn";
import { rowBasedMetricNameColumn } from "../../columns/rowBasedMetricNameColumn";
import { secondComparisonValueColumn } from "../../columns/secondComparisonValueColumn";
import { secondKPIIndicatorValueColumn } from "../../columns/secondKPIIndicatorValueColumn";
import { IVisualDataColumn } from "../../columns/visualDataColumn";

import { IConverter } from "../converter";
import { IConverterOptions } from "../converterOptions";

import { IDataRepresentationColumnSet } from "../columnSet/dataRepresentation/dataRepresentationColumnSet";

export class ColumnSetConverter implements IConverter<IDataRepresentationColumnSet> {
    public convert(options: IConverterOptions): IDataRepresentationColumnSet {
        const { dataView } = options;

        const dataMapping: IDataRepresentationColumnSet = this.getDefaultColumnSet();

        if (!dataView
            || !dataView.table
            || !dataView.table.columns
        ) {
            return dataMapping;
        }

        dataView.table.columns.forEach((column: powerbi.DataViewMetadataColumn) => {
            if (column.roles) {
                Object.keys(column.roles).forEach((roleName: string) => {
                    if (dataMapping[roleName]) {
                        dataMapping[roleName].push(column.displayName);

                        dataMapping[roleName].sort();
                    }
                });
            }
        });

        return dataMapping;
    }

    private getDefaultColumnSet(): IDataRepresentationColumnSet {
        const dataMapping: IDataRepresentationColumnSet = {};

        [
            actualValueColumn,
            comparisonValueColumn,
            kpiIndicatorIndexColumn,
            kpiIndicatorValueColumn,
            secondComparisonValueColumn,
            secondKPIIndicatorValueColumn,
            rowBasedMetricNameColumn,
        ].forEach((column: IVisualDataColumn) => {
            dataMapping[column.name] = [];
        });

        return dataMapping;
    }
}

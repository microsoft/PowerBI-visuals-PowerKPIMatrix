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

import {
    displayUnitSystemType as displayUnitSystemTypeModule,
    valueFormatter,
} from "powerbi-visuals-utils-formattingutils";

import { DataRepresentationAxisValueType } from "../converter/data/dataRepresentation/dataRepresentationAxisValueType";
import { DataRepresentationTypeEnum } from "../converter/data/dataRepresentation/dataRepresentationType";

import { AsOfDateSettings } from "../settings/descriptors/asOfDateSettings";

export class FormattingUtils {
    public static getFormatterOfAxisValue(
        min: DataRepresentationAxisValueType,
        max: DataRepresentationAxisValueType,
        type: DataRepresentationTypeEnum,
        metadata: powerbi.DataViewMetadataColumn,
        settings: AsOfDateSettings,
    ): valueFormatter.IValueFormatter {

        switch (type) {
            case DataRepresentationTypeEnum.NumberType: {
                return this.getValueFormatter(
                    settings.displayUnits || min,
                    undefined,
                    metadata,
                    settings.precision,
                    settings.getFormat());
            }
            default: {
                return this.getValueFormatter(
                    min,
                    max,
                    metadata,
                    undefined,
                    settings.getFormat(),
                    undefined);
            }
        }
    }

    public static getValueFormatter(
        min: DataRepresentationAxisValueType,
        max: DataRepresentationAxisValueType,
        metadata?: powerbi.DataViewMetadataColumn,
        precision?: number,
        format?: string,
        displayUnitSystemType: displayUnitSystemTypeModule.DisplayUnitSystemType
            = displayUnitSystemTypeModule.DisplayUnitSystemType.WholeUnits,
    ): valueFormatter.IValueFormatter {
        return valueFormatter.valueFormatter.create({
            columnType: metadata && metadata.type,
            displayUnitSystemType,
            format,
            precision,
            value: min,
            value2: max,
        });
    }

    public static getFormattedValue(value: number, formatter: valueFormatter.IValueFormatter): string {
        if (isNaN(value)) {
            return "";
        }

        if (formatter) {
            return formatter.format(value);
        }

        return `${value}`;
    }
}

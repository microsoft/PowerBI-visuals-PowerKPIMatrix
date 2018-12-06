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

import { IVisualDataColumn } from "../../columns/visualDataColumn";
import { BaseContainerComponent } from "../baseContainerComponent";
import { IVisualComponentRenderOptions } from "../visualComponentRenderOptions";
import { IVisualComponentRenderOptionsBase } from "../visualComponentRenderOptionsBase";
import { IColumnMappingColumnSelectorConstructorOptions } from "./columnMappingColumnSelectorConstructorOptions";
import { IColumnMappingDropDownComponentRenderOptions } from "./columnMappingDropDownComponentRenderOptions";
import { IColumnMappingDropDownComponentState } from "./columnMappingDropDownComponentState";
import { ColumnMappingGroupComponent } from "./columnMappingGroupComponent";
import { IColumnMappingGroupRenderOptions } from "./columnMappingGroupRenderOptions";

export class ColumnMappingColumnSelectorComponent extends BaseContainerComponent {
    private className: string = "columnMappingColumnSelectorComponent";

    private title: string = "";
    private columns: IVisualDataColumn[];

    private onChange: (columnName: string, displayName: string, options: IVisualComponentRenderOptionsBase) => void;
    private getSelectedValueByColumnName: (columnName: string, values: string[]) => string;

    constructor(options: IColumnMappingColumnSelectorConstructorOptions) {
        super();

        this.element = options.element
            .append("div")
            .classed(this.className, true);

        this.title = options.title;
        this.columns = options.columns;

        this.onChange = options.onChange;
        this.getSelectedValueByColumnName = options.getSelectedValueByColumnName;

        this.components = [
            new ColumnMappingGroupComponent({ element: this.element }),
        ];
    }

    public render(options: IVisualComponentRenderOptions): void {
        super.render(this.getColumnMappingGroupRenderOptions(options));
    }

    public getState(): IColumnMappingDropDownComponentState {
        return this.components[0].getState() as IColumnMappingDropDownComponentState;
    }

    private getColumnMappingGroupRenderOptions(options: IVisualComponentRenderOptions): IColumnMappingGroupRenderOptions {
        return {
            groups: this.getDropDownRenderOptions(options),
            title: this.title,
        };
    }

    private getDropDownRenderOptions(options: IVisualComponentRenderOptions): IColumnMappingDropDownComponentRenderOptions[] {
        const { columnSet } = options;

        return this.columns.map((column: IVisualDataColumn) => {
            const emptyValues: string[] = column.emptyValues || [];

            const columnValues: string[] = columnSet[column.name] || [];

            const values: string[] = emptyValues.concat(columnValues);

            const selectedValue: string = this.getSelectedValueByColumnName(column.name, values) || emptyValues[0];

            return {
                helpMessage: column.helpMessage,
                name: column.displayName as string,
                onChange: (value: string) => {
                    const currentValue: string = emptyValues.indexOf(value) >= 0
                        ? undefined
                        : value;

                    this.onChange(column.name, currentValue, options);
                },
                selectedValue,
                values,
            };
        });
    }
}

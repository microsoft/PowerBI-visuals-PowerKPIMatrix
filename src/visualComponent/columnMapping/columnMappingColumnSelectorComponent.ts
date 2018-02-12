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

namespace powerbi.extensibility.visual {
    export class ColumnMappingColumnSelectorComponent extends BaseContainerComponent {
        private className: string = "columnMappingColumnSelectorComponent";

        private title: string = "";
        private columns: VisualDataColumn[];

        private onChange: (columnName: string, displayName: string, options: VisualComponentRenderOptionsBase) => void;
        private getSelectedValueByColumnName: (columnName: string, values: string[]) => string;

        constructor(options: ColumnMappingColumnSelectorConstructorOptions) {
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

        render(options: VisualComponentRenderOptions): void {
            super.render(this.getColumnMappingGroupRenderOptions(options));
        }

        private getColumnMappingGroupRenderOptions(options: VisualComponentRenderOptions): ColumnMappingGroupRenderOptions {
            return {
                title: this.title,
                groups: this.getDropDownRenderOptions(options)
            };
        }

        private getDropDownRenderOptions(options: VisualComponentRenderOptions): ColumnMappingDropDownComponentRenderOptions[] {
            const { columnSet } = options;

            return this.columns.map((column: VisualDataColumn) => {
                const emptyValues: string[] = column.emptyValues || [];

                const columnValues: string[] = columnSet[column.name] || [];

                const values: string[] = emptyValues.concat(columnValues);

                const selectedValue: string = this.getSelectedValueByColumnName(column.name, values) || emptyValues[0];

                return {
                    values,
                    selectedValue,
                    helpMessage: column.helpMessage,
                    name: column.displayName as string,
                    onChange: (value: string) => {
                        let currentValue: string = emptyValues.indexOf(value) >= 0
                            ? undefined
                            : value;

                        this.onChange(column.name, currentValue, options);
                    }
                };
            });
        }

        public getState(): ColumnMappingDropDownComponentState {
            return this.components[0].getState() as ColumnMappingDropDownComponentState;
        }
    }
}
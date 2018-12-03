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

namespace powerbi.visuals.samples.powerKPIMatrix {
    // jsCommon
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

    export class ColumnMappingComponent extends BaseContainerComponent {
        private className: string = "columnMappingComponent";

        private rootElement: D3.Selection;
        private scrollableElement: D3.Selection;

        private rootElementSelector: ClassAndSelector = createClassAndSelector("columnMappingComponent_root");
        private scrollableElementSelector: ClassAndSelector = createClassAndSelector("columnMappingComponent_scrollable");

        private stateService: StateService;

        constructor(options: VisualComponentConstructorOptions) {
            super();

            this.stateService = options.stateService;

            this.element = options.element
                .append("div")
                .classed(this.className, true);

            this.rootElement = this.element
                .append("div")
                .classed(this.rootElementSelector.class, true);

            this.scrollableElement = this.rootElement
                .append("div")
                .classed(this.scrollableElementSelector.class, true);

            const header: VisualComponent = new ColumnMappingHeaderComponent({
                element: this.rootElement,
            });

            const row: VisualComponent = new ColumnMappingColumnSelectorComponent({
                element: this.scrollableElement,
                title: "Select the Row to map to additional columns from your data model",
                columns: [actualValueColumn],
                onChange: (columnName: string, displayName: string, options: VisualComponentRenderOptions) => {
                    if (!this.stateService.states.columnMapping) {
                        return;
                    }

                    this.stateService.states.columnMapping
                        .setRow(displayName)
                        .setCurrentRowName(displayName);

                    this.render(options);
                },
                getSelectedValueByColumnName: (columnName: string, values: string[]) => {
                    if (!this.stateService.states.columnMapping.isCurrentRowSet()) {
                        const defaultValue: string = values[0];

                        this.stateService.states.columnMapping.setCurrentRowName(defaultValue);

                        return defaultValue;
                    }

                    return undefined;
                }
            });

            const columns: VisualComponent = new ColumnMappingColumnSelectorComponent({
                element: this.scrollableElement,
                title: "Link to the associated columns from your data model",
                columns: [
                    comparisonValueColumn,
                    kpiIndicatorIndexColumn,
                    kpiIndicatorValueColumn,
                    secondComparisonValueColumn,
                    secondKPIIndicatorValueColumn,
                ],
                onChange: (columnName: string, displayName: string) => {
                    if (!this.stateService.states.columnMapping) {
                        return;
                    }

                    const rowName: string = row.getState()[actualValueColumn.displayName as string];

                    this.stateService.states.columnMapping
                        .setRow(rowName)
                        .setCurrentRowName(rowName)
                        .setColumn(columnName, displayName);
                },
                getSelectedValueByColumnName: (columnName: string) => {
                    return this.stateService.states.columnMapping.getSelectedValueByColumnName(columnName);
                }
            });

            const footer: VisualComponent = new ColumnMappingFooterComponent({
                element: this.rootElement,
                buttons: [
                    {
                        buttonText: "Apply",
                        onClick: this.onApply.bind(this)
                    }
                ]
            });

            this.components = [
                header,
                row,
                columns,
                footer
            ];
        }

        render(options: VisualComponentRenderOptions): void {
            if (options.isAdvancedEditModeTurnedOn) {
                this.show();
            } else {
                this.hide();
            }

            super.render(options);
        }

        public destroy(): void {
            this.stateService = null;

            super.destroy();
        }

        private onApply(): void {
            this.stateService.save(true);
        }
    }
}

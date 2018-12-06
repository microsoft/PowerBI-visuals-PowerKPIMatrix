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

import { Selection } from "d3-selection";

import { CssConstants } from "powerbi-visuals-utils-svgutils";

import { actualValueColumn } from "../../columns/actualValueColumn";
import { comparisonValueColumn } from "../../columns/comparisonValueColumn";
import { kpiIndicatorIndexColumn } from "../../columns/kpiIndicatorIndexColumn";
import { kpiIndicatorValueColumn } from "../../columns/kpiIndicatorValueColumn";
import { secondComparisonValueColumn } from "../../columns/secondComparisonValueColumn";
import { secondKPIIndicatorValueColumn } from "../../columns/secondKPIIndicatorValueColumn";

import { StateService } from "../../services/state/stateService";

import { BaseContainerComponent } from "../baseContainerComponent";
import { IVisualComponent } from "../visualComponent";
import { IVisualComponentConstructorOptions } from "../visualComponentConstructorOptions";
import { IVisualComponentRenderOptions } from "../visualComponentRenderOptions";

import { ColumnMappingColumnSelectorComponent } from "./columnMappingColumnSelectorComponent";
import { ColumnMappingFooterComponent } from "./columnMappingFooterComponent";
import { ColumnMappingHeaderComponent } from "./columnMappingHeaderComponent";

export class ColumnMappingComponent extends BaseContainerComponent {
    private className: string = "columnMappingComponent";

    private rootElement: Selection<any, any, any, any>;
    private scrollableElement: Selection<any, any, any, any>;

    private rootElementSelector: CssConstants.ClassAndSelector
        = CssConstants.createClassAndSelector("columnMappingComponent_root");

    private scrollableElementSelector: CssConstants.ClassAndSelector
        = CssConstants.createClassAndSelector("columnMappingComponent_scrollable");

    private stateService: StateService;

    constructor(options: IVisualComponentConstructorOptions) {
        super();

        this.stateService = options.stateService;

        this.element = options.element
            .append("div")
            .classed(this.className, true);

        this.rootElement = this.element
            .append("div")
            .classed(this.rootElementSelector.className, true);

        this.scrollableElement = this.rootElement
            .append("div")
            .classed(this.scrollableElementSelector.className, true);

        const header: IVisualComponent = new ColumnMappingHeaderComponent({
            element: this.rootElement,
        });

        const row: IVisualComponent = new ColumnMappingColumnSelectorComponent({
            columns: [actualValueColumn],
            element: this.scrollableElement,
            getSelectedValueByColumnName: (columnName: string, values: string[]) => {
                if (!this.stateService.states.columnMapping.isCurrentRowSet()) {
                    const defaultValue: string = values[0];

                    this.stateService.states.columnMapping.setCurrentRowName(defaultValue);

                    return defaultValue;
                }

                return undefined;
            },
            onChange: (
                columnName: string,
                displayName: string,
                onChangeOptions: IVisualComponentRenderOptions,
            ) => {
                if (!this.stateService.states.columnMapping) {
                    return;
                }

                this.stateService.states.columnMapping
                    .setRow(displayName)
                    .setCurrentRowName(displayName);

                this.render(onChangeOptions);
            },

            title: "Select the Row to map to additional columns from your data model",
        });

        const columns: IVisualComponent = new ColumnMappingColumnSelectorComponent({
            columns: [
                comparisonValueColumn,
                kpiIndicatorIndexColumn,
                kpiIndicatorValueColumn,
                secondComparisonValueColumn,
                secondKPIIndicatorValueColumn,
            ],
            element: this.scrollableElement,
            getSelectedValueByColumnName: (columnName: string) => {
                return this.stateService.states.columnMapping.getSelectedValueByColumnName(columnName);
            },
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
            title: "Link to the associated columns from your data model",

        });

        const footer: IVisualComponent = new ColumnMappingFooterComponent({
            buttons: [
                {
                    buttonText: "Apply",
                    onClick: this.onApply.bind(this),
                },
            ],
            element: this.rootElement,
        });

        this.components = [
            header,
            row,
            columns,
            footer,
        ];
    }

    public render(options: IVisualComponentRenderOptions): void {
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

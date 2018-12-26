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

import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { TableType } from "../../../settings/descriptors/tableSettings";
import { ScrollUtils } from "../../../utils/scrollUtils";
import { IVisualComponent } from "../../visualComponent";
import { IVisualComponentConstructorOptions } from "../../visualComponentConstructorOptions";
import { CellComponent } from "../cell/cellComponent";
import { ICellState } from "../cell/cellState";
import { TextCellComponent } from "../cell/text/textCellComponent";
import { ITextCellRenderOptions } from "../cell/text/textCellRenderOptions";
import { RowComponent } from "../row/rowComponent";
import { IRowComponentConstructorOptions } from "../row/rowComponentConstructorOptions";
import { IHeaderRowRenderOptions } from "./headerRowRenderOptions";

export class HeaderRowComponent extends RowComponent {
    private extraClassName: string = "headerRowComponent";
    private componentContainerClassName: string = "headerRowComponent_container";

    private maxSize: number = 200;

    constructor(options: IRowComponentConstructorOptions) {
        super(options);

        this.initHorizontalDraggableComponent(this.options);

        this.name = "__#__headerRowComponent__#__"; // Don't change this value. This value is used for state mapping

        this.element.classed(this.extraClassName, true);
        this.containerElement.classed(this.componentContainerClassName, true);
    }

    public render(options: IHeaderRowRenderOptions): void {
        const {
            settings,
            columnNames,
            columnOrders,
        } = options;

        this.tableType = settings.table.type;

        if (settings && settings.header && settings.header.show) {
            this.initCells(columnNames.length);

            this.updateGrid(settings.horizontalGrid, settings.verticalGrid);

            this.show();

            this.components.forEach((component: IVisualComponent, componentIndex: number) => {
                const order: number = columnOrders[componentIndex];

                const componentRenderOptions: ITextCellRenderOptions = {
                    fontSettings: settings.header,
                    order,
                    value: columnNames[componentIndex],
                };

                component.render(componentRenderOptions);

                this.verticalDraggableComponents[componentIndex].updateOrder(order);
            });

            this.applyFontSettings(settings.header);
        } else {
            this.hide();
        }

        this.applyState(this.options.stateService.states.table.getRowStateSet()[this.name]);
    }

    public scrollTo(
        xOffset: number,
        yOffset: number,
        scrollbarWidth: number,
        scrollbarHeight: number,
    ): void {
        if (!this.containerElement) {
            return;
        }

        let marginRight: string = null;
        let marginBottom: string = null;

        switch (this.tableType) {
            case TableType.RowBasedKPIS: {
                marginRight = pixelConverter.toString(scrollbarWidth);

                break;
            }
            case TableType.ColumnBasedKPIS: {
                marginBottom = pixelConverter.toString(scrollbarHeight);

                break;
            }
        }

        ScrollUtils.d3ScrollTo(this.containerElement, xOffset, yOffset);

        this.containerElement
            .style("margin-bottom", marginBottom)
            .style("margin-right", marginRight);
    }

    public resetScroll(): void {
        this.scrollTo(0, 0, 0, 0);
    }

    protected onSizeChange(width: number, height: number): void {
        let currentHeight: number = height;
        let currentWidth: number = width;

        if (this.tableType === TableType.RowBasedKPIS
            && !isNaN(currentHeight)
            && currentHeight !== null
        ) {
            currentHeight = Math.min(currentHeight, this.maxSize);
        } else if (this.tableType === TableType.ColumnBasedKPIS
            && !isNaN(currentWidth)
            && currentWidth !== null
        ) {
            currentWidth = Math.min(currentWidth, this.maxSize);
        }

        super.onSizeChange(currentWidth, currentHeight);
    }

    private initCells(cellsLength: number): void {
        this.destroyComponentsByLength(this.components, cellsLength);
        this.destroyComponentsByLength(this.verticalDraggableComponents, cellsLength);

        if (this.components.length < cellsLength) {
            const constructorOptions: IVisualComponentConstructorOptions = {
                element: this.containerElement,
            };

            for (
                let index: number = this.components.length;
                index < cellsLength;
                index++
            ) {
                this.initCellElement(constructorOptions, index);
            }
        }
    }

    private initCellElement(
        constructorOptions: IVisualComponentConstructorOptions,
        index: number,
    ): void {
        const cell: CellComponent = new TextCellComponent(constructorOptions);

        this.pushComponent(
            cell,
            {
                element: this.containerElement,
                onDrag: (width: number, height: number) => {
                    this.onCellSizeChange(width, height, index);
                },
                onDragStart: () => {
                    const cellState: ICellState = cell.getState();

                    return {
                        x: cellState.width,
                        y: cellState.height,
                    };
                },
                onSaveState: this.options.onSaveState,
                scaleService: this.options.scaleService,
                width: this.options.defaultMargin,
            });
    }

    private destroyComponentsByLength(components: IVisualComponent[], length: number): void {
        components
            .splice(length)
            .forEach((component: IVisualComponent) => {
                component.clear();
                component.destroy();
            });
    }
}

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
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    export abstract class RowComponent
        extends BaseContainerComponent
        implements RowElementsVisibility {

        private containerClassName: string = "rowComponent_container";
        protected className: string = "rowComponent";

        protected tableType: TableType = TableType.RowBasedKPIS;

        protected containerElement: d3.Selection<any>;

        protected horizontalDraggableComponent: DraggableComponent;
        protected verticalDraggableComponents: DraggableComponent[] = [];

        /**
         * Name of the row
         */
        protected name: string;

        protected options: RowComponentConstructorOptions;

        constructor(options: RowComponentConstructorOptions) {
            super();

            this.options = options;

            this.element = options.element
                .append("div")
                .classed(this.className, true);

            this.containerElement = this.element
                .append("div")
                .classed(this.containerClassName, true);

            this.components = [];
        }

        protected initHorizontalDraggableComponent(options: RowComponentConstructorOptions): void {
            if (this.horizontalDraggableComponent) {
                return;
            }

            this.horizontalDraggableComponent = new DraggableComponent({
                element: this.element,
                scaleService: options.scaleService,
                onDragStart: this.getPoint.bind(this),
                onDrag: this.onSizeChange.bind(this),
                onSaveState: options.onSaveState,
                height: options.defaultMargin,
            });
        }

        protected getCellByIndex(index: number): CellComponent {
            if (!this.components) {
                return null;
            }

            return this.components[index] instanceof CellComponent
                ? this.components[index] as CellComponent
                : null;
        }

        protected applyState(state: RowState): void {
            if (!this.options.stateService) {
                return;
            }

            if (!state || !state.cellSet || !state.cellSet[this.tableType]) {
                let width: number;
                let height: number;

                if (this.components
                    && this.components[0] instanceof CellComponent
                    && this.components[0].getState
                ) {
                    const cellState: CellState = (this.components[0] as CellComponent).getState();

                    width = cellState.width;
                    height = cellState.height;
                }

                const [widthReverted, heightReverted] = this.tableType === TableType.ColumnBasedKPIS
                    ? [height, width]
                    : [width, height];

                const currentWidth: number = this.tableType === TableType.ColumnBasedKPIS
                    ? widthReverted
                    : undefined;

                const currentHeight: number = this.tableType === TableType.RowBasedKPIS
                    ? heightReverted
                    : undefined;

                this.components.forEach((_, componentIndex: number) => {
                    this.updateCellComponentSizeByIndex(currentWidth, currentHeight, componentIndex);
                });

                this.updateSize(width, height);

                this.updateSizeBasedOnChildren();

                return;
            }

            this.components.forEach((component: CellComponent, cellIndex: number) => {
                const cellState: CellState = state.cellSet[this.tableType][cellIndex]
                    || (this.components && this.components[0] && (this.components[0] as CellComponent).getState());

                if (cellState) {
                    if (cellIndex === 0) {
                        let { width, height } = cellState;

                        if (this.tableType === TableType.ColumnBasedKPIS) {
                            [width, height] = [height, width];
                        }

                        this.updateSize(width, height);
                    }

                    this.updateCellComponentSizeByIndex(
                        cellState.width,
                        cellState.height,
                        cellIndex
                    );
                }
            });

            this.updateSizeBasedOnChildren();
        }

        private getPoint(): any { // : IPoint
            let cellState: CellState = {
                width: 0,
                height: 0,
            };

            for (const component of this.components) {
                if (component && component.getState) {
                    cellState = (component as CellComponent).getState();

                    break;
                }
            }

            return {
                x: cellState.width,
                y: cellState.height
            };
        }

        protected onSizeChange(width: number, height: number): void {
            this.components.forEach((component: CellComponent, componentIndex: number) => {
                if (component instanceof CellComponent) {
                    const currentWidth: number = this.tableType === TableType.RowBasedKPIS
                        ? undefined
                        : width;

                    const currentHeight: number = this.tableType === TableType.ColumnBasedKPIS
                        ? undefined
                        : height;

                    component.updateSize(currentWidth, currentHeight);

                    if (componentIndex === 1) {
                        const cellState: CellState = component.getState();

                        this.updateSize(undefined, this.tableType === TableType.RowBasedKPIS
                            ? cellState.height
                            : cellState.width);
                    }
                }
            });
        }

        protected updateSize(width: number, height: number): void {
            if (this.tableType === TableType.ColumnBasedKPIS) {
                [width, height] = [height, width];
            }

            let heightStr: string = null;
            let widthStr: string = null;

            switch (this.tableType) {
                case TableType.RowBasedKPIS: {
                    heightStr = height !== undefined && height !== null
                        ? PixelConverter.toString(height)
                        : null;

                    break;
                }
                case TableType.ColumnBasedKPIS: {
                    widthStr = width !== undefined && width !== null
                        ? PixelConverter.toString(width)
                        : null;

                    break;
                }
            }

            this.containerElement.style({
                height: heightStr,
                width: widthStr
            });
        }

        protected updateSizeBasedOnChildren(): void {
            if (!this.horizontalDraggableComponent) {
                return;
            }

            let width: number = this.getWidth();
            let height: number;

            if (this.tableType === TableType.ColumnBasedKPIS) {
                [width, height] = [height, width];
            }

            this.horizontalDraggableComponent.updateSize(width, height, true);
        }

        protected pushComponent(component: VisualComponent, options: DraggableConstructorOptions): void {
            this.components.push(component);
            this.verticalDraggableComponents.push(new DraggableComponent(options));
        }

        protected applyFontSettings(fontSettings: FontSettings): void {
            if (!this.element || !fontSettings) {
                return;
            }

            this.element
                .style({
                    "font-size": PixelConverter.toString(PixelConverter.fromPointToPixel(fontSettings.textFontSize)),
                    "font-family": fontSettings.fontFamily
                })
                .classed(this.italicClassName, fontSettings.isItalic)
                .classed(this.boldClassName, fontSettings.isBold);
        }

        public getWidth(): number {
            const viewport: IViewport = this.getSize([
                ...this.components,
                ...this.verticalDraggableComponents,
            ]);

            switch (this.tableType) {
                case TableType.ColumnBasedKPIS: {
                    return viewport.height;
                }
                case TableType.RowBasedKPIS:
                default: {
                    return viewport.width;
                }
            }
        }

        public getHeight(shouldConsiderSplitter: boolean = true): number {
            const components: VisualComponent[] = [];

            this.components.some((component: VisualComponent) => {
                if (component && component.isShown) {
                    components.push(component);

                    return true;
                }

                return false;
            });

            if (shouldConsiderSplitter) {
                components.push(this.horizontalDraggableComponent);
            }

            switch (this.tableType) {
                case TableType.ColumnBasedKPIS: {
                    return this.getSize(components).width;
                }
                case TableType.RowBasedKPIS:
                default: {
                    return this.getSize(components).height;
                }
            }
        }

        private getSize(components: VisualComponent[]): IViewport {
            return (components || []).reduce(
                (viewport: IViewport, component: VisualComponent) => {
                    if (component && component.isShown && component.getState) {
                        const cellState: CellState = component.getState() as CellState;

                        viewport.height += cellState.height;
                        viewport.width += cellState.width;
                    }

                    return viewport;
                },
                {
                    width: 0,
                    height: 0
                }
            );
        }

        public clear(): void {
            if (this.containerElement) {
                this.containerElement
                    .selectAll("*")
                    .remove();
            }

            super.clear();
        }

        public destroy(): void {
            if (this.containerElement) {
                this.containerElement.remove();
            }

            this.containerElement = null;

            [
                this.horizontalDraggableComponent,
                ...this.verticalDraggableComponents
            ].forEach((component: DraggableComponent) => {
                if (component) {
                    component.destroy();
                }
            });

            this.horizontalDraggableComponent = null;
            this.verticalDraggableComponents = null;

            super.destroy();
        }

        public updateCellComponentSizeByIndex(width: number, height: number, cellIndex: number): void {
            const component: CellComponent = this.getCellByIndex(cellIndex);

            if (component && component.updateSize) {
                component.updateSize(width, height);
            }
        }

        public updateSizeOfCellByIndex(width: number, height: number, cellIndex: number): void {
            this.updateCellComponentSizeByIndex(width, height, cellIndex);

            this.updateSizeBasedOnChildren();
        }

        public getState(): RowState {
            const state: RowState = {
                name: this.name,
                cellSet: {
                    [this.tableType]: [],
                },
            };

            if (this.components) {
                this.components.forEach((component: VisualComponent) => {
                    if (component && component.getState) {
                        state.cellSet[this.tableType].push(component.getState() as CellState);
                    }
                });
            }

            return state;
        }

        public updateGrid(
            horizontalGridSettings: GridSettings,
            verticalGridSettings: GridSettings
        ): void {
            if (this.tableType === TableType.ColumnBasedKPIS) {
                [horizontalGridSettings, verticalGridSettings] = [verticalGridSettings, horizontalGridSettings];
            }

            this.updateDraggableComponents(
                [this.horizontalDraggableComponent],
                horizontalGridSettings,
                true
            );

            this.updateDraggableComponents(
                this.verticalDraggableComponents,
                verticalGridSettings,
                false
            );

            this.updateBorder(verticalGridSettings);
        }

        protected updateBorder(verticalGridSettings: GridSettings): void {
            const border: string = this.getStringRepresentationOfBorderByGridSettings(verticalGridSettings);

            this.element.style({
                "border-top": this.tableType === TableType.ColumnBasedKPIS
                    ? border
                    : null,
                "border-left": this.tableType === TableType.RowBasedKPIS
                    ? border
                    : null,
            });
        }

        protected getStringRepresentationOfBorderByGridSettings(gridSettings: GridSettings): string {
            return gridSettings && gridSettings.show
                ? `${PixelConverter.toString(gridSettings.thickness)} solid ${gridSettings.color}`
                : null;
        }

        private updateDraggableComponents(
            components: DraggableComponent[],
            gridSettings: GridSettings,
            isHorizontal: boolean = true,
        ): void {
            const size: number = gridSettings.show
                ? gridSettings.thickness
                : this.options.defaultMargin;

            const color: string = gridSettings.show
                ? gridSettings.color
                : null;

            let [width, height] = [size, size];

            if (isHorizontal) {
                width = undefined;
            } else {
                height = undefined;
            }

            if (this.tableType === TableType.ColumnBasedKPIS) {
                [width, height] = [height, width];
            }

            components.forEach((component: DraggableComponent) => {
                if (component) {
                    component.updateSize(width, height);

                    component.updateColor(color);
                }
            });
        }

        public updateVisibility(visibilities: boolean[]): void {
            if (!this.components || !this.verticalDraggableComponents) {
                return;
            }

            this.updateVisibilityOfComponents(
                visibilities,
                this.components,
                this.verticalDraggableComponents);

            this.updateSizeBasedOnChildren();
        }

        protected updateVisibilityOfComponents(
            visibilities: boolean[],
            components: VisualComponent[],
            verticalDraggableComponents: VisualComponent[]
        ): void {
            for (
                let componentIndex: number = 0;
                componentIndex < components.length;
                componentIndex++
            ) {
                const visibility: boolean = visibilities[componentIndex];

                [
                    components[componentIndex],
                    verticalDraggableComponents[componentIndex]
                ].forEach((component: VisualComponent) => {
                    if (component) {
                        if (visibility) {
                            component.show();
                        } else {
                            component.hide();
                        }
                    }
                });
            }

            this.updateSizeBasedOnChildren();
        }

        protected onCellSizeChange(width: number, height: number, index: number): void {
            if (!this.options || !this.options.onCellSizeChange) {
                return;
            }

            const currentWidth: number = this.tableType === TableType.RowBasedKPIS
                ? width
                : undefined;

            const currentHeight: number = this.tableType === TableType.ColumnBasedKPIS
                ? height
                : undefined;

            this.options.onCellSizeChange(currentWidth, currentHeight, index);
        }
    }
}
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
    export enum BodyRowComponentViewMode { // Enum's values are used as class name for CSS
        tabular,
        common,
    }

    export abstract class BaseBodyRowComponent extends RowComponent {
        protected extraClassName: string = "bodyRowComponent";

        protected bodyOptions: BodyRowConstructorOptions;
        protected cellOptions: CollapserCellConstructorOptions;

        protected rootContainerClassName: string = "bodyRowComponent_root_container";
        protected childrenContainerClassName: string = "bodyRowComponent_children_container";

        protected level: number = 0;

        protected childrenContainer: D3.Selection;

        protected parentOnChildrenSizeChangeHandler: () => void;

        constructor(options: BodyRowConstructorOptions) {
            super(options);

            this.element.classed(this.extraClassName, true);

            this.childrenContainer = this.element
                .append("div")
                .classed(this.childrenContainerClassName, true);

            this.parentOnChildrenSizeChangeHandler = options.onChildrenSizeChange;

            this.bodyOptions = {
                ...options,
                element: this.childrenContainer,
                onChildrenSizeChange: this.onChildrenSizeChange.bind(this),
            };

            this.cellOptions = {
                element: this.containerElement,
                scaleService: options.scaleService,
                stateService: options.stateService,
                powerKPIModalWindowService: options.powerKPIModalWindowService,
            };
        }

        public abstract render(options: BodyRowRenderOptions): void;

        protected updateBorder(verticalGridSettings: GridSettings): void {
            super.updateBorder(this.level === 0 ? verticalGridSettings : null);
        }

        protected onSizeChange(width: number, height: number): void {
            super.onSizeChange(width, height);

            this.onChildrenSizeChange();
        }

        protected onChildrenSizeChange(): void {
            if (this.parentOnChildrenSizeChangeHandler) {
                this.parentOnChildrenSizeChangeHandler();
            }
        }

        protected initCells(
            constructors: any[],
            options: BodyRowConstructorOptions,
            cellOptions: VisualComponentConstructorOptions
        ): void {
            constructors.forEach((componentConstructor, componentConstructorIndex: number) => {
                const component: CellComponent = new componentConstructor(cellOptions);

                if (component.updateSize
                    && options.cellStates
                    && options.cellStates[componentConstructorIndex]
                ) {
                    component.updateSize(options.cellStates[componentConstructorIndex].width, undefined);
                }

                this.pushComponent(
                    component,
                    {
                        element: this.containerElement,
                        scaleService: options.scaleService,
                        onDragStart: () => {
                            const cellState: CellState = component.getState();

                            return {
                                x: cellState.width,
                                y: cellState.height,
                            };
                        },
                        onDrag: (width: number, height: number) => {
                            this.onCellSizeChange(
                                width,
                                height,
                                componentConstructorIndex + this.level
                            );
                        },
                        onSaveState: options.onSaveState,
                        width: options.defaultMargin,
                    });
            });
        }

        protected destroyComponents(): void {
            [
                ...this.components,
                ...this.verticalDraggableComponents,
                this.horizontalDraggableComponent
            ].forEach((component: VisualComponent) => {
                if (component) {
                    component.destroy();
                }
            });

            this.components = [];
            this.verticalDraggableComponents = [];
            this.horizontalDraggableComponent = null;
        }

        protected updateClassNamesBasedOnViewMode(viewMode: BodyRowComponentViewMode): void {
            if (!this.element) {
                return;
            }

            this.element
                .classed(BodyRowComponentViewMode[BodyRowComponentViewMode.tabular], viewMode === BodyRowComponentViewMode.tabular)
                .classed(BodyRowComponentViewMode[BodyRowComponentViewMode.common], viewMode === BodyRowComponentViewMode.common);
        }
    }
}
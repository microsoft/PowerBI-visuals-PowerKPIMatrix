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

export abstract class TableBaseComponent
    extends BaseContainerComponent
    implements RowElementsVisibility {

    protected tableType: TableType = TableType.RowBasedKPIS;

    public updateSizeOfCellByIndex(width: number, height: number, cellIndex: number): void {
        if (!this.components) {
            return;
        }

        this.components.forEach((component: VisualComponent) => {
            if ((component as RowComponent).updateSizeOfCellByIndex) {
                (component as RowComponent).updateSizeOfCellByIndex(width, height, cellIndex);
            }
        });
    }

    public getState(): TableState {
        const state: TableState = {
            rowSet: {}
        };

        if (this.components) {
            this.components.forEach((component: VisualComponent) => {
                if (component.getState) {
                    if (component instanceof RowComponent) {
                        const rowState: RowState = component.getState();

                        state.rowSet[rowState.name] = rowState;
                    } else if (component instanceof TableBaseComponent) {
                        const subTableState: TableState = component.getState();

                        for (const rowName in subTableState.rowSet) {
                            state.rowSet[rowName] = subTableState.rowSet[rowName];
                        }
                    }
                }
            });
        }

        return state;
    }

    public updateVisibility(visibilities: boolean[]): void {
        this.components.forEach((component: RowElementsVisibility) => {
            if (component.updateVisibility) {
                component.updateVisibility(visibilities);
            }
        });
    }
}

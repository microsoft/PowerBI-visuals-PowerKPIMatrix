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
    export interface OnSaveHandler {
        (instances: ISettingsServiceItem[], isRenderRequired: boolean): void;
    }

    export interface States {
        [stateName: string]: State<any>;
        columnMapping: ColumnMappingState;
        table: TableInternalState;
        settings: SettingsState;
    }

    export class StateService {
        private onSave: OnSaveHandler;

        public states: States;

        constructor(states: States, onSave: OnSaveHandler) {
            this.states = states;
            this.onSave = onSave;
        }

        public save(isRenderRequired: boolean = false): void {
            const obj: { [name: string]: ISettingsServiceItem[] } = {};

            for (const stateName in this.states) {
                const state: State<any> = this.states[stateName];

                state.save().map((item: ISettingsServiceItem) => {
                    if (obj[item.objectName]) {
                        const mergedItem: ISettingsServiceItem = this.findItemForMerge(
                            obj[item.objectName],
                            item
                        );

                        if (mergedItem) {
                            mergedItem.properties = {
                                ...mergedItem.properties,
                                ...item.properties
                            };
                        } else {
                            obj[item.objectName] = [
                                ...obj[item.objectName],
                                item,
                            ];
                        }
                    } else {
                        obj[item.objectName] = [item];
                    }
                });
            }

            const items: ISettingsServiceItem[] = [];

            for (let key in obj) {
                items.push(...obj[key]);
            }

            this.onSave(items, isRenderRequired);
        }

        private findItemForMerge(items: ISettingsServiceItem[], item: ISettingsServiceItem): ISettingsServiceItem {
            for (let currentItem of items) {
                if (currentItem.objectName === item.objectName
                    && currentItem.selectionId === item.selectionId
                ) {
                    return currentItem;
                }
            }

            return null;
        }

        public parse(settings: PersistentSettings): void {
            for (const stateName in this.states) {
                this.states[stateName].parse(this.parseState(settings && settings[stateName]));
            }
        }

        private parseState(str: string): State<any> {
            try {
                return JSON.parse(str) || undefined;
            } catch (_) {
                return undefined;
            }
        }
    }
}

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
    // powerbi.extensibility.utils.dataview
    import DataViewObjects = powerbi.extensibility.utils.dataview.DataViewObjects;
    import DataViewProperties = powerbi.extensibility.utils.dataview.DataViewProperties;
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export interface GeneratedCategory {
        name: string;
        displayName: string;
    }

    export abstract class SettingsBase<T extends DataViewObjectsParser> extends DataViewObjectsParser {
        public static get maxAmountOfCategories(): number {
            return 5;
        }

        private static CategoryNamePrefix: string = "category_";
        private static CategoryDisplayNamePrefix: string = "Category";

        public static getCategoryByIndex(categoryIndex: number): GeneratedCategory {
            return {
                name: `${SettingsBase.CategoryNamePrefix}${categoryIndex}`,
                displayName: `${SettingsBase.CategoryDisplayNamePrefix} [${categoryIndex + 1}]`,
            };
        }

        public parse(dataView: DataView): T {
            return this.parseObjects(dataView
                && dataView.metadata
                && dataView.metadata.objects
            );
        }

        /**
         * It'd be better to move this method into DataViewUtils later
         */
        public parseObjects(objects: DataViewObjects): T {
            if (objects) {
                let properties: DataViewProperties = this.getProperties();

                for (let objectName in properties) {
                    for (let propertyName in properties[objectName]) {
                        const defaultValue: any = this[objectName][propertyName];

                        this[objectName][propertyName] = DataViewObjects.getCommonValue(
                            objects,
                            properties[objectName][propertyName],
                            defaultValue);
                    }

                    if ((this[objectName] as SettingsWithParser).parse) {
                        (this[objectName] as SettingsWithParser).parse();
                    }

                    this.onObjectHasBeenParsed(objectName);

                }
            } else {
                this.onObjectsAreUndefined();
            }

            return this as any;
        }

        protected abstract onObjectHasBeenParsed(objectName: string): void;
        protected abstract onObjectsAreUndefined(): void;

        public static enumerateObjectInstances(
            dataViewObjectParser: DataViewObjectsParser,
            options: EnumerateVisualObjectInstancesOptions
        ): VisualObjectInstanceEnumeration {
            const instanceEnumeration: VisualObjectInstanceEnumeration =
                super.enumerateObjectInstances(dataViewObjectParser, options);

            if (dataViewObjectParser
                && dataViewObjectParser[options.objectName]
                && dataViewObjectParser[options.objectName] instanceof SettingsPropertyBase
                && !(dataViewObjectParser[options.objectName] as SettingsPropertyBase).isEnumerable) {
                return {
                    instances: []
                };
            }

            return instanceEnumeration;
        }

        protected generateCategories(
            maxAmountOfCategories: number,
            horizontalAlignment: HorizontalTextAlignment,
            verticalAlignment: VerticalTextAlignment,
            isShown: boolean,
            isEnumerable: boolean
        ): void {
            for (let categoryIndex: number = 0; categoryIndex < maxAmountOfCategories; categoryIndex++) {
                const category: GeneratedCategory = SettingsBase.getCategoryByIndex(categoryIndex);

                const fontSettings: CategorySettings = new CategorySettings();

                fontSettings.setDefault();

                fontSettings.alignment = horizontalAlignment;
                fontSettings.verticalAlignment = verticalAlignment;
                fontSettings.label = category.displayName;
                fontSettings.show = isShown;
                fontSettings.isEnumerable = isEnumerable;
                fontSettings.order = 0;

                this[category.name] = fontSettings;
            }
        }
    }
}

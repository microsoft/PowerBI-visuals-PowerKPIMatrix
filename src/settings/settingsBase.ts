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

import powerbi from "powerbi-visuals-api";

import {
    dataViewObjects,
    dataViewObjectsParser,
} from "powerbi-visuals-utils-dataviewutils";

import {
    HorizontalTextAlignment,
    VerticalTextAlignment,
} from "./descriptors/fontSettings";

import { CategorySettings } from "./descriptors/categorySettings";
import { SettingsPropertyBase } from "./descriptors/settingsPropertyBase";
import { ISettingsWithParser } from "./descriptors/settingsWithParser";

export interface IGeneratedCategory {
    name: string;
    displayName: string;
}

export abstract class SettingsBase<T extends dataViewObjectsParser.DataViewObjectsParser>
    extends dataViewObjectsParser.DataViewObjectsParser {

    public static enumerateObjectInstances(
        dataViewObjectParser: dataViewObjectsParser.DataViewObjectsParser,
        options: powerbi.EnumerateVisualObjectInstancesOptions,
    ): powerbi.VisualObjectInstanceEnumeration {
        const instanceEnumeration: powerbi.VisualObjectInstanceEnumeration =
            super.enumerateObjectInstances(dataViewObjectParser, options);

        if (dataViewObjectParser
            && dataViewObjectParser[options.objectName]
            && dataViewObjectParser[options.objectName] instanceof SettingsPropertyBase
            && !(dataViewObjectParser[options.objectName] as SettingsPropertyBase).isEnumerable) {
            return {
                instances: [],
            };
        }

        return instanceEnumeration;
    }

    public static get maxAmountOfCategories(): number {
        return 5;
    }

    public static getCategoryByIndex(categoryIndex: number): IGeneratedCategory {
        return {
            displayName: `${SettingsBase.CategoryDisplayNamePrefix} [${categoryIndex + 1}]`,
            name: `${SettingsBase.CategoryNamePrefix}${categoryIndex}`,
        };
    }

    private static CategoryNamePrefix: string = "category_";
    private static CategoryDisplayNamePrefix: string = "Category";

    public parse(dataView: powerbi.DataView): T {
        return this.parseObjects(dataView
            && dataView.metadata
            && dataView.metadata.objects,
        );
    }

    /**
     * It'd be better to move this method into DataViewUtils later
     */
    public parseObjects(objects: powerbi.DataViewObjects): T {
        if (objects) {
            const properties: dataViewObjectsParser.DataViewProperties = this.getProperties();

            for (const objectName in properties) {
                for (const propertyName in properties[objectName]) {
                    const defaultValue: any = this[objectName][propertyName];

                    this[objectName][propertyName] = dataViewObjects.getCommonValue(
                        objects,
                        properties[objectName][propertyName],
                        defaultValue);
                }

                if ((this[objectName] as ISettingsWithParser).parse) {
                    (this[objectName] as ISettingsWithParser).parse();
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

    protected generateCategories(
        maxAmountOfCategories: number,
        horizontalAlignment: HorizontalTextAlignment,
        verticalAlignment: VerticalTextAlignment,
        isShown: boolean,
        isEnumerable: boolean,
    ): void {
        for (let categoryIndex: number = 0; categoryIndex < maxAmountOfCategories; categoryIndex++) {
            const category: IGeneratedCategory = SettingsBase.getCategoryByIndex(categoryIndex);

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

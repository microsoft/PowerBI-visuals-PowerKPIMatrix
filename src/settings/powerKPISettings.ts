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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";

import {
    Settings as BasePowerKPISettings,
} from "../../node_modules/powerbi-visuals-powerkpi/src/settings/settings";

export class PowerKPISettings extends BasePowerKPISettings {
    public static getObjectNameWithPrefix(objectName: string): string {
        return `${this.Prefix}${objectName}`;
    }

    public static getObjectNameWithoutPrefix(objectName: string): string {
        return objectName.replace(this.Prefix, "");
    }

    public static enumerateObjectInstances(
        dataViewObjectParser: dataViewObjectsParser.DataViewObjectsParser,
        options: powerbi.EnumerateVisualObjectInstancesOptions,
    ): powerbi.VisualObjectInstanceEnumeration {

        const objectName: string = options && options.objectName
            ? this.getObjectNameWithoutPrefix(options.objectName)
            : "";

        return super.enumerateObjectInstances(
            dataViewObjectParser,
            { objectName },
        );
    }

    private static Prefix: string = "integratedPowerKPI_";

    private static InnumerablePrefix: RegExp = /^_/;

    public getProperties() {
        const properties = {};

        Object.keys(this).forEach((objectName: string) => {
            if (this.isPropertyEnumerable(objectName)) {
                const propertyNames: string[] = Object.keys(this[objectName]);

                properties[objectName] = {};

                propertyNames.forEach((propertyName: string) => {
                    if (this.isPropertyEnumerable(objectName)) {
                        properties[objectName][propertyName] =
                            this.createPropertyIdentifier(
                                PowerKPISettings.getObjectNameWithPrefix(objectName),
                                propertyName,
                            );
                    }
                });
            }
        });

        return properties;
    }

    private isPropertyEnumerable(propertyName: string): boolean {
        return !PowerKPISettings.InnumerablePrefix.test(propertyName);
    }

    private createPropertyIdentifier(
        objectName: string,
        propertyName: string,
    ): powerbi.DataViewObjectPropertyIdentifier {
        return {
            objectName,
            propertyName,
        };
    }
}

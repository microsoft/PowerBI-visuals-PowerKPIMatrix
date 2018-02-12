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
    // powerbi.extensibility.utils.dataview
    import DataViewProperties = powerbi.extensibility.utils.dataview.DataViewProperties;
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    // powerKPI
    import BaseSettings = powerKPI.Settings;

    export class PowerKPISettings extends BaseSettings {
        private static InnumerablePrefix: RegExp = /^_/;

        public getProperties(): DataViewProperties {
            let properties: DataViewProperties = {},
                objectNames: string[] = Object.keys(this);

            objectNames.forEach((objectName: string) => {
                if (this.isPropertyEnumerable(objectName)) {
                    let propertyNames: string[] = Object.keys(this[objectName]);

                    properties[objectName] = {};

                    propertyNames.forEach((propertyName: string) => {
                        if (this.isPropertyEnumerable(objectName)) {
                            properties[objectName][propertyName] =
                                this.createPropertyIdentifier(
                                    PowerKPIPrefixier.getObjectNameWithPrefix(objectName),
                                    propertyName
                                );
                        }
                    });
                }
            });

            return properties;
        }

        public static enumerateObjectInstances(
            dataViewObjectParser: DataViewObjectsParser,
            options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {

            const objectName: string = options && options.objectName
                ? PowerKPIPrefixier.getObjectNameWithoutPrefix(options.objectName)
                : "";

            return super.enumerateObjectInstances(
                dataViewObjectParser,
                { objectName }
            );
        }

        private isPropertyEnumerable(propertyName: string): boolean {
            return !PowerKPISettings.InnumerablePrefix.test(propertyName);
        }

        private createPropertyIdentifier(
            objectName: string,
            propertyName: string
        ): DataViewObjectPropertyIdentifier {

            return {
                objectName,
                propertyName
            };
        }
    }
}
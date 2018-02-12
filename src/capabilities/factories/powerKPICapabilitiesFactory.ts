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

    interface HiddenProperties {
        [propertyName: string]: {
            [optionsName: string]: boolean;
        };
    }

    export class PowerKPICapabilitiesFactory implements CapabilitiesFactory {
        private displayNamePrefix: string = "Pop-out Chart ";

        private hiddenProperties: string[] = [
            "title",
            "series",
            "lineStyle",
            "lineThickness",
        ];

        private hiddenOptions: HiddenProperties = {
            subtitle: {
                titleText: true
            },
            dateValueKPI: {
                displayUnits: true,
                precision: true,
            },
            actualValueKPI: {
                displayUnits: true,
                precision: true,
            },
            kpiIndicator: {
                color_0: true,
                color_1: true,
                color_2: true,
                color_3: true,
                color_4: true,
                kpiIndex_0: true,
                kpiIndex_1: true,
                kpiIndex_2: true,
                kpiIndex_3: true,
                kpiIndex_4: true,
                shape_0: true,
                shape_1: true,
                shape_2: true,
                shape_3: true,
                shape_4: true,
            },
            kpiIndicatorValue: {
                displayUnits: true,
                precision: true,
            },
            secondKPIIndicatorValue: {
                displayUnits: true,
                precision: true,
            }
        };

        public makeDataRoles(): VisualDataRole[] {
            return [];
        }

        public makeDataViewMappings(): DataView[] {
            return [];
        }

        public makeObjects(): any {
            return this.mapObjects({} /* PowerKPI.capabilities && PowerKPI.capabilities.objects*/);
        }

        private mapObjects(baseObjects: any): any {
            const objects: any = {};

            if (baseObjects) {
                Object.keys(baseObjects).forEach((propertyName: string) => {
                    if (this.hiddenProperties.indexOf(propertyName) === -1) {
                        const descriptor: any = baseObjects[propertyName];

                        let properties: any = {};

                        if (this.hiddenOptions[propertyName]) {
                            Object.keys(descriptor.properties).forEach((optionName: string) => {
                                if (!this.hiddenOptions[propertyName][optionName]) {
                                    properties[optionName] = descriptor.properties[optionName];
                                }
                            });
                        } else {
                            properties = { ...descriptor.properties };
                        }

                        const propertyNameWitPrefix: string = PowerKPIPrefixier.getObjectNameWithPrefix(propertyName);

                        objects[propertyNameWitPrefix] = {
                            properties,
                            displayName: `${this.displayNamePrefix}${descriptor.displayName}`,
                        };
                    }
                });
            }

            return objects;
        }
    }

    export class PowerKPIPrefixier {
        private static Prefix: string = "integratedPowerKPI_";

        public static getObjectNameWithPrefix(objectName: string): string {
            return `${this.Prefix}${objectName}`;
        }

        public static getObjectNameWithoutPrefix(objectName: string): string {
            return objectName.replace(this.Prefix, "");
        }
    }
}
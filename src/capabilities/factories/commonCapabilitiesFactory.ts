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
    // powerbi
    import VisualDataRole = powerbi.extensibility.visual.VisualDataRole;

    export class CommonCapabilitiesFactory implements CapabilitiesFactory {
        private marginSignOfFormattingPanel: string = "  "; // Alt + 255

        public makeDataRoles(): VisualDataRole[] {
            return [
                dateColumn,
                actualValueColumn,
                comparisonValueColumn,
                kpiIndicatorIndexColumn,
                kpiIndicatorValueColumn,
                secondComparisonValueColumn,
                secondKPIIndicatorValueColumn,
                rowBasedMetricNameColumn,
                categoryColumn,
                imageColumn,
                sortOrderColumn,
                hyperlinkColumn,
            ];
        }

        public makeDataViewMappings(): any[] {
            return [
                {
                    conditions: [
                        {
                            [dateColumn.name]: { max: 1 },
                            [actualValueColumn.name]: { max: 0 },
                            [comparisonValueColumn.name]: { max: 0 },
                            [kpiIndicatorIndexColumn.name]: { max: 0 },
                            [kpiIndicatorValueColumn.name]: { max: 0 },
                            [secondComparisonValueColumn.name]: { max: 0 },
                            [secondKPIIndicatorValueColumn.name]: { max: 0 },
                            [rowBasedMetricNameColumn.name]: { max: 0 },
                            [categoryColumn.name]: { max: 0 },
                            [imageColumn.name]: { max: 0 },
                            [sortOrderColumn.name]: { max: 0 },
                            [hyperlinkColumn.name]: { max: 0 },
                        },
                        {
                            [dateColumn.name]: { min: 1, max: 1 },
                            [actualValueColumn.name]: { min: 0 },
                            [comparisonValueColumn.name]: { min: 0 },
                            [kpiIndicatorIndexColumn.name]: { min: 0 },
                            [kpiIndicatorValueColumn.name]: { min: 0 },
                            [secondComparisonValueColumn.name]: { min: 0 },
                            [secondKPIIndicatorValueColumn.name]: { min: 0 },
                            [rowBasedMetricNameColumn.name]: { max: 0 },
                            [categoryColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [imageColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [sortOrderColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [hyperlinkColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                        },
                        {
                            [dateColumn.name]: { min: 1, max: 1 },
                            [actualValueColumn.name]: { max: 1 },
                            [comparisonValueColumn.name]: { max: 1 },
                            [kpiIndicatorIndexColumn.name]: { max: 1 },
                            [kpiIndicatorValueColumn.name]: { max: 1 },
                            [secondComparisonValueColumn.name]: { max: 1 },
                            [secondKPIIndicatorValueColumn.name]: { max: 1 },
                            [rowBasedMetricNameColumn.name]: { max: 1 },
                            [categoryColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [imageColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [sortOrderColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [hyperlinkColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                        },
                        {
                            [dateColumn.name]: { min: 1, max: 1 },
                            [actualValueColumn.name]: { max: 1 },
                            [comparisonValueColumn.name]: { max: 1 },
                            [kpiIndicatorIndexColumn.name]: { max: 1 },
                            [kpiIndicatorValueColumn.name]: { max: 1 },
                            [secondComparisonValueColumn.name]: { max: 1 },
                            [secondKPIIndicatorValueColumn.name]: { max: 1 },
                            [rowBasedMetricNameColumn.name]: { min: 1, max: 1 },
                            [categoryColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [imageColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [sortOrderColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                            [hyperlinkColumn.name]: { min: 0, max: SettingsBase.maxAmountOfCategories },
                        },
                    ],
                    table: {
                        rows: {
                            select: [
                                {
                                    for: {
                                        in: dateColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: actualValueColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: comparisonValueColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: kpiIndicatorIndexColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: kpiIndicatorValueColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: secondComparisonValueColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: secondKPIIndicatorValueColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: rowBasedMetricNameColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: categoryColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: imageColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: sortOrderColumn.name
                                    }
                                },
                                {
                                    for: {
                                        in: hyperlinkColumn.name
                                    }
                                },
                            ],
                            dataReductionAlgorithm: {
                                window: { count: 30000 }
                            }
                        }
                    },
                }
            ];
        }

        public makeObjects(): any {
            const descriptors: any = {
                internalState: {
                    displayName: "Internal State",
                    properties: {
                        value: {
                            displayName: "Column Mapping Value",
                            type: { text: true }
                        },
                    }
                },
                title: {
                    displayName: "Title",
                    properties: {}
                },
                header: this.getFontSettings(
                    "Header",
                    "Header Options",
                    true,
                    false,
                    false,
                    true
                )
            };

            this.applyCategories(descriptors);

            descriptors["subtotal"] = this.getSubtotalSettings();

            descriptors["asOfDate"] = this.getNumericWithFontSettings(
                "As of Date",
                "As of Date options",
                true,
                true,
                true,
                false,
                false,
                1
            );

            descriptors["metricName"] = this.getFontSettings(
                "Metric Name",
                "Metric Name options",
                false,
                true,
                true,
                true,
                true,
                true,
                1
            );

            descriptors["currentValue"] = this.getValueSettings(
                "Current Value",
                "Current Value options",
                true,
                true,
                true,
                false,
                true,
                1
            );

            descriptors["kpiIndicator"] = this.getKPIIndicatorSettings(1);

            descriptors["kpiIndicatorValue"] = this.getKPIIndicatorValueSettings(
                "KPI Indicator Value",
                true,
                true,
                1
            );

            descriptors["comparisonValue"] = this.getNumericWithFontSettings(
                "Comparison Value",
                "Comparison Value options",
                true,
                true,
                true,
                false,
                true,
                1
            );

            descriptors["secondComparisonValue"] = this.getNumericWithFontSettings(
                "Second Comparison Value",
                "Second Comparison Value options",
                true,
                true,
                true,
                false,
                true,
                1
            );

            descriptors["secondKPIIndicatorValue"] = this.getKPIIndicatorValueSettings(
                "Second KPI Indicator Value",
                false,
                false,
                1
            );

            descriptors["sparklineSettings"] = {
                displayName: "Sparklines",
                description: "Customize sparklines for each metric",
                properties: {
                    show: this.getShow(),
                    order: this.getOrder(undefined, 1),
                    label: this.getText("Label", 1),
                    backgroundColor: this.getBackground(undefined, 1),
                    isActualVisible: this.getBool("Show Current", undefined, 1),
                    shouldActualUseKPIColors: this.getBool("Current Uses KPI Colors", undefined, 2),
                    actualColor: this.getColor("Current Color", 2),
                    actualThickness: this.getNumeric("Current Thickness", undefined, undefined, 2),
                    actualLineStyle: this.getDescriptor("Current Line Style", { enumeration: lineStyleEnumType }, undefined, 2),
                    isTargetVisible: this.getBool("Show Comparison", undefined, 1),
                    targetColor: this.getColor("Comparison Color", 2),
                    targetThickness: this.getNumeric("Comparison Thickness", undefined, undefined, 2),
                    targetLineStyle: this.getDescriptor("Comparison Line Style", { enumeration: lineStyleEnumType }, undefined, 2),
                    isSecondComparisonValueVisible: this.getBool("Show Second Comparison", undefined, 1),
                    secondComparisonValueColor: this.getColor("Second Comparison Color", 2),
                    secondComparisonValueThickness: this.getNumeric("Second Comparison Thickness", undefined, undefined, 2),
                    secondComparisonValueLineStyle: this.getDescriptor("Second Comparison Line Style", { enumeration: lineStyleEnumType }, undefined, 2),
                    shouldUseCommonScale: this.getBool("Use Common Scale", "Common automatic scaling across all KPIs", 1),
                    yMin: this.getNumeric("Y-axis Min", "Auto", undefined, 1),
                    yMax: this.getNumeric("Y-axis Max", "Auto", undefined, 1),
                    verticalReferenceLineColor: this.getColor("Vertical Reference Line Color", 1),
                    verticalReferenceLineThickness: this.getNumeric(
                        "Vertical Reference Line Thickness",
                        undefined,
                        undefined,
                        1
                    ),
                }
            };

            descriptors["verticalGrid"] = this.getGridSettings("Vertical Grid");
            descriptors["horizontalGrid"] = this.getGridSettings("Horizontal Grid");

            descriptors["metricSpecific"] = this.getMetricSpecificSettings();

            descriptors["table"] = this.getTableSettings();

            descriptors["popOutGeneralSettings"] = {
                displayName: "Pop-out Chart General",
                properties: {
                    show: this.getShow(),
                    backgroundColor: this.getColor("Background Color"),
                    viewportSize: this.getNumeric("Size %", undefined, "Size is a percentage of size of mail viewport"),
                }
            };

            return descriptors;
        }

        private applyCategories(descriptors: any): void {
            for (let categoryIndex: number = 0; categoryIndex < SettingsBase.maxAmountOfCategories; categoryIndex++) {
                const category: GeneratedCategory = SettingsBase.getCategoryByIndex(categoryIndex);

                descriptors[category.name] = this.getFontSettings(
                    category.displayName,
                    undefined,
                    false,
                    false,
                    true,
                    true,
                    true,
                    true,
                    0
                );
            }
        }

        private getBool(
            displayName: string,
            description?: string,
            level?: number
        ): any {
            return this.getDescriptor(
                displayName,
                { bool: true },
                description,
                level
            );
        }

        private getColor(displayName: string = "Color", level?: number): any {
            return this.getDescriptor(
                displayName,
                { fill: { solid: { color: true } } },
                undefined,
                level);
        }

        private getOrder(displayName: string = "Column Order", level?: number): any {
            return this.getNumeric(displayName, undefined, undefined, level);
        }

        private getNumeric(
            displayName: string = "Number",
            placeHolderText?: string,
            description?: string,
            level?: number
        ): any {
            const descriptor = this.getDescriptor(
                displayName,
                { numeric: true },
                description,
                level);

            descriptor.placeHolderText = placeHolderText;
            descriptor.suppressFormatPainterCopy = true;

            return descriptor;
        }

        private getDisplayUnits(displayName: string = "Display Units", level?: number): any {
            const descriptor: any = this.getDescriptor(
                displayName,
                { formatting: { labelDisplayUnits: true } },
                "Select the units (millions, billions, etc.)",
                level);

            descriptor.suppressFormatPainterCopy = true;

            return descriptor;
        }

        private getPrecision(displayName: string = "Decimal Places", level?: number): any {
            return this.getNumeric(
                displayName,
                "Auto",
                "Select the number of decimal places to display",
                level);
        }

        private getNumericSettings(
            displayName: string,
            description: string,
            isTextReplacementCompatible?: boolean,
            level?: number
        ): any {
            const properties: any = {
                format: this.getText("Format", level),
                displayUnits: this.getDisplayUnits(undefined, level),
                precision: this.getPrecision(undefined, level),
            };

            if (isTextReplacementCompatible) {
                properties["textReplacement"] = this.getText("Text Replacement", level);
            }

            return {
                displayName,
                description,
                properties,
            };
        }

        private getFontSize(displayName: string = "Text Size", level?: number): any {
            return this.getDescriptor(
                displayName,
                { formatting: { fontSize: true } },
                undefined,
                level);
        }

        private getFontFamily(displayName: string = "Font Family", level?: number): any {
            return this.getDescriptor(
                displayName,
                { formatting: { fontFamily: true } },
                undefined,
                level);
        }

        private getDescriptor(
            displayName: string,
            type: any,
            description?: string,
            level: number = 0
        ): any {
            let margin: string = this.getMarginByLevel(level);

            return {
                type,
                displayName: `${margin}${displayName}`,
            };
        }

        private getMarginByLevel(level: number): string {
            let margin: string = "";

            for (let i: number = 0; i < level || 0; i++) {
                margin += this.marginSignOfFormattingPanel;
            }

            return margin;
        }

        private getKPIIndicatorValueSettings(
            displayName: string,
            isShownPresented: boolean,
            isMatchKPIColorPresented: boolean,
            level: number
        ): any {
            const baseProperties: any = {};

            if (isShownPresented) {
                baseProperties.isShown = this.getShow(undefined, level);
            }

            const descriptor: any = this.getNumericWithFontSettings(
                displayName,
                undefined,
                true,
                true,
                true,
                false,
                true,
                level,
                baseProperties,
            );

            if (isMatchKPIColorPresented) {
                descriptor.properties["shouldMatchKPIColor"] = this.getBool(
                    "Match KPI Indicator Color",
                    undefined,
                    level
                );
            }

            return descriptor;
        }

        private getShow(displayName: string = "Show", level?: number): any {
            return this.getBool(displayName, undefined, level);
        }

        private getBold(displayName: string = "Bold", level?: number): any {
            return this.getBool(displayName, undefined, level);
        }

        private getUnderline(displayName: string = "Underline", level?: number): any {
            return this.getBool(displayName, undefined, level);
        }

        private getItalic(displayName: string = "Italic", level?: number): any {
            return this.getBool(displayName, undefined, level);
        }

        private getText(displayName: string = "Label", level?: number): any {
            return this.getDescriptor(displayName, { text: true }, undefined, level);
        }

        private getGridSettings(displayName: string): any {
            return {
                displayName,
                properties: {
                    show: this.getShow(),
                    color: this.getColor("Color"),
                    outlineWeight: this.getNumeric("Thickness"),
                }
            };
        }

        private getHorizontalAlignment(
            displayName: string = "Horizontal Alignment",
            level?: number
        ): any {
            return this.getDescriptor(displayName, { formatting: { alignment: true } }, undefined, level);
        }

        private getVerticalAlignment(
            displayName: string = "Vertical Alignment",
            level?: number
        ): any {
            return this.getDescriptor(displayName, { enumeration: verticalTextAlignmentIEnumType }, undefined, level);
        }

        private getWrapText(
            displayName: string = "Wrap Text",
            level?: number
        ): any {
            return this.getDescriptor(displayName, { enumeration: wrapTextIEnumType }, undefined, level);
        }

        private getBackground(displayName: string = "Background Color", level?: number): any {
            return this.getDescriptor(
                displayName,
                { fill: { solid: { color: { nullable: true } } } },
                undefined,
                level);
        }

        private getFontSettings(
            displayName: string,
            description?: string,
            isShowPresented: boolean = false,
            isOrderShown: boolean = false,
            isLabelShown: boolean = false,
            isWrapTextShown: boolean = false,
            isHyperlinkCompatible: boolean = false,
            isImageCompatible: boolean = false,
            level?: number,
            baseProperties: any = {},
        ): any {
            const properties: any
                = this.getLabelProperties(isShowPresented, isOrderShown, isLabelShown, level, baseProperties);

            properties["fontSize"] = this.getFontSize(undefined, level);

            if (isWrapTextShown) {
                properties["wrapText"] = this.getWrapText(undefined, level);
            }

            properties["isBold"] = this.getBold(undefined, level);
            properties["isItalic"] = this.getItalic(undefined, level);
            properties["isUnderlined"] = this.getUnderline(undefined, level);

            if (isHyperlinkCompatible) {
                properties["isHyperlinkUnderlined"] = this.getUnderline("Hyperlink Underline", level);
            }

            properties["fontFamily"] = this.getFontFamily(undefined, level);

            properties["alignment"] = this.getHorizontalAlignment(undefined, level);
            properties["verticalAlignment"] = this.getVerticalAlignment(undefined, level);

            properties["color"] = this.getColor(undefined, level);

            if (isHyperlinkCompatible) {
                properties["hyperlinkColor"] = this.getColor("Hyperlink Color", level);
            }

            if (isImageCompatible) {
                properties["shouldShowLabel"] = this.getBool("Show Label", undefined, level);
                properties["shouldShowImage"] = this.getBool("Show Image", undefined, level);

                properties["imageIconWidth"] = this.getNumeric("Image Width", "Auto Based On Text Size", undefined, level);
                properties["imageIconHeight"] = this.getNumeric("Image Height", "Auto Based On Text Size", undefined, level);
            }

            properties["backgroundColor"] = this.getBackground(undefined, level);

            return {
                displayName,
                description,
                properties,
            };
        }

        private getLabelProperties(
            isShowPresented: boolean = true,
            isOrderShown: boolean = true,
            isLabelShown: boolean = true,
            level?: number,
            properties: any = {},
        ): any {
            if (isShowPresented) {
                properties["show"] = this.getShow(undefined, level);
            }

            if (isOrderShown) {
                properties["order"] = this.getOrder(undefined, level);
            }

            if (isLabelShown) {
                properties["label"] = this.getText(undefined, level);
            }

            return properties;
        }

        private getNumericWithFontSettings(
            displayName: string,
            description: string,
            isShowPresented: boolean = true,
            isOrderShown: boolean = true,
            isLabelShown: boolean = true,
            isHyperlinkCompatible: boolean = false,
            isTextReplacementCompatible: boolean = false,
            level?: number,
            baseProperties: any = {},
        ): any {
            const fontSettings: any = this.getFontSettings(
                displayName,
                description,
                isShowPresented,
                isOrderShown,
                isLabelShown,
                false,
                isHyperlinkCompatible,
                false,
                level,
                baseProperties
            );

            const numericSettings: any = this.getNumericSettings(
                displayName,
                description,
                isTextReplacementCompatible,
                level
            );

            numericSettings.properties = {
                ...numericSettings.properties,
                ...fontSettings.properties,
            };

            return numericSettings;
        }

        private getValueSettings(
            displayName: string,
            description: string,
            isShowPresented: boolean = true,
            isOrderShown: boolean = true,
            isLabelShown: boolean = true,
            isHyperlinkCompatible: boolean = false,
            isTextReplacementCompatible: boolean = false,
            level?: number,
            baseProperties: any = {},
        ): any {
            const settings: any = this.getNumericWithFontSettings(
                displayName,
                description,
                isShowPresented,
                isOrderShown,
                isLabelShown,
                isHyperlinkCompatible,
                isTextReplacementCompatible,
                level,
                baseProperties,
            );

            settings.properties.shouldTreatZeroValuesAsNulls = this.getBool(
                "Treat zero values as nulls",
                undefined,
                level
            );

            return settings;
        }

        private getKPIIndicatorSettings(level?: number): any {
            const properties: any = {
                isShown: this.getShow(undefined, level),
                fontSize: this.getFontSize("Size", level),
                shouldWrap: this.getBool("Wrap", undefined, level),
                horizontalPosition: this.getDescriptor(
                    "Position",
                    { enumeration: kpiIndicatorHorizontalPositionIEnumType },
                    undefined,
                    level
                ),
                verticalPosition: this.getDescriptor(
                    "Position",
                    { enumeration: kpiIndicatorVerticalPositionIEnumType },
                    undefined,
                    level
                ),
            };

            KPIIndicatorSettings
                .createDefault()
                .applyProperties(properties, this.getMarginByLevel(level));

            return {
                properties,
                displayName: "KPI Indicator",
                description: "KPI Indicator options",
            };
        }

        private getTableSettings(): any {
            const descriptor: any = {
                displayName: "Table",
                description: "Table Options",
                properties: {
                    type: this.getDescriptor("Type", { enumeration: tableTypeIEnumType }),
                    style: this.getDescriptor("Style", { enumeration: tableStyleIEnumType }),
                    sortOrder: this.getDescriptor("Category Auto-Sort", { enumeration: sortOrderIEnumType }),
                    defaultSortOrderBy: this.getDescriptor("Default Sort Order By", { enumeration: defaultSortOrderByIEnumType }),
                    shouldHideUnmappedMetrics: this.getBool("Hide unmapped metrics"),
                    defaultUnmappedCategoryName: this.getText("Default Unmapped Category Name"),
                }
            };

            return descriptor;
        }

        private getSubtotalSettings(): any {
            return {
                displayName: "Category Subtotal",
                properties: {
                    show: this.getShow(undefined, 0),
                    type: this.getDescriptor(
                        "Type",
                        { enumeration: SubtotalTypeIEnumType },
                        undefined,
                        0
                    ),
                }
            };
        }

        private getMetricSpecificSettings(): any {
            return {
                displayName: "Metric Specific Options",
                properties: {
                    backgroundColor: this.getBackground(undefined, 1),
                }
            };
        }
    }
}
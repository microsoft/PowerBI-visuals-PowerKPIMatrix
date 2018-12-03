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
    export class Settings extends SettingsBase<Settings> {
        public internalState: PersistentSettings = new PersistentSettings();

        public metricSpecific: MetricSpecificSettings = new MetricSpecificSettings();

        public table: TableSettings = new TableSettings();

        public title: FakeTitleSettings = new FakeTitleSettings();
        public header: HeaderSettings = new HeaderSettings();

        public asOfDate: AsOfDateSettings = new AsOfDateSettings();
        public metricName: CategorySettings = new CategorySettings();
        public currentValue: KPIValueSettings = new KPIValueSettings();
        public kpiIndicator: KPIIndicatorSettings = new KPIIndicatorSettings();
        public kpiIndicatorValue: KPIIndicatorValueSettings = new KPIIndicatorValueSettings();
        public comparisonValue: KPIValueSettings = new KPIValueSettings();
        public secondComparisonValue: KPIValueSettings = new KPIValueSettings();
        public secondKPIIndicatorValue: KPIIndicatorValueSettings = new KPIIndicatorValueSettings();
        public sparklineSettings: SparklineSettings = new SparklineSettings();

        public verticalGrid: GridSettings = new GridSettings();
        public horizontalGrid: GridSettings = new GridSettings();

        public subtotal: SubtotalSettings = new SubtotalSettings();

        public popOutGeneralSettings: PopOutGeneralSettings = new PopOutGeneralSettings();

        public powerKPISettings: PowerKPISettings;

        constructor() {
            super();

            this.asOfDate.isEnumerable = false;
            this.asOfDate.show = true;
            this.asOfDate.label = "As of Date";
            this.asOfDate.order = 1;

            this.metricName.isEnumerable = false;
            this.metricName.alignment = HorizontalTextAlignment.left;
            this.metricName.label = "Metric Name";
            this.metricName.order = 2;

            this.currentValue.isEnumerable = false;
            this.currentValue.defaultFormat = "#,0.00";
            this.currentValue.label = "Current Value";
            this.currentValue.order = 3;

            this.kpiIndicator.isEnumerable = false;
            this.kpiIndicator.applySettingToContext();

            this.kpiIndicatorValue.isEnumerable = false;
            this.kpiIndicatorValue.defaultFormat = "+0.00 %;-0.00 %;0.00 %";
            this.kpiIndicatorValue.label = "KPI Status";
            this.kpiIndicatorValue.order = 4;

            this.comparisonValue.isEnumerable = false;
            this.comparisonValue.defaultFormat = "#,0.00";
            this.comparisonValue.label = "Comparison Value";
            this.comparisonValue.order = 5;

            this.secondComparisonValue.isEnumerable = false;
            this.secondComparisonValue.defaultFormat = "#,0.00";
            this.secondComparisonValue.label = "Second Comparison Value";
            this.secondComparisonValue.order = 6;

            this.secondKPIIndicatorValue.isEnumerable = false;
            this.secondKPIIndicatorValue.defaultFormat = "+0.00 %;-0.00 %;0.00 %";
            this.secondKPIIndicatorValue.label = "Second KPI Status";
            this.secondKPIIndicatorValue.order = 7;
            this.secondKPIIndicatorValue.shouldMatchKPIColor = false;

            this.sparklineSettings.isEnumerable = false;
            this.sparklineSettings.label = "Sparklines";
            this.sparklineSettings.order = 8;

            this.metricSpecific.isEnumerable = false;

            this.generateCategories(
                SettingsBase.maxAmountOfCategories,
                HorizontalTextAlignment.center,
                VerticalTextAlignment.top,
                true,
                true
            );
        }

        public hideDescriptors(seriesDeep: number): void {
            const amountOfCategories: number = seriesDeep - 1;

            this.subtotal.parse(amountOfCategories);
            this.metricName.updateHyperlinkVisibility(this.metricName.isHyperlinkSpecified);

            this.hideCategories(amountOfCategories);
        }

        private hideCategories(amountOfAllowedCategories: number): void {
            for (let index: number = 0; index < SettingsBase.maxAmountOfCategories; index++) {
                const category: GeneratedCategory = SettingsBase.getCategoryByIndex(index);

                const options: CategorySettings = this[category.name];

                if (options) {
                    options.updateHyperlinkVisibility(options.isHyperlinkSpecified);

                    if (index >= amountOfAllowedCategories) {
                        options.isEnumerable = false;
                    }
                }
            }
        }

        protected onObjectHasBeenParsed(objectName: string): void {
            if (objectName !== "table") {
                return;
            }

            this.updatePropertiesBasedOnPreviousAndCurrentStyles();
        }

        protected onObjectsAreUndefined(): void {
            this.updatePropertiesBasedOnPreviousAndCurrentStyles();
        }

        public updatePropertiesBasedOnPreviousAndCurrentStyles(): void {
            switch (this.table.style) {
                case TableStyle.BoldHeader:
                case TableStyle.BoldHeaderAndAlternatingMetrics: {
                    this.applyBoldHeader();

                    this.currentValue.isBold = false;

                    break;
                }
                case TableStyle.BoldHeaderAndCurrentValue: {
                    this.applyBoldHeader();

                    this.currentValue.isBold = true;

                    break;
                }
                case TableStyle.Default:
                default: {
                    this.header.setDefault();
                    this.header.backgroundColor = undefined;

                    this.horizontalGrid.setDefault();
                    this.verticalGrid.setDefault();

                    this.currentValue.isBold = false;

                    break;
                }
            }
        }

        private applyBoldHeader(): void {
            this.header.show = true;
            this.header.backgroundColor = "#333333";
            this.header.color = "#fff";
            this.header.isBold = true;
            this.header.textFontSize = 10;
            this.header.alignment = HorizontalTextAlignment.center;

            this.horizontalGrid.show = true;
            this.verticalGrid.show = true;
            this.verticalGrid.color = this.horizontalGrid.color = "#E7E7E7";
            this.verticalGrid.thickness = this.horizontalGrid.thickness = 2;
        }

        public parse(dataView: DataView): Settings {
            this.powerKPISettings = PowerKPISettings.parse(dataView);

            return super.parse(dataView);
        }

        public static enumerateObjectInstances(
            settings: Settings,
            options: EnumerateVisualObjectInstancesOptions
        ): VisualObjectInstanceEnumeration {
            const enumeration: VisualObjectInstanceEnumeration = super.enumerateObjectInstances(
                settings,
                options
            );

            if (options
                && options.objectName
                && settings[options.objectName]
            ) {
                return enumeration;
            }

            const powerKPIEnumeration: VisualObjectInstanceEnumeration =
                PowerKPISettings.enumerateObjectInstances(settings.powerKPISettings, options);

            return {
                instances: [
                    ...Settings.getInstances(enumeration),
                    ...Settings.getInstances(powerKPIEnumeration),
                ]
            };
        }

        private static getInstances(enumeration: VisualObjectInstanceEnumeration): VisualObjectInstance[] {
            return enumeration
                && (enumeration as VisualObjectInstanceEnumerationObject).instances
                || [];
        }
    }
}

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

import { SettingsBase } from "./settingsBase";

import { AsOfDateSettings } from "./descriptors/asOfDateSettings";
import { FontSettings } from "./descriptors/fontSettings";
import { KPIIndicatorSettings } from "./descriptors/kpi/kpiIndicatorSettings";
import { KPIIndicatorValueSettings } from "./descriptors/kpi/kpiIndicatorValueSettings";
import { KPIValueSettings } from "./descriptors/kpi/kpiValueSettings";
import { LabelSettings } from "./descriptors/labelSettings";
import { MetricSpecificSettings } from "./descriptors/metricSpecificSettings";
import { SparklineSettings } from "./descriptors/sparklineSettings";

export class SeriesSettings extends SettingsBase<SeriesSettings> {
    public asOfDate: AsOfDateSettings = new AsOfDateSettings();
    public metricName: FontSettings = new FontSettings();
    public currentValue: KPIValueSettings = new KPIValueSettings();
    public kpiIndicator: KPIIndicatorSettings = new KPIIndicatorSettings();
    public kpiIndicatorValue: KPIIndicatorValueSettings = new KPIIndicatorValueSettings();
    public comparisonValue: KPIValueSettings = new KPIValueSettings();
    public secondComparisonValue: KPIValueSettings = new KPIValueSettings();
    public secondKPIIndicatorValue: KPIIndicatorValueSettings = new KPIIndicatorValueSettings();
    public sparklineSettings: SparklineSettings = new SparklineSettings();

    public metricSpecific: MetricSpecificSettings = new MetricSpecificSettings();

    public applyAlternativeBackgroundColor(): void {
        const backgroundColor: string = this.metricSpecific.alternativeBackgroundColor;

        this.applyBackgroundColor(backgroundColor);
        this.metricSpecific.backgroundColor = backgroundColor;
    }

    protected onObjectHasBeenParsed(objectName: string): void {
        if (objectName !== "metricSpecific") {
            return;
        }

        this.applyMetricSpecificSettings();
    }

    protected onObjectsAreUndefined(): void {
        this.applyMetricSpecificSettings();
    }

    private applyMetricSpecificSettings(): void {
        this.applyBackgroundColor(this.metricSpecific.backgroundColor);
    }

    private applyBackgroundColor(backgroundColor): void {
        [
            this.asOfDate,
            this.metricName,
            this.currentValue,
            this.kpiIndicatorValue,
            this.comparisonValue,
            this.sparklineSettings,
            this.secondComparisonValue,
            this.secondKPIIndicatorValue,
        ].forEach((specificSettings: LabelSettings) => {
            this.applyBackgroundColorIfOwnColorIsNotSpecified(
                specificSettings,
                backgroundColor,
            );
        });
    }

    private applyBackgroundColorIfOwnColorIsNotSpecified(
        specificSettings: LabelSettings,
        backgroundColor: string,
    ): void {
        if (!specificSettings || !backgroundColor || specificSettings.backgroundColor) {
            return;
        }

        specificSettings.backgroundColor = backgroundColor;
    }
}

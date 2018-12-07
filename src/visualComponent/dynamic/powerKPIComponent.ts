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

// powerKpi
// import PowerKpiSeriesSettings = powerKpi.SeriesSettings;
// import PowerKpiDataRepresentation = powerKpi.DataRepresentation;
// import PowerKpiDataRepresentationAxis = powerKpi.DataRepresentationAxis;
// import PowerKpiDataRepresentationScale = powerKpi.DataRepresentationScale;
// import PowerKpiDataRepresentationPoint = powerKpi.DataRepresentationPoint;
// import PowerKpiDataRepresentationSeries = powerKpi.IDataRepresentationSeries;
// import PowerKpiDataRepresentationPointFilter = powerKpi.DataRepresentationPointFilter;
// import PowerKpiDataRepresentationPointGradientColor = powerKpi.DataRepresentationPointGradientColor;

import powerbi from "powerbi-visuals-api";

import { PowerKPI } from "../../../node_modules/powerbi-visuals-powerkpi/src/visual";

import {
    IDataRepresentationAxis as IDataRepresentationAxisPowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/dataRepresentation/dataRepresentationAxis";

import {
    DataRepresentationScale as DataRepresentationScalePowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/dataRepresentation/dataRepresentationScale";

import {
    DataRepresentationPointFilter as DataRepresentationPointFilterPowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/dataRepresentation/dataRepresentationPointFilter";

import {
    IDataRepresentationSeries as IDataRepresentationSeriesPoweKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/dataRepresentation/dataRepresentationSeries";

import {
    IDataRepresentationPoint as IDataRepresentationPointPoweKPI,
    IDataRepresentationPointGradientColor as IDataRepresentationPointGradientColorPowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/dataRepresentation/dataRepresentationPoint";

import {
    SeriesSettings as SeriesSettingsPowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/settings/seriesSettings";

import {
    Settings as SettingsPowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/settings/settings";

import {
    IDataRepresentation as IDataRepresentationPowerKPI,
} from "../../../node_modules/powerbi-visuals-powerkpi/src/dataRepresentation/dataRepresentation";

import { BaseComponent } from "../baseComponent";
import { IVisualComponentConstructorOptions } from "../visualComponentConstructorOptions";

import { ISparklineCellRenderOptions } from "../table/cell/sparkline/sparklineCellRenderOptions";

import { DataConverter } from "../../converter/data/dataConverter";
import { IDataRepresentationAxis } from "../../converter/data/dataRepresentation/dataRepresentationAxis";
import { IDataRepresentationPoint } from "../../converter/data/dataRepresentation/dataRepresentationPoint";
import { IDataRepresentationPointSet } from "../../converter/data/dataRepresentation/dataRepresentationPointSet";

import { NumericValueUtils } from "../../utils/numericValueUtils";

export interface IPowerKPIConstructorOptions extends IVisualComponentConstructorOptions {
    style: powerbi.extensibility.IColorPalette;
    host: powerbi.extensibility.visual.IVisualHost;
}

export class PowerKPIComponent extends BaseComponent {
    private instance: PowerKPI;

    constructor(private constructorOptions: IPowerKPIConstructorOptions) {
        super();

        const {
            element,
            host,
        } = constructorOptions;

        this.element = element.append("div");

        try {
            this.instance = new PowerKPI({
                element: this.element.node(),
                host,
            });
        }
        catch (_) {
            this.instance = null;
        }
    }

    public render(options: ISparklineCellRenderOptions): void {
        if (!this.instance) {
            return;
        }

        this.instance.render(this.convertDataToPowerKPIFormat(options));
    }

    public destroy(): void {
        if (this.instance) {
            this.instance.destroy();
        }

        this.instance = null;

        super.destroy();
    }

    private convertDataToPowerKPIFormat(options: ISparklineCellRenderOptions): IDataRepresentationPowerKPI {
        const {
            y,
            series,
            settings,
            metadata,
        } = options;

        const yAxis: IDataRepresentationAxis = {
            max: undefined,
            min: undefined,
        };

        const powerKPISettings: SettingsPowerKPI = settings.powerKPISettings;

        powerKPISettings.subtitle.titleText = series.name;

        powerKPISettings.dateValueKPI.displayUnits = series.settings.asOfDate.displayUnits;
        powerKPISettings.dateValueKPI.precision = series.settings.asOfDate.precision;

        powerKPISettings.actualValueKPI.displayUnits = series.settings.currentValue.displayUnits;
        powerKPISettings.actualValueKPI.precision = series.settings.currentValue.precision;

        powerKPISettings.kpiIndicatorValue.displayUnits = series.settings.kpiIndicatorValue.displayUnits;
        powerKPISettings.kpiIndicatorValue.precision = series.settings.kpiIndicatorValue.precision;

        if (!powerKPISettings.tooltipVariance.label) {
            powerKPISettings.tooltipVariance.label = settings.kpiIndicatorValue.label;
        }

        if (!powerKPISettings.secondTooltipVariance.label) {
            powerKPISettings.secondTooltipVariance.label = settings.secondKPIIndicatorValue.label;
        }

        series.settings.kpiIndicator.forEach((_, index: number, indexedName: string) => {
            powerKPISettings.kpiIndicator[indexedName] = series.settings.kpiIndicator[indexedName];
        });

        powerKPISettings.parseSettings(options.viewport, series.x.scale.type);

        const columnFormat: string = series.settings.asOfDate.columnFormat;

        powerKPISettings.dateValueKPI.setColumnFormat(columnFormat);
        powerKPISettings.tooltipLabel.setColumnFormat(columnFormat);

        if (series.settings.sparklineSettings.shouldUseCommonScale) {
            yAxis.min = y.min;
        } else if (NumericValueUtils.isValueFinite(powerKPISettings.yAxis.min)) {
            yAxis.min = powerKPISettings.yAxis.min;
        } else if (NumericValueUtils.isValueFinite(series.settings.sparklineSettings.yMin)) {
            yAxis.min = series.settings.sparklineSettings.yMin;
        }

        if (series.settings.sparklineSettings.shouldUseCommonScale) {
            yAxis.max = y.max;
        } else if (NumericValueUtils.isValueFinite(powerKPISettings.yAxis.max)) {
            yAxis.max = powerKPISettings.yAxis.max;
        } else if (NumericValueUtils.isValueFinite(series.settings.sparklineSettings.yMax)) {
            yAxis.max = series.settings.sparklineSettings.yMax;
        }

        const scaledYAxis: IDataRepresentationAxisPowerKPI = {
            format: series.settings.currentValue.getFormat(),
            max: undefined,
            min: undefined,
            scale: DataRepresentationScalePowerKPI.create(),
        };

        const pointFilter: DataRepresentationPointFilterPowerKPI = new DataRepresentationPointFilterPowerKPI();

        let maxThickness: number = 0;

        const powerKPISeries: IDataRepresentationSeriesPoweKPI[] = series.points
            .map((pointSet: IDataRepresentationPointSet, pointSetIndex: number) => {
                const gradientPoints: IDataRepresentationPointGradientColorPowerKPI[] = [];

                const points: IDataRepresentationPointPoweKPI[] = pointSet.points
                    .map((point: IDataRepresentationPoint, pointIndex: number) => {
                        const powerKpiPoint: IDataRepresentationPointPoweKPI = {
                            color: pointSet.colors[pointIndex] || pointSet.color,
                            kpiIndex: pointSet.kpiIndicatorIndexes[pointIndex],
                            x: point.axisValue as any,
                            y: point.value,
                        };

                        pointFilter.groupPointByColor(gradientPoints, powerKpiPoint, false);

                        return powerKpiPoint;
                    });

                const thickness: number = pointSet.thickness;

                maxThickness = Math.max(maxThickness, thickness);

                DataConverter.applyYArguments(yAxis, pointSet.min as number);
                DataConverter.applyYArguments(yAxis, pointSet.max as number);

                const seriesSettings: SeriesSettingsPowerKPI = SeriesSettingsPowerKPI.getDefault() as SeriesSettingsPowerKPI;

                seriesSettings.line.fillColor = pointSet.color;
                seriesSettings.line.lineStyle = pointSet.lineStyle;
                seriesSettings.line.thickness = thickness;

                return {
                    current: {
                        color: pointSet.color,
                        index: series.kpiIndicatorIndex,
                        kpiIndex: series.kpiIndicatorIndex,
                        x: series.axisValue,
                        y: series.currentValue,
                    },
                    domain: {
                        max: pointSet.max,
                        min: pointSet.min,
                    },
                    format: pointSet.settings.getFormat(),
                    gradientPoints,
                    hasSelection: false,
                    identity: pointSetIndex === 0
                        ? series.selectionId
                        : this.getSelectionId(`${pointSetIndex}`),
                    name: pointSet.name || pointSet.settings.label,
                    points,
                    settings: seriesSettings,

                    selected: false,
                    y: scaledYAxis,
                };
            });

        scaledYAxis.scale.domain([yAxis.min, yAxis.max], series.y.scale.type);
        scaledYAxis.min = yAxis.min as number;
        scaledYAxis.max = yAxis.max as number;

        const margin = powerKPISettings.dots.getMarginByThickness(
            maxThickness,
            {
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
            },
        );

        const powerKPIData: IDataRepresentationPowerKPI = {
            groups: [{
                series: powerKPISeries,
                y: scaledYAxis,
            }],
            margin,
            series: powerKPISeries,
            settings: powerKPISettings,
            sortedSeries: powerKPISeries,
            variance: [
                series.kpiIndicatorValue,
                series.secondKPIIndicatorValue,
            ],
            variances: series.varianceSet || [],
            viewport: options.viewport,
            x: {
                axisType: series.x.scale.type,
                format: series.settings.asOfDate.getFormat(),
                max: series.x.max as any,
                metadata,
                min: series.x.min as any,
                name: series.settings.asOfDate.label,
                scale: DataRepresentationScalePowerKPI
                    .create()
                    .domain(series.x.scale.getDomain(), series.x.scale.type),
                values: series.axisValues,
            },
        };

        return powerKPIData;
    }

    private getSelectionId(measureId: string): powerbi.visuals.ISelectionId {
        if (!this.constructorOptions && !this.constructorOptions.host) {
            return null;
        }

        return this.constructorOptions.host
            .createSelectionIdBuilder()
            .withMeasure(measureId)
            .createSelectionId();
    }

}

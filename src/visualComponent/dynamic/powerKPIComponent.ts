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
    // powerbi
    import IVisualStyle = powerbi.IVisualStyle;

    // powerKpi
    import PowerKpiSeriesSettings = powerKpi.SeriesSettings;
    import PowerKpiDataRepresentation = powerKpi.DataRepresentation;
    import PowerKpiDataRepresentationAxis = powerKpi.DataRepresentationAxis;
    import PowerKpiDataRepresentationScale = powerKpi.DataRepresentationScale;
    import PowerKpiDataRepresentationPoint = powerKpi.DataRepresentationPoint;
    import PowerKpiDataRepresentationSeries = powerKpi.IDataRepresentationSeries;
    import PowerKpiDataRepresentationPointFilter = powerKpi.DataRepresentationPointFilter;
    import PowerKpiDataRepresentationPointGradientColor = powerKpi.DataRepresentationPointGradientColor;

    export interface PowerKPIConstructorOptions extends VisualComponentConstructorOptions {
        style: IVisualStyle;
        host: IVisualHostServices;
    }

    export class PowerKPIComponent extends BaseComponent {
        private instance: PowerKPI = new PowerKPI();

        constructor(options: PowerKPIConstructorOptions) {
            super();

            const {
                style,
                element,
                host,
            } = options;

            this.element = element.append("div");

            this.instance.init({
                host,
                style,
                element: $(this.element.node()),
                viewport: null,
            });
        }

        public render(options: SparklineCellRenderOptions): void {
            if (!this.instance) {
                return;
            }

            this.instance.render(this.convertDataToPowerKPIFormat(options));
        }

        private convertDataToPowerKPIFormat(options: SparklineCellRenderOptions): PowerKpiDataRepresentation {
            const {
                y,
                series,
                settings,
                metadata,
            } = options;

            const yAxis: DataRepresentationAxis = {
                min: undefined,
                max: undefined,
            };

            const powerKPISettings: PowerKPISettings = settings.powerKPISettings;

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

            series.settings.kpiIndicator
                .forEach((property: PropertyConfiguration, index: number, indexedName: string) => {
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

            const scaledYAxis: PowerKpiDataRepresentationAxis = {
                min: undefined,
                max: undefined,
                format: series.settings.currentValue.getFormat(),
                scale: PowerKpiDataRepresentationScale.create(),
            };

            const pointFilter: PowerKpiDataRepresentationPointFilter = new PowerKpiDataRepresentationPointFilter();

            let maxThickness: number = 0;

            const powerKPISeries: PowerKpiDataRepresentationSeries[] = series.points
                .map((pointSet: DataRepresentationPointSet, pointSetIndex: number) => {
                    const gradientPoints: PowerKpiDataRepresentationPointGradientColor[] = [];

                    const points: PowerKpiDataRepresentationPoint[] = pointSet.points
                        .map((point: DataRepresentationPoint, pointIndex: number) => {
                            const powerKpiPoint: PowerKpiDataRepresentationPoint = {
                                x: point.axisValue as any,
                                y: point.value,
                                kpiIndex: pointSet.kpiIndicatorIndexes[pointIndex],
                                color: pointSet.colors[pointIndex] || pointSet.color,
                            };

                            pointFilter.groupPointByColor(gradientPoints, powerKpiPoint, false);

                            return powerKpiPoint;
                        });

                    const thickness: number = pointSet.thickness;

                    maxThickness = Math.max(maxThickness, thickness);

                    DataConverter.applyYArguments(yAxis, pointSet.min as number);
                    DataConverter.applyYArguments(yAxis, pointSet.max as number);

                    const seriesSettings: PowerKpiSeriesSettings = PowerKpiSeriesSettings.getDefault() as PowerKpiSeriesSettings;

                    seriesSettings.line.fillColor = pointSet.color;
                    seriesSettings.line.lineStyle = pointSet.lineStyle;
                    seriesSettings.line.thickness = thickness;

                    return {
                        points,
                        gradientPoints: gradientPoints,
                        settings: seriesSettings,
                        name: pointSet.name || pointSet.settings.label,
                        identity: pointSetIndex === 0
                            ? series.selectionId
                            : SelectionId.createWithMeasure(`${pointSetIndex}`),
                        current: {
                            color: pointSet.color,
                            x: series.axisValue,
                            y: series.currentValue,
                            index: series.kpiIndicatorIndex,
                            kpiIndex: series.kpiIndicatorIndex,
                        },
                        format: pointSet.settings.getFormat(),
                        y: scaledYAxis,
                        selected: false,
                        hasSelection: false,
                        domain: {
                            min: pointSet.min,
                            max: pointSet.max,
                        },
                    };
                });

            scaledYAxis.scale.domain([yAxis.min, yAxis.max], series.y.scale.type);
            scaledYAxis.min = yAxis.min as number;
            scaledYAxis.max = yAxis.max as number;

            const margin: IMargin = powerKPISettings.dots.getMarginByThickness(
                maxThickness,
                {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            );

            const powerKPIData: PowerKpiDataRepresentation = {
                margin,
                series: powerKPISeries,
                sortedSeries: powerKPISeries,
                groups: [{
                    series: powerKPISeries,
                    y: scaledYAxis,
                }],
                viewport: options.viewport,
                x: {
                    name: series.settings.asOfDate.label,
                    type: series.x.scale.type,
                    metadata,
                    min: series.x.min as any,
                    max: series.x.max as any,
                    values: series.axisValues,
                    format: series.settings.asOfDate.getFormat(),
                    scale: PowerKpiDataRepresentationScale
                        .create()
                        .domain(series.x.scale.getDomain(), series.x.scale.type)
                },
                settings: powerKPISettings,
                variance: [
                    series.kpiIndicatorValue,
                    series.secondKPIIndicatorValue
                ],
                variances: series.varianceSet || [],
            };

            return powerKPIData;
        }

        public destroy(): void {
            if (this.instance) {
                this.instance.destroy();
            }

            this.instance = null;

            super.destroy();
        }
    }
}

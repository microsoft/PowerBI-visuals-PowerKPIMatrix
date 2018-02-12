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
    // powerKPI
    import SelectionId = powerbi.extensibility.ISelectionId;
    import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
    import IMargin = powerbi.extensibility.utils.svg.IMargin;

    import PowerKPIDataRepresentation = powerbi.extensibility.visual.DataRepresentation;
    import PowerKPIDataRepresentationScale = powerbi.extensibility.visual.DataRepresentationScale;
    import PowerKPIDataRepresentationPoint = powerbi.extensibility.visual.DataRepresentationPoint;
    import PowerKPIDataRepresentationSeries = powerbi.extensibility.visual.DataRepresentationSeries;
    // import PowerKPI = .PowerKPI;

    export class PowerKPIComponent extends BaseComponent {
        private instance: PowerKPI;
        private selectionIdBuilder: ISelectionIdBuilder;

        constructor(options: VisualComponentConstructorOptions) {
            super();

            const {
                element,
            } = options;

            this.element = element.append("div");
            this.selectionIdBuilder = options.host.createSelectionIdBuilder();
            this.instance = new PowerKPI({
                element: this.element.node() as HTMLElement,
                host: {
                    tooltipService: options.host.tooltipService,
                    colorPalette: options.host.colorPalette,
                    createSelectionIdBuilder: options.host.createSelectionIdBuilder
                } as IVisualHost
            });

        }

        public render(options: SparklineCellRenderOptions): void {
            if (!this.instance) {
                return;
            }

            this.instance.render(this.convertDataToPowerKPIFormat(options));
        }

        private convertDataToPowerKPIFormat(options: SparklineCellRenderOptions): powerKPI.DataRepresentation {
            const {
                y,
                series,
                settings,
                metadata,
            } = options;

            let maxThickness: number = 0;

            const yAxis: DataRepresentationAxis = {
                min: undefined,
                max: undefined,
            };

            const powerKPISeries: powerKPI.DataRepresentationSeries[] = series.points
                .map((pointSet: DataRepresentationPointSet, pointSetIndex: number) => {
                    const points: powerKPI.DataRepresentationPoint[] = pointSet.points
                        .map((point: DataRepresentationPoint, pointIndex: number) => {
                            return {
                                axisValue: point.axisValue,
                                value: point.value,
                                kpiIndex: pointSet.kpiIndicatorIndexes[pointIndex],
                            };
                        });

                    const thickness: number = pointSet.thickness;

                    maxThickness = Math.max(maxThickness, thickness);

                    DataConverter.applyYArguments(yAxis, pointSet.min as number);
                    DataConverter.applyYArguments(yAxis, pointSet.max as number);
                    let c = pointSetIndex === 0
                        ? series.selectionId
                        : this.selectionIdBuilder.withMeasure(`${pointSetIndex}`).createSelectionId();

                    return {
                        points,
                        thickness,
                        name: pointSet.name || pointSet.settings.label,
                        color: pointSet.color,
                        selectionId: pointSetIndex === 0
                            ? series.selectionId
                            : this.selectionIdBuilder.withMeasure(`${pointSetIndex}`).createSelectionId(),
                        lineStyle: pointSet.lineStyle.toString(),
                        current: {
                            axisValue: series.axisValue,
                            value: series.currentValue,
                            index: series.kpiIndicatorIndex,
                            kpiIndex: series.kpiIndicatorIndex
                        },
                        format: pointSet.settings.getFormat()
                    } as powerKPI.DataRepresentationSeries;
                });

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
            powerKPISettings.applyColumnFormat(series.settings.asOfDate.columnFormat);

            const margin: IMargin = powerKPISettings.dots.getMarginByThickness(
                maxThickness,
                {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            );

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

            const powerKPIData: powerKPI.DataRepresentation = {
                margin,
                series: powerKPISeries as any,
                viewport: options.viewport,
                x: {
                    name: series.settings.asOfDate.label,
                    type: series.x.scale.type,
                    metadata,
                    min: series.x.min as any,
                    max: series.x.max as any,
                    values: series.axisValues,
                    ticks: [],
                    format: series.settings.asOfDate.getFormat(),
                },
                y: {
                    min: yAxis.min as number,
                    max: yAxis.max as number,
                    ticks: [],
                    format: series.settings.currentValue.getFormat(),
                    maxTickWidth: 0,
                },
                settings: powerKPISettings,
                scale: {
                    x: powerKPI.DataRepresentationScale
                        .create()
                        .domain(series.x.scale.getDomain(), series.x.scale.type),
                    y: powerKPI.DataRepresentationScale
                        .create()
                        .domain([yAxis.min, yAxis.max], series.y.scale.type),
                },
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
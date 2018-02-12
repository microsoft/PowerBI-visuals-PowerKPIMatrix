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
    // powerbi.visuals.controls
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;

    enum TooltipMarkerShapeEnum {
        circle,
        none
    }

    export class TooltipComponent implements VisualComponent {
        private static singletonInstance: TooltipComponent;

        private tooltipService: ITooltipService;

        private varianceStrategy: VarianceStrategy = new VarianceStrategy();

        private extraYOffset: number = 5;

        private tooltipIsShow: boolean;

        constructor(tooltipService: ITooltipService) {
            this.tooltipService = tooltipService;
        }

        public render(options: DynamicComponentRenderOptions): void {
            if (!options || !this.tooltipService) {
                return;
            }

            const {
                scale,
                series,
                position,
                metadata,
                viewport,
            } = options;

            const baseDataItems: VisualTooltipDataItem[] = [];

            if (NumericValueUtils.isValueDefined(series.axisValue)) {
                const asOfDateFormatter: IValueFormatter = FormattingUtils.getFormatterOfAxisValue(
                    series.x.min,
                    series.x.max,
                    series.x.scale.type,
                    metadata,
                    series.settings.asOfDate
                );

                baseDataItems.push({
                    displayName: "",
                    value: asOfDateFormatter.format(series.axisValue),
                    // markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle)
                });
            }

            this.addValueTooltip(
                baseDataItems,
                this.getVarianceTooltip(
                    series.varianceSet && series.varianceSet[0],
                    series.settings.kpiIndicatorValue,
                    series.points[0] && series.points[0].kpiIndicatorIndexes,
                    series.settings.kpiIndicator
                )
            );

            this.addValueTooltip(
                baseDataItems,
                this.getVarianceTooltip(
                    series.varianceSet && series.varianceSet[1],
                    series.settings.secondKPIIndicatorValue,
                    null,
                    null
                )
            );

            const additionalDataItems: VisualTooltipDataItem[] = [];

            series.points.forEach((pointSet: DataRepresentationPointSet) => {
                this.addValueTooltip(
                    additionalDataItems,
                    this.getValueTooltip(pointSet)
                );
            });

            if (additionalDataItems && additionalDataItems.length) {
                baseDataItems.push(
                    { // Separator
                        displayName: "   ",
                        value: "",
                        // markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.none)
                    }, { // Separator
                        displayName: "   ",
                        value: "",
                        // markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.none)
                    }
                );

                baseDataItems.push(...additionalDataItems);
            }

            const yOffset: number = position.y - position.offsetY;
            const screenHeight: number = window.innerHeight;
            const middleScreenHeight: number = screenHeight / 2;
            const height: number = viewport.height * scale.height;

            const isElementAboveOfMiddleOfScreen: boolean =
                (
                    yOffset + (height / 2) < middleScreenHeight
                    && (yOffset + height) < middleScreenHeight
                )
                || yOffset < middleScreenHeight;

            this.renderTooltip(
                baseDataItems,
                0,
                isElementAboveOfMiddleOfScreen
                    ? yOffset + height + this.extraYOffset
                    : screenHeight - yOffset + this.extraYOffset
            );
        }

        private addValueTooltip(
            dataItems: VisualTooltipDataItem[],
            dataItem: VisualTooltipDataItem
        ): void {
            if (!dataItem) {
                return;
            }

            dataItems.push(dataItem);
        }

        private getVarianceTooltip(
            varianceSet: number[],
            settings: NumberSettingsBase,
            kpiIndicatorIndexes: number[],
            kpiIndicatorSettings: KPIIndicatorSettings
        ): VisualTooltipDataItem {
            const variance: number = varianceSet && varianceSet[0];

            if (!NumericValueUtils.isValueFinite(variance)) {
                return null;
            }

            const kpiIndicatorValueFormatter: IValueFormatter = FormattingUtils.getValueFormatter(
                settings.displayUnits || variance || 0,
                undefined,
                undefined,
                settings.precision,
                settings.getFormat()
            );

            let color: string = "rgba(0,0,0,0)";

            if (kpiIndicatorSettings) {
                const kpiIndicatorIndex: number = kpiIndicatorIndexes && kpiIndicatorIndexes[0];
                const currentKPIIndicator: IKPIIndicatorSettings = kpiIndicatorSettings.getCurrentKPI(kpiIndicatorIndex);

                color = (currentKPIIndicator && currentKPIIndicator.color) || color;
            }

            return {
                color,
                displayName: settings.label,
                value: FormattingUtils.getFormattedValue(
                    variance,
                    kpiIndicatorValueFormatter
                ),
                // markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
            };
        }

        private getValueTooltip(pointSet: DataRepresentationPointSet): VisualTooltipDataItem {
            if (!pointSet
                || !pointSet.settings
                || !pointSet.points
                || !pointSet.points[0]
                || !NumericValueUtils.isValueFinite(pointSet.points[0].value)
            ) {
                return null;
            }

            const {
                name,
                settings
             } = pointSet;

            const value: number = pointSet.points[0].value;

            const formatter: IValueFormatter = FormattingUtils.getValueFormatter(
                settings.displayUnits || value || 0,
                undefined,
                undefined,
                settings.precision,
                settings.getFormat()
            );

            return {
                displayName: name || settings.label,
                value: FormattingUtils.getFormattedValue(
                    value,
                    formatter
                ),
                // markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
                color: (pointSet.colors && pointSet.colors[0]) || pointSet.color,
            };
        }

        private renderTooltip(
            dataItems: VisualTooltipDataItem[],
            offsetX: number,
            offsetY: number
        ): void {
            if (!dataItems
                || !dataItems.length
                || !this.tooltipService
            ) {
                this.hide();
            } else {
                this.tooltipIsShow = true;
                this.tooltipService.show({
                    dataItems,
                    coordinates: [offsetX, offsetY, 0, 0],
                    identities: [],
                    isTouchEvent: false
                });
            }
        }

        public get isShown(): boolean {
            return this.tooltipService && this.tooltipIsShow;
        }

        public clear(): void {
            this.tooltipIsShow = false;
            this.hide();
        }

        public hide(): void {
            if (!this.isShown) {
                return;
            }

            this.tooltipService.hide({ immediately: true, isTouchEvent: false });
        }

        public destroy(): void {
            if (!this.tooltipService) {
                return;
            }

            this.hide();

            this.tooltipService = null;
            this.varianceStrategy = null;
        }

        private getTooltipMarkerShape(markerShape: TooltipMarkerShapeEnum): string {
            return TooltipMarkerShapeEnum[markerShape];
        }
    }
}
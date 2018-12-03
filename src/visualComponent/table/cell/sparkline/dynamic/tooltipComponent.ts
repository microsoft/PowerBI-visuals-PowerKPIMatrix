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
    // powerbi.visuals.controls
    import Rectangle = powerbi.visuals.controls.TouchUtils.Rectangle;

    enum TooltipMarkerShapeEnum {
        circle,
        none
    }

    export class TooltipComponent implements VisualComponent {
        private static singletonInstance: TooltipComponent;

        private tooltipComponent: ToolTipComponent;

        private extraYOffset: number = 5;

        private transparentColor: string = "rgba(0,0,0,0)";

        constructor() {
            try {
                this.tooltipComponent = new ToolTipComponent({ hideArrow: true });
            } catch (err) {
                this.tooltipComponent = null;
            }
        }

        public static instance(): TooltipComponent {
            if (!TooltipComponent.singletonInstance) {
                TooltipComponent.singletonInstance = new TooltipComponent();
            }

            return TooltipComponent.singletonInstance;
        }

        public render(options: DynamicComponentRenderOptions): void {
            if (!options || !this.tooltipComponent) {
                return;
            }

            const {
                scale,
                series,
                position,
                metadata,
                viewport,
            } = options;

            const baseDataItems: TooltipDataItem[] = [];

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
                    color: this.transparentColor,
                    value: asOfDateFormatter.format(series.axisValue),
                    markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle)
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

            const additionalDataItems: TooltipDataItem[] = [];

            series.points.forEach((pointSet: DataRepresentationPointSet) => {
                this.addValueTooltip(
                    additionalDataItems,
                    this.getValueTooltip(pointSet)
                );
            });

            if (additionalDataItems && additionalDataItems.length) {
                baseDataItems.push(
                    this.getTooltipSeparator(),
                    this.getTooltipSeparator(),
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

            const rect: Rectangle = new Rectangle(
                position.x,
                isElementAboveOfMiddleOfScreen ? 0 : screenHeight,
                0,
                0
            );

            this.renderTooltip(
                baseDataItems,
                rect,
                0,
                isElementAboveOfMiddleOfScreen
                    ? yOffset + height + this.extraYOffset
                    : screenHeight - yOffset + this.extraYOffset
            );
        }

        private getTooltipSeparator(): TooltipDataItem {
            return {
                displayName: "   ",
                value: "",
                color: this.transparentColor,
                markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.none)
            };
        }

        private addValueTooltip(
            dataItems: TooltipDataItem[],
            dataItem: TooltipDataItem
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
        ): TooltipDataItem {
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

            let color: string = this.transparentColor;

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
                markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
            };
        }

        private getValueTooltip(pointSet: DataRepresentationPointSet): TooltipDataItem {
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
                markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
                color: (pointSet.colors && pointSet.colors[0]) || pointSet.color || this.transparentColor,
            };
        }

        private renderTooltip(
            dataItems: TooltipDataItem[],
            rect: Rectangle,
            offsetX: number,
            offsetY: number
        ): void {
            if (!dataItems
                || !dataItems.length
                || !rect
                || !this.tooltipComponent
            ) {
                this.hide();
            } else {
                this.tooltipComponent.setTooltipAppearanceOptions({
                    offsetX,
                    offsetY
                });

                this.tooltipComponent.show(dataItems, rect);
            }
        }

        public get isShown(): boolean {
            return this.tooltipComponent
                && this.tooltipComponent.isTooltipComponentVisible
                && this.tooltipComponent.isTooltipComponentVisible();
        }

        public clear(): void {
            this.hide();
        }

        public hide(): void {
            if (!this.isShown) {
                return;
            }

            this.tooltipComponent.hide();
        }

        public destroy(): void {
            if (!this.tooltipComponent) {
                return;
            }

            this.hide();

            this.tooltipComponent = null;
        }

        private getTooltipMarkerShape(markerShape: TooltipMarkerShapeEnum): string {
            return TooltipMarkerShapeEnum[markerShape];
        }
    }
}

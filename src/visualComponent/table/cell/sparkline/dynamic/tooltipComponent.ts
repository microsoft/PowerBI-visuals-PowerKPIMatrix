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

import powerbi from "powerbi-visuals-api";

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import { IVisualComponent } from "../../../../visualComponent";
import { IVisualComponentConstructorOptions } from "../../../../visualComponentConstructorOptions";

import { IDataRepresentationPointSet } from "../../../../../converter/data/dataRepresentation/dataRepresentationPointSet";
import { NumberSettingsBase } from "../../../../../settings/descriptors/numberSettingsBase";
import { FormattingUtils } from "../../../../../utils/formattingUtils";
import { NumericValueUtils } from "../../../../../utils/numericValueUtils";

import {
    IKPIIndicatorSettings,
    KPIIndicatorSettings,
} from "../../../../../settings/descriptors/kpi/kpiIndicatorSettings";

import { IDynamicComponentRenderOptions } from "./dynamicComponentRenderOptions";

enum TooltipMarkerShapeEnum {
    circle,
    none,
}

interface IVisualTooltipDataItem extends powerbi.extensibility.VisualTooltipDataItem {
    lineStyle?: string; // TODO: Extend PBI API
    markerShape?: string; // TODO: Extend PBI API
    lineColor?: string; // TODO: Extend PBI API
}

export class TooltipComponent implements IVisualComponent {
    private extraYOffset: number = 5;

    private transparentColor: string = "rgba(0,0,0,0)";

    constructor(private constructorOptions: IVisualComponentConstructorOptions) { }

    public render(options: IDynamicComponentRenderOptions): void {
        if (!options) {
            return;
        }

        const {
            scale,
            series,
            position,
            metadata,
            viewport,
        } = options;

        const baseDataItems: IVisualTooltipDataItem[] = [];

        if (NumericValueUtils.isValueDefined(series.axisValue)) {
            const asOfDateFormatter: valueFormatter.IValueFormatter = FormattingUtils.getFormatterOfAxisValue(
                series.x.min,
                series.x.max,
                series.x.scale.type,
                metadata,
                series.settings.asOfDate,
            );

            baseDataItems.push({
                color: this.transparentColor,
                displayName: "",
                markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
                value: asOfDateFormatter.format(series.axisValue),
            });
        }

        this.addValueTooltip(
            baseDataItems,
            this.getVarianceTooltip(
                series.varianceSet && series.varianceSet[0],
                series.settings.kpiIndicatorValue,
                series.points[0] && series.points[0].kpiIndicatorIndexes,
                series.settings.kpiIndicator,
            ),
        );

        this.addValueTooltip(
            baseDataItems,
            this.getVarianceTooltip(
                series.varianceSet && series.varianceSet[1],
                series.settings.secondKPIIndicatorValue,
                null,
                null,
            ),
        );

        const additionalDataItems: IVisualTooltipDataItem[] = [];

        series.points.forEach((pointSet: IDataRepresentationPointSet) => {
            this.addValueTooltip(
                additionalDataItems,
                this.getValueTooltip(pointSet),
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

        const coordinates: [number, number] = this.getCoordinates(
            position.x,
            position.y,
        );

        this.renderTooltip(
            baseDataItems,
            [
                coordinates[0],
                isElementAboveOfMiddleOfScreen ? 0 : screenHeight,
            ],
            0,
            isElementAboveOfMiddleOfScreen
                ? yOffset + height + this.extraYOffset
                : screenHeight - yOffset + this.extraYOffset,
        );
    }

    public clear(): void {
        this.hide();
    }

    public hide(): void {
        if (!this.constructorOptions || !this.constructorOptions.tooltipService) {
            return;
        }

        this.constructorOptions.tooltipService.hide({
            immediately: true,
            isTouchEvent: false,
        });
    }

    public destroy(): void {
        this.hide();
    }

    private getCoordinates(x: number, y: number): [number, number] {
        if (!this.constructorOptions || !this.constructorOptions.rootElement) {
            return [x, y];
        }

        const rootNode: HTMLElement = this.constructorOptions.rootElement.node();

        const rect: ClientRect = rootNode.getBoundingClientRect();

        return [
            x - rect.left - rootNode.clientLeft,
            y - rect.top - rootNode.clientTop,
        ];
    }

    private getTooltipSeparator(): IVisualTooltipDataItem {
        return {
            color: this.transparentColor,
            displayName: "   ",
            markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.none),
            value: "",
        };
    }

    private addValueTooltip(
        dataItems: IVisualTooltipDataItem[],
        dataItem: IVisualTooltipDataItem,
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
        kpiIndicatorSettings: KPIIndicatorSettings,
    ): IVisualTooltipDataItem {
        const variance: number = varianceSet && varianceSet[0];

        if (!NumericValueUtils.isValueFinite(variance)) {
            return null;
        }

        const kpiIndicatorValueFormatter: valueFormatter.IValueFormatter = FormattingUtils.getValueFormatter(
            settings.displayUnits || variance || 0,
            undefined,
            undefined,
            settings.precision,
            settings.getFormat(),
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
            markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
            value: FormattingUtils.getFormattedValue(
                variance,
                kpiIndicatorValueFormatter,
            ),
        };
    }

    private getValueTooltip(pointSet: IDataRepresentationPointSet): IVisualTooltipDataItem {
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
            settings,
        } = pointSet;

        const value: number = pointSet.points[0].value;

        const formatter: valueFormatter.IValueFormatter = FormattingUtils.getValueFormatter(
            settings.displayUnits || value || 0,
            undefined,
            undefined,
            settings.precision,
            settings.getFormat(),
        );

        return {
            color: (pointSet.colors && pointSet.colors[0]) || pointSet.color || this.transparentColor,
            displayName: name || settings.label,
            markerShape: this.getTooltipMarkerShape(TooltipMarkerShapeEnum.circle),
            value: FormattingUtils.getFormattedValue(
                value,
                formatter,
            ),
        };
    }

    private renderTooltip(
        dataItems: IVisualTooltipDataItem[],
        coordinates: [number, number],
        offsetX: number,
        offsetY: number,
    ): void {
        if (!dataItems
            || !dataItems.length
            || !this.constructorOptions
            || !this.constructorOptions.tooltipService
        ) {
            this.hide();
        } else {
            this.constructorOptions.tooltipService.show({
                coordinates,
                dataItems,
                identities: [],
                isTouchEvent: false,
            });
        }
    }

    // public get isShown(): boolean {
    //     return this.tooltipComponent
    //         && this.tooltipComponent.isTooltipComponentVisible
    //         && this.tooltipComponent.isTooltipComponentVisible();
    // }

    private getTooltipMarkerShape(markerShape: TooltipMarkerShapeEnum): string {
        return TooltipMarkerShapeEnum[markerShape];
    }
}

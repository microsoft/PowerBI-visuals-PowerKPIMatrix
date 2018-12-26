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

import { Selection } from "d3-selection";

import { CssConstants } from "powerbi-visuals-utils-svgutils";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import {
    IKPIIndicatorSettings,
    KPIIndicatorPosition,
} from "../../../../settings/descriptors/kpi/kpiIndicatorSettings";

import { HorizontalTextAlignment } from "../../../../settings/descriptors/fontSettings";
import { IVisualComponentConstructorOptions } from "../../../visualComponentConstructorOptions";
import { TextCellComponent } from "../text/textCellComponent";
import { IKPIIndicatorCellRenderOptions } from "./kpiIndicatorCellRenderOptions";

export class KPIIndicatorCellComponent extends TextCellComponent {
    private componentExtraClassName: string = "kpiIndicatorCellComponent";

    private indicatorClassName: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("kpiIndicatorCellComponent_indicator");

    private glyphClassName: string = "powerKPIMatrix_glyphIcon";

    private kpiIndicatorPositionLeftClassName: string = "kpiIndicatorPosition_left";
    private kpiIndicatorPositionRightClassName: string = "kpiIndicatorPosition_right";

    private kpiIndicatorRowDirectionClassName: string = "kpiIndicatorRowDirectionClassName";
    private kpiIndicatorColumnDirectionClassName: string = "kpiIndicatorColumnDirectionClassName";

    private kpiStatusHorizontalAlignmentCenterClassName: string = "kpiStatus_horizontalAlignment_center";

    constructor(options: IVisualComponentConstructorOptions) {
        super(options);

        this.element.classed(this.componentExtraClassName, true);

        this.updateSize(this.width, this.height);
    }

    public render(options: IKPIIndicatorCellRenderOptions): void {
        const kpiIndicatorSettings: IKPIIndicatorSettings = options
            .kpiIndicatorSettings
            .getCurrentKPI(options.kpiIndicatorIndex);

        options.fontSettings.kpiColor = kpiIndicatorSettings && kpiIndicatorSettings.color;

        this.updateElementsDirection(options.kpiIndicatorSettings.shouldWrap);
        this.updatePosition(options.kpiIndicatorSettings.position);

        this.renderIndicator(options, kpiIndicatorSettings);

        const value: string = options.fontSettings.isShown
            ? options.value
            : undefined;

        super.render({
            fontSettings: options.fontSettings,
            order: options.order,
            value,
        });

        this.applyCenterAlignment(
            options.kpiIndicatorSettings.isShown
            &&
            options.fontSettings.isShown
            &&
            options.fontSettings.alignment === HorizontalTextAlignment.center,
        );
    }

    private applyCenterAlignment(shouldApply: boolean): void {
        if (!this.element) {
            return;
        }

        this.element.classed(
            this.kpiStatusHorizontalAlignmentCenterClassName,
            shouldApply,
        );
    }

    private updateElementsDirection(shouldUseColumnDirection: boolean): void {
        if (!this.element) {
            return;
        }

        this.element
            .classed(this.kpiIndicatorColumnDirectionClassName, shouldUseColumnDirection)
            .classed(this.kpiIndicatorRowDirectionClassName, !shouldUseColumnDirection);
    }

    private updatePosition(position: KPIIndicatorPosition): void {
        if (!this.element) {
            return;
        }

        this.element
            .classed(this.kpiIndicatorPositionLeftClassName, position === KPIIndicatorPosition.left)
            .classed(this.kpiIndicatorPositionRightClassName, position === KPIIndicatorPosition.right);
    }

    private renderIndicator(
        options: IKPIIndicatorCellRenderOptions,
        kpiIndicatorSettings: IKPIIndicatorSettings,
    ): void {
        const nodeSelection: Selection<any, any[], any, any> = this.element
            .selectAll(this.indicatorClassName.selectorName)
            .data(options.kpiIndicatorSettings.isShown ? [[]] : []);

        nodeSelection
            .exit()
            .remove();

        const mergedNodeSelection: Selection<any, any[], any, any> = nodeSelection
            .enter()
            .append("div")
            .merge(nodeSelection);

        const className: string = kpiIndicatorSettings.shape
            ? `${this.indicatorClassName.className} ${this.glyphClassName} ${kpiIndicatorSettings.shape}`
            : `${this.indicatorClassName.className}`;

        mergedNodeSelection
            .attr("class", className)
            .style("color", kpiIndicatorSettings.color)
            .style(
                "font-size",
                pixelConverter.toString(
                    pixelConverter.fromPointToPixel(options.kpiIndicatorSettings.textFontSize),
                ),
            );

        this.updateTextWrapping(mergedNodeSelection, options.fontSettings.wrapText);
    }
}
